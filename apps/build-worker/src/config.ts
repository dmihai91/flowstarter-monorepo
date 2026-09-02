/**
 * Environment contract for the private Pi build worker.
 *
 * Every value is validated once at boot so a misconfigured host fails loudly
 * instead of half-running a client's paid build. Nothing here is ever sent to
 * a model: the Pi API key, the service-role key and the GitHub token stay in
 * this process.
 */

export interface ValidatorCommand {
  bin: string;
  args: string[];
}

/**
 * How a finished build reaches a reviewer.
 *
 * `github` is production: push the client branch and open the internal draft
 * PR that gates HUMAN_QA. `local` is the dev/dry path: package the build
 * output into a tarball, serve it off this worker, and ask flowstarter-main to
 * deploy it through the ordinary `deploySite` → deploy-agent route. Local mode
 * needs no GitHub credentials and no Hetzner host, which is the whole point:
 * the ledger → build → deploy → serve chain can be exercised end to end on a
 * laptop.
 */
export type PublishMode = 'github' | 'local';

export interface LocalPublishConfig {
  /** Where packaged tarballs are written and served from. */
  artifactsRoot: string;
  /** Base URL the deploy-agent will fetch artifacts from. */
  artifactBaseUrl: string;
  /** flowstarter-main, which owns `deploySite` and the deployments ledger. */
  flowstarterMainUrl: string;
  /**
   * Directory inside the built site to package, relative to the site root.
   * Falls back to the site root itself when it does not exist, so a manifest
   * that is already plain HTML still deploys.
   */
  outputDir: string;
  /**
   * Replace the Pi coding session with a deterministic pass that only
   * materializes and marks the approved preview. Lets CI and a laptop without
   * a model key still drive the whole chain.
   */
  stubAgent: boolean;
}

export interface WorkerConfig {
  port: number;
  hostname: string;
  sharedSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  publishMode: PublishMode;
  pi: {
    provider: string;
    modelId: string;
    apiKey: string;
    thinkingLevel: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
    timeoutMs: number;
  };
  git: {
    repositoryRoot: string;
    worktreesRoot: string;
    baseRef: string;
    remote: string;
  };
  /** Null in local mode, where no PR is opened and no token is needed. */
  github: {
    apiBaseUrl: string;
    owner: string;
    repo: string;
    token: string;
  } | null;
  /** Null in github mode. */
  local: LocalPublishConfig | null;
  stagingUrlTemplate: string;
  validateCommands: ValidatorCommand[];
  buildTimeoutMs: number;
  maxAttempts: number;
  concurrency: number;
  queueLimit: number;
}

const THINKING_LEVELS = new Set([
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
]);

/**
 * A template site is installed and built with trusted, operator-defined
 * commands run outside Pi. `--ignore-scripts` keeps template dependencies from
 * executing lifecycle hooks on the build host.
 */
const DEFAULT_VALIDATE_COMMANDS: ValidatorCommand[] = [
  { bin: 'pnpm', args: ['install', '--ignore-scripts', '--prefer-offline'] },
  { bin: 'pnpm', args: ['run', 'build'] },
];

export class ConfigError extends Error {}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new ConfigError(`${key} is required`);
  return value;
}

function optionalNumber(
  env: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
  bounds: { min: number; max: number },
): number {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < bounds.min || value > bounds.max) {
    throw new ConfigError(
      `${key} must be an integer between ${bounds.min} and ${bounds.max}`,
    );
  }
  return value;
}

function parseValidateCommands(raw: string | undefined): ValidatorCommand[] {
  if (!raw?.trim()) return DEFAULT_VALIDATE_COMMANDS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(
      'FLOWSTARTER_BUILD_VALIDATE_COMMANDS must be a JSON array of string arrays',
    );
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ConfigError(
      'FLOWSTARTER_BUILD_VALIDATE_COMMANDS must contain at least one command',
    );
  }
  return parsed.map((entry) => {
    if (
      !Array.isArray(entry) ||
      entry.length === 0 ||
      entry.some((part) => typeof part !== 'string' || part.length === 0)
    ) {
      throw new ConfigError(
        'Each validate command must be a non-empty array of non-empty strings',
      );
    }
    const [bin, ...args] = entry as string[];
    // execFile never goes through a shell, but a bin containing a separator
    // would let an operator typo escape the intended toolchain.
    if (!/^[A-Za-z0-9._-]+$/.test(bin as string)) {
      throw new ConfigError(`Validate command "${bin}" is not a bare executable name`);
    }
    return { bin: bin as string, args };
  });
}

function parseRepository(value: string): { owner: string; repo: string } {
  const match = /^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)$/.exec(value);
  if (!match) {
    throw new ConfigError('FLOWSTARTER_SITES_REPO must be in "owner/repo" form');
  }
  return { owner: match[1] as string, repo: match[2] as string };
}

function parsePublishMode(raw: string | undefined): PublishMode {
  const mode = raw?.trim() || 'github';
  if (mode !== 'github' && mode !== 'local') {
    throw new ConfigError(
      `FLOWSTARTER_BUILD_MODE must be "github" or "local", received "${mode}"`,
    );
  }
  return mode;
}

function parseHttpUrl(value: string, key: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigError(`${key} is not a valid URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ConfigError(`${key} must be an http(s) URL`);
  }
  return value.replace(/\/$/, '');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const sharedSecret = required(env, 'FLOWSTARTER_BUILD_WORKER_SECRET');
  if (sharedSecret.length < 32) {
    throw new ConfigError(
      'FLOWSTARTER_BUILD_WORKER_SECRET must be at least 32 characters',
    );
  }

  const publishMode = parsePublishMode(env.FLOWSTARTER_BUILD_MODE);
  const port = optionalNumber(env, 'FLOWSTARTER_BUILD_WORKER_PORT', 8787, {
    min: 1,
    max: 65_535,
  });
  // A stub agent is only meaningful in local mode; production must never
  // silently ship a site nothing personalized.
  const stubAgent =
    publishMode === 'local' && env.FLOWSTARTER_BUILD_STUB_AGENT === 'true';

  const piApiKey =
    env.PI_API_KEY?.trim() || env.OPENROUTER_API_KEY?.trim() || '';
  if (!piApiKey && !stubAgent) {
    throw new ConfigError(
      'PI_API_KEY (or OPENROUTER_API_KEY) is required ' +
        '(or set FLOWSTARTER_BUILD_MODE=local with FLOWSTARTER_BUILD_STUB_AGENT=true)',
    );
  }

  const thinkingLevel = env.PI_THINKING_LEVEL?.trim() || 'medium';
  if (!THINKING_LEVELS.has(thinkingLevel)) {
    throw new ConfigError(`PI_THINKING_LEVEL "${thinkingLevel}" is not supported`);
  }

  // Local mode is expected to run on a laptop with nothing provisioned, so the
  // git roots get defaults there. Production still has to say where they are.
  const repositoryRoot =
    publishMode === 'local'
      ? env.FLOWSTARTER_REPOSITORY_ROOT?.trim() ||
        '/tmp/flowstarter-local/repository'
      : required(env, 'FLOWSTARTER_REPOSITORY_ROOT');
  const worktreesRoot =
    publishMode === 'local'
      ? env.FLOWSTARTER_WORKTREES_ROOT?.trim() ||
        '/tmp/flowstarter-local/worktrees'
      : required(env, 'FLOWSTARTER_WORKTREES_ROOT');
  if (!repositoryRoot.startsWith('/') || !worktreesRoot.startsWith('/')) {
    throw new ConfigError(
      'FLOWSTARTER_REPOSITORY_ROOT and FLOWSTARTER_WORKTREES_ROOT must be absolute paths',
    );
  }

  const stagingUrlTemplate =
    env.FLOWSTARTER_STAGING_URL_TEMPLATE?.trim() ||
    (publishMode === 'local'
      ? 'http://localhost:8788/{projectId}/'
      : 'https://{projectId}.staging.flowstarter.net');
  if (!stagingUrlTemplate.includes('{projectId}')) {
    throw new ConfigError(
      'FLOWSTARTER_STAGING_URL_TEMPLATE must contain the {projectId} placeholder',
    );
  }
  // Local mode serves from loopback, where there is no certificate to have.
  if (publishMode !== 'local' && !stagingUrlTemplate.startsWith('https://')) {
    throw new ConfigError('FLOWSTARTER_STAGING_URL_TEMPLATE must be https');
  }

  return {
    port,
    hostname: env.FLOWSTARTER_BUILD_WORKER_HOST?.trim() || '0.0.0.0',
    sharedSecret,
    supabaseUrl: required(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    supabaseServiceRoleKey: required(env, 'SUPABASE_SERVICE_ROLE_KEY'),
    publishMode,
    pi: {
      provider: env.PI_PROVIDER?.trim() || 'openrouter',
      modelId: env.PI_MODEL?.trim() || 'z-ai/glm-5.2',
      apiKey: piApiKey,
      thinkingLevel: thinkingLevel as WorkerConfig['pi']['thinkingLevel'],
      timeoutMs: optionalNumber(env, 'PI_TIMEOUT_MS', 1_800_000, {
        min: 60_000,
        max: 7_200_000,
      }),
    },
    git: {
      repositoryRoot,
      worktreesRoot,
      baseRef: env.FLOWSTARTER_SITES_BASE_REF?.trim() || 'main',
      remote: env.FLOWSTARTER_SITES_REMOTE?.trim() || 'origin',
    },
    github:
      publishMode === 'github'
        ? {
            apiBaseUrl:
              env.GITHUB_API_BASE_URL?.trim().replace(/\/$/, '') ||
              'https://api.github.com',
            ...parseRepository(required(env, 'FLOWSTARTER_SITES_REPO')),
            token: required(env, 'FLOWSTARTER_SITES_GITHUB_TOKEN'),
          }
        : null,
    local:
      publishMode === 'local'
        ? {
            artifactsRoot:
              env.FLOWSTARTER_BUILD_ARTIFACTS_ROOT?.trim() ||
              '/tmp/flowstarter-build-artifacts',
            artifactBaseUrl: parseHttpUrl(
              env.FLOWSTARTER_BUILD_ARTIFACT_BASE_URL?.trim() ||
                `http://127.0.0.1:${port}`,
              'FLOWSTARTER_BUILD_ARTIFACT_BASE_URL',
            ),
            flowstarterMainUrl: parseHttpUrl(
              env.FLOWSTARTER_MAIN_URL?.trim() || 'http://127.0.0.1:3000',
              'FLOWSTARTER_MAIN_URL',
            ),
            outputDir: env.FLOWSTARTER_BUILD_OUTPUT_DIR?.trim() || 'dist',
            stubAgent,
          }
        : null,
    stagingUrlTemplate,
    validateCommands: parseValidateCommands(
      env.FLOWSTARTER_BUILD_VALIDATE_COMMANDS,
    ),
    buildTimeoutMs: optionalNumber(env, 'FLOWSTARTER_BUILD_TIMEOUT_MS', 900_000, {
      min: 30_000,
      max: 3_600_000,
    }),
    maxAttempts: optionalNumber(env, 'FLOWSTARTER_BUILD_MAX_ATTEMPTS', 3, {
      min: 1,
      max: 10,
    }),
    concurrency: optionalNumber(env, 'FLOWSTARTER_BUILD_CONCURRENCY', 1, {
      min: 1,
      max: 4,
    }),
    queueLimit: optionalNumber(env, 'FLOWSTARTER_BUILD_QUEUE_LIMIT', 32, {
      min: 1,
      max: 512,
    }),
  };
}
