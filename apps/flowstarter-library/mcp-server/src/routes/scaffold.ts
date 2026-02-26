import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { buildFileTree, getAllFiles } from '../utils/file-reader.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { scaffoldToConvex, ScaffoldToConvexSchema } from '../tools/scaffold-to-convex.js';
import { getTemplateConfig } from '../framework-detection.js';
import { log, logRequestStart, logRequestEnd } from '../logging.js';
import { TEMPLATES_DIR } from '../config.js';

export function createScaffoldRoutes() {
	const router = Router();

	// Scaffold to Convex Endpoint
	// Direct HTTP endpoint for scaffolding templates to Convex (faster than MCP)
	router.post('/api/scaffold-to-convex', async (req, res) => {
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

	// Streaming Scaffold Endpoint
	// Streams template files as NDJSON for faster, progressive loading
	router.get('/api/templates/:slug/scaffold/stream', async (req, res) => {
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

			console.error(`[HTTP] ✓ Streamed ${files.length} files for template: ${slug}`);
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
	router.get('/api/templates/:slug/scaffold', async (req, res) => {
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

			console.error(`[HTTP] ✓ Scaffolded ${files.length} files for template: ${slug}`);

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

	return router;
}
