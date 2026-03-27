const { S3Client, PutObjectCommand } = require('/Users/dmpopescu/flowstarter-monorepo/node_modules/.pnpm/@aws-sdk+client-s3@3.989.0/node_modules/@aws-sdk/client-s3/dist-cjs/index.js');
const { readFileSync, readdirSync } = require('fs');
const { join, extname } = require('path');

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://6d58633ee8f9faa83e9d15bf27917d1f.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '791f639876137bf1fbd4a175179e11ce',
    secretAccessKey: 'e0cce4ba66d0e75e08d0930f80519d7b6b2eb3112c23ae167d87cba91c047d29',
  },
});

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const DIRS = [
  '/Users/dmpopescu/flowstarter-monorepo/apps/flowstarter-main/public/assets/template-thumbnails',
  '/Users/dmpopescu/flowstarter-monorepo/apps/flowstarter-main/public/thumbs',
];

(async () => {
  let ok = 0, fail = 0;
  for (const dir of DIRS) {
    const files = readdirSync(dir).filter(f => ['.png','.jpg','.webp'].includes(extname(f)));
    for (const file of files) {
      const key = 'templates/' + file;
      try {
        await client.send(new PutObjectCommand({
          Bucket: 'flowstarter-assets', Key: key,
          Body: readFileSync(join(dir, file)),
          ContentType: MIME[extname(file)] ?? 'image/png',
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        console.log('✓', key);
        ok++;
      } catch(e) { console.error('✗', key, e.message); fail++; }
    }
  }
  console.log(`\nDone: ${ok} uploaded, ${fail} failed`);
})();
