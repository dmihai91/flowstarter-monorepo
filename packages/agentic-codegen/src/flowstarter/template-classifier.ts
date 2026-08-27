/**
 * Sigma-style deterministic template selection.
 *
 * Adapted from the ask-sage / ereno SignalRouter v5 embedding router: one
 * MiniLM forward pass per text, cosine ranking, and a confidence gate.
 * The classifier replaces the LLM template-selection call when its top match
 * clears both an absolute score floor and a margin over the runner-up;
 * anything murkier falls back to the model-driven selector.
 *
 * The embedder is a seam so tests run on a stub and the ONNX artifacts stay
 * external (SIGMA_MODEL_DIR), keeping the repo free of model weights.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateCandidate } from './types';

export interface Embedder {
  embed(texts: string[]): Promise<Float32Array[]>;
}

export interface TemplateClassification {
  ranked: Array<{ slug: string; score: number }>;
  /** Set when the gate passes; the pipeline may skip the LLM selector. */
  autoSelect?: { slug: string; score: number; margin: number };
}

export interface TemplateClassifierOptions {
  /** Minimum cosine similarity for the top match. */
  minScore?: number;
  /** Minimum lead over the runner-up. */
  minMargin?: number;
}

export class TemplateClassifier {
  private readonly minScore: number;
  private readonly minMargin: number;

  constructor(
    private readonly embedder: Embedder,
    options: TemplateClassifierOptions = {},
  ) {
    this.minScore = options.minScore ?? 0.35;
    this.minMargin = options.minMargin ?? 0.05;
  }

  async classify(
    intakeText: string,
    candidates: readonly TemplateCandidate[],
  ): Promise<TemplateClassification> {
    if (candidates.length === 0) return { ranked: [] };
    const texts = [
      intakeText,
      ...candidates.map((candidate) => describeCandidate(candidate)),
    ];
    const vectors = await this.embedder.embed(texts);
    const query = vectors[0] as Float32Array;
    const ranked = candidates
      .map((candidate, index) => ({
        slug: candidate.slug,
        score: cosine(query, vectors[index + 1] as Float32Array),
      }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const runnerUp = ranked[1];
    const margin = top && runnerUp ? top.score - runnerUp.score : top?.score ?? 0;
    const autoSelect =
      top && top.score >= this.minScore && margin >= this.minMargin
        ? { slug: top.slug, score: top.score, margin }
        : undefined;
    return { ranked, autoSelect };
  }
}

/** The text the classifier sees for each template — descriptors only, no code. */
export function describeCandidate(candidate: TemplateCandidate): string {
  const parts = [
    candidate.slug.replace(/-/g, ' '),
    candidate.displayName,
    candidate.description,
    candidate.category,
    ...(candidate.useCase ?? []),
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);
  return parts.join('. ');
}

export function buildIntakeText(input: {
  niche: string;
  description?: string;
  targetAudience?: string;
  primaryGoal?: string;
}): string {
  // Embed business facts, not instructions: long intake descriptions carry
  // content-policy prose ("do not invent clients…") that dilutes the
  // embedding and drags similarity toward generic templates. Keep the niche,
  // audience and goal whole, and only the first sentence of the description.
  const firstSentence = input.description
    ?.slice(0, 240)
    .split(/(?<=[.!?])\s/)[0];
  return [input.niche, firstSentence, input.targetAudience, input.primaryGoal]
    .filter(Boolean)
    .join('. ')
    .slice(0, 600);
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += (a[i] as number) * (b[i] as number);
  // Embedder output is L2-normalized, so the dot product IS the cosine.
  return dot;
}

// ── MiniLM ONNX embedder ────────────────────────────────────────────────────

interface TokenizerJson {
  model: { vocab: Record<string, number>; unk_token: string; continuing_subword_prefix?: string };
}

/**
 * Minimal BERT WordPiece pipeline matching sentence-transformers/all-MiniLM:
 * NFD-lowercase + accent strip, punctuation split, greedy longest-match with
 * '##' continuations, [CLS]/[SEP] framing, mean pooling + L2 normalize.
 */
export class MiniLmOnnxEmbedder implements Embedder {
  private session: import('onnxruntime-node').InferenceSession | undefined;
  private vocab!: Record<string, number>;
  private unkId!: number;
  private clsId!: number;
  private sepId!: number;

  constructor(private readonly modelDir: string, private readonly maxLen = 256) {}

  private async ensure(): Promise<import('onnxruntime-node').InferenceSession> {
    if (this.session) return this.session;
    const ort = await import('onnxruntime-node');
    const tok = JSON.parse(
      readFileSync(join(this.modelDir, 'tokenizer.json'), 'utf8'),
    ) as TokenizerJson;
    this.vocab = tok.model.vocab;
    this.unkId = this.vocab[tok.model.unk_token] ?? 100;
    this.clsId = this.vocab['[CLS]'] ?? 101;
    this.sepId = this.vocab['[SEP]'] ?? 102;
    this.session = await ort.InferenceSession.create(
      join(this.modelDir, 'minilm_opt_int8.onnx'),
    );
    return this.session;
  }

  private tokenize(text: string): number[] {
    const normalized = text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    const words = normalized
      .replace(/([!-/:-@[-`{-~])/g, ' $1 ')
      .split(/\s+/)
      .filter(Boolean);
    const ids: number[] = [this.clsId];
    for (const word of words) {
      if (ids.length >= this.maxLen - 1) break;
      let start = 0;
      const pieces: number[] = [];
      let ok = true;
      while (start < word.length) {
        let end = word.length;
        let id: number | undefined;
        while (end > start) {
          const piece = (start === 0 ? '' : '##') + word.slice(start, end);
          const found = this.vocab[piece];
          if (found !== undefined) { id = found; break; }
          end--;
        }
        if (id === undefined) { ok = false; break; }
        pieces.push(id);
        start = end;
      }
      ids.push(...(ok ? pieces : [this.unkId]));
    }
    ids.push(this.sepId);
    return ids.slice(0, this.maxLen);
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const session = await this.ensure();
    const ort = await import('onnxruntime-node');
    const results: Float32Array[] = [];
    for (const text of texts) {
      const ids = this.tokenize(text);
      const len = ids.length;
      const input = new BigInt64Array(ids.map((id) => BigInt(id)));
      const mask = new BigInt64Array(len).fill(BigInt(1));
      const types = new BigInt64Array(len).fill(BigInt(0));
      const feeds: Record<string, import('onnxruntime-node').Tensor> = {
        input_ids: new ort.Tensor('int64', input, [1, len]),
        attention_mask: new ort.Tensor('int64', mask, [1, len]),
        token_type_ids: new ort.Tensor('int64', types, [1, len]),
      };
      const output = await session.run(feeds);
      const hidden = output[session.outputNames[0] as string] as import('onnxruntime-node').Tensor;
      const [, seq, dim] = hidden.dims as number[];
      const data = hidden.data as Float32Array;
      const pooled = new Float32Array(dim as number);
      for (let t = 0; t < (seq as number); t++)
        for (let d = 0; d < (dim as number); d++)
          pooled[d] = (pooled[d] as number) + (data[t * (dim as number) + d] as number);
      let norm = 0;
      for (let d = 0; d < (dim as number); d++) {
        pooled[d] = (pooled[d] as number) / (seq as number);
        norm += (pooled[d] as number) ** 2;
      }
      norm = Math.sqrt(norm) || 1;
      for (let d = 0; d < (dim as number); d++) pooled[d] = (pooled[d] as number) / norm;
      results.push(pooled);
    }
    return results;
  }
}
