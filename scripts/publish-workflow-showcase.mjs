/**
 * Publishes workflow-showcase-static/ to the existing R2 bucket behind
 * assets.flowstarter.dev, under the workflows/ prefix.
 *
 * Run from the repo root:   node scripts/publish-workflow-showcase.mjs
 * Result:                   https://assets.flowstarter.dev/workflows/index.html
 *
 * Uses R2_* credentials from apps/flowstarter-main/.env.local. Idempotent —
 * re-running overwrites the same keys. Remove with any S3 client by deleting
 * the workflows/ prefix.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';

const env = Object.fromEntries(
  readFileSync('apps/flowstarter-main/.env.local', 'utf8')
    .split('\n').filter((l) => /^[A-Z]/.test(l))
    .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim()]),
);
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const TYPES = { '.html': 'text/html; charset=utf-8', '.webm': 'video/webm', '.png': 'image/png' };
const files = [['workflow-showcase-static/index.html', 'workflows/index.html']];
for (const f of readdirSync('workflow-showcase-static/clips'))
  files.push([`workflow-showcase-static/clips/${f}`, `workflows/clips/${f}`]);

for (const [src, key] of files) {
  const ext = extname(src);
  await client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET, Key: key, Body: readFileSync(src),
    ContentType: TYPES[ext],
    CacheControl: ext === '.html' ? 'public, max-age=300' : 'public, max-age=86400',
  }));
  console.log('uploaded', key);
}
console.log('\nLive at: https://assets.flowstarter.dev/workflows/index.html');
