/**
 * Site Versioning Utilities
 *
 * Handles gzip compression and decompression for site version storage.
 * Files are compressed into a gzipped archive for efficient storage in Convex.
 * Uses native browser CompressionStream API for gzip.
 */

export interface SiteFile {
  path: string;
  content: string;
}

export interface FileManifestEntry {
  path: string;
  size: number;
  hash?: string;
}

export interface CompressedArchive {
  data: Uint8Array;
  size: number;
  uncompressedSize: number;
  fileCount: number;
  manifest: FileManifestEntry[];
}

/**
 * Simple hash function for file content
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Create a JSON-based archive structure
 * We use a simple JSON format that can be gzipped efficiently
 */
interface ArchiveStructure {
  version: number;
  timestamp: number;
  files: SiteFile[];
}

/**
 * Compress data using native CompressionStream API
 */
async function gzipCompress(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const inputData = encoder.encode(data);

  // Use CompressionStream for gzip
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(inputData);
  writer.close();

  // Read compressed data
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Decompress gzip data using native DecompressionStream API
 */
async function gzipDecompress(compressedData: Uint8Array): Promise<string> {
  // Use DecompressionStream for gunzip
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(compressedData as BufferSource);
  writer.close();

  // Read decompressed data
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks and decode
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

/**
 * Compress site files into a gzipped archive
 */
export async function compressSiteFiles(
  files: SiteFile[]
): Promise<CompressedArchive> {
  // Calculate uncompressed size and create manifest
  let uncompressedSize = 0;
  const manifest: FileManifestEntry[] = [];

  for (const file of files) {
    const size = new TextEncoder().encode(file.content).length;
    uncompressedSize += size;
    manifest.push({
      path: file.path,
      size,
      hash: hashContent(file.content),
    });
  }

  // Create archive structure
  const archive: ArchiveStructure = {
    version: 1,
    timestamp: Date.now(),
    files,
  };

  // Convert to JSON and compress with gzip
  const jsonString = JSON.stringify(archive);
  const compressed = await gzipCompress(jsonString);

  return {
    data: compressed,
    size: compressed.length,
    uncompressedSize,
    fileCount: files.length,
    manifest,
  };
}

/**
 * Decompress a gzipped archive back to site files
 */
export async function decompressSiteFiles(
  compressedData: Uint8Array
): Promise<SiteFile[]> {
  try {
    // Decompress
    const decompressed = await gzipDecompress(compressedData);

    // Parse JSON
    const archive: ArchiveStructure = JSON.parse(decompressed);

    return archive.files;
  } catch (error) {
    console.error('Failed to decompress site archive:', error);
    throw new Error('Failed to decompress site archive');
  }
}

/**
 * Convert compressed data to Blob for upload
 */
export function compressedToBlob(compressed: CompressedArchive): Blob {
  return new Blob([compressed.data as BlobPart], { type: 'application/gzip' });
}

/**
 * Upload compressed archive to Convex storage
 */
export async function uploadCompressedArchive(
  compressed: CompressedArchive,
  uploadUrl: string
): Promise<string> {
  const blob = compressedToBlob(compressed);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/gzip',
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload archive: ${response.status}`);
  }

  const result = await response.json();
  return result.storageId;
}

/**
 * Download and decompress archive from Convex storage
 */
export async function downloadAndDecompressArchive(
  archiveUrl: string
): Promise<SiteFile[]> {
  const response = await fetch(archiveUrl);

  if (!response.ok) {
    throw new Error(`Failed to download archive: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const compressed = new Uint8Array(arrayBuffer);

  return decompressSiteFiles(compressed);
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(compressed: CompressedArchive): number {
  if (compressed.uncompressedSize === 0) return 1;
  return compressed.size / compressed.uncompressedSize;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
