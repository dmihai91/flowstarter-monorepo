#!/usr/bin/env tsx
/**
 * E2E Test Environment Setup Script
 *
 * This script helps set up the environment for running E2E tests.
 * It checks for required dependencies and environment variables.
 *
 * Usage: npx tsx scripts/setup-e2e.ts
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function check(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ name, status, message });
  const emoji = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  log(emoji, `${name}: ${message}`);
}

// Check for required environment variables
function checkEnvVariables() {
  log('🔍', 'Checking environment variables...\n');

  // Load env files in order of precedence (later files override earlier)
  const envFiles = [
    join(ROOT_DIR, '.env'),
    join(ROOT_DIR, '.env.local'),
    join(ROOT_DIR, '.env.test'),
  ];

  let envVars: Record<string, string | undefined> = {};
  let foundFiles: string[] = [];

  for (const envPath of envFiles) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      });
      foundFiles.push(envPath.replace(ROOT_DIR, '.'));
    }
  }

  if (foundFiles.length > 0) {
    log('📄', `Found env files: ${foundFiles.join(', ')}`);
  } else {
    check('Environment File', 'fail', 'No .env, .env.local, or .env.test file found. Copy .env.test.example to .env.test');
    return;
  }

  // Merge with process.env
  envVars = { ...process.env, ...envVars };

  // Check required variables
  const required = [
    { key: 'VITE_CONVEX_URL', desc: 'Convex URL for real-time backend' },
  ];

  const aiProviders = [
    { key: 'OPEN_ROUTER_API_KEY', desc: 'OpenRouter API key' },
    { key: 'GROQ_API_KEY', desc: 'Groq API key' },
    { key: 'ANTHROPIC_API_KEY', desc: 'Anthropic API key' },
  ];

  const optional = [
    { key: 'DAYTONA_API_KEY', desc: 'Daytona API key (for preview tests)' },
    { key: 'VITE_FLOWSTARTER_MCP_URL', desc: 'MCP server URL (for template tests)' },
  ];

  // Check required
  for (const { key, desc } of required) {
    if (envVars[key]) {
      check(key, 'pass', desc);
    } else {
      check(key, 'fail', `${desc} - NOT SET`);
    }
  }

  // Check AI providers (at least one required)
  const hasAiProvider = aiProviders.some(({ key }) => envVars[key]);
  if (hasAiProvider) {
    for (const { key, desc } of aiProviders) {
      if (envVars[key]) {
        check(key, 'pass', desc);
      } else {
        check(key, 'warn', `${desc} - not set (optional if other provider available)`);
      }
    }
  } else {
    check('AI Provider', 'fail', 'At least one AI provider API key required (OpenRouter, Groq, or Anthropic)');
  }

  // Check optional
  console.log('\n');
  log('📋', 'Optional environment variables:\n');
  for (const { key, desc } of optional) {
    if (envVars[key]) {
      check(key, 'pass', desc);
    } else {
      check(key, 'warn', `${desc} - not set (some tests may be skipped)`);
    }
  }
}

// Check Playwright installation
function checkPlaywright() {
  console.log('\n');
  log('🎭', 'Checking Playwright installation...\n');

  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    check('Playwright', 'pass', 'Playwright is installed');

    // Check for browsers
    try {
      const result = execSync('npx playwright install --dry-run chromium 2>&1', {
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      if (result.includes('already installed') || result.includes('up to date')) {
        check('Chromium', 'pass', 'Browser is installed');
      } else {
        check('Chromium', 'warn', 'Browser may need installation. Run: npx playwright install chromium');
      }
    } catch {
      check('Chromium', 'warn', 'Run: npx playwright install chromium');
    }
  } catch {
    check('Playwright', 'fail', 'Playwright not installed. Run: pnpm add -D @playwright/test');
  }
}

// Check if Convex is running
async function checkConvex() {
  console.log('\n');
  log('🔄', 'Checking Convex connection...\n');

  try {
    const response = await fetch('http://127.0.0.1:3210');
    check('Convex Dev Server', 'pass', 'Running at http://127.0.0.1:3210');
  } catch {
    check('Convex Dev Server', 'warn', 'Not running. Start with: npx convex dev');
  }
}

// Check if dev server can start
function checkDevServer() {
  console.log('\n');
  log('🚀', 'Checking dev server configuration...\n');

  const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));

  if (packageJson.scripts?.dev) {
    check('Dev Script', 'pass', `Command: ${packageJson.scripts.dev}`);
  } else {
    check('Dev Script', 'fail', 'No "dev" script found in package.json');
  }

  if (packageJson.scripts?.['test:e2e']) {
    check('E2E Script', 'pass', `Command: ${packageJson.scripts['test:e2e']}`);
  } else {
    check('E2E Script', 'warn', 'No "test:e2e" script found. Add: "test:e2e": "playwright test"');
  }
}

// Print summary
function printSummary() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     E2E SETUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warned = results.filter((r) => r.status === 'warn').length;

  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ⚠️  Warnings: ${warned}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    REQUIRED ACTIONS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`  ❌ ${r.name}: ${r.message}`);
      });

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    QUICK START');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('  1. Copy environment file:');
  console.log('     cp .env.test.example .env.test');
  console.log('');
  console.log('  2. Fill in your API keys in .env.test');
  console.log('');
  console.log('  3. Install Playwright browsers:');
  console.log('     npx playwright install chromium');
  console.log('');
  console.log('  4. Start Convex dev server (in separate terminal):');
  console.log('     npx convex dev');
  console.log('');
  console.log('  5. Run E2E tests:');
  console.log('     pnpm test:e2e');
  console.log('');
  console.log('  Or run with UI:');
  console.log('     npx playwright test --ui');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Main
async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('               FLOWSTARTER E2E TEST SETUP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  checkEnvVariables();
  checkPlaywright();
  await checkConvex();
  checkDevServer();
  printSummary();

  const failed = results.filter((r) => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

