/**
 * The gate that keeps brief-generated imagery from being silently ignored:
 * the coding agent gets exactly one repair message naming what it left
 * unplaced, and a fully-placed (or asset-less) build passes untouched.
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findGeneratedAssetIssue } from '../src/flowstarter/workflows';
import type { GeneratedAssetEntry } from '../src/flowstarter/generated-assets';

const HERO: GeneratedAssetEntry = {
  publicPath: '/flowstarter-assets/generated-hero.png',
  slotId: 'src/content/site-labels.md#12',
  role: 'hero',
  prompt: 'test',
};
const CARD: GeneratedAssetEntry = {
  publicPath: '/flowstarter-assets/generated-service-1.png',
  slotId: 'src/content/site-labels.md#30',
  role: 'service',
  prompt: 'test',
};

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'fs-gen-usage-'));
  await mkdir(join(root, 'src', 'content'), { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writeLabels(body: string): Promise<void> {
  await writeFile(join(root, 'src/content/site-labels.md'), body, 'utf8');
}

describe('findGeneratedAssetIssue', () => {
  it('passes when every generated asset is referenced', async () => {
    await writeLabels(
      `hero:\n  image: "${HERO.publicPath}"\nservices:\n  - image: "${CARD.publicPath}"\n`,
    );
    expect(await findGeneratedAssetIssue(root, [HERO, CARD])).toBeUndefined();
  });

  it('names exactly the assets the build ignored', async () => {
    await writeLabels(`hero:\n  image: "${HERO.publicPath}"\n`);
    const issue = await findGeneratedAssetIssue(root, [HERO, CARD]);
    expect(issue).toContain(CARD.publicPath);
    expect(issue).toContain(CARD.slotId);
    expect(issue).not.toContain(HERO.publicPath);
  });

  it('flags a build that kept stock art everywhere', async () => {
    await writeLabels('hero:\n  image: "/images/template-stock.jpg"\n');
    const issue = await findGeneratedAssetIssue(root, [HERO]);
    expect(issue).toContain(HERO.publicPath);
    expect(issue).toContain('hero');
  });

  it('stays quiet when nothing was generated', async () => {
    await writeLabels('hero:\n  image: "/images/template-stock.jpg"\n');
    expect(await findGeneratedAssetIssue(root, [])).toBeUndefined();
  });

  it('stays quiet when the template has no content files at all', async () => {
    expect(await findGeneratedAssetIssue(root, [HERO])).toBeUndefined();
  });
});
