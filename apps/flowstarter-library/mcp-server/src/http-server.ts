import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
	createMcpRoutes,
	createScaffoldRoutes,
	createTemplatesRoutes,
	createPreviewRoutes,
	createStaticRoutes,
} from './routes/index.js';
import { PORT, HOST, CORS_ORIGIN, PUBLIC_DIR, TEMPLATES_DIR } from './config.js';

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

	// Mount MCP routes (must come first, before static files)
	const { router: mcpRouter, connectionPromise } = createMcpRoutes(server);
	app.use(mcpRouter);
	await connectionPromise;

	// Serve static files from public directory (showcase app)
	console.error(`[HTTP] Checking for public directory at: ${PUBLIC_DIR}`);
	if (fs.existsSync(PUBLIC_DIR)) {
		console.error(`[HTTP] ✓ Public directory found, serving static files`);
		app.use(express.static(PUBLIC_DIR));
	} else {
		console.error(`[HTTP] ✗ Public directory not found`);
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

	// Mount all route modules
	app.use(createScaffoldRoutes());
	app.use(createTemplatesRoutes());
	app.use(createPreviewRoutes());
	app.use(createStaticRoutes());

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
