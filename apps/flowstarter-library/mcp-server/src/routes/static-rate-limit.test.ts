import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { createStaticRoutes } from './static.js';

// Every handler in static.ts reads the filesystem and streams a file back, and
// two of them (the /:slug/*splat template route and the /*splat SPA fallback)
// were mounted without any limiter, which CodeQL reported as
// js/missing-rate-limiting. These tests hold the limiter in place: one by
// inspecting the registered middleware chain, one by exhausting a tiny budget.

/** express-rate-limit attaches resetKey/getKey to the middleware it returns. */
function isRateLimiter(handler: unknown): boolean {
	return (
		typeof handler === 'function' &&
		typeof (handler as { resetKey?: unknown }).resetKey === 'function' &&
		typeof (handler as { getKey?: unknown }).getKey === 'function'
	);
}

interface RouteLayer {
	route?: {
		path: string;
		stack: { handle: unknown }[];
	};
}

function layerFor(router: ReturnType<typeof createStaticRoutes>, path: string) {
	const layers = (router as unknown as { stack: RouteLayer[] }).stack;
	const layer = layers.find((candidate) => candidate.route?.path === path);
	if (!layer?.route) throw new Error(`no route registered for ${path}`);
	return layer.route;
}

describe('static routes carry a rate limiter', () => {
	const router = createStaticRoutes();

	it.each([
		'/api/templates/:slug/*splat',
		'/:slug',
		'/:slug/*splat',
		'/*splat',
	])('puts a limiter in front of %s', (path) => {
		const route = layerFor(router, path);
		expect(isRateLimiter(route.stack[0].handle)).toBe(true);
		expect(route.stack.length).toBeGreaterThan(1);
	});
});

describe('the limiter actually refuses traffic past the budget', () => {
	const app = express();
	app.use(createStaticRoutes({ rateLimit: { windowMs: 60_000, limit: 2 } }));

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

	it('answers 429 once a client has spent its budget', async () => {
		// The first request is not a template, so it falls through the slug
		// routes to the SPA fallback and spends the whole budget of 2.
		const first = await fetch(`${baseUrl}/not-a-template/deep/path`);
		expect(first.status).not.toBe(429);

		const second = await fetch(`${baseUrl}/not-a-template/deep/path`);
		expect(second.status).toBe(429);
	});
});
