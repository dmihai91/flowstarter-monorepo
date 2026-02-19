/**
 * Snapshot Compression Utilities
 *
 * Compresses/decompresses project files as gzip for efficient Convex blob storage.
 * Uses browser's native CompressionStream API (supported in modern browsers).
 */

export interface FileEntry {
  path: string;
  content: string;
  type: string;
  isBinary: boolean;
}

export interface FileMap {
  [path: string]: {
    type: string;
    content: string;
    isBinary: boolean;
  };
}

export interface CompressionResult {
  blob: Blob;
  compressedSize: number;
  uncompressedSize: number;
  fileCount: number;
}

/**
 * Compress files to gzip blob for storage
 */
export async function compressFilesToBlob(files: FileEntry[]): Promise<CompressionResult> {
  // Convert files array to FileMap for JSON serialization
  const fileMap: FileMap = {};

  for (const file of files) {
    fileMap[file.path] = {
      type: file.type,
      content: file.content,
      isBinary: file.isBinary,
    };
  }

  const jsonString = JSON.stringify(fileMap);
  const uncompressedSize = new TextEncoder().encode(jsonString).length;

  // Use CompressionStream API for gzip
  const stream = new Blob([jsonString]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(compressedStream).blob();

  return {
    blob: compressedBlob,
    compressedSize: compressedBlob.size,
    uncompressedSize,
    fileCount: files.length,
  };
}

/**
 * Compress FileMap to gzip blob
 */
export async function compressFileMapToBlob(fileMap: FileMap): Promise<CompressionResult> {
  const jsonString = JSON.stringify(fileMap);
  const uncompressedSize = new TextEncoder().encode(jsonString).length;
  const fileCount = Object.keys(fileMap).length;

  const stream = new Blob([jsonString]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(compressedStream).blob();

  return {
    blob: compressedBlob,
    compressedSize: compressedBlob.size,
    uncompressedSize,
    fileCount,
  };
}

/**
 * Decompress gzip blob back to FileMap
 */
export async function decompressBlobToFileMap(blob: Blob): Promise<FileMap> {
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const decompressedText = await new Response(decompressedStream).text();

  return JSON.parse(decompressedText) as FileMap;
}

/**
 * Decompress gzip blob to files array
 */
export async function decompressBlobToFiles(blob: Blob): Promise<FileEntry[]> {
  const fileMap = await decompressBlobToFileMap(blob);

  return Object.entries(fileMap).map(([path, data]) => ({
    path,
    content: data.content,
    type: data.type,
    isBinary: data.isBinary,
  }));
}

/**
 * Download blob from URL and decompress
 */
export async function downloadAndDecompress(url: string): Promise<FileMap> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download snapshot: ${response.status}`);
  }

  const blob = await response.blob();

  return decompressBlobToFileMap(blob);
}

/**
 * Upload compressed blob to Convex storage
 */
export async function uploadCompressedBlob(uploadUrl: string, blob: Blob): Promise<{ storageId: string }> {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/gzip' },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload snapshot: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if CompressionStream is supported
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/**
 * Fallback: Compress using pako (if CompressionStream not available)
 * Note: Requires pako library to be installed
 */
export async function compressWithPako(fileMap: FileMap): Promise<CompressionResult> {
  // Dynamic import pako only if needed
  const pako = await import('pako');

  const jsonString = JSON.stringify(fileMap);
  const uncompressedSize = new TextEncoder().encode(jsonString).length;
  const fileCount = Object.keys(fileMap).length;

  const compressed = pako.gzip(jsonString);
  const blob = new Blob([compressed], { type: 'application/gzip' });

  return {
    blob,
    compressedSize: blob.size,
    uncompressedSize,
    fileCount,
  };
}

/**
 * Fallback: Decompress using pako
 */
export async function decompressWithPako(blob: Blob): Promise<FileMap> {
  const pako = await import('pako');

  const arrayBuffer = await blob.arrayBuffer();
  const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });

  return JSON.parse(decompressed) as FileMap;
}

