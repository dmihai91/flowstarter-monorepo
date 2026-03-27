import { S3Client, PutObjectCommand, ListObjectsV2Command } from '/Users/dmpopescu/flowstarter-monorepo/node_modules/.pnpm/@aws-sdk+client-s3@3.989.0_@aws-sdk+client-sts@3.989.0/node_modules/@aws-sdk/client-s3/dist-cjs/index.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const ACCOUNT_ID  = '6d58633ee8f9faa83e9d15bf27917d1f';
const BUCKET      = 'flowstarter-assets';
const ACCESS_KEY  = 'cfut_U0e8TKoVCPDtv7bAfTX2y1FDj4CGK0e8HLisUeDS68233456';
const SECRET_KEY  = 'e0cce4ba66d0e75e08d0930f80519d7b6b2eb3112c23ae167d87cba91c047d29';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

const IMAGE_DIRS = [
  { local: '/Users/dmpopescu/flowstarter-monorepo/apps/flowstarter-main/public/assets/template-thumbnails', r2prefix: 'templates/' },
  { local: '/Users/dmpopescu/flowstarter-monorepo/apps/flowstarter-main/public/thumbs', r2prefix: 'templates/' },
];

let uploaded = 0, skipped = 0;

for (const { local, r2prefix } of IMAGE_DIRS) {
  const files = readdirSync(local).filter(f => ['.png','.jpg','.webp'].includes(extname(f)));
  for (const file of files) {
    const key = r2prefix + file;
    const body = readFileSync(join(local, file));
    const ct = MIME[extname(file)] ?? 'image/png';
    try {
      await client.send(new PutObjectCommand({
        Bucket: BUCKET, Key: key, Body: body,
        ContentType: ct,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      console.log(`✓ ${key}`);
      uploaded++;
    } catch (e) {
      console.error(`✗ ${key}: ${e.message}`);
      skipped++;
    }
  }
}

console.log(`\nDone: ${uploaded} uploaded, ${skipped} failed`);
