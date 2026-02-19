#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('Starting MCP client...');

  // Create transport with environment variables
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
    env: {
      ...process.env,
      DISABLE_AUTH: 'true'
    }
  });

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✓ Connected to MCP server');

    // List available tools
    const tools = await client.listTools();
    console.log('\n📦 Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test list_templates
    console.log('\n🔧 Testing list_templates...');
    const result = await client.callTool({
      name: 'list_templates',
      arguments: {}
    });
    
    console.log('\n✓ Raw Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.content && result.content[0]) {
      const templates = JSON.parse(result.content[0].text);
      if (templates.templates) {
        console.log(`\nFound ${templates.templates.length} templates:`);
        templates.templates.forEach(t => {
          console.log(`  - ${t.displayName} (${t.fileCount} files, ${t.totalLOC} LOC)`);
        });
      } else {
        console.log('\nResponse:', templates);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testMCPServer().catch(console.error);
