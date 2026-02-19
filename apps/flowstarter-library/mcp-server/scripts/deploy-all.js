#!/usr/bin/env node
/**
 * Deploy All - Build templates and showcase, then deploy to mcp-server
 * 
 * Usage:
 *   node scripts/deploy-all.js              # Build everything
 *   node scripts/deploy-all.js --templates  # Only build templates
 *   node scripts/deploy-all.js --showcase   # Only build/deploy showcase
 *   node scripts/deploy-all.js --parallel   # Build templates in parallel (faster but uses more resources)
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, cpSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'apps/flowstarter-library/templates');
const SHOWCASE_DIR = join(ROOT, 'apps/flowstarter-library/showcase');
const MCP_PUBLIC = join(__dirname, '../public');

const args = process.argv.slice(2);
const onlyTemplates = args.includes('--templates');
const onlyShowcase = args.includes('--showcase');
const parallel = args.includes('--parallel');
const buildAll = !onlyTemplates && !onlyShowcase;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
}

async function buildTemplate(templateName) {
  const templateDir = join(TEMPLATES_DIR, templateName);
  
  try {
    // Install deps if needed
    if (!existsSync(join(templateDir, 'node_modules'))) {
      execSync('pnpm install', { cwd: templateDir, stdio: 'pipe' });
    }
    
    // Build
    execSync('pnpm run build', { 
      cwd: templateDir, 
      stdio: 'pipe',
      timeout: 120000 
    });
    
    return { success: existsSync(join(templateDir, 'dist')) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function buildTemplatesSequential(templates) {
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    process.stdout.write(`  [${i + 1}/${templates.length}] ${template}... `);
    
    const result = await buildTemplate(template);
    
    if (result.success) {
      console.log(`${colors.green}✓${colors.reset}`);
      results.success.push(template);
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
      results.failed.push(template);
    }
  }
  
  return results;
}

async function buildTemplatesParallel(templates) {
  log('⚡', 'Building templates in parallel...', colors.yellow);
  
  const results = await Promise.all(
    templates.map(async (template) => {
      const result = await buildTemplate(template);
      const status = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      console.log(`  ${status} ${template}`);
      return { template, ...result };
    })
  );
  
  return {
    success: results.filter(r => r.success).map(r => r.template),
    failed: results.filter(r => !r.success).map(r => r.template),
  };
}

async function buildTemplates() {
  logSection('Building Templates');
  
  const templates = readdirSync(TEMPLATES_DIR)
    .filter(f => statSync(join(TEMPLATES_DIR, f)).isDirectory());
  
  log('📦', `Found ${templates.length} templates`);
  
  const results = parallel
    ? await buildTemplatesParallel(templates)
    : await buildTemplatesSequential(templates);
  
  console.log();
  log('✅', `Success: ${results.success.length}`, colors.green);
  if (results.failed.length > 0) {
    log('❌', `Failed: ${results.failed.length} (${results.failed.join(', ')})`, colors.red);
  }
  
  return results;
}

async function buildShowcase() {
  logSection('Building Showcase');
  
  log('🔨', 'Building showcase app...');
  execSync('pnpm run build', { cwd: SHOWCASE_DIR, stdio: 'inherit' });
  
  log('📦', 'Copying assets to mcp-server...');
  const distAssets = join(SHOWCASE_DIR, 'dist/assets');
  const mcpAssets = join(MCP_PUBLIC, 'assets');
  cpSync(distAssets, mcpAssets, { recursive: true, force: true });
  
  // Find new filenames
  const distFiles = readdirSync(distAssets);
  const jsFile = distFiles.find(f => f.endsWith('.js'));
  const cssFile = distFiles.find(f => f.endsWith('.css'));
  
  if (!jsFile || !cssFile) {
    throw new Error('Could not find built JS or CSS files');
  }
  
  log('📝', `Updating index.html (JS: ${jsFile}, CSS: ${cssFile})...`);
  
  const indexPath = join(MCP_PUBLIC, 'index.html');
  let indexHtml = readFileSync(indexPath, 'utf-8');
  
  indexHtml = indexHtml.replace(
    /src="\/assets\/index-[^"]+\.js"/,
    `src="/assets/${jsFile}"`
  );
  indexHtml = indexHtml.replace(
    /href="\/assets\/index-[^"]+\.css"/,
    `href="/assets/${cssFile}"`
  );
  
  writeFileSync(indexPath, indexHtml);
  
  log('✅', 'Showcase deployed!', colors.green);
}

async function main() {
  console.log(`\n${colors.cyan}${colors.bright}🚀 MCP Server Deploy Script${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    if (buildAll || onlyTemplates) {
      await buildTemplates();
    }
    
    if (buildAll || onlyShowcase) {
      await buildShowcase();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logSection('Deploy Complete');
    log('🎉', `All done in ${duration}s!`, colors.green);
    
  } catch (error) {
    log('💥', `Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
