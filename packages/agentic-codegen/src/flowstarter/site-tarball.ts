/**
 * Turning a `{path, content}` manifest into the gzipped tarball the
 * deploy-agent extracts.
 *
 * This lives in the shared package rather than in flowstarter-main because
 * two producers now need it: the funnel preview publisher (which runs inside
 * Next) and the build worker (which runs on a compute host and cannot import
 * app code). Both must emit byte-identical archives, or a "redeploy the same
 * site" comparison stops meaning anything.
 *
 * The tar writer is hand-rolled ustar rather than a dependency. It is 60 lines
 * of a format that has not changed since 1988, it is deterministic (same files
 * in, same bytes out — which is what makes the tests meaningful), and it keeps
 * a package with a history of path-traversal CVEs out of the request path that
 * packages attacker-influenced, LLM-generated file names.
 */

import { gzipSync } from 'node:zlib';

export interface ArchiveFile {
  path: string;
  content: string /** Present for binary entries; content is then base64. */;
  encoding?: 'base64';
}

const BLOCK = 512;

export class SiteArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteArchiveError';
  }
}

function octal(value: number, width: number): string {
  // ustar numeric fields are octal, zero-padded, NUL-terminated.
  return value.toString(8).padStart(width - 1, '0') + '\0';
}

function writeString(
  block: Uint8Array,
  offset: number,
  width: number,
  value: string,
): void {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length > width) {
    throw new SiteArchiveError(`field does not fit in ${width} bytes`);
  }
  block.set(bytes, offset);
}

/**
 * Splits a path into ustar's (prefix, name) pair. Names up to 100 bytes fit on
 * their own; longer ones borrow the 155-byte prefix field at a directory
 * boundary. Anything that still does not fit is refused rather than silently
 * truncated into a different file.
 */
function splitPath(path: string): { name: string; prefix: string } {
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' };
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('/');
    const name = parts.slice(i).join('/');
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix };
    }
  }
  throw new SiteArchiveError(`path is too long for a tar header: ${path}`);
}

/**
 * Rejects anything that would let an entry escape the directory the agent
 * extracts into. The agent extracts with system `tar`, which is not obliged to
 * refuse these, and the file names in a generated site were chosen by a
 * language model.
 */
function assertSafeEntryPath(path: string): void {
  if (!path || path.startsWith('/') || path.startsWith('./')) {
    throw new SiteArchiveError(`unsafe archive path: "${path}"`);
  }
  if (path.includes('\0') || path.includes('\\')) {
    throw new SiteArchiveError(`unsafe archive path: "${path}"`);
  }
  if (path.split('/').some((segment) => segment === '..')) {
    throw new SiteArchiveError(`unsafe archive path: "${path}"`);
  }
}

function tarHeader(
  path: string,
  size: number,
  mtimeSeconds: number,
): Uint8Array {
  const block = new Uint8Array(BLOCK);
  const { name, prefix } = splitPath(path);
  writeString(block, 0, 100, name);
  writeString(block, 100, 8, octal(0o644, 8));
  writeString(block, 108, 8, octal(0, 8));
  writeString(block, 116, 8, octal(0, 8));
  writeString(block, 124, 12, octal(size, 12));
  writeString(block, 136, 12, octal(mtimeSeconds, 12));
  // Checksum is computed with this field filled with spaces, then written.
  block.fill(0x20, 148, 156);
  block[156] = '0'.charCodeAt(0); // typeflag: regular file
  writeString(block, 257, 6, 'ustar\0');
  writeString(block, 263, 2, '00');
  if (prefix) writeString(block, 345, 155, prefix);

  // Classic index loop: `for…of` over a Uint8Array needs downlevelIteration,
  // which flowstarter-main's tsconfig (target es5) does not enable.
  let sum = 0;
  for (let i = 0; i < block.length; i++) sum += block[i] as number;
  // 6 octal digits, NUL, space — the form every tar implementation accepts.
  writeString(block, 148, 8, `${sum.toString(8).padStart(6, '0')}\0 `);
  return block;
}

export interface PackOptions {
  /** Fixed mtime keeps the output byte-identical for identical input. */
  mtimeSeconds?: number;
  /** Refuses anything larger, uncompressed. Default 32 MiB. */
  maxBytes?: number;
}

/**
 * Packs a manifest into a gzipped tar the deploy-agent can extract.
 *
 * Entries are emitted in the order given; callers who want reproducibility
 * across runs should sort. Directories are not emitted — `tar -x` creates them
 * implicitly, and an explicit directory entry is one more thing that can carry
 * a path we did not check.
 */
export function packSiteTarball(
  files: readonly ArchiveFile[],
  options: PackOptions = {},
): Uint8Array {
  if (files.length === 0) {
    throw new SiteArchiveError('cannot pack an empty manifest');
  }
  const maxBytes = options.maxBytes ?? 32 * 1024 * 1024;
  const mtime = options.mtimeSeconds ?? 0;
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (const file of files) {
    const path = file.path.trim();
    assertSafeEntryPath(path);
    // Binary manifest entries (images, fonts) carry base64 with an encoding
    // marker; packing them as UTF-8 would corrupt every image in the site.
    const body =
      file.encoding === 'base64'
        ? Buffer.from(file.content ?? '', 'base64')
        : Buffer.from(file.content ?? '', 'utf8');
    total += body.length;
    if (total > maxBytes) {
      throw new SiteArchiveError('manifest exceeds the archive size limit');
    }
    chunks.push(tarHeader(path, body.length, mtime));
    chunks.push(new Uint8Array(body));
    const padding = (BLOCK - (body.length % BLOCK)) % BLOCK;
    if (padding > 0) chunks.push(new Uint8Array(padding));
  }

  // Two zero blocks mark end-of-archive.
  chunks.push(new Uint8Array(BLOCK * 2));

  const tar = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return new Uint8Array(gzipSync(tar, { level: 9 }));
}
