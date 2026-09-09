import { describe, expect, it } from 'vitest';
import {
  ArtifactUrlError,
  assertUsableArtifactUrl,
  authorizeBuildWorker,
  buildWorkerSecret,
  deployAgentClientFromEnv,
  resolveDeployAgentSecret,
} from '../build-worker-deploy';
import { DryRunDeployAgentClient, HttpDeployAgentClient } from '../deploy';
import { deployedSiteUrl, localSiteBaseUrl } from '../site-urls';

const SECRET = 's'.repeat(48);

describe('buildWorkerSecret', () => {
  it('refuses a secret short enough to brute force', () => {
    expect(
      buildWorkerSecret({ FLOWSTARTER_BUILD_WORKER_SECRET: 'short' })
    ).toBeNull();
    expect(buildWorkerSecret({})).toBeNull();
    expect(buildWorkerSecret({ FLOWSTARTER_BUILD_WORKER_SECRET: SECRET })).toBe(
      SECRET
    );
  });
});

describe('authorizeBuildWorker', () => {
  const env = { FLOWSTARTER_BUILD_WORKER_SECRET: SECRET };

  it('accepts the dispatch secret the worker already holds', () => {
    expect(authorizeBuildWorker(`Bearer ${SECRET}`, env)).toBe(true);
  });

  it('rejects a wrong, truncated, missing or unscheme-d credential', () => {
    expect(authorizeBuildWorker(`Bearer ${'x'.repeat(48)}`, env)).toBe(false);
    expect(authorizeBuildWorker(`Bearer ${SECRET.slice(0, 47)}`, env)).toBe(
      false
    );
    expect(authorizeBuildWorker(SECRET, env)).toBe(false);
    expect(authorizeBuildWorker(null, env)).toBe(false);
    expect(authorizeBuildWorker(undefined, env)).toBe(false);
  });

  it('rejects everything when no secret is configured, rather than opening up', () => {
    expect(authorizeBuildWorker('Bearer ', {})).toBe(false);
    expect(authorizeBuildWorker(`Bearer ${SECRET}`, {})).toBe(false);
  });
});

describe('assertUsableArtifactUrl', () => {
  it('accepts https anywhere', () => {
    expect(
      assertUsableArtifactUrl('https://cdn.example/site.tar.gz', {
        NODE_ENV: 'production',
      }).protocol
    ).toBe('https:');
  });

  it('accepts plain http on loopback outside production, where the worker serves its own artifact', () => {
    for (const host of ['127.0.0.1', 'localhost']) {
      expect(
        assertUsableArtifactUrl(`http://${host}:8787/artifacts/a.tar.gz`, {
          NODE_ENV: 'development',
        }).hostname
      ).toContain(host === 'localhost' ? 'localhost' : '127.0.0.1');
    }
  });

  it('refuses plain http off loopback, and refuses it entirely in production', () => {
    expect(() =>
      assertUsableArtifactUrl('http://evil.example/site.tar.gz', {
        NODE_ENV: 'development',
      })
    ).toThrow(ArtifactUrlError);
    expect(() =>
      assertUsableArtifactUrl('http://127.0.0.1:8787/a.tar.gz', {
        NODE_ENV: 'production',
      })
    ).toThrow(ArtifactUrlError);
  });

  it('refuses a non-http scheme and a malformed URL', () => {
    expect(() =>
      assertUsableArtifactUrl('file:///etc/passwd', { NODE_ENV: 'development' })
    ).toThrow(ArtifactUrlError);
    expect(() =>
      assertUsableArtifactUrl('not a url', { NODE_ENV: 'development' })
    ).toThrow(ArtifactUrlError);
  });
});

describe('resolveDeployAgentSecret', () => {
  it('prefers the per-server ref, then the single-server dev fallback', () => {
    const env = {
      DEPLOY_AGENT_SHARED_SECRET_LOCAL_DEV: 'per-server',
      DEPLOY_AGENT_SHARED_SECRET: 'global',
    };
    expect(
      resolveDeployAgentSecret('deploy_agent_shared_secret_local_dev', env)
    ).toBe('per-server');
    expect(
      resolveDeployAgentSecret('deploy_agent_shared_secret_other', env)
    ).toBe('global');
    expect(resolveDeployAgentSecret('anything', {})).toBeNull();
  });
});

describe('deployAgentClientFromEnv', () => {
  it('honours the dry-run switch and defaults to the real HTTP client', () => {
    expect(
      deployAgentClientFromEnv({ DEPLOY_AGENT_DRY_RUN: 'true' })
    ).toBeInstanceOf(DryRunDeployAgentClient);
    expect(deployAgentClientFromEnv({})).toBeInstanceOf(HttpDeployAgentClient);
  });
});

describe('deployedSiteUrl', () => {
  it('prefers the custom domain the client actually paid for', () => {
    expect(
      deployedSiteUrl({
        slug: 'calm-path',
        primaryDomain: 'calmpath.ro',
        env: { FLOWSTARTER_LOCAL_SITE_BASE_URL: 'http://localhost:8788' },
      })
    ).toBe('https://calmpath.ro');
  });

  it('uses the local path-served URL when a local deploy-agent is serving', () => {
    expect(
      deployedSiteUrl({
        slug: 'calm-path',
        env: { FLOWSTARTER_LOCAL_SITE_BASE_URL: 'http://localhost:8788/' },
      })
    ).toBe('http://localhost:8788/calm-path/');
  });

  it('falls back to the preview subdomain the deploy upserts DNS for', () => {
    expect(deployedSiteUrl({ slug: 'calm-path', env: {} })).toMatch(
      /^https:\/\/calm-path\.preview\./
    );
  });

  it('never serves the local base URL in production', () => {
    const env = {
      NODE_ENV: 'production',
      FLOWSTARTER_LOCAL_SITE_BASE_URL: 'http://localhost:8788',
    };
    expect(localSiteBaseUrl(env)).toBeNull();
    expect(deployedSiteUrl({ slug: 'calm-path', env })).toMatch(/^https:\/\//);
  });
});
