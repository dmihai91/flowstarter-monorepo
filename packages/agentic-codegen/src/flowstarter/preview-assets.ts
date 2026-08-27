import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Client media handed to the preview pipeline (scraped brand photos, profile
 * pictures). The bytes are untrusted scrape output; the file name and target
 * directory are validated here so nothing escapes `public/flowstarter-assets/`.
 */
export interface CachedAssetFile {
  /** Corpus source the asset came from, e.g. an Instagram post document id. */
  sourceId: string;
  /** Plain file name; written under public/flowstarter-assets/. */
  fileName: string;
  contentBase64: string;
  /**
   * May this image fill the hero/banner? Set by the caller that knows what
   * the photo actually shows (intake question, scraper profile role, or a
   * vision classifier). Casual snapshots must be left false: the hero then
   * keeps the template's art-directed asset instead.
   */
  heroEligible?: boolean;
}

/** Raster-only: SVG can carry scripts and scraped media never needs it. */
const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,80}\.(png|jpe?g|webp|gif)$/i;
const MAX_ASSET_BYTES = 8 * 1024 * 1024;

export interface CachedAssetEntry {
  sourceId: string;
  publicPath: string;
  /** True only when the caller vouched for this image as hero-grade. */
  heroEligible?: boolean;
  /** Pixel dimensions, when the format header could be parsed. The agent
   * needs these to keep avatar-sized images out of hero-sized slots. */
  width?: number;
  height?: number;
}

/** Best-effort dimensions from the image header; undefined when unknown. */
function probeImageSize(
  bytes: Buffer,
): { width: number; height: number } | undefined {
  // PNG: IHDR directly after the 8-byte signature.
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  // GIF: logical screen descriptor, little-endian.
  if (bytes.length > 10 && bytes.toString('ascii', 0, 3) === 'GIF') {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  // JPEG: scan segments for a start-of-frame marker.
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1] as number;
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
  }
  // WebP (VP8/VP8L/VP8X) and unparseable data: no dimensions.
  return undefined;
}

/**
 * Writes client media into the workspace and returns the cachedAssets entries
 * the preview agent may reference. Trusted orchestrator step — runs after
 * scaffold, before any agent session.
 */
export async function materializeCachedAssets(
  workspaceRoot: string,
  files: readonly CachedAssetFile[],
): Promise<CachedAssetEntry[]> {
  if (files.length === 0) return [];
  const directory = join(workspaceRoot, 'public', 'flowstarter-assets');
  await mkdir(directory, { recursive: true });

  const seen = new Set<string>();
  const entries: CachedAssetEntry[] = [];
  for (const file of files) {
    if (!SAFE_FILE_NAME.test(file.fileName)) {
      throw new Error(`Unsafe cached asset file name: ${file.fileName}`);
    }
    const key = file.fileName.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate cached asset file name: ${file.fileName}`);
    }
    seen.add(key);
    const bytes = Buffer.from(file.contentBase64, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_ASSET_BYTES) {
      throw new Error(`Cached asset ${file.fileName} is empty or too large`);
    }
    await writeFile(join(directory, file.fileName), bytes, {
      flag: 'wx',
      mode: 0o644,
    });
    const size = probeImageSize(bytes);
    // A hero-sized slot needs real pixels; an upscaled avatar reads blurry.
    const bigEnough = size ? Math.max(size.width, size.height) >= 700 : false;
    entries.push({
      sourceId: file.sourceId,
      publicPath: `/flowstarter-assets/${file.fileName}`,
      ...(size ?? {}),
      heroEligible: Boolean(file.heroEligible) && bigEnough,
    });
  }
  return entries;
}
