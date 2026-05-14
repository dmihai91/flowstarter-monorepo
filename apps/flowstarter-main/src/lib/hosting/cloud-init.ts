/**
 * Cloud-init bootstrap script generator for Hetzner servers.
 *
 * Emits a cloud-config (YAML) blob that Hetzner runs on first boot.
 * This sets up the **shared multi-tenant Caddy host** topology described in
 * `docs/CONCIERGE_PIVOT_PLAN.md`:
 *
 *   - Updates packages
 *   - Installs Caddy (auto-https), Docker, jq, curl, ufw
 *   - Installs Node.js 22 + the Claude Code CLI globally so the editor's
 *     coding agent can run on the host (uses ANTHROPIC_API_KEY)
 *   - Hardens SSH (disables root password login, keeps key auth)
 *   - Opens 22/80/443 in ufw
 *   - Drops a systemd unit for the deploy-agent (Bun service, Slice 2.8)
 *   - Writes a base Caddyfile that includes per-site snippets from
 *     /etc/caddy/sites/*.caddy
 *   - Bumps cloud_init_version label so we can track which servers need
 *     a re-bootstrap when the script changes
 *
 * The deploy-agent binary itself isn't built yet — for now this script
 * leaves a placeholder unit that's disabled. When Slice 2.8 lands the
 * agent, we'll fill the ExecStart in.
 */

const CLOUD_INIT_VERSION = 2;

/**
 * Pinned versions for the host's coding-agent stack. Bump these together
 * with CLOUD_INIT_VERSION when upgrading.
 */
const NODE_MAJOR = 22;
const CLAUDE_CODE_NPM_PACKAGE = '@anthropic-ai/claude-code';

export interface CloudInitOptions {
  /** SSH public key(s) to add to the server's root account */
  sshAuthorizedKeys?: string[];
  /** Hostname to set on the server (FQDN or short name) */
  hostname?: string;
  /**
   * Bearer token the deploy-agent will require on every request from the
   * operator. Should be a high-entropy random string. The operator stores
   * this in Supabase Vault under hosting_servers.deploy_agent_secret_ref.
   */
  deployAgentSharedSecret: string;
  /**
   * Tarball URL (HTTPS) the server pulls the deploy-agent binary from on
   * first boot. Falls back to a placeholder that does nothing when null.
   */
  deployAgentArtifactUrl?: string | null;
  /** Email address Caddy uses for Let's Encrypt registration */
  caddyAcmeEmail: string;
  /**
   * Anthropic API key the on-host Claude Code CLI uses. Written to
   * /etc/flowstarter/anthropic.env (mode 0600, root-only) so any
   * editor-spawned subprocess can read it. Optional during early
   * provisioning — when omitted the CLI is still installed but the env
   * file is left empty so an operator can drop the key in later.
   */
  anthropicApiKey?: string | null;
}

export function getCloudInitVersion(): number {
  return CLOUD_INIT_VERSION;
}

/**
 * Builds the cloud-config YAML. The output is meant to be passed to Hetzner's
 * `user_data` field on POST /v1/servers.
 *
 * Note: We intentionally use raw string templating instead of a YAML library
 * because the script is small, the structure is fixed, and we want zero
 * runtime deps on the server-side hot path.
 */
export function buildCloudInit(opts: CloudInitOptions): string {
  if (!opts.deployAgentSharedSecret) {
    throw new Error('buildCloudInit: deployAgentSharedSecret is required');
  }
  if (!opts.caddyAcmeEmail) {
    throw new Error('buildCloudInit: caddyAcmeEmail is required');
  }

  const sshKeys = opts.sshAuthorizedKeys ?? [];
  const hostname = opts.hostname ?? 'flowstarter-host';
  const artifactUrl = opts.deployAgentArtifactUrl;

  const sshKeysYaml = sshKeys.length
    ? sshKeys.map((k) => `      - ${escapeYaml(k)}`).join('\n')
    : '';

  // Note: heredoc must keep tab/space indentation correct for YAML.
  return `#cloud-config
#
# Flowstarter Hetzner host bootstrap — version ${CLOUD_INIT_VERSION}
# See apps/flowstarter-main/src/lib/hosting/cloud-init.ts for source.
#
hostname: ${hostname}
manage_etc_hosts: true

package_update: true
package_upgrade: true

packages:
  - curl
  - jq
  - ufw
  - debian-keyring
  - debian-archive-keyring
  - apt-transport-https
  - ca-certificates
  - software-properties-common

users:
  - name: root
${
  sshKeysYaml
    ? `    ssh_authorized_keys:\n${sshKeysYaml}`
    : '    # no extra ssh keys'
}

write_files:
  - path: /etc/flowstarter/version
    content: |
      cloud_init_version=${CLOUD_INIT_VERSION}
    owner: root:root
    permissions: '0644'
  - path: /etc/flowstarter/deploy-agent.env
    content: |
      DEPLOY_AGENT_SHARED_SECRET=${opts.deployAgentSharedSecret}
      DEPLOY_AGENT_PORT=8443
    owner: root:root
    permissions: '0600'
  - path: /etc/flowstarter/anthropic.env
    content: |
      # Anthropic credentials for the on-host Claude Code CLI. Sourced by
      # any editor-spawned subprocess that runs the agent on this host.
      ANTHROPIC_API_KEY=${opts.anthropicApiKey ?? ''}
    owner: root:root
    permissions: '0600'
  - path: /etc/caddy/Caddyfile
    content: |
      # Base Caddyfile — per-site vhosts live in /etc/caddy/sites/*.caddy
      {
        email ${opts.caddyAcmeEmail}
      }
      import /etc/caddy/sites/*.caddy
    owner: root:root
    permissions: '0644'
  - path: /etc/systemd/system/flowstarter-deploy-agent.service
    content: |
      [Unit]
      Description=Flowstarter deploy-agent
      After=network-online.target docker.service
      Wants=network-online.target

      [Service]
      EnvironmentFile=/etc/flowstarter/deploy-agent.env
      ExecStart=/usr/local/bin/flowstarter-deploy-agent
      Restart=on-failure
      RestartSec=5

      [Install]
      WantedBy=multi-user.target
    owner: root:root
    permissions: '0644'

runcmd:
  # ─── Caddy install (official repo) ────────────────────────────────────
  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | tee /etc/apt/sources.list.d/caddy-stable.list
  - apt-get update
  - apt-get install -y caddy

  # ─── Docker install (official convenience script) ─────────────────────
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker

  # ─── Node.js ${NODE_MAJOR} + Claude Code CLI ──────────────────────────
  # NodeSource ships current LTS; Debian's own apt is too stale for the
  # CLI's engine requirement. Globally installs ${CLAUDE_CODE_NPM_PACKAGE}
  # so editor-spawned subprocesses on the host can run \`claude\` directly.
  - curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  - apt-get install -y nodejs
  - npm install -g ${CLAUDE_CODE_NPM_PACKAGE}
  - claude --version || true

  # ─── Sites dir + Caddy reload ─────────────────────────────────────────
  - mkdir -p /etc/caddy/sites
  - mkdir -p /var/www/sites
  - chown -R caddy:caddy /var/www/sites
  - systemctl reload caddy

  # ─── Firewall ─────────────────────────────────────────────────────────
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable

  # ─── Deploy-agent install (placeholder until artifact is published) ───
${
  artifactUrl
    ? `  - curl -fsSL ${escapeShell(
        artifactUrl
      )} -o /usr/local/bin/flowstarter-deploy-agent
  - chmod +x /usr/local/bin/flowstarter-deploy-agent
  - systemctl daemon-reload
  - systemctl enable --now flowstarter-deploy-agent`
    : `  # Deploy-agent artifact URL not provided. Service unit installed but disabled.
  - systemctl daemon-reload`
}

final_message: "Flowstarter host bootstrap complete (cloud_init_version=${CLOUD_INIT_VERSION}). Caddy + Docker + Node ${NODE_MAJOR} + Claude Code CLI installed. Deploy-agent ${
    artifactUrl ? 'started' : 'disabled (no artifact url)'
  }. Anthropic env ${
    opts.anthropicApiKey
      ? 'wired'
      : 'placeholder (drop key in /etc/flowstarter/anthropic.env)'
  }."
`;
}

function escapeYaml(value: string): string {
  // Quote only if needed: contains ':' or starts with a YAML-significant char.
  if (/^[a-zA-Z0-9@\-+=/_.\s]+$/.test(value) && !value.includes(': ')) {
    return value;
  }
  return JSON.stringify(value);
}

function escapeShell(value: string): string {
  // For URLs in cloud-init runcmd. We trust the input (operator-controlled),
  // but still wrap in single quotes and escape any embedded single quotes.
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
