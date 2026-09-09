import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { getTemplateConfig } from '../framework-detection.js';
import { TEMPLATES_DIR, PUBLIC_DIR, CORS_ORIGIN } from '../config.js';
import {
	assertSafeSlug,
	escapeHtml,
	isSafeSlug,
	resolveUnder,
	UnsafePathError,
} from '../utils/safe-path.js';

export function createStaticRoutes() {
	const router = Router();

	// Serve template static assets (handle both /assets/* and root level files)
	router.all('/api/templates/:slug/*', (req, res, next) => {
		const { slug } = req.params;

		// Skip if it's a specific endpoint
		if (
			req.path.endsWith('/live') ||
			req.path.endsWith('/thumbnail') ||
			req.path.endsWith('/preview')
		) {
			return next();
		}

		if (!isSafeSlug(slug)) {
			return res.status(400).send('Invalid template slug');
		}

		try {
			const templateDir = resolveUnder(TEMPLATES_DIR, slug);
			const templateConfig = getTemplateConfig(templateDir);
			const assetsDir = templateConfig.buildDir;

			if (!fs.existsSync(assetsDir)) {
				return res.status(404).send('Template not built');
			}

			// req.path already has the base route removed by Express
			// e.g., for '/api/templates/slug/assets/file.js', req.path will be '/assets/file.js'
			const filePath = req.path.startsWith('/')
				? req.path.slice(1)
				: req.path;
			const fullPath = resolveUnder(assetsDir, filePath);

			if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
				res.sendFile(fullPath);
			} else {
				res.status(404).send('Asset not found');
			}
		} catch (err) {
			if (err instanceof UnsafePathError) {
				return res.status(400).send('Invalid path');
			}
			throw err;
		}
	});

	// Direct template preview routes
	// This allows templates to work with their client-side routing from root
	router.get('/:slug', (req, res, next) => {
		const { slug } = req.params;
		if (!isSafeSlug(slug)) {
			return next();
		}

		let templateDir: string;
		try {
			templateDir = resolveUnder(TEMPLATES_DIR, slug);
		} catch {
			return next();
		}

		// Check if this is actually a template directory
		if (
			!fs.existsSync(templateDir) ||
			!fs.statSync(templateDir).isDirectory()
		) {
			return next(); // Not a template, continue to showcase app
		}

		const templateConfig = getTemplateConfig(templateDir);
		const assetsDir = templateConfig.buildDir;
		const safeSlug = assertSafeSlug(slug);
		const escapedSlug = escapeHtml(safeSlug);

		// Serve index.html for the template with rewritten asset paths
		const indexPath = path.join(assetsDir, 'index.html');
		if (fs.existsSync(indexPath)) {
			let html = fs.readFileSync(indexPath, 'utf-8');
			// Rewrite asset paths to include template slug
			html = html.replace(/src="\/assets\//g, `src="/${safeSlug}/assets/`);
			html = html.replace(/href="\/assets\//g, `href="/${safeSlug}/assets/`);
			// Rewrite Astro asset paths
			html = html.replace(/src="\/_astro\//g, `src="/${safeSlug}/_astro/`);
			html = html.replace(/href="\/_astro\//g, `href="/${safeSlug}/_astro/`);
			html = html.replace(
				/src="\/manifest\.js"/g,
				`src="/${safeSlug}/manifest.js"`
			);
			// Inject basepath for TanStack Router
			const basepathScript = `<script>window.__BASEPATH__ = '/${escapedSlug}';</script>`;
			html = html.replace('<head>', `<head>${basepathScript}`);
			// Allow iframe embedding from configured origins
			res.setHeader('Content-Type', 'text/html');
			res.removeHeader('X-Frame-Options');
			const frameAncestors =
				CORS_ORIGIN === '*' ? '*' : `'self' ${CORS_ORIGIN}`;
			res.setHeader(
				'Content-Security-Policy',
				`frame-ancestors ${frameAncestors}`
			);
			res.send(html);
		} else {
			next();
		}
	});

	router.get('/:slug/*', (req, res, next) => {
		const { slug } = req.params;
		if (!isSafeSlug(slug)) {
			return next();
		}

		let templateDir: string;
		try {
			templateDir = resolveUnder(TEMPLATES_DIR, slug);
		} catch {
			return next();
		}

		// Check if this is actually a template directory
		if (
			!fs.existsSync(templateDir) ||
			!fs.statSync(templateDir).isDirectory()
		) {
			return next(); // Not a template, continue to showcase app
		}

		const templateConfig = getTemplateConfig(templateDir);
		const assetsDir = templateConfig.buildDir;
		const safeSlug = assertSafeSlug(slug);
		const escapedSlug = escapeHtml(safeSlug);

		// For any route under /{slug}, try to serve assets
		const requestPath = (req.params as { 0?: string })[0] || '';

		if (requestPath) {
			try {
				const assetPath = resolveUnder(assetsDir, requestPath);
				if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
					return res.sendFile(assetPath);
				}
			} catch (err) {
				if (!(err instanceof UnsafePathError)) throw err;
			}
		}

		// Serve index.html for the template with rewritten asset paths
		const indexPath = path.join(assetsDir, 'index.html');
		if (fs.existsSync(indexPath)) {
			let html = fs.readFileSync(indexPath, 'utf-8');
			// Rewrite asset paths to include template slug
			html = html.replace(/src="\/assets\//g, `src="/${safeSlug}/assets/`);
			html = html.replace(/href="\/assets\//g, `href="/${safeSlug}/assets/`);
			// Rewrite Astro asset paths
			html = html.replace(/src="\/_astro\//g, `src="/${safeSlug}/_astro/`);
			html = html.replace(/href="\/_astro\//g, `href="/${safeSlug}/_astro/`);
			html = html.replace(
				/src="\/manifest\.js"/g,
				`src="/${safeSlug}/manifest.js"`
			);
			// Add base tag for client-side routing to work correctly
			html = html.replace(
				'<head>',
				`<head><base href="/${escapedSlug}/">`
			);
			// Allow iframe embedding from configured origins
			res.setHeader('Content-Type', 'text/html');
			res.removeHeader('X-Frame-Options');
			const frameAncestors =
				CORS_ORIGIN === '*' ? '*' : `'self' ${CORS_ORIGIN}`;
			res.setHeader(
				'Content-Security-Policy',
				`frame-ancestors ${frameAncestors}`
			);
			res.send(html);
		} else {
			next();
		}
	});

	// SPA fallback
	router.get('*', (req, res) => {
		// Skip API routes
		if (
			req.path.startsWith('/api/') ||
			req.path === '/mcp' ||
			req.path === '/health'
		) {
			return res.status(404).json({ error: 'Not found' });
		}

		const indexPath = path.join(PUBLIC_DIR, 'index.html');
		if (fs.existsSync(indexPath)) {
			res.sendFile(indexPath);
		} else {
			res.status(404).send('Showcase app not built');
		}
	});

	return router;
}
