import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { getTemplateConfig } from '../framework-detection.js';
import { TEMPLATES_DIR, CORS_ORIGIN } from '../config.js';

// Helper function to serve template HTML
function serveTemplatePreview(
	req: Request,
	slug: string,
	mode: string | undefined,
	res: Response
) {
	const templateDir = path.join(TEMPLATES_DIR, slug);
	const templateConfig = getTemplateConfig(templateDir);
	const distDir = templateConfig.buildDir;
	const indexPath = path.join(distDir, 'index.html');

	// Check if template is built
	if (!fs.existsSync(distDir) || !fs.existsSync(indexPath)) {
		return res.status(503).send(`
		<!DOCTYPE html>
		<html>
		  <head>
			<meta charset="utf-8">
			<title>Template Not Built</title>
			<style>
			  body {
				font-family: system-ui, sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
				background: #0f172a;
				color: #e2e8f0;
			  }
			  .container { text-align: center; max-width: 500px; padding: 2rem; }
			  h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #f87171; }
			  p { margin-bottom: 1rem; color: #94a3b8; line-height: 1.6; }
			  code { background: #1e293b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; }
			</style>
		  </head>
		  <body>
			<div class="container">
			  <h1>Template Not Built</h1>
			  <p>The template <strong>${slug}</strong> needs to be built before preview.</p>
			  <p>Run: <code>cd templates/${slug} && pnpm install && pnpm build</code></p>
			</div>
		  </body>
		</html>
	  `);
	}

	// Read and rewrite the HTML to use correct asset paths
	let html = fs.readFileSync(indexPath, 'utf-8');

	const basePath = `/api/templates/${slug}/live`;
	const modeParam = mode ? `?mode=${mode}` : '';

	// Rewrite asset paths to include the template slug (handles both /assets/ and /_astro/)
	html = html.replace(/(\/assets\/)/g, `/api/templates/${slug}/assets/`);
	html = html.replace(/(\/_astro\/)/g, `/api/templates/${slug}/_astro/`);
	html = html.replace(/\/manifest\.js/g, `/api/templates/${slug}/manifest.js`);

	// Server-side rewrite of all href attributes to keep navigation within template preview
	// Helper function to rewrite a single href value
	function rewriteHref(href: string): string {
		// Skip external links, mailto, tel, and already rewritten
		if (href.startsWith('http') || href.startsWith('//') || 
			href.startsWith('mailto:') || href.startsWith('tel:') ||
			href.includes('/api/templates/')) {
			return href;
		}
		
		// Pure anchor: #contact -> /api/templates/slug/live?mode=x#contact
		if (href.startsWith('#')) {
			return `${basePath}${modeParam}${href}`;
		}
		
		// Root with anchor: /#contact -> /api/templates/slug/live?mode=x#contact
		if (href.startsWith('/#')) {
			return `${basePath}${modeParam}${href.substring(1)}`;
		}
		
		// Just root: / -> /api/templates/slug/live?mode=x
		if (href === '/') {
			return `${basePath}${modeParam}`;
		}
		
		// Internal path: /about or /about#section
		if (href.startsWith('/')) {
			// Skip asset paths
			if (href.startsWith('/api/') || href.startsWith('/_astro/') || href.startsWith('/assets/')) {
				return href;
			}
			
			const hashIdx = href.indexOf('#');
			if (hashIdx !== -1) {
				const pathPart = href.substring(1, hashIdx); // remove leading /
				const hashPart = href.substring(hashIdx);
				if (pathPart) {
					return `${basePath}/${pathPart}${modeParam}${hashPart}`;
				}
				return `${basePath}${modeParam}${hashPart}`;
			}
			return `${basePath}${href}${modeParam}`;
		}
		
		return href;
	}
	
	// Rewrite all href attributes (both double and single quotes)
	let rewriteCount = 0;
	html = html.replace(/href=(["'])([^"']*?)\1/g, (match, quote, href) => {
		const newHref = rewriteHref(href);
		if (newHref !== href) {
			rewriteCount++;
		}
		return `href=${quote}${newHref}${quote}`;
	});
	console.error(`[HTTP] Rewrote ${rewriteCount} href attributes for template: ${slug}`);
	
	// Script to intercept navigation and rewrite links to stay within template preview
	// Runs immediately to rewrite links before user can click them
	const navigationScript = `
	<script>
	(function() {
		const BASE_PATH = '${basePath}';
		const MODE_PARAM = '${modeParam}';
		
		// Build URL with proper query string and hash handling
		function buildUrl(href) {
			let path = href;
			let hash = '';
			const hashIndex = href.indexOf('#');
			if (hashIndex !== -1) {
				path = href.substring(0, hashIndex);
				hash = href.substring(hashIndex);
			}
			if (path === '/' || path === '') {
				return BASE_PATH + MODE_PARAM + hash;
			}
			return BASE_PATH + path + MODE_PARAM + hash;
		}
		
		function rewriteLinks() {
			document.querySelectorAll('a[href]').forEach(function(link) {
				const href = link.getAttribute('href');
				if (!href) return;
				
				// Skip external, already rewritten, and special links
				if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:') || href.includes('/api/templates/')) return;
				
				// Pure anchor links (#something)
				if (href.startsWith('#')) {
					link.setAttribute('href', BASE_PATH + MODE_PARAM + href);
					return;
				}
				
				// Internal links starting with /
				if (href.startsWith('/')) {
					link.setAttribute('href', buildUrl(href));
				}
			});
		}
		
		// Run immediately, on DOMContentLoaded, and on load
		rewriteLinks();
		document.addEventListener('DOMContentLoaded', rewriteLinks);
		window.addEventListener('load', rewriteLinks);
		
		// Observe for dynamically added content
		var observerStarted = false;
		function startObserver() {
			if (observerStarted || !document.body) return;
			observerStarted = true;
			var observer = new MutationObserver(function() { rewriteLinks(); });
			observer.observe(document.body, { childList: true, subtree: true });
		}
		if (document.body) startObserver();
		else document.addEventListener('DOMContentLoaded', startObserver);
		
		// Intercept all clicks as final fallback
		document.addEventListener('click', function(e) {
			var link = e.target;
			while (link && link.tagName !== 'A') link = link.parentElement;
			if (!link) return;
			
			var href = link.getAttribute('href');
			if (!href) return;
			
			// Skip external and special links
			if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
			
			// Already rewritten - let it through
			if (href.includes('/api/templates/')) return;
			
			e.preventDefault();
			e.stopPropagation();
			
			if (href.startsWith('#')) {
				window.location.href = BASE_PATH + MODE_PARAM + href;
			} else if (href.startsWith('/')) {
				window.location.href = buildUrl(href);
			}
		}, true);
		
		window.__BASEPATH__ = BASE_PATH;
	})();
	</script>`;
	
	// Add smooth scrolling CSS
	const smoothScrollStyle = `<style>html{scroll-behavior:smooth}</style>`;
	html = html.replace('<head>', `<head>${smoothScrollStyle}${navigationScript}`);

	// Inject dark mode class if mode=dark
	if (mode === 'dark') {
		html = html.replace('<html', '<html class="dark"');
	}

	// Allow iframe embedding from configured origins
	res.setHeader('Content-Type', 'text/html');
	// Remove X-Frame-Options to allow framing (CSP frame-ancestors takes precedence)
	res.removeHeader('X-Frame-Options');
	const frameAncestors = CORS_ORIGIN === '*' ? '*' : `'self' ${CORS_ORIGIN}`;
	res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
	res.send(html);
}

export function createPreviewRoutes() {
	const router = Router();

	// Main live preview endpoint
	router.get('/api/templates/:slug/live', (req, res) => {
		console.error(`[HTTP] >>> Live preview request: ${req.params.slug}, mode=${req.query.mode}`);
		const mode = req.query.mode as string | undefined;
		serveTemplatePreview(req, req.params.slug, mode, res);
	});

	// Handle client-side routing - serve index.html for all subroutes under /live/*
	router.get('/api/templates/:slug/live/*', (req, res) => {
		const mode = req.query.mode as string | undefined;
		serveTemplatePreview(req, req.params.slug, mode, res);
	});

	return router;
}
