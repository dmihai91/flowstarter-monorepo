import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import {
	LOCAL_DEV_ORIGINS,
	createCorsOptionsDelegate,
	matchAllowedOrigin,
	parseAllowedOrigins,
	resolveAllowedOrigins,
} from './cors.js';

// The HTTP transport used to answer `origin: true`, reflecting whatever Origin
// a request carried and attaching credentials to it
// (CodeQL js/cors-permissive-configuration). These tests pin the replacement:
// an allow-list, default deny, credentials only for a match.

describe('parseAllowedOrigins', () => {
	it('splits a comma separated list and trims each entry', () => {
		expect(parseAllowedOrigins('https://a.example, https://b.example')).toEqual([
			'https://a.example',
			'https://b.example',
		]);
	});

	it('drops blanks and never treats * as an entry', () => {
		expect(parseAllowedOrigins('*')).toEqual([]);
		expect(parseAllowedOrigins(' , https://a.example , * ')).toEqual([
			'https://a.example',
		]);
	});

	it('returns nothing for an unset variable', () => {
		expect(parseAllowedOrigins(undefined)).toEqual([]);
		expect(parseAllowedOrigins('')).toEqual([]);
	});
});

describe('resolveAllowedOrigins', () => {
	it('reads MCP_ALLOWED_ORIGINS and keeps the local development origins', () => {
		const allowed = resolveAllowedOrigins({
			MCP_ALLOWED_ORIGINS: 'https://app.example',
		} as NodeJS.ProcessEnv);
		expect(allowed).toContain('https://app.example');
		for (const origin of LOCAL_DEV_ORIGINS) {
			expect(allowed).toContain(origin);
		}
	});

	it('still honours the older CORS_ORIGIN variable', () => {
		expect(
			resolveAllowedOrigins({
				CORS_ORIGIN: 'https://legacy.example',
			} as NodeJS.ProcessEnv)
		).toContain('https://legacy.example');
	});

	it('never widens to everything when a variable is *', () => {
		const allowed = resolveAllowedOrigins({
			MCP_ALLOWED_ORIGINS: '*',
			CORS_ORIGIN: '*',
		} as NodeJS.ProcessEnv);
		expect(allowed).not.toContain('*');
		expect(allowed).toEqual([...LOCAL_DEV_ORIGINS]);
	});
});

describe('matchAllowedOrigin', () => {
	it('returns the allow-list entry, not the value the client sent', () => {
		const allowed = ['https://app.example'];
		const matched = matchAllowedOrigin('https://app.example', allowed);
		expect(matched).toBe(allowed[0]);
	});

	it('refuses an unknown origin and a missing one', () => {
		expect(matchAllowedOrigin('https://evil.example', ['https://a.example'])).toBeUndefined();
		expect(matchAllowedOrigin(undefined, ['https://a.example'])).toBeUndefined();
	});
});

describe('CORS middleware over HTTP', () => {
	const app = express();
	app.use(
		cors(
			createCorsOptionsDelegate({
				MCP_ALLOWED_ORIGINS: 'https://app.example',
			} as NodeJS.ProcessEnv)
		)
	);
	app.get('/health', (_req, res) => {
		res.json({ status: 'healthy' });
	});

	let server: Server;
	let baseUrl: string;

	beforeAll(async () => {
		await new Promise<void>((resolve) => {
			server = app.listen(0, '127.0.0.1', () => resolve());
		});
		const { port } = server.address() as AddressInfo;
		baseUrl = `http://127.0.0.1:${port}`;
	});

	afterAll(() => {
		server.close();
	});

	it('echoes an allowed origin and allows credentials with it', async () => {
		const res = await fetch(`${baseUrl}/health`, {
			headers: { Origin: 'https://app.example' },
		});
		expect(res.headers.get('access-control-allow-origin')).toBe('https://app.example');
		expect(res.headers.get('access-control-allow-credentials')).toBe('true');
	});

	it('allows a local development origin with no configuration for it', async () => {
		const res = await fetch(`${baseUrl}/health`, {
			headers: { Origin: 'http://localhost:3000' },
		});
		expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
	});

	it('sends no allow-origin and no credentials to an unknown origin', async () => {
		const res = await fetch(`${baseUrl}/health`, {
			headers: { Origin: 'https://evil.example' },
		});
		expect(res.headers.get('access-control-allow-origin')).toBeNull();
		expect(res.headers.get('access-control-allow-credentials')).toBeNull();
	});

	it('keeps the health route reachable from a denied origin', async () => {
		const res = await fetch(`${baseUrl}/health`, {
			headers: { Origin: 'https://evil.example' },
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: 'healthy' });
	});

	it('answers a preflight from an allowed origin only', async () => {
		const allowed = await fetch(`${baseUrl}/health`, {
			method: 'OPTIONS',
			headers: {
				Origin: 'https://app.example',
				'Access-Control-Request-Method': 'GET',
			},
		});
		expect(allowed.headers.get('access-control-allow-origin')).toBe('https://app.example');

		const denied = await fetch(`${baseUrl}/health`, {
			method: 'OPTIONS',
			headers: {
				Origin: 'https://evil.example',
				'Access-Control-Request-Method': 'GET',
			},
		});
		expect(denied.headers.get('access-control-allow-origin')).toBeNull();
	});
});
