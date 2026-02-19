#!/usr/bin/env node
/**
 * Build showcase app and deploy to mcp-server public folder
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, cpSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const showcaseDir = __dirname;
const mcpServerPublic = join(__dirname, '..', 'mcp-server', 'public');

console.log('🔨 Building showcase app...');
execSync('pnpm run build', { cwd: showcaseDir, stdio: 'inherit' });

console.log('📦 Copying assets to mcp-server...');
const distAssets = join(showcaseDir, 'dist', 'assets');
const mcpAssets = join(mcpServerPublic, 'assets');

// Copy all assets
cpSync(distAssets, mcpAssets, { recursive: true, force: true });

// Find the new JS and CSS filenames from dist
const distFiles = readdirSync(distAssets);
const jsFile = distFiles.find(f => f.endsWith('.js'));
const cssFile = distFiles.find(f => f.endsWith('.css'));

if (!jsFile || !cssFile) {
  console.error('❌ Could not find built JS or CSS files');
  process.exit(1);
}

console.log(`📝 Updating index.html (JS: ${jsFile}, CSS: ${cssFile})...`);

// Update mcp-server index.html with new asset references
const indexPath = join(mcpServerPublic, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf-8');

// Replace JS reference
indexHtml = indexHtml.replace(
  /src="\/assets\/index-[^"]+\.js"/,
  `src="/assets/${jsFile}"`
);

// Replace CSS reference
indexHtml = indexHtml.replace(
  /href="\/assets\/index-[^"]+\.css"/,
  `href="/assets/${cssFile}"`
);

writeFileSync(indexPath, indexHtml);

console.log('✅ Deploy complete!');
