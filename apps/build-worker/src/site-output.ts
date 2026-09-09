/**
 * Reading a finished build off disk as a deployable manifest.
 *
 * The worktree the agent worked in is a source tree with a package manager's
 * debris in it. What the deploy-agent extracts must be only the built site, so
 * this walks one directory — `dist/` when the validation commands produced one,
 * the site root otherwise — and refuses everything that has no business inside
 * a static artifact.
 *
 * Text is carried as UTF-8 and everything else as base64, matching the
 * `ArchiveFile` contract `packSiteTarball` reads: packing a PNG as UTF-8 would
 * corrupt every image on the site, silently.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { ArchiveFile } from '@flowstarter/agentic-codegen';

/** Directories that are never part of a deployable static site. */
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.astro',
  '.cache',
  '.turbo',
  '.next',
  '.vercel',
  '.netlify',
]);

/** Extensions read as text; anything else is base64. */
const TEXT_EXTENSIONS = new Set([
  'html',
  'htm',
  'xhtml',
  'css',
  'js',
  'mjs',
  'cjs',
  'json',
  'map',
  'svg',
  'txt',
  'xml',
  'webmanifest',
  'md',
  'csv',
  'astro',
]);

export class SiteOutputError extends Error {}

function isTextPath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return TEXT_EXTENSIONS.has(ext);
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Which directory actually holds the site.
 *
 * A real Astro build leaves `dist/`. A manifest that was already plain HTML
 * (the deterministic dry path, and some hand-authored templates) never grows
 * one, and deploying its root is correct rather than a fallback hack.
 */
export async function resolveSiteOutputDir(
  siteRoot: string,
  outputDir: string,
): Promise<string> {
  const candidate = join(siteRoot, outputDir);
  return (await isDirectory(candidate)) ? candidate : siteRoot;
}

export interface CollectOptions {
  /** Refuses a build larger than this, uncompressed. Default 64 MiB. */
  maxBytes?: number;
  /** Refuses a build with more entries than this. Default 5000. */
  maxFiles?: number;
}

/**
 * Walks `dir` into archive entries with posix-relative paths, sorted so the
 * same tree always packs to the same bytes.
 */
export async function collectSiteFiles(
  dir: string,
  options: CollectOptions = {},
): Promise<ArchiveFile[]> {
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  const maxFiles = options.maxFiles ?? 5_000;
  const files: ArchiveFile[] = [];
  let total = 0;

  const walk = async (current: string): Promise<void> => {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && EXCLUDED_DIRS.has(entry.name)) continue;
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        await walk(join(current, entry.name));
        continue;
      }
      // Symlinks are skipped rather than followed: the target may sit outside
      // the tree, and a static host has no use for one.
      if (!entry.isFile()) continue;

      const absolute = join(current, entry.name);
      const rel = relative(dir, absolute).split(sep).join('/');
      const bytes = await readFile(absolute);
      total += bytes.length;
      if (files.length >= maxFiles) {
        throw new SiteOutputError(
          `build output has more than ${maxFiles} files; refusing to package it`,
        );
      }
      if (total > maxBytes) {
        throw new SiteOutputError(
          `build output exceeds ${maxBytes} bytes; refusing to package it`,
        );
      }
      files.push(
        isTextPath(rel)
          ? { path: rel, content: bytes.toString('utf8') }
          : { path: rel, content: bytes.toString('base64'), encoding: 'base64' },
      );
    }
  };

  await walk(dir);
  if (files.length === 0) {
    throw new SiteOutputError(`build output directory ${dir} is empty`);
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return files;
}
