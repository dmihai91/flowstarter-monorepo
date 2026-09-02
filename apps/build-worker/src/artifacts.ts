/**
 * On-disk store for packaged site tarballs, served back over the worker's own
 * HTTP port.
 *
 * The deploy-agent's contract is "here is a URL, go fetch it". In production
 * that URL is Supabase Storage; in local mode there is no bucket and no
 * public host, so the worker serves what it just built. That is safe only
 * because the file name carries 128 bits of CSPRNG: the artifact endpoint is
 * unauthenticated (the agent has no bearer token for us) and a guessable name
 * would hand a client's unreleased site to anyone who can reach the port.
 */

import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** `<uuid-ish job id>-<32 hex>` — what the URL grammar allows. */
const TOKEN = /^[0-9a-f-]{1,64}-[0-9a-f]{32}$/i;

export interface StoredArtifact {
  token: string;
  url: string;
  path: string;
  sha256: string;
  sizeBytes: number;
}

export class ArtifactStore {
  constructor(
    private readonly options: { root: string; baseUrl: string },
  ) {}

  async put(jobId: string, bytes: Uint8Array): Promise<StoredArtifact> {
    await mkdir(this.options.root, { recursive: true, mode: 0o700 });
    const token = `${jobId.toLowerCase()}-${randomBytes(16).toString('hex')}`;
    const path = join(this.options.root, `${token}.tar.gz`);
    await writeFile(path, bytes, { mode: 0o600 });
    return {
      token,
      path,
      url: `${this.options.baseUrl.replace(/\/$/, '')}/artifacts/${token}.tar.gz`,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sizeBytes: bytes.byteLength,
    };
  }

  /** Null for an unknown or malformed token — never a filesystem error. */
  async read(token: string): Promise<Buffer | null> {
    if (!TOKEN.test(token)) return null;
    try {
      return await readFile(join(this.options.root, `${token}.tar.gz`));
    } catch {
      return null;
    }
  }
}

/** The token out of `/artifacts/<token>.tar.gz`, or null. */
export function artifactTokenFromPath(pathname: string): string | null {
  const match = /^\/artifacts\/([^/]+)\.tar\.gz$/.exec(pathname);
  const token = match?.[1];
  return token && TOKEN.test(token) ? token : null;
}
