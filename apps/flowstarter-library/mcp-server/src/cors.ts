import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import type { Request } from 'express';

/**
 * Cross-origin policy for the HTTP transport.
 *
 * The server used to reflect whatever `Origin` a request carried whenever
 * `CORS_ORIGIN` was unset or `*`, which is an allow-any policy with
 * credentials attached (CodeQL js/cors-permissive-configuration). It now
 * answers from an allow-list and denies everything else. Denying only means
 * the response carries no `Access-Control-Allow-Origin`; the request still
 * reaches its route, so `/health` stays reachable from anywhere.
 */

/** Methods and headers the transport has always accepted. */
const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization'];

/**
 * Origins allowed with no configuration at all: the two ports this server and
 * its clients use in local development, on both loopback spellings. README.md
 * connects a client to `http://localhost:3000` and `src/tools/list.ts`
 * defaults `PUBLIC_URL` to `http://localhost:3001`.
 */
export const LOCAL_DEV_ORIGINS: readonly string[] = [
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:3001',
	'http://127.0.0.1:3001',
];

/** Split a comma separated origin list, dropping blanks and any `*` wildcard. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0 && origin !== '*');
}

/**
 * The full allow-list: `MCP_ALLOWED_ORIGINS`, then the older `CORS_ORIGIN`
 * (same syntax, kept working), then the local development origins. A `*` in
 * either variable is ignored rather than obeyed.
 */
export function resolveAllowedOrigins(
	env: NodeJS.ProcessEnv = process.env
): string[] {
	return Array.from(
		new Set([
			...parseAllowedOrigins(env.MCP_ALLOWED_ORIGINS),
			...parseAllowedOrigins(env.CORS_ORIGIN),
			...LOCAL_DEV_ORIGINS,
		])
	);
}

/**
 * The allow-list entry equal to `origin`, or undefined. Returning the entry
 * rather than the request's own header keeps the value that reaches the
 * response header sourced from configuration, never from the client.
 */
export function matchAllowedOrigin(
	origin: string | undefined,
	allowed: readonly string[]
): string | undefined {
	if (!origin) return undefined;
	return allowed.find((candidate) => candidate === origin);
}

/** Options for an origin that matched: echo the configured entry, allow credentials. */
function allowOptions(matched: string): CorsOptions {
	return {
		origin: matched,
		credentials: true,
		methods: ALLOWED_METHODS,
		allowedHeaders: ALLOWED_HEADERS,
	};
}

/** Options for everything else: no origin header, and no credentials with it. */
function denyOptions(): CorsOptions {
	return {
		origin: false,
		credentials: false,
		methods: ALLOWED_METHODS,
		allowedHeaders: ALLOWED_HEADERS,
	};
}

/**
 * Per-request CORS options. A request with no `Origin` (same origin, curl, a
 * health probe) is not a cross-origin request and gets the deny options, which
 * for it means simply no CORS headers.
 */
export function createCorsOptionsDelegate(
	env: NodeJS.ProcessEnv = process.env
): CorsOptionsDelegate<Request> {
	const allowed = resolveAllowedOrigins(env);
	return (req, callback) => {
		const matched = matchAllowedOrigin(req.headers.origin, allowed);
		callback(null, matched ? allowOptions(matched) : denyOptions());
	};
}
