#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isClerkConfigured } from './utils/auth.js';
import { createMcpServer } from './server.js';
import { startHttpServer } from './http-server.js';

async function main() {
  // Check if authentication is configured
  const clerkConfigured = isClerkConfigured();

  if (!clerkConfigured) {
    console.error('ERROR: Clerk authentication is required but not configured!');
    console.error('Please set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in .env');
    process.exit(1);
  }

  console.error('Clerk authentication configured and required for all requests');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const modeArg = args.find(arg => arg.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'stdio';

  // Create MCP server with tools
  const { server } = await createMcpServer();

  if (mode === 'http') {
    // Start HTTP server
    await startHttpServer(server);
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
