#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isClerkConfigured } from './utils/auth.js';
import { createMcpServer } from './server.js';
import { startHttpServer } from './http-server.js';

async function main() {
  // Check if authentication is configured
  const clerkConfigured = isClerkConfigured();
  const internalAuthConfigured = Boolean(process.env.FLOWSTARTER_MCP_INTERNAL_TOKEN);

  if (!clerkConfigured && !internalAuthConfigured) {
    console.error('ERROR: MCP authentication is not configured!');
    console.error('Configure Clerk or FLOWSTARTER_MCP_INTERNAL_TOKEN.');
    process.exit(1);
  }

  console.error('Flowstarter MCP authentication configured');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const modeArg = args.find(arg => arg.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'stdio';

  // Create MCP server with tools
  const { server, fetcher } = await createMcpServer();

  if (mode === 'http') {
    // Start HTTP server
    await startHttpServer(fetcher);
    console.error('Flowstarter MCP Server is running in HTTP mode');
  } else {
    // Start stdio server (default)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Flowstarter MCP Server is running in stdio mode');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
