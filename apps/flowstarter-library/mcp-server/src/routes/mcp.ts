import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../server.js';
import type { TemplateFetcher } from '../utils/template-fetcher.js';

export function createMcpRoutes(fetcher: TemplateFetcher) {
	const router = Router();

	// MCP endpoint with Streamable HTTP transport
	router.post('/mcp', async (req, res) => {
		console.error(`[HTTP] Incoming POST request from ${req.ip}`);

		try {
			// SDK invariant: a stateless transport may handle exactly one HTTP
			// request. Reusing it makes the client's initialized notification fail.
			const { server } = await createMcpServer(fetcher);
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});
			await server.connect(transport);
			await transport.handleRequest(req, res);
			res.on('close', () => {
				void transport.close();
				void server.close();
			});
		} catch (error) {
			console.error('[HTTP] Error handling MCP request:', error);
			if (!res.headersSent) {
				res.status(500).json({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	});

	// Also handle GET requests (for SSE)
	router.get('/mcp', (_req, res) => {
		res.status(405).json({
			jsonrpc: '2.0',
			error: { code: -32000, message: 'Method not allowed in stateless mode' },
			id: null,
		});
	});

	return { router };
}
