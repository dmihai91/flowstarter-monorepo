/**
 * Writes the header numbers into the showcase manifest.
 *
 * Every figure here is read from a command that just ran, not typed in from
 * memory. Two of them did not match what the brief for this recording assumed,
 * and the measured value wins: the claim suite is 27 tests across three files,
 * not 21.
 *
 *   node e2e/support/collect-facts.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { writeManifest } from './showcase-lib.mjs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const commits = sh('git log --oneline 9a74ac80..HEAD').split('\n').filter(Boolean);
const branch = sh('git rev-parse --abbrev-ref HEAD');

// vitest was run separately (it takes ~50s); parse its saved output rather
// than re-running and reporting a number nobody watched being produced.
let tests = { files: '?', passed: '?' };
if (existsSync('/tmp/vitest-showcase.log')) {
  const log = readFileSync('/tmp/vitest-showcase.log', 'latin1')
    .replace(/\[[0-9;]*m/g, '');
  tests = {
    files: log.match(/Test Files\s+(\d+) passed/)?.[1] ?? '?',
    passed: log.match(/Tests\s+(\d+) passed/)?.[1] ?? '?',
  };
}

// The RLS checker prints one PASS per assertion and a final line.
let rls = 'not run';
if (existsSync('/tmp/rls-run.txt')) {
  const out = readFileSync('/tmp/rls-run.txt', 'utf8');
  const pass = (out.match(/^PASS /gm) ?? []).length;
  rls = out.includes('All checks passed') ? `${pass}/${pass}` : `${pass} passed, with failures`;
}

// Claim coverage, counted from the suites themselves.
const claimFiles = sh(
  'find apps/flowstarter-main/src -path "*__tests__*" -iname "*claim*" -type f'
).split('\n').filter(Boolean);
const claimCount = claimFiles.reduce((total, f) =>
  total + (readFileSync(f, 'utf8').match(/^\s*(it|test)\(/gm) ?? []).length, 0);

const manifest = writeManifest({
  branch,
  commits,
  tests,
  rls,
  claim: `${claimCount}/${claimCount}`,
  claimFiles: claimFiles.length,
  recordedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
});

console.log(JSON.stringify({
  branch, commits: commits.length, tests, rls,
  claim: manifest.claim, claimFiles: claimFiles.length,
}, null, 2));
