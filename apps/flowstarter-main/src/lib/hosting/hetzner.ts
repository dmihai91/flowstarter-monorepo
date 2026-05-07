/**
 * Hetzner Cloud API client.
 *
 * Typed `fetch` wrapper around the subset of endpoints we need for the
 * shared multi-tenant Caddy-host topology:
 *   - createServer  → POST /v1/servers
 *   - getServer     → GET  /v1/servers/{id}
 *   - listServers   → GET  /v1/servers
 *   - deleteServer  → DELETE /v1/servers/{id}
 *
 * Docs: https://docs.hetzner.cloud/
 *
 * Authentication: `Authorization: Bearer <HETZNER_API_TOKEN>`.
 *
 * Note: this lives inside flowstarter-main for now. When the operator
 * service is split out (Slice 2.7) it should import the same module
 * — keep API-surface decisions provider-agnostic and serializable.
 */

const DEFAULT_BASE_URL = 'https://api.hetzner.cloud/v1';

export type HetznerLocation =
  | 'fsn1' // Falkenstein, DE
  | 'nbg1' // Nuremberg, DE
  | 'hel1' // Helsinki, FI
  | 'ash'  // Ashburn, US
  | 'hil'; // Hillsboro, US

export type HetznerServerType =
  | 'cpx22'  // shared AMD, 2 vCPU / 4 GB — Flowstarter v1 default per master doc
  | 'cpx21'  // shared AMD, 3 vCPU / 4 GB
  | 'cpx31'  // shared AMD, 4 vCPU / 8 GB
  | 'cx22'   // shared Intel, 2 vCPU / 4 GB
  | 'cx32'   // shared Intel, 4 vCPU / 8 GB
  | 'cx42';  // shared Intel, 8 vCPU / 16 GB

export type HetznerServerStatus =
  | 'initializing'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'off'
  | 'deleting'
  | 'rebuilding'
  | 'migrating'
  | 'unknown';

export interface HetznerPublicNet {
  ipv4?: { ip: string; blocked: boolean; dns_ptr: string };
  ipv6?: { ip: string; blocked: boolean; dns_ptr: Array<{ ip: string; dns_ptr: string }> };
  floating_ips?: number[];
}

export interface HetznerServer {
  id: number;
  name: string;
  status: HetznerServerStatus;
  created: string;
  public_net: HetznerPublicNet;
  server_type: { id: number; name: string };
  datacenter: { id: number; name: string; location: { name: string; country: string } };
  image: { id: number; name: string | null; type: string };
  iso: unknown | null;
  rescue_enabled: boolean;
  locked: boolean;
  protection: { delete: boolean; rebuild: boolean };
  labels: Record<string, string>;
}

export interface HetznerCreateServerRequest {
  name: string;
  location?: HetznerLocation;
  server_type: HetznerServerType;
  image: string; // e.g. 'ubuntu-24.04'
  ssh_keys?: Array<number | string>;
  user_data?: string; // cloud-init YAML
  labels?: Record<string, string>;
  start_after_create?: boolean;
}

export interface HetznerCreateServerResponse {
  server: HetznerServer;
  action: { id: number; status: string; command: string };
  next_actions: Array<{ id: number; status: string; command: string }>;
  root_password: string | null;
}

export interface HetznerListServersResponse {
  servers: HetznerServer[];
  meta: { pagination: { page: number; per_page: number; total_entries: number } };
}

export class HetznerApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: unknown,
    message?: string
  ) {
    super(message ?? `Hetzner API ${status} ${code}`);
    this.name = 'HetznerApiError';
  }
}

export interface HetznerClientOptions {
  token: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class HetznerClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(opts: HetznerClientOptions) {
    if (!opts.token) {
      throw new Error('HetznerClient requires a token');
    }
    this.token = opts.token;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
  }

  async createServer(req: HetznerCreateServerRequest): Promise<HetznerCreateServerResponse> {
    return this.request<HetznerCreateServerResponse>('POST', '/servers', req);
  }

  async getServer(id: number | string): Promise<HetznerServer> {
    const data = await this.request<{ server: HetznerServer }>('GET', `/servers/${id}`);
    return data.server;
  }

  async listServers(params?: { label_selector?: string; page?: number; per_page?: number }): Promise<HetznerListServersResponse> {
    const query = new URLSearchParams();
    if (params?.label_selector) query.set('label_selector', params.label_selector);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.per_page !== undefined) query.set('per_page', String(params.per_page));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request<HetznerListServersResponse>('GET', `/servers${suffix}`);
  }

  async deleteServer(id: number | string): Promise<{ action: { id: number; status: string; command: string } }> {
    return this.request<{ action: { id: number; status: string; command: string } }>(
      'DELETE',
      `/servers/${id}`
    );
  }

  private async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data: unknown = undefined;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        // non-JSON body
      }
    }

    if (!res.ok) {
      const errPayload = (data as { error?: { code?: string; message?: string; details?: unknown } } | undefined)?.error;
      throw new HetznerApiError(
        res.status,
        errPayload?.code ?? 'unknown_error',
        errPayload?.details,
        errPayload?.message ?? `Hetzner API ${res.status} on ${method} ${path}`
      );
    }

    return data as T;
  }
}

/**
 * Build a HetznerClient from process.env. Throws if the token isn't set.
 * Use this from server-side code only — never bundle the token into the client.
 */
export function hetznerFromEnv(env: NodeJS.ProcessEnv = process.env): HetznerClient {
  const token = env.HETZNER_API_TOKEN;
  if (!token) {
    throw new Error('HETZNER_API_TOKEN is not set in env');
  }
  return new HetznerClient({ token });
}
