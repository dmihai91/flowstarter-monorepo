import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.FLOWSTARTER_RECORDING_URL ?? 'http://127.0.0.1:3000';
const outputDir = resolve(
  process.cwd(),
  'apps/flowstarter-main/public/workflow-clips',
);

const frames = [
  { clip: '01-intake.webm', poster: '01-intake.png', time: 8 },
  { clip: '02-preview.webm', poster: '02-preview.png', time: 13 },
  { clip: '03-build.webm', poster: '03-build.png', time: 14 },
  { clip: '04-editor.webm', poster: '04-editor.png', time: 11 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const frame of frames) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(
      `<style>html,body{margin:0;background:#121114}video{display:block;width:1440px;height:900px;object-fit:contain}</style><video muted playsinline src="${baseUrl}/workflow-clips/${frame.clip}"></video>`,
    );
    const video = page.locator('video');
    await video.evaluate(
      (element, time) =>
        new Promise((resolveFrame, reject) => {
          const media = element;
          const seek = () => {
            media.currentTime = Math.min(Number(time), Math.max(0, media.duration - 0.2));
          };
          media.addEventListener('seeked', () => resolveFrame(undefined), { once: true });
          media.addEventListener('error', () => reject(media.error), { once: true });
          if (media.readyState >= 1) seek();
          else media.addEventListener('loadedmetadata', seek, { once: true });
        }),
      frame.time,
    );
    const destination = resolve(outputDir, frame.poster);
    await video.screenshot({ path: destination });
    console.log(`${frame.poster}: ${destination}`);
    await page.close();
  }
} finally {
  await browser.close();
}
