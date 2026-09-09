import * as path from 'path';

/**
 * Template / resource slug allowlist.
 * Alphanumeric with internal hyphens only — blocks traversal and injection.
 */
const SAFE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export class UnsafePathError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnsafePathError';
	}
}

export function isSafeSlug(slug: string | undefined | null): slug is string {
	return typeof slug === 'string' && SAFE_SLUG_RE.test(slug);
}

export function assertSafeSlug(slug: string | undefined | null): string {
	if (!isSafeSlug(slug)) {
		throw new UnsafePathError('Invalid template slug');
	}
	return slug;
}

/**
 * Resolve `parts` under `root`, rejecting any path that escapes the root.
 * CodeQL recognizes resolve + prefix-boundary checks as path-injection sanitizers.
 */
export function resolveUnder(root: string, ...parts: string[]): string {
	const base = path.resolve(root);
	for (const part of parts) {
		if (
			typeof part !== 'string' ||
			part.length === 0 ||
			part.includes('\0') ||
			path.isAbsolute(part)
		) {
			throw new UnsafePathError('Invalid path segment');
		}
		// Reject any segment that still contains traversal after normalization
		const normalized = path.normalize(part);
		if (
			normalized === '..' ||
			normalized.startsWith(`..${path.sep}`) ||
			normalized.includes(`${path.sep}..${path.sep}`) ||
			normalized.endsWith(`${path.sep}..`)
		) {
			throw new UnsafePathError('Path traversal rejected');
		}
	}
	const resolved = path.resolve(base, ...parts);
	if (resolved !== base && !resolved.startsWith(base + path.sep)) {
		throw new UnsafePathError('Path escapes root');
	}
	return resolved;
}

/** Escape text for safe interpolation into HTML bodies. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Allow only dark/light preview modes. */
export function sanitizePreviewMode(
	mode: string | undefined,
): 'dark' | 'light' | undefined {
	if (mode === 'dark' || mode === 'light') return mode;
	return undefined;
}
