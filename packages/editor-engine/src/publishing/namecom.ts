/**
 * name.com Core v1 REST API wrapper for domain provisioning (Tier 2).
 *
 * Auth: HTTP Basic Auth (username:token).
 * Sandbox: append '-test' to username, use api.dev.name.com.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface NameComConfig {
  username: string;
  token: string;
  sandbox?: boolean;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number; // USD cents
  currency?: string;
}

export interface DomainRegistration {
  domain: string;
  expireDate: string;
  locked: boolean;
}

// ── Internals ────────────────────────────────────────────────────────────────

function baseUrl(config: NameComConfig): string {
  return config.sandbox
    ? 'https://api.dev.name.com'
    : 'https://api.name.com';
}

function authHeader(config: NameComConfig): string {
  const user = config.sandbox
    ? `${config.username}-test`
    : config.username;
  return `Basic ${Buffer.from(`${user}:${config.token}`).toString('base64')}`;
}

async function namecomFetch(
  path: string,
  config: NameComConfig,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${baseUrl(config)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader(config),
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  return res;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Search domain availability + suggestions for a keyword.
 * POST /core/v1/domains/search
 */
export async function searchDomains(
  keyword: string,
  config: NameComConfig,
): Promise<DomainSearchResult[]> {
  const res = await namecomFetch('/core/v1/domains/search', config, {
    method: 'POST',
    body: JSON.stringify({
      keyword,
      tlds: ['.com', '.co', '.io', '.dev'],
    }),
  });

  if (!res.ok) {
    throw new Error(`name.com search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    results?: Array<{
      domainName: string;
      purchasable: boolean;
      purchasePrice?: number;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    domain: r.domainName,
    available: r.purchasable,
    price: r.purchasePrice ? Math.round(r.purchasePrice * 100) : undefined,
    currency: r.purchasePrice ? 'USD' : undefined,
  }));
}

/**
 * Register a domain.
 * POST /core/v1/domains
 */
export async function registerDomain(
  domain: string,
  config: NameComConfig,
): Promise<DomainRegistration> {
  // First look up the price via search so we can pass purchasePrice
  const results = await searchDomains(domain.split('.')[0], config);
  const match = results.find(
    (r) => r.domain.toLowerCase() === domain.toLowerCase(),
  );

  const purchasePrice = match?.price
    ? match.price / 100 // API expects dollars
    : undefined;

  const res = await namecomFetch('/core/v1/domains', config, {
    method: 'POST',
    body: JSON.stringify({
      domainName: domain,
      purchasePrice,
      purchaseType: 'registration',
      years: 1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `name.com registration failed: ${res.status} ${res.statusText} — ${body}`,
    );
  }

  const data = (await res.json()) as {
    domainName: string;
    expireDate: string;
    locked: boolean;
  };

  return {
    domain: data.domainName,
    expireDate: data.expireDate,
    locked: data.locked,
  };
}

/**
 * Update nameservers for a domain to point to Cloudflare.
 * PUT /core/v1/domains/{domainName}/nameservers
 */
export async function setNameservers(
  domain: string,
  nameservers: string[],
  config: NameComConfig,
): Promise<void> {
  const res = await namecomFetch(
    `/core/v1/domains/${encodeURIComponent(domain)}/nameservers`,
    config,
    {
      method: 'PUT',
      body: JSON.stringify({ nameservers }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `name.com setNameservers failed: ${res.status} ${res.statusText} — ${body}`,
    );
  }
}

/**
 * Get domain info (to check registration status).
 * GET /core/v1/domains/{domainName}
 */
export async function getDomain(
  domain: string,
  config: NameComConfig,
): Promise<DomainRegistration | null> {
  const res = await namecomFetch(
    `/core/v1/domains/${encodeURIComponent(domain)}`,
    config,
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `name.com getDomain failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    domainName: string;
    expireDate: string;
    locked: boolean;
  };

  return {
    domain: data.domainName,
    expireDate: data.expireDate,
    locked: data.locked,
  };
}
