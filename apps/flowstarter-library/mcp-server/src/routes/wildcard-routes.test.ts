import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { createStaticRoutes } from './static.js';
import { createPreviewRoutes } from './preview.js';
import { createTemplatesRoutes } from './templates.js';

// Regression coverage for the Express 4 -> 5 wildcard route migration.
// path-to-regexp v8 (bundled by Express 5) rejects bare "*" patterns with
// "Missing parameter name" at *route-registration* time, so a server built
// with these routes would fail to start. Named wildcards ("*splat") are
// required instead, and any handler that previously read the unnamed
// wildcard via req.params[0] needs to read the (now array-valued)
// req.params.splat instead.
describe('wildcard route registration (Express 5)', () => {
	it('registers static routes (asset catch-all, slug wildcard, SPA fallback) without throwing', () => {
		expect(() => createStaticRoutes()).not.toThrow();
	});

	it('registers preview routes (live/* client-side routing) without throwing', () => {
		expect(() => createPreviewRoutes()).not.toThrow();
	});

	it('registers templates routes without throwing', () => {
		expect(() => createTemplatesRoutes()).not.toThrow();
	});
});

describe('wildcard routes handle requests without a route-registration crash', () => {
	const app = express();
	app.use(createPreviewRoutes());
	app.use(createTemplatesRoutes());
	app.use(createStaticRoutes());

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

	it('handles nested /live/* subroutes (named wildcard, no params[0] usage)', async () => {
		const res = await fetch(`${baseUrl}/api/templates/dorin-portfolio/live/some/nested/path`);
		expect(res.status).not.toBe(500);
	});

	it('handles nested template asset subroutes (named wildcard feeding req.params.splat)', async () => {
		const res = await fetch(`${baseUrl}/api/templates/dorin-portfolio/assets/does-not-exist.js`);
		expect(res.status).not.toBe(500);
	});

	it('falls back to a 404 for unknown paths instead of crashing the router', async () => {
		const res = await fetch(`${baseUrl}/some/unknown/spa/route`);
		expect(res.status).toBe(404);
	});
});
