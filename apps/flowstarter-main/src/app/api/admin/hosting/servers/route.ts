import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { hetznerFromEnv, HetznerApiError } from '@/lib/hosting/hetzner';
import { buildCloudInit, getCloudInitVersion } from '@/lib/hosting/cloud-init';
import { randomBytes } from 'node:crypto';

const ALLOWED_LOCATIONS = ['fsn1', 'nbg1', 'hel1', 'ash', 'hil'] as const;
const ALLOWED_SERVER_TYPES = [
  'cpx22',
  'cpx21',
  'cpx31',
  'cx22',
  'cx32',
  'cx42',
] as const;

type Loc = (typeof ALLOWED_LOCATIONS)[number];
type ServerType = (typeof ALLOWED_SERVER_TYPES)[number];

function sanitizeName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!/^[a-z0-9-]{2,40}$/.test(trimmed)) return null;
  return trimmed;
}

function inEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string') return fallback;
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback;
}

export async function GET() {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('hosting_servers')
    .select(
      `id, name, provider, hetzner_server_id, ipv4, ipv6, location, server_type,
       status, status_detail, site_capacity, sites_count, cloud_init_version,
       notes, created_at, updated_at, decommissioned_at`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ servers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  // Server-side env access: never read these in the same scope as the
  // returned response — keep the values in local consts only.
  const hetznerToken = process.env.HETZNER_API_TOKEN;
  const sshKeyId = process.env.HETZNER_SSH_KEY_ID;
  const acmeEmail = process.env.CADDY_ACME_EMAIL ?? `ops@${derivedDomain()}`;

  if (!hetznerToken) {
    return NextResponse.json(
      { error: 'HETZNER_API_TOKEN is not configured' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const name = sanitizeName(body.name);
  if (!name) {
    return NextResponse.json(
      {
        error:
          'name is required and must match /^[a-z0-9-]{2,40}$/ (e.g. "caddy-fra-01")',
      },
      { status: 400 }
    );
  }

  const location: Loc = inEnum(body.location, ALLOWED_LOCATIONS, 'fsn1');
  const serverType: ServerType = inEnum(
    body.server_type,
    ALLOWED_SERVER_TYPES,
    'cpx22'
  );
  const siteCapacity =
    typeof body.site_capacity === 'number' && body.site_capacity > 0
      ? Math.floor(body.site_capacity)
      : 50;
  const notes =
    typeof body.notes === 'string' ? body.notes.slice(0, 1000) : null;

  // Generate a per-server shared secret. NEVER returned in the response.
  // Stored only in cloud-init (server-side only) and inserted into the
  // hosting_servers row as a vault-ref placeholder for now (Slice 2.7 will
  // wire up Supabase Vault for real).
  const sharedSecret = randomBytes(32).toString('base64url');
  const sharedSecretRef = `deploy_agent_shared_secret_${name}`;

  // Compose cloud-init.
  const userData = buildCloudInit({
    hostname: name,
    deployAgentSharedSecret: sharedSecret,
    deployAgentArtifactUrl: null, // Slice 2.8 fills this in
    caddyAcmeEmail: acmeEmail,
    sshAuthorizedKeys: [],
    // Anthropic key for the on-host Claude Code CLI (used by the editor's
    // coding agent when running on this server). We pass through whatever
    // is in the deployer's env so /etc/flowstarter/anthropic.env lands
    // populated. If not set, the file is created empty and an operator
    // can fill it in over SSH.
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
  });

  const supabase = createSupabaseServiceRoleClient();

  // Insert pending row first so we have an audit trail even if Hetzner errors.
  const { data: row, error: insertErr } = await supabase
    .from('hosting_servers')
    .insert({
      name,
      provider: 'hetzner',
      location,
      server_type: serverType,
      site_capacity: siteCapacity,
      sites_count: 0,
      status: 'provisioning',
      cloud_init_version: getCloudInitVersion(),
      deploy_agent_secret_ref: sharedSecretRef,
      notes,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (insertErr || !row) {
    return NextResponse.json(
      { error: insertErr?.message ?? 'Failed to record hosting_server' },
      { status: 500 }
    );
  }

  // Call Hetzner Cloud API.
  let hetznerServerId: number | null = null;
  let publicIpv4: string | null = null;
  let publicIpv6: string | null = null;
  let createErr: HetznerApiError | Error | null = null;

  try {
    const client = hetznerFromEnv();
    const sshKeys = sshKeyId ? [sshKeyId] : undefined;
    const out = await client.createServer({
      name,
      server_type: serverType,
      image: 'ubuntu-24.04',
      location,
      ssh_keys: sshKeys,
      user_data: userData,
      labels: {
        managed_by: 'flowstarter',
        role: 'caddy-host',
        cloud_init_version: '1',
      },
      start_after_create: true,
    });
    hetznerServerId = out.server.id;
    publicIpv4 = out.server.public_net?.ipv4?.ip ?? null;
    publicIpv6 = out.server.public_net?.ipv6?.ip ?? null;
  } catch (e) {
    createErr = e instanceof Error ? e : new Error('unknown error');
  }

  if (createErr) {
    await supabase
      .from('hosting_servers')
      .update({
        status: 'error',
        status_detail:
          createErr instanceof HetznerApiError
            ? `${createErr.code}: ${createErr.message}`
            : createErr.message,
      })
      .eq('id', row.id);
    return NextResponse.json(
      {
        error: 'Hetzner provisioning failed',
        detail: createErr.message,
        hosting_server_id: row.id,
      },
      { status: 502 }
    );
  }

  const { data: updated, error: updateErr } = await supabase
    .from('hosting_servers')
    .update({
      hetzner_server_id:
        hetznerServerId !== null ? String(hetznerServerId) : null,
      ipv4: publicIpv4,
      ipv6: publicIpv6,
      // Initial state is "provisioning" until we confirm SSH + Caddy + agent ready.
      status: 'provisioning',
    })
    .eq('id', row.id)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? 'Failed to update hosting_server' },
      { status: 500 }
    );
  }

  return NextResponse.json({ server: updated }, { status: 201 });
}

function derivedDomain(): string {
  // Best-effort fallback when CADDY_ACME_EMAIL is not set. Keeps the cloud-init
  // valid in dev. Production should always set CADDY_ACME_EMAIL explicitly.
  return process.env.PLATFORM_DOMAIN ?? 'flowstarter.app';
}
