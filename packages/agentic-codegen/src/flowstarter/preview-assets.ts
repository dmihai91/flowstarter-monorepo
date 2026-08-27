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
}

/** Raster-only: SVG can carry scripts and scraped media never needs it. */
const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,80}\.(png|jpe?g|webp|gif)$/i;
const MAX_ASSET_BYTES = 8 * 1024 * 1024;

/**
 * Writes client media into the workspace and returns the cachedAssets entries
 * the preview agent may reference. Trusted orchestrator step — runs after
 * scaffold, before any agent session.
 */
export async function materializeCachedAssets(
  workspaceRoot: string,
  files: readonly CachedAssetFile[],
): Promise<Array<{ sourceId: string; publicPath: string }>> {
  if (files.length === 0) return [];
  const directory = join(workspaceRoot, 'public', 'flowstarter-assets');
  await mkdir(directory, { recursive: true });

  const seen = new Set<string>();
  const entries: Array<{ sourceId: string; publicPath: string }> = [];
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
    entries.push({
      sourceId: file.sourceId,
      publicPath: `/flowstarter-assets/${file.fileName}`,
    });
  }
  return entries;
}
