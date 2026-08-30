/**
 * The info agent's shared vocabulary: what the wizard sends, what the endpoint
 * answers with, and the deterministic glue between them.
 *
 * Nothing here talks to a model, a database or the network, and nothing here
 * imports `server-only` — that is deliberate. The same functions run in the
 * browser (to draw the "still missing" list and to merge answers back into the
 * wizard) and on the server (to decide which gaps the agent is allowed to ask
 * about). One implementation, so the two can never disagree about what is
 * missing.
 *
 * The division of labour with `lib/flowstarter/sufficiency.ts` is strict:
 *
 *   the gate decides WHAT is missing → this module decides which of those a
 *   conversation can possibly fix → the model only decides HOW to phrase it.
 *
 * A model is never asked whether something is missing.
 */
import {
  evaluateSufficiency,
  type MissingCode,
  type MissingItem,
  type SufficiencyInput,
} from '@/lib/flowstarter/sufficiency';
import type { DiscoveryData, IntakeChatTurn } from './discovery.logic';

export type { IntakeChatTurn };

// ---------------------------------------------------------------------------
// Caps — an anonymous endpoint, so every one of these is a spend limit too
// ---------------------------------------------------------------------------

/** Agent questions per visitor, ever. Past this the chat closes itself out. */
export const MAX_INTAKE_QUESTIONS = 4;

/** Turns (both sides) accepted in one request body. */
export const MAX_TRANSCRIPT_TURNS = 2 * MAX_INTAKE_QUESTIONS + 4;

/** One turn. Longer than an answer, shorter than a pasted inbox. */
export const MAX_TURN_CHARS = 1_000;

/** Whole request, answers + transcript. Cheap ceiling on prompt spend. */
export const MAX_INTAKE_INPUT_CHARS = 12_000;

/** Services the chat will accept from one answer. */
export const MAX_EXTRACTED_SERVICES = 12;

// ---------------------------------------------------------------------------
// Wire shapes
// ---------------------------------------------------------------------------

export type IntakeChatRole = IntakeChatTurn['role'];

/** The wizard answers the endpoint is willing to look at. */
export interface IntakeChatAnswers {
  businessName: string;
  description: string;
  industry: string;
  targetAudience: string;
  goal: string;
  email: string;
  phone: string;
  services: string[];
  /** The visitor's own words, gathered by this chat so far. */
  intakeAnswers: string[];
}

/**
 * What the endpoint pulled out of the conversation, deterministically. The
 * wizard merges this into its `data`, so the preview is generated from the
 * answers the visitor just gave rather than from the form alone.
 */
export interface ExtractedIntakeAnswers {
  /** Every client turn, tidied. Counts as business prose for the gate. */
  answers: string[];
  services?: string[];
  phone?: string;
}

export type IntakeChatSkipReason = 'budget' | 'unconfigured' | 'error';

export interface IntakeChatResponse {
  /** `ask` — a question is waiting. `complete` — nothing more to ask. */
  status: 'ask' | 'complete';
  question: string | null;
  /** Everything the gate found, verbatim: plain-word messages, not codes. */
  missing: MissingItem[];
  /** Gate codes split by whether a conversation can actually fix them. */
  asks: { conversational: MissingCode[]; assets: MissingCode[] };
  extracted: ExtractedIntakeAnswers;
  /** The client's own words, filed as evidence when the interview finishes. */
  documents: Array<{ topic: string; text: string }>;
  questionsAsked: number;
  maxQuestions: number;
  /** True when the chat closed itself out without asking (budget, config). */
  skipped?: boolean;
  reason?: IntakeChatSkipReason;
}

export interface BusinessNamesResponse {
  names: Array<{ name: string; rationale: string }>;
}

// ---------------------------------------------------------------------------
// Which gaps a conversation can close
// ---------------------------------------------------------------------------

/**
 * The gaps a person can fix by typing. Asking a chat window for a 1600px
 * photograph is how you get a visitor who closes the tab, so image gaps are
 * shown as a note ("we will use template artwork until you send one") and
 * never handed to the interviewer.
 */
export const CONVERSATIONAL_GAP_CODES: readonly MissingCode[] = [
  'business_text_thin',
  'services_missing',
  'contact_signal_missing',
];

/** Short plain-word labels for the checklist. The long ask is the gate's. */
export const GAP_LABELS: Record<MissingCode, string> = {
  hero_image_missing: 'A main photo',
  hero_image_low_resolution: 'A bigger main photo',
  section_images_missing: 'Two more photos',
  logo_missing: 'Your logo',
  business_text_thin: 'A few words about the business',
  contact_signal_missing: 'A way to reach you',
  services_missing: 'What you sell or do',
};

export function conversationalGaps(
  missing: readonly MissingItem[]
): MissingItem[] {
  return missing.filter((item) => CONVERSATIONAL_GAP_CODES.includes(item.code));
}

export function assetGaps(missing: readonly MissingItem[]): MissingItem[] {
  return missing.filter(
    (item) => !CONVERSATIONAL_GAP_CODES.includes(item.code)
  );
}

/** Blocking gaps left unanswered when the visitor skips ahead. */
export function placeholderedIfSkipped(
  missing: readonly MissingItem[]
): MissingItem[] {
  return missing.filter((item) => item.severity === 'blocking');
}

// ---------------------------------------------------------------------------
// Wizard answers → gate input
// ---------------------------------------------------------------------------

function nonEmpty(values: Array<string | undefined | null>): string[] {
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
}

/**
 * Projects wizard answers onto the gate's input.
 *
 * `images` and `logo` are deliberately empty: at this point in the funnel
 * there is no workspace and nothing has been uploaded, so the image codes
 * always fire. That is honest — the preview really will use template artwork —
 * and it is why the chat step must never block on `ready`.
 */
export function sufficiencyInputFromAnswers(
  answers: Partial<IntakeChatAnswers>
): SufficiencyInput {
  return {
    images: [],
    logo: null,
    businessText: nonEmpty([
      answers.description,
      answers.targetAudience,
      ...(answers.intakeAnswers ?? []),
    ]),
    contact: {
      email: answers.email ?? '',
      phone: answers.phone ?? '',
      bookingUrl: '',
    },
    services: answers.services ?? [],
  };
}

/** The wizard's own state, in the shape the gate and the endpoint expect. */
export function answersFromDiscovery(data: DiscoveryData): IntakeChatAnswers {
  return {
    businessName: data.businessName ?? '',
    description: data.description ?? '',
    industry: data.industry ?? '',
    targetAudience: data.targetAudience ?? '',
    goal: data.goal ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    services: data.services ?? [],
    intakeAnswers: data.intakeAnswers ?? [],
  };
}

/** What is still missing, given the wizard's answers right now. */
export function gapsForDiscovery(data: DiscoveryData): MissingItem[] {
  return evaluateSufficiency(
    sufficiencyInputFromAnswers(answersFromDiscovery(data))
  ).missing;
}

// ---------------------------------------------------------------------------
// Conversation → structured answers
// ---------------------------------------------------------------------------

/** Topics whose text is a list of things the business sells. */
const SERVICE_TOPIC = /(service|offer|what-you-do|menu|treatment|product)/;

/** Topics whose text may carry a phone number. */
const CONTACT_TOPIC = /(contact|phone|reach|call|book)/;

/**
 * Deliberately conservative: seven or more digits with the usual separators.
 * A false positive here would put a wrong number on a client's website.
 */
const PHONE = /(\+?\d[\d\s().-]{6,}\d)/;

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_TURN_CHARS);
}

function splitServices(text: string): string[] {
  return text
    .split(/[\n,;•]|(?:^|\s)-\s/)
    .map((entry) => entry.replace(/^[\s\d.)-]+/, '').trim())
    .filter((entry) => entry.length > 1 && entry.length <= 80)
    .slice(0, MAX_EXTRACTED_SERVICES);
}

/**
 * Pulls structured answers out of a conversation. Pure and idempotent: it
 * reads the whole transcript every time and returns the full picture, so a
 * retried request cannot duplicate an answer.
 *
 * The model's `documents` are used for *classification* only — which topic an
 * answer belongs to — never as a source of new facts: `answers` is built from
 * the client's own turns.
 */
export function extractIntakeAnswers(input: {
  transcript: readonly IntakeChatTurn[];
  documents?: ReadonlyArray<{ topic: string; text: string }>;
}): ExtractedIntakeAnswers {
  const clientTurns = input.transcript
    .filter((turn) => turn.role === 'client')
    .map((turn) => tidy(turn.text))
    .filter((text) => text.length > 0);

  const services: string[] = [];
  let phone: string | undefined;

  for (const document of input.documents ?? []) {
    const topic = document.topic.toLowerCase();
    if (SERVICE_TOPIC.test(topic))
      services.push(...splitServices(document.text));
    if (CONTACT_TOPIC.test(topic)) {
      phone ??= PHONE.exec(document.text)?.[1]?.trim();
    }
  }
  // A number the visitor typed is worth having even before the interview
  // closes and produces documents.
  for (const text of clientTurns) {
    phone ??= PHONE.exec(text)?.[1]?.trim();
  }

  const deduped = services
    .map((service) => service.trim())
    .filter(
      (service, index, all) =>
        service.length > 0 &&
        all.findIndex(
          (other) => other.toLowerCase() === service.toLowerCase()
        ) === index
    )
    .slice(0, MAX_EXTRACTED_SERVICES);

  return {
    answers: clientTurns,
    ...(deduped.length > 0 ? { services: deduped } : {}),
    ...(phone ? { phone: phone.slice(0, 40) } : {}),
  };
}

/**
 * Merges what the endpoint extracted back into the wizard's data.
 *
 * Form answers win: a visitor who typed a phone number into the form is not
 * overruled by a number the chat thought it saw. Chat answers only ever fill
 * a hole.
 */
export function mergeExtractedAnswers(
  data: DiscoveryData,
  extracted: ExtractedIntakeAnswers
): DiscoveryData {
  return {
    ...data,
    intakeAnswers: extracted.answers,
    services:
      extracted.services && extracted.services.length > 0
        ? extracted.services
        : data.services ?? [],
    phone: data.phone?.trim() ? data.phone : extracted.phone ?? '',
  };
}

/** Total characters a request body is spending on the model. */
export function intakeInputSize(input: {
  answers: Partial<IntakeChatAnswers>;
  transcript: readonly IntakeChatTurn[];
}): number {
  const answerChars = [
    input.answers.businessName,
    input.answers.description,
    input.answers.industry,
    input.answers.targetAudience,
    input.answers.goal,
    ...(input.answers.services ?? []),
    ...(input.answers.intakeAnswers ?? []),
  ].reduce((total, value) => total + (value?.length ?? 0), 0);
  return (
    answerChars +
    input.transcript.reduce((total, turn) => total + turn.text.length, 0)
  );
}

// ---------------------------------------------------------------------------
// Feeding the generator
// ---------------------------------------------------------------------------

/** `/api/discovery/preview/live` caps `description` here. */
const MAX_DESCRIPTION_CHARS = 5_000;

/**
 * The description the preview is generated from, with the chat answers folded
 * in.
 *
 * This is the whole point of the step: an answer the visitor typed here has to
 * reach the generator on the very next screen, not only after they claim the
 * preview. Their words are labelled as theirs so the copy pass can quote them
 * rather than paraphrase the form.
 */
export function describeWithIntakeAnswers(data: DiscoveryData): string {
  const parts = [data.description.trim()];
  const services = (data.services ?? []).filter((service) => service.trim());
  if (services.length > 0) {
    parts.push(
      `What they sell, in their words:\n${services
        .map((service) => `- ${service}`)
        .join('\n')}`
    );
  }
  const answers = (data.intakeAnswers ?? []).filter((answer) => answer.trim());
  if (answers.length > 0) {
    parts.push(
      `Answers they gave in the intake conversation:\n${answers
        .map((answer) => `- ${answer}`)
        .join('\n')}`
    );
  }
  return parts.join('\n\n').slice(0, MAX_DESCRIPTION_CHARS);
}

/**
 * The chat, in the shape the claim endpoint accepts. Returns undefined when
 * there is nothing worth carrying, so a skipped chat adds nothing to the body.
 */
export function claimIntakeChatPayload(data: DiscoveryData):
  | {
      transcript: IntakeChatTurn[];
      documents: Array<{ topic: string; text: string }>;
      answers: string[];
      services: string[];
      phone: string;
    }
  | undefined {
  const transcript = data.intakeChat ?? [];
  const documents = data.intakeChatDocuments ?? [];
  const answers = data.intakeAnswers ?? [];
  if (transcript.length === 0 && documents.length === 0 && answers.length === 0)
    return undefined;
  return {
    transcript,
    documents,
    answers,
    services: data.services ?? [],
    phone: data.phone ?? '',
  };
}
