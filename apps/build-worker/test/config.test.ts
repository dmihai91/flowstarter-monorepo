import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config';

function validEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    FLOWSTARTER_BUILD_WORKER_SECRET: 's'.repeat(48),
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    PI_API_KEY: 'pi-key',
    FLOWSTARTER_REPOSITORY_ROOT: '/srv/flowstarter/sites',
    FLOWSTARTER_WORKTREES_ROOT: '/srv/flowstarter/worktrees',
    FLOWSTARTER_SITES_REPO: 'flowstarter/sites',
    FLOWSTARTER_SITES_GITHUB_TOKEN: 'ghp_token',
    ...overrides,
  };
}

describe('worker configuration', () => {
  it('boots with the documented minimum and sensible defaults', () => {
    const config = loadConfig(validEnv());
    expect(config.port).toBe(8787);
    expect(config.concurrency).toBe(1);
    expect(config.pi.provider).toBe('openrouter');
    expect(config.github).toMatchObject({ owner: 'flowstarter', repo: 'sites' });
    expect(config.validateCommands.map((c) => c.bin)).toEqual(['pnpm', 'pnpm']);
    expect(config.stagingUrlTemplate).toContain('{projectId}');
  });

  it('accepts OPENROUTER_API_KEY in place of PI_API_KEY', () => {
    const config = loadConfig(
      validEnv({ PI_API_KEY: undefined, OPENROUTER_API_KEY: 'or-key' }),
    );
    expect(config.pi.apiKey).toBe('or-key');
  });

  it('refuses a shared secret short enough to brute force', () => {
    expect(() =>
      loadConfig(validEnv({ FLOWSTARTER_BUILD_WORKER_SECRET: 'short' })),
    ).toThrow(ConfigError);
  });

  it('refuses to start without model credentials', () => {
    expect(() =>
      loadConfig(validEnv({ PI_API_KEY: undefined, OPENROUTER_API_KEY: undefined })),
    ).toThrow(ConfigError);
  });

  it('refuses relative git roots', () => {
    expect(() =>
      loadConfig(validEnv({ FLOWSTARTER_WORKTREES_ROOT: 'worktrees' })),
    ).toThrow(ConfigError);
  });

  it('refuses a staging template that cannot address the project or is not https', () => {
    expect(() =>
      loadConfig(
        validEnv({ FLOWSTARTER_STAGING_URL_TEMPLATE: 'https://staging.example.com' }),
      ),
    ).toThrow(ConfigError);
    expect(() =>
      loadConfig(
        validEnv({ FLOWSTARTER_STAGING_URL_TEMPLATE: 'http://{projectId}.example.com' }),
      ),
    ).toThrow(ConfigError);
  });

  it('refuses a repository that is not owner/repo', () => {
    expect(() => loadConfig(validEnv({ FLOWSTARTER_SITES_REPO: 'sites' }))).toThrow(
      ConfigError,
    );
  });

  it('parses operator-supplied validate commands', () => {
    const config = loadConfig(
      validEnv({
        FLOWSTARTER_BUILD_VALIDATE_COMMANDS: JSON.stringify([
          ['npm', 'ci'],
          ['npm', 'run', 'build'],
        ]),
      }),
    );
    expect(config.validateCommands).toEqual([
      { bin: 'npm', args: ['ci'] },
      { bin: 'npm', args: ['run', 'build'] },
    ]);
  });

  it('refuses a validate command that is a path rather than an executable name', () => {
    expect(() =>
      loadConfig(
        validEnv({
          FLOWSTARTER_BUILD_VALIDATE_COMMANDS: JSON.stringify([['../../bin/sh', '-c']]),
        }),
      ),
    ).toThrow(ConfigError);
  });

  it('refuses malformed validate command JSON', () => {
    expect(() =>
      loadConfig(validEnv({ FLOWSTARTER_BUILD_VALIDATE_COMMANDS: 'pnpm build' })),
    ).toThrow(ConfigError);
    expect(() =>
      loadConfig(validEnv({ FLOWSTARTER_BUILD_VALIDATE_COMMANDS: '[]' })),
    ).toThrow(ConfigError);
  });

  it('refuses an out-of-range concurrency', () => {
    expect(() => loadConfig(validEnv({ FLOWSTARTER_BUILD_CONCURRENCY: '0' }))).toThrow(
      ConfigError,
    );
    expect(() => loadConfig(validEnv({ FLOWSTARTER_BUILD_CONCURRENCY: '99' }))).toThrow(
      ConfigError,
    );
  });
});
