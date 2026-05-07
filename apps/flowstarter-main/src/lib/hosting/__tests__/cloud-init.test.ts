import { describe, expect, it } from 'vitest';
import { buildCloudInit, getCloudInitVersion } from '../cloud-init';

describe('buildCloudInit', () => {
  it('throws if shared secret is missing', () => {
    expect(() =>
      buildCloudInit({
        deployAgentSharedSecret: '',
        caddyAcmeEmail: 'ops@example.com',
      })
    ).toThrow();
  });

  it('throws if ACME email is missing', () => {
    expect(() =>
      buildCloudInit({
        deployAgentSharedSecret: 'secret',
        caddyAcmeEmail: '',
      })
    ).toThrow();
  });

  it('emits valid cloud-config header', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'shh',
      caddyAcmeEmail: 'ops@flowstarter.app',
    });
    expect(out.startsWith('#cloud-config')).toBe(true);
  });

  it('includes the shared secret + ACME email in write_files', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'super-shh',
      caddyAcmeEmail: 'ops@flowstarter.app',
      hostname: 'caddy-fra-01',
    });
    expect(out).toContain('DEPLOY_AGENT_SHARED_SECRET=super-shh');
    expect(out).toContain('email ops@flowstarter.app');
    expect(out).toContain('hostname: caddy-fra-01');
  });

  it('includes ssh keys when provided', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'x',
      caddyAcmeEmail: 'a@b.c',
      sshAuthorizedKeys: ['ssh-ed25519 AAAA test@host'],
    });
    expect(out).toContain('ssh-ed25519 AAAA test@host');
  });

  it('disables agent when no artifact url', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'x',
      caddyAcmeEmail: 'a@b.c',
    });
    expect(out).toContain('disabled (no artifact url)');
    expect(out).not.toContain('flowstarter-deploy-agent\n  - chmod +x');
    expect(out).not.toContain('systemctl enable --now flowstarter-deploy-agent');
  });

  it('downloads + enables agent when artifact url provided', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'x',
      caddyAcmeEmail: 'a@b.c',
      deployAgentArtifactUrl: 'https://artifacts.flowstarter.app/agent-v1.bin',
    });
    expect(out).toContain('agent-v1.bin');
    expect(out).toContain(
      '/usr/local/bin/flowstarter-deploy-agent'
    );
    expect(out).toContain('systemctl enable --now flowstarter-deploy-agent');
  });

  it('embeds the cloud_init_version label', () => {
    const out = buildCloudInit({
      deployAgentSharedSecret: 'x',
      caddyAcmeEmail: 'a@b.c',
    });
    expect(out).toContain(`cloud_init_version=${getCloudInitVersion()}`);
  });
});
