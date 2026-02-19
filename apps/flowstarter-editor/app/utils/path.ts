// Browser-compatible path utilities
import type { ParsedPath } from 'path';
import pathBrowserify from 'path-browserify';

/**
 * Convert Windows-style backslashes to forward slashes for browser compatibility.
 * This is needed because path-browserify only handles POSIX-style paths.
 */
function toForwardSlashes(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * A browser-compatible path utility that mimics Node's path module
 * Using path-browserify for consistent behavior in browser environments
 * All functions normalize backslashes to forward slashes for cross-platform compatibility
 */
export const path = {
  join: (...paths: string[]): string => pathBrowserify.join(...paths.map(toForwardSlashes)),
  dirname: (p: string): string => pathBrowserify.dirname(toForwardSlashes(p)),
  basename: (p: string, ext?: string): string => pathBrowserify.basename(toForwardSlashes(p), ext),
  extname: (p: string): string => pathBrowserify.extname(toForwardSlashes(p)),
  relative: (from: string, to: string): string => pathBrowserify.relative(toForwardSlashes(from), toForwardSlashes(to)),
  isAbsolute: (p: string): boolean => pathBrowserify.isAbsolute(toForwardSlashes(p)),
  normalize: (p: string): string => pathBrowserify.normalize(toForwardSlashes(p)),
  parse: (p: string): ParsedPath => pathBrowserify.parse(toForwardSlashes(p)),
  format: (pathObject: ParsedPath): string => pathBrowserify.format(pathObject),

  /** Utility to convert backslashes to forward slashes */
  toForwardSlashes,
} as const;

