import { Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export function createMcpRoutes(server: McpServer) {
	const router = Router();

	// Create transport once (stateless mode - no session management)
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined, // Stateless mode
	});

	// Connect server to transport (returns a promise)
	const connectionPromise = server.connect(transport);

	// MCP endpoint with Streamable HTTP transport
	router.post('/mcp', async (req, res) => {
		await connectionPromise; // Ensure connected
		console.error(`[HTTP] Incoming POST request from ${req.ip}`);

		try {
			await transport.handleRequest(req, res);
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
	router.get('/mcp', async (req, res) => {
		await connectionPromise; // Ensure connected
		console.error(`[HTTP] Incoming GET request from ${req.ip}`);
		try {
			await transport.handleRequest(req, res);
		} catch (error) {
			console.error('[HTTP] Error handling MCP GET request:', error);
			if (!res.headersSent) {
				res.status(500).json({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	});

	return { router, connectionPromise };
}
