import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CommandSiteValidator,
  NoopSiteValidator,
  SiteValidationError,
} from '../src/validator';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function siteWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'flowstarter-validator-'));
  temporaryDirectories.push(root);
  await writeFile(join(root, 'package.json'), '{"name":"site"}', 'utf8');
  await mkdir(join(root, 'src'), { recursive: true });
  return root;
}

/** Stands in for `pnpm run build`: writes the dist/ output the gate requires. */
const BUILD_OK = {
  bin: 'node',
  args: ['-e', 'require("node:fs").mkdirSync("dist",{recursive:true})'],
};

describe('NoopSiteValidator', () => {
  it('passes without a package manifest or dist output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flowstarter-noop-validator-'));
    temporaryDirectories.push(root);
    const validator = new NoopSiteValidator();
    await expect(validator.validate(root, 'full')).resolves.toBeUndefined();
    await expect(validator.validate(root, 'preview')).resolves.toBeUndefined();
  });
});

describe('CommandSiteValidator', () => {
  it('passes a site that installs, builds and emits output', async () => {
    const root = await siteWorkspace();
    const validator = new CommandSiteValidator({
      commands: [BUILD_OK],
      timeoutMs: 30_000,
    });
    await expect(validator.validate(root, 'full')).resolves.toBeUndefined();
  });

  it('fails the job when a build command exits non-zero', async () => {
    const root = await siteWorkspace();
    const validator = new CommandSiteValidator({
      commands: [{ bin: 'node', args: ['-e', 'console.error("build broke");process.exit(1)'] }],
      timeoutMs: 30_000,
    });
    await expect(validator.validate(root, 'full')).rejects.toThrow(/build broke/);
  });

  it('fails when the commands succeed but produce no output directory', async () => {
    const root = await siteWorkspace();
    const validator = new CommandSiteValidator({
      commands: [{ bin: 'node', args: ['-e', '0'] }],
      timeoutMs: 30_000,
    });
    await expect(validator.validate(root, 'full')).rejects.toThrow(
      /no dist\/ output directory/,
    );
  });

  it('refuses a workspace missing its manifest or sources before running anything', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flowstarter-validator-'));
    temporaryDirectories.push(root);
    const validator = new CommandSiteValidator({
      commands: [{ bin: 'node', args: ['-e', 'process.exit(1)'] }],
      timeoutMs: 30_000,
    });
    await expect(validator.validate(root, 'full')).rejects.toThrow(
      /no package manifest/,
    );
  });

  it('is not the preview gate and says so rather than silently passing', async () => {
    const root = await siteWorkspace();
    const validator = new CommandSiteValidator({
      commands: [BUILD_OK],
      timeoutMs: 30_000,
    });
    await expect(validator.validate(root, 'preview')).rejects.toThrow(
      SiteValidationError,
    );
  });

  it('kills a command that hangs past the build timeout', async () => {
    const root = await siteWorkspace();
    const validator = new CommandSiteValidator({
      commands: [{ bin: 'node', args: ['-e', 'setTimeout(()=>{},60000)'] }],
      timeoutMs: 1_000,
    });
    await expect(validator.validate(root, 'full')).rejects.toThrow(/timed out/);
  });
});
