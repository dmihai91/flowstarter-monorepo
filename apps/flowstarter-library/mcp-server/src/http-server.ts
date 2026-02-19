import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildFileTree, getAllFiles } from './utils/file-reader.js';
import { TemplateFetcher } from './utils/template-fetcher.js';
import { scaffoldToConvex, ScaffoldToConvexSchema } from './tools/scaffold-to-convex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve templates directory - try multiple locations for different run contexts
function resolveTemplatesDir(): string {
	const candidates = [
		path.resolve(__dirname, '..', '..', 'templates'),
		path.resolve(process.cwd(), 'apps', 'flowstarter-library', 'templates'),
		path.resolve(process.cwd(), 'templates'),
	];
	for (const dir of candidates) {
		if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
			return dir;
		}
	}
	return candidates[0];
}
const TEMPLATES_DIR = resolveTemplatesDir();

// �"?�"?�"? Framework Detection �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
type TemplateFramework = 'astro' | 'tanstack-start' | 'unknown';

interface TemplateConfig {
	framework: TemplateFramework;
	buildDir: string;
	srcDir: string;
}

/**
 * Detect the framework used by a template by reading its config.json
 * Falls back to checking for framework-specific files
 *
 * Supports two structures:
 * - New structure: sources in template root (src/, dist/)
 * - Legacy structure: sources in start/ subdirectory (start/src/, .vinxi/build/client/)
 */
function getTemplateConfig(templateDir: string): TemplateConfig {
	const configPath = path.join(templateDir, 'config.json');

	// Try to read framework from config.json
	if (fs.existsSync(configPath)) {
		try {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			if (config.framework === 'astro') {
				return {
					framework: 'astro',
					buildDir: path.join(templateDir, 'dist'),
					srcDir: path.join(templateDir, 'src'),
				};
			}
		} catch (e) {
			// Ignore JSON parse errors
		}
	}

	// Check for Astro config file (new structure - sources in root)
	if (fs.existsSync(path.join(templateDir, 'astro.config.mjs')) ||
	    fs.existsSync(path.join(templateDir, 'astro.config.js'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Check for new structure with src/ in template root (not in start/)
	// This handles Astro templates that may not have config.json with framework field
	if (fs.existsSync(path.join(templateDir, 'src')) &&
	    !fs.existsSync(path.join(templateDir, 'start'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Check for TanStack Start (vinxi) - legacy structure
	if (fs.existsSync(path.join(templateDir, 'start', 'app.config.ts')) ||
	    fs.existsSync(path.join(templateDir, '.vinxi'))) {
		return {
			framework: 'tanstack-start',
			buildDir: path.join(templateDir, '.vinxi/build/client'),
			srcDir: path.join(templateDir, 'start', 'src'),
		};
	}

	// Default: check if src/ exists in root (new structure) or fall back to legacy
	if (fs.existsSync(path.join(templateDir, 'src'))) {
		return {
			framework: 'astro',
			buildDir: path.join(templateDir, 'dist'),
			srcDir: path.join(templateDir, 'src'),
		};
	}

	// Legacy fallback for TanStack Start
	return {
		framework: 'tanstack-start',
		buildDir: path.join(templateDir, '.vinxi/build/client'),
		srcDir: path.join(templateDir, 'start', 'src'),
	};
}

const PORT = process.env.HTTP_PORT || 3001;
const HOST = process.env.HTTP_HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// �"?�"?�"? Comprehensive Logging �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_COLORS = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

interface RequestMetrics {
	startTime: number;
	endpoint: string;
	method: string;
}

const activeRequests = new Map<string, RequestMetrics>();

function log(level: 'debug' | 'info' | 'warn' | 'error', scope: string, message: string, data?: Record<string, unknown>) {
	const levels = { debug: 0, info: 1, warn: 2, error: 3 };
	if (levels[level] < (levels[LOG_LEVEL as keyof typeof levels] ?? 1)) return;

	const colors = {
		debug: LOG_COLORS.dim,
		info: LOG_COLORS.cyan,
		warn: LOG_COLORS.yellow,
		error: LOG_COLORS.red,
	};

	const timestamp = new Date().toISOString();
	const prefix = `${colors[level]}[${timestamp}] [${scope}] [${level.toUpperCase()}]${LOG_COLORS.reset}`;

	let output = `${prefix} ${message}`;
	if (data) {
		const dataStr = Object.entries(data)
			.map(([k, v]) => `${LOG_COLORS.dim}${k}=${LOG_COLORS.reset}${typeof v === 'object' ? JSON.stringify(v) : v}`)
			.join(' ');
		output += ` ${dataStr}`;
	}
	console.error(output);
}

function logRequestStart(requestId: string, method: string, endpoint: string, clientIp: string) {
	activeRequests.set(requestId, { startTime: Date.now(), endpoint, method });
	log('info', 'HTTP', `��' ${method} ${endpoint}`, { requestId, clientIp });
}

function logRequestEnd(requestId: string, statusCode: number, extra?: Record<string, unknown>) {
	const metrics = activeRequests.get(requestId);
	if (metrics) {
		const duration = Date.now() - metrics.startTime;
		activeRequests.delete(requestId);
		log('info', 'HTTP', `��? ${metrics.method} ${metrics.endpoint}`, {
			requestId,
			statusCode,
			duration: `${duration}ms`,
			...extra
		});
	}
}

export async function startHttpServer(server: McpServer) {
	const app = express();

	// CORS configuration
	app.use(
		cors({
			origin: CORS_ORIGIN,
			credentials: true,
			methods: ['GET', 'POST', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
		})
	);

	// Parse JSON bodies ONLY for non-MCP endpoints
	// The MCP endpoint needs raw body access for StreamableHTTP transport
	app.use((req, res, next) => {
		if (req.path === '/mcp') {
			// Skip body parsing for MCP endpoint
			next();
		} else {
			// Parse JSON for other endpoints
			express.json()(req, res, next);
		}
	});

	// Create transport once (stateless mode - no session management)
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined, // Stateless mode
	});

	// Connect server to transport
	await server.connect(transport);

	// MCP endpoint with Streamable HTTP transport - MUST come before static files
	app.post('/mcp', async (req, res) => {
		console.error(`[HTTP] Incoming POST request from ${req.ip}`);

		try {
			// Handle the HTTP request with the transport
			await transport.handleRequest(req, res);
		} catch (error) {
			console.error('[HTTP] Error handling MCP request:', error);
			if (!res.headersSent) {
				res.status(500).json({
					error: 'Internal server error',
					message:
						error instanceof Error
							? error.message
							: 'Unknown error',
				});
			}
		}
	});

	// Also handle GET requests (for SSE)
	app.get('/mcp', async (req, res) => {
		console.error(`[HTTP] Incoming GET request from ${req.ip}`);
		try {
			await transport.handleRequest(req, res);
		} catch (error) {
			console.error('[HTTP] Error handling MCP GET request:', error);
			if (!res.headersSent) {
				res.status(500).json({
					error: 'Internal server error',
					message:
						error instanceof Error
							? error.message
							: 'Unknown error',
				});
			}
		}
	});

	// Serve static files from public directory (showcase app)
	const publicDir = path.join(__dirname, '../public');
	console.error(`[HTTP] Checking for public directory at: ${publicDir}`);
	if (fs.existsSync(publicDir)) {
		console.error(`[HTTP] �o" Public directory found, serving static files`);
		app.use(express.static(publicDir));
	} else {
		console.error(`[HTTP] �o- Public directory not found`);
	}

	// Health check endpoint
	app.get('/health', (req, res) => {
		res.json({
			status: 'healthy',
			service: 'mcp-server',
			version: '1.0.0',
			transport: 'streamable-http',
		});
	});

	// �"?�"?�"? Scaffold to Convex Endpoint �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
	// Direct HTTP endpoint for scaffolding templates to Convex (faster than MCP)
	app.post('/api/scaffold-to-convex', async (req, res) => {
		const requestId = `req_${Date.now()}`;
		logRequestStart(requestId, 'POST', '/api/scaffold-to-convex', req.ip || 'unknown');

		try {
			// Validate input
			const input = ScaffoldToConvexSchema.parse(req.body);
			log('info', 'SCAFFOLD', `Starting scaffold to Convex for template "${input.slug}"`, {
				projectName: input.projectName,
				hasPalette: !!input.palette,
				hasFonts: !!input.fonts,
			});

			// Initialize template fetcher
			const fetcher = new TemplateFetcher(TEMPLATES_DIR);
			await fetcher.initialize();

			// Execute scaffold
			const result = await scaffoldToConvex(input, fetcher, TEMPLATES_DIR);

			if (result.success) {
				log('info', 'SCAFFOLD', 'Scaffold completed successfully', {
					projectId: result.projectId,
					urlId: result.urlId,
					fileCount: result.fileCount,
				});
				logRequestEnd(requestId, 200, { urlId: result.urlId, fileCount: result.fileCount });
				res.json(result);
			} else {
				log('error', 'SCAFFOLD', 'Scaffold failed', { error: result.error });
				logRequestEnd(requestId, 500, { error: result.error });
				res.status(500).json(result);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			log('error', 'SCAFFOLD', 'Scaffold request failed', { error: errorMessage });
			logRequestEnd(requestId, 400, { error: errorMessage });
			res.status(400).json({
				success: false,
				error: errorMessage,
			});
		}
	});

	// �"?�"?�"? Streaming Scaffold Endpoint �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
	// Streams template files as NDJSON for faster, progressive loading
	app.get('/api/templates/:slug/scaffold/stream', async (req, res) => {
		const { slug } = req.params;
		console.error(`[HTTP] Streaming scaffold request for: ${slug}`);

		const templatePath = path.join(TEMPLATES_DIR, slug);
		const templateConfig = getTemplateConfig(templatePath);
		const srcPath = templateConfig.srcDir;

		console.error(`[HTTP] Template framework: ${templateConfig.framework}, srcDir: ${srcPath}`);

		// Verify template exists
		if (!fs.existsSync(srcPath)) {
			return res.status(404).json({ error: `Template not found: ${slug}` });
		}

		// Set up streaming response
		res.setHeader('Content-Type', 'application/x-ndjson');
		res.setHeader('Transfer-Encoding', 'chunked');
		res.setHeader('Cache-Control', 'no-cache');

		try {
			// Initialize template fetcher to get metadata
			const fetcher = new TemplateFetcher(TEMPLATES_DIR);
			await fetcher.initialize();
			const template = fetcher.getTemplate(slug);

			// Send template metadata first
			res.write(JSON.stringify({
				type: 'metadata',
				template: template || {
					metadata: {
						name: slug,
						slug,
						displayName: slug,
						description: '',
						category: 'landing',
						features: [],
						techStack: { framework: 'TanStack Start', styling: 'Tailwind CSS', typescript: true }
					},
					packageJson: { dependencies: {}, devDependencies: {}, scripts: {} }
				}
			}) + '\n');

			// Build file tree
			const fileTree = await buildFileTree(srcPath);
			const files = await getAllFiles(srcPath, fileTree);

			// Send file count for progress tracking
			res.write(JSON.stringify({
				type: 'progress',
				total: files.length
			}) + '\n');

			// Stream each file
			let index = 0;
			for (const file of files) {
				res.write(JSON.stringify({
					type: 'file',
					index,
					path: file.path,
					content: file.content
				}) + '\n');
				index++;

				// Small delay to prevent overwhelming the connection
				await new Promise(resolve => setImmediate(resolve));
			}

			// Send completion message
			res.write(JSON.stringify({ type: 'complete', count: files.length }) + '\n');
			res.end();

			console.error(`[HTTP] �o" Streamed ${files.length} files for template: ${slug}`);
		} catch (error) {
			console.error(`[HTTP] Streaming scaffold error:`, error);
			res.write(JSON.stringify({
				type: 'error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}) + '\n');
			res.end();
		}
	});

	// Regular scaffold endpoint (non-streaming, for backwards compatibility)
	app.get('/api/templates/:slug/scaffold', async (req, res) => {
		const { slug } = req.params;
		console.error(`[HTTP] Regular scaffold request for: ${slug}`);

		const templatePath = path.join(TEMPLATES_DIR, slug);
		const templateConfig = getTemplateConfig(templatePath);
		const srcPath = templateConfig.srcDir;

		console.error(`[HTTP] Template framework: ${templateConfig.framework}, srcDir: ${srcPath}`);

		if (!fs.existsSync(srcPath)) {
			return res.status(404).json({ error: `Template not found: ${slug}` });
		}

		try {
			// Initialize template fetcher to get metadata
			const fetcher = new TemplateFetcher(TEMPLATES_DIR);
			await fetcher.initialize();
			const template = fetcher.getTemplate(slug);

			// Build file tree and get all files
			const fileTree = await buildFileTree(srcPath);
			const srcFiles = await getAllFiles(srcPath, fileTree);
			
			// Also include essential config files from template root
			const rootConfigFiles = ['package.json', 'astro.config.mjs', 'tailwind.config.mjs', 'postcss.config.cjs', 'tsconfig.json'];
			const configFiles = [];
			
			for (const configFile of rootConfigFiles) {
				const configFilePath = path.join(templatePath, configFile);
				if (fs.existsSync(configFilePath)) {
					try {
						let fileContent = fs.readFileSync(configFilePath, 'utf-8');
						// Fix for Daytona preview: modify astro.config.mjs to use root base path
						if (configFile === 'astro.config.mjs') {
							fileContent = fileContent.replace(/base:\s*['"][^'"]*['"]/g, "base: '/'");
						}
						configFiles.push({ path: '/' + configFile, content: fileContent });
					} catch (e) {}
				}
			}
			const files = [...configFiles, ...srcFiles.map(f => ({ path: '/src/' + f.path, content: f.content }))];

			console.error(`[HTTP] �o" Scaffolded ${files.length} files for template: ${slug}`);

			res.json({
				scaffold: {
					template: template || {
						metadata: {
							name: slug,
							slug,
							displayName: slug,
							description: '',
							category: 'landing',
							features: [],
							techStack: { framework: 'TanStack Start', styling: 'Tailwind CSS', typescript: true }
						},
						packageJson: { dependencies: {}, devDependencies: {}, scripts: {} }
					},
					files: files.map(f => ({ path: f.path, content: f.content, type: 'file' }))
				}
			});
		} catch (error) {
			console.error(`[HTTP] Scaffold error:`, error);
			res.status(500).json({
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	});

	// Template image endpoints
	app.get('/api/templates/:slug/thumbnail', (req, res) => {
		const { slug } = req.params;
		const theme = req.query.theme as string;

		let filename = 'thumbnail.png';
		if (theme === 'light') {
			filename = 'thumbnail-light.png';
		} else if (theme === 'dark') {
			filename = 'thumbnail-dark.png';
		}

		// Try specific theme file first
		let imagePath = path.join(TEMPLATES_DIR, slug, filename);

		if (!fs.existsSync(imagePath)) {
			// Fallback to default thumbnail.png if specific theme not found
			imagePath = path.join(TEMPLATES_DIR, slug, 'thumbnail.png');
		}

		if (fs.existsSync(imagePath)) {
			res.sendFile(imagePath);
		} else {
			res.status(404).json({ error: 'Thumbnail not found' });
		}
	});

	app.get('/api/templates/:slug/preview', (req, res) => {
		const { slug } = req.params;
		const theme = req.query.theme as string;

		console.error(`[HTTP] Preview request: slug=${slug}, theme=${theme}`);
		console.error(`[HTTP] TEMPLATES_DIR: ${TEMPLATES_DIR}`);

		let filename = 'preview.png';
		if (theme === 'light') {
			filename = 'preview-light.png';
		} else if (theme === 'dark') {
			filename = 'preview-dark.png';
		}

		let imagePath = path.join(TEMPLATES_DIR, slug, filename);
		console.error(`[HTTP] Checking path: ${imagePath}`);
		console.error(`[HTTP] Path exists: ${fs.existsSync(imagePath)}`);

		if (!fs.existsSync(imagePath)) {
			// Fallback
			imagePath = path.join(TEMPLATES_DIR, slug, 'preview.png');
			console.error(`[HTTP] Fallback path: ${imagePath}`);
			console.error(
				`[HTTP] Fallback exists: ${fs.existsSync(imagePath)}`
			);
		}

		if (fs.existsSync(imagePath)) {
			console.error(`[HTTP] Sending file: ${imagePath}`);
			res.sendFile(imagePath);
		} else {
			console.error(`[HTTP] File not found: ${imagePath}`);
			res.status(404).json({ error: 'Preview not found' });
		}
	});

	// Live template preview - serve template HTML with iframe-friendly settings
	// Helper function to serve template HTML
	function serveTemplatePreview(
		req: express.Request,
		slug: string,
		mode: string | undefined,
		res: express.Response
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
		html = html.replace(
			/\/manifest\.js/g,
			`/api/templates/${slug}/manifest.js`
		);

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

	// Main live preview endpoint
	app.get('/api/templates/:slug/live', (req, res) => {
		console.error(`[HTTP] >>> Live preview request: ${req.params.slug}, mode=${req.query.mode}`);
		const mode = req.query.mode as string | undefined;
		serveTemplatePreview(req, req.params.slug, mode, res);
	});

	// Handle client-side routing - serve index.html for all subroutes under /live/*
	app.get('/api/templates/:slug/live/*', (req, res) => {
		const mode = req.query.mode as string | undefined;
		serveTemplatePreview(req, req.params.slug, mode, res);
	});

	// List all templates endpoint
	app.get('/api/templates', async (req, res) => {
		try {
			if (!fs.existsSync(TEMPLATES_DIR)) {
				log('error', 'http', 'Templates directory not found', { path: TEMPLATES_DIR });
				return res.status(500).json({ error: 'Templates directory not found', path: TEMPLATES_DIR });
			}
			const fetcher = new TemplateFetcher(TEMPLATES_DIR);
			await fetcher.initialize();
			const templates = fetcher.getAllTemplates();
			
			const templateList: Array<Record<string, unknown>> = [];
			for (const t of templates) {
				try {
					// Determine color based on category/tags just for fun/fallback
					let color = "#3b82f6";
					const cat = t.metadata.category as string;
					if (cat === 'health' || cat === 'fitness') color = "#10b981";
					if (cat === 'business' || cat === 'saas-product') color = "#6366f1";
					
					const rawFeatures = (t.config as any)?.features || [];
					const integrations = (t.config as any)?.integrations || {};
					const slug = t.metadata.slug;
					
					// Load palettes from config or palettes/ folder
					let palettes: Array<{ id: string; name: string; colors?: Record<string, string>; fonts?: { heading?: string; body?: string } }> = Array.isArray((t.config as any)?.palettes) ? (t.config as any).palettes : [];
					if (palettes.length === 0) {
						const palettesDir = path.join(TEMPLATES_DIR, slug, 'palettes');
						if (fs.existsSync(palettesDir)) {
							try {
								const paletteFiles = fs.readdirSync(palettesDir)
									.filter((f: string) => f.endsWith('.json'))
									.sort();
								palettes = paletteFiles.map((file: string) => {
									const content = JSON.parse(fs.readFileSync(path.join(palettesDir, file), 'utf-8'));
									const c = content.colors || {};
									return {
										id: content.id || file.replace('.json', ''),
										name: content.name || content.id || file,
										colors: {
											primary: c.primary || c['primary-dark'] || '#3b82f6',
											secondary: c.secondary || c.accent || '#6366f1',
											accent: c.accent || c.secondary || '#8b5cf6',
											background: c.background || c.surface || '#ffffff',
											text: c.text || c['text-muted'] || '#1e293b',
										},
										fonts: content.fonts,
									};
								});
							} catch (e) {
								log('warn', 'http', `Failed to load palettes for ${slug}`, { error: String(e) });
							}
						}
					}
					
					// Load fonts from palettes if config has none (each palette can have fonts)
					let fonts: Array<{ id: string; name: string; heading?: string; body?: string }> = (t.config as any)?.fonts || [];
					if (fonts.length === 0 && palettes.length > 0) {
						const seen = new Set<string>();
						for (const p of palettes) {
							const pf = p.fonts;
							if (pf?.heading && pf?.body && !seen.has(`${pf.heading}/${pf.body}`)) {
								seen.add(`${pf.heading}/${pf.body}`);
								fonts.push({
									id: `font-${seen.size}`,
									name: `${pf.heading} + ${pf.body}`,
									heading: pf.heading,
									body: pf.body,
								});
							}
						}
					}
					
					// Compute sensible flags for filtering
					const hasDark = rawFeatures.some((f: string) => /dark/i.test(f)) ||
						fs.existsSync(path.join(TEMPLATES_DIR, slug, 'thumbnail-dark.png'));
					const hasBooking = Boolean((integrations as any)['booking']) || rawFeatures.some((f: string) => /booking/i.test(f));
					const hasNewsletter = Boolean((integrations as any)['newsletter']) || rawFeatures.some((f: string) => /newsletter/i.test(f));
					const hasContact = rawFeatures.some((f: string) => /contact\s*form/i.test(f));
					const hasPricing = rawFeatures.some((f: string) => /pricing/i.test(f));
					const hasFAQ = rawFeatures.some((f: string) => /faq/i.test(f));
					const hasGallery = rawFeatures.some((f: string) => /(gallery|portfolio)/i.test(f));
					const isMultiPage = rawFeatures.some((f: string) => /multi[- ]?page/i.test(f));
					
					templateList.push({
						slug,
						name: t.metadata.displayName,
						description: t.metadata.description,
						category: t.metadata.category || '',
						useCase: t.metadata.useCase || [],
						color,
						thumbnail: `/api/templates/${slug}/thumbnail`,
						palettes,
						fonts,
						theme: (t.config as any)?.theme || {},
						features: rawFeatures,
						flags: {
							dark: hasDark,
							booking: hasBooking,
							newsletter: hasNewsletter,
							contact: hasContact,
							pricing: hasPricing,
							faq: hasFAQ,
							gallery: hasGallery,
							multipage: isMultiPage,
						},
					});
				} catch (e) {
					log('error', 'http', `Failed to process template ${t.metadata.slug}`, { error: String(e) });
				}
			}
			
			res.json(templateList);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			const stack = error instanceof Error ? error.stack : undefined;
			console.error('Error listing templates:', msg, stack);
			res.status(500).json({ error: 'Failed to list templates', details: msg });
		}
	});

	// Serve template static assets (handle both /assets/* and root level files)
	app.all("/api/templates/:slug/*", (req, res, next) => {
		const { slug } = req.params;

		// Skip if it's a specific endpoint
		if (
			req.path.endsWith('/live') ||
			req.path.endsWith('/thumbnail') ||
			req.path.endsWith('/preview')
		) {
			return next();
		}

		const templateDir = path.join(TEMPLATES_DIR, slug);
		const templateConfig = getTemplateConfig(templateDir);
		const assetsDir = templateConfig.buildDir;

		if (fs.existsSync(assetsDir)) {
			// req.path already has the base route removed by Express
			// e.g., for '/api/templates/slug/assets/file.js', req.path will be '/assets/file.js'
			const filePath = req.path.startsWith('/')
				? req.path
				: '/' + req.path;
			const fullPath = path.join(assetsDir, filePath);

			if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
				res.sendFile(fullPath);
			} else {
				res.status(404).send(`Asset not found: ${filePath}`);
			}
		} else {
			res.status(404).send('Template not built');
		}
	});

	// Direct template preview routes
	// This allows templates to work with their client-side routing from root
	app.get('/:slug', (req, res, next) => {
		const { slug } = req.params;
		const templateDir = path.join(TEMPLATES_DIR, slug);

		// Check if this is actually a template directory
		if (
			!fs.existsSync(templateDir) ||
			!fs.statSync(templateDir).isDirectory()
		) {
			return next(); // Not a template, continue to showcase app
		}

		const templateConfig = getTemplateConfig(templateDir);
		const assetsDir = templateConfig.buildDir;

		// Serve index.html for the template with rewritten asset paths
		const indexPath = path.join(assetsDir, 'index.html');
		if (fs.existsSync(indexPath)) {
			let html = fs.readFileSync(indexPath, 'utf-8');
			// Rewrite asset paths to include template slug
			html = html.replace(/src="\/assets\//g, `src="/${slug}/assets/`);
			html = html.replace(/href="\/assets\//g, `href="/${slug}/assets/`);
			// Rewrite Astro asset paths
			html = html.replace(/src="\/_astro\//g, `src="/${slug}/_astro/`);
			html = html.replace(/href="\/_astro\//g, `href="/${slug}/_astro/`);
			html = html.replace(
				/src="\/manifest\.js"/g,
				`src="/${slug}/manifest.js"`
			);
			// Inject basepath for TanStack Router
			const basepathScript = `<script>window.__BASEPATH__ = '/${slug}';</script>`;
			html = html.replace('<head>', `<head>${basepathScript}`);
			// Allow iframe embedding from configured origins
			res.setHeader('Content-Type', 'text/html');
			res.removeHeader('X-Frame-Options');
			const frameAncestors = CORS_ORIGIN === '*' ? '*' : `'self' ${CORS_ORIGIN}`;
			res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
			res.send(html);
		} else {
			next();
		}
	});

	app.get('/:slug/*', (req, res, next) => {
		const { slug } = req.params;
		const templateDir = path.join(TEMPLATES_DIR, slug);

		// Check if this is actually a template directory
		if (
			!fs.existsSync(templateDir) ||
			!fs.statSync(templateDir).isDirectory()
		) {
			return next(); // Not a template, continue to showcase app
		}

		const templateConfig = getTemplateConfig(templateDir);
		const assetsDir = templateConfig.buildDir;

		// For any route under /{slug}, try to serve assets
		const requestPath = (req.params as any)[0] || '';

		if (requestPath) {
			// Serve specific asset
			const assetPath = path.join(assetsDir, requestPath);
			if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
				return res.sendFile(assetPath);
			}
		}

		// Serve index.html for the template with rewritten asset paths
		const indexPath = path.join(assetsDir, 'index.html');
		if (fs.existsSync(indexPath)) {
			let html = fs.readFileSync(indexPath, 'utf-8');
			// Rewrite asset paths to include template slug
			html = html.replace(/src="\/assets\//g, `src="/${slug}/assets/`);
			html = html.replace(/href="\/assets\//g, `href="/${slug}/assets/`);
			// Rewrite Astro asset paths
			html = html.replace(/src="\/_astro\//g, `src="/${slug}/_astro/`);
			html = html.replace(/href="\/_astro\//g, `href="/${slug}/_astro/`);
			html = html.replace(
				/src="\/manifest\.js"/g,
				`src="/${slug}/manifest.js"`
			);
			// Add base tag for client-side routing to work correctly
			html = html.replace('<head>', `<head><base href="/${slug}/">`);
			// Allow iframe embedding from configured origins
			res.setHeader('Content-Type', 'text/html');
			res.removeHeader('X-Frame-Options');
			const frameAncestors = CORS_ORIGIN === '*' ? '*' : `'self' ${CORS_ORIGIN}`;
			res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
			res.send(html);
		} else {
			next();
		}
	});

	// SPA fallback
	app.get('*', (req, res) => {
		// Skip API routes
		if (
			req.path.startsWith('/api/') ||
			req.path === '/mcp' ||
			req.path === '/health'
		) {
			return res.status(404).json({ error: 'Not found' });
		}

		const indexPath = path.join(publicDir, 'index.html');
		if (fs.existsSync(indexPath)) {
			res.sendFile(indexPath);
		} else {
			res.status(404).send('Showcase app not built');
		}
	});

	// Start server
	return new Promise<void>((resolve) => {
		app.listen(Number(PORT), HOST, () => {
			console.error(`[HTTP] server running on http://${HOST}:${PORT}`);
			console.error(`[HTTP] MCP endpoint: http://${HOST}:${PORT}/mcp`);
			console.error(`[HTTP] Health check: http://${HOST}:${PORT}/health`);
			console.error(`[HTTP] Showcase app: http://${HOST}:${PORT}/`);
			console.error(`[HTTP] CORS origin: ${CORS_ORIGIN}`);
			console.error(`[HTTP] Templates dir: ${TEMPLATES_DIR} (exists: ${fs.existsSync(TEMPLATES_DIR)})`);
			resolve();
		});
	});
}

