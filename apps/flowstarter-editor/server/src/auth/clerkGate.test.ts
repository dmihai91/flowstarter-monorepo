import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ClerkGateForbidden,
  parseWorkspaceSlugFromHost,
  resetClerkGateForTesting,
  resolveAuthorization,
  setClerkGateForTesting,
} from "./clerkGate";

// ─── parseWorkspaceSlugFromHost ────────────────────────────────────────────

describe("parseWorkspaceSlugFromHost", () => {
  beforeEach(() => {
    delete process.env.EDITOR_PUBLIC_DOMAIN;
  });

  it("returns slug for `{slug}.flowstarter.net`", () => {
    expect(parseWorkspaceSlugFromHost("acme.flowstarter.net")).toBe("acme");
  });

  it("strips an explicit port", () => {
    expect(parseWorkspaceSlugFromHost("acme.flowstarter.net:8080")).toBe("acme");
  });

  it("normalises mixed case to lower", () => {
    expect(parseWorkspaceSlugFromHost("AcMe.Flowstarter.Net")).toBe("acme");
  });

  it("returns null for the apex domain", () => {
    expect(parseWorkspaceSlugFromHost("flowstarter.net")).toBeNull();
  });

  it("returns null for `www` subdomain", () => {
    expect(parseWorkspaceSlugFromHost("www.flowstarter.net")).toBeNull();
  });

  it("returns null for nested subdomains (admin shouldn't try foo.bar.flowstarter.net)", () => {
    expect(parseWorkspaceSlugFromHost("foo.bar.flowstarter.net")).toBeNull();
  });

  it("returns null for localhost", () => {
    expect(parseWorkspaceSlugFromHost("localhost")).toBeNull();
    expect(parseWorkspaceSlugFromHost("localhost:5733")).toBeNull();
  });

  it("returns null for *.local mDNS hosts", () => {
    expect(parseWorkspaceSlugFromHost("studio.local")).toBeNull();
  });

  it("returns null for unrelated domains", () => {
    expect(parseWorkspaceSlugFromHost("acme.example.com")).toBeNull();
  });

  it("returns null for empty / null input", () => {
    expect(parseWorkspaceSlugFromHost("")).toBeNull();
    expect(parseWorkspaceSlugFromHost(null)).toBeNull();
    expect(parseWorkspaceSlugFromHost(undefined)).toBeNull();
  });

  it("handles comma-separated header values (Forwarded chains)", () => {
    expect(
      parseWorkspaceSlugFromHost("acme.flowstarter.net, edge-proxy"),
    ).toBe("acme");
  });

  it("rejects slugs with invalid characters", () => {
    expect(parseWorkspaceSlugFromHost("ACME!.flowstarter.net")).toBeNull();
    expect(parseWorkspaceSlugFromHost("a..flowstarter.net")).toBeNull();
    expect(parseWorkspaceSlugFromHost("-leading-dash.flowstarter.net")).toBeNull();
  });

  it("respects EDITOR_PUBLIC_DOMAIN override (e.g. staging)", () => {
    process.env.EDITOR_PUBLIC_DOMAIN = "staging.flowstarter.dev";
    expect(parseWorkspaceSlugFromHost("acme.staging.flowstarter.dev")).toBe(
      "acme",
    );
    expect(parseWorkspaceSlugFromHost("acme.flowstarter.net")).toBeNull();
  });
});

// ─── resolveAuthorization ──────────────────────────────────────────────────

interface FakeWorkspace {
  id: string;
  slug: string;
  name: string;
  tier_name: string | null;
}

interface FakeMembership {
  workspace_id: string;
  clerk_user_id: string;
  role: string;
}

type Row = Record<string, unknown>;

function buildSupabaseFake(opts: {
  workspaces: FakeWorkspace[];
  memberships: FakeMembership[];
}): NonNullable<Parameters<typeof setClerkGateForTesting>[0]["supabase"]> {
  const eq = (rows: Row[], column: string, value: unknown): Row[] =>
    rows.filter((row) => row[column] === value);
  return {
    from(table: string) {
      const rows: Row[] = (() => {
        if (table === "workspaces") return opts.workspaces as unknown as Row[];
        if (table === "workspace_memberships") return opts.memberships as unknown as Row[];
        throw new Error(`Unexpected table ${table}`);
      })();

      const builder: {
        _rows: Row[];
        select(): typeof builder;
        eq(column: string, value: unknown): typeof builder;
        in(column: string, values: unknown[]): typeof builder;
        maybeSingle(): Promise<{ data: Row | null; error: null }>;
        then(resolve: (value: { data: Row[]; error: null }) => unknown): Promise<unknown>;
      } = {
        _rows: rows,
        select() {
          return builder;
        },
        eq(column, value) {
          builder._rows = eq(builder._rows, column, value);
          return builder;
        },
        in(column, values) {
          builder._rows = builder._rows.filter((row) => values.includes(row[column]));
          return builder;
        },
        async maybeSingle() {
          return { data: builder._rows[0] ?? null, error: null };
        },
        then(resolve) {
          return Promise.resolve(resolve({ data: builder._rows, error: null }));
        },
      };
      return builder;
    },
  } as unknown as NonNullable<Parameters<typeof setClerkGateForTesting>[0]["supabase"]>;
}

function buildClerkFake(
  role: string | null,
): NonNullable<Parameters<typeof setClerkGateForTesting>[0]["clerk"]> {
  return {
    users: {
      async getUser(_userId: string) {
        return {
          publicMetadata: role === null ? null : { role },
        };
      },
    },
  } as unknown as NonNullable<Parameters<typeof setClerkGateForTesting>[0]["clerk"]>;
}

beforeEach(() => {
  resetClerkGateForTesting();
});
afterEach(() => {
  resetClerkGateForTesting();
  vi.restoreAllMocks();
});

describe("resolveAuthorization — admin path", () => {
  it("returns role=admin, plan=admin, all workspace ids regardless of membership", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake("team"),
      supabase: buildSupabaseFake({
        workspaces: [
          { id: "ws-1", slug: "acme", name: "Acme", tier_name: "pro" },
          { id: "ws-2", slug: "beta", name: "Beta", tier_name: "essential" },
        ],
        memberships: [],
      }),
    });
    const identity = await resolveAuthorization("user_admin");
    expect(identity.role).toBe("admin");
    expect(identity.tier).toBe("admin");
    expect(identity.allowedWorkspaceIds).toEqual(["ws-1", "ws-2"]);
  });

  it("treats publicMetadata.role='admin' the same as 'team'", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake("admin"),
      supabase: buildSupabaseFake({
        workspaces: [{ id: "ws-1", slug: "acme", name: "Acme", tier_name: "pro" }],
        memberships: [],
      }),
    });
    const identity = await resolveAuthorization("user_admin");
    expect(identity.role).toBe("admin");
  });

  it("includes the currentWorkspace block when currentSlug is provided", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake("team"),
      supabase: buildSupabaseFake({
        workspaces: [{ id: "ws-1", slug: "acme", name: "Acme", tier_name: "pro" }],
        memberships: [],
      }),
    });
    const identity = await resolveAuthorization("user_admin", { currentSlug: "acme" });
    expect(identity.currentWorkspace).toEqual({
      id: "ws-1",
      slug: "acme",
      name: "Acme",
      tier: "pro",
    });
  });
});

describe("resolveAuthorization — client path", () => {
  it("returns the workspaces the client has memberships in", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake(null),
      supabase: buildSupabaseFake({
        workspaces: [
          { id: "ws-1", slug: "acme", name: "Acme", tier_name: "pro" },
          { id: "ws-2", slug: "beta", name: "Beta", tier_name: "essential" },
        ],
        memberships: [
          { workspace_id: "ws-1", clerk_user_id: "user_client", role: "admin" },
        ],
      }),
    });
    const identity = await resolveAuthorization("user_client");
    expect(identity.role).toBe("client");
    expect(identity.allowedWorkspaceIds).toEqual(["ws-1"]);
    expect(identity.tier).toBe("pro");
  });

  it("falls back to plan='starter' when no memberships exist", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake(null),
      supabase: buildSupabaseFake({
        workspaces: [],
        memberships: [],
      }),
    });
    const identity = await resolveAuthorization("user_client");
    expect(identity.role).toBe("client");
    expect(identity.tier).toBe("starter");
    expect(identity.allowedWorkspaceIds).toEqual([]);
    expect(identity.currentWorkspace).toBeNull();
  });

  it("scopes plan to the currentWorkspace and normalises legacy tier_name", async () => {
    // DB still holds legacy strings; the read boundary maps
    // essential→starter and commerce→ecommerce.
    setClerkGateForTesting({
      clerk: buildClerkFake(null),
      supabase: buildSupabaseFake({
        workspaces: [
          { id: "ws-1", slug: "acme", name: "Acme", tier_name: "essential" },
          { id: "ws-2", slug: "beta", name: "Beta", tier_name: "commerce" },
        ],
        memberships: [
          { workspace_id: "ws-1", clerk_user_id: "user_client", role: "admin" },
          { workspace_id: "ws-2", clerk_user_id: "user_client", role: "admin" },
        ],
      }),
    });
    const onAcme = await resolveAuthorization("user_client", { currentSlug: "acme" });
    const onBeta = await resolveAuthorization("user_client", { currentSlug: "beta" });
    expect(onAcme.tier).toBe("starter");
    expect(onBeta.tier).toBe("ecommerce");
  });

  it("refuses when client tries to open a workspace they don't belong to", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake(null),
      supabase: buildSupabaseFake({
        workspaces: [
          { id: "ws-1", slug: "acme", name: "Acme", tier_name: "pro" },
          { id: "ws-2", slug: "beta", name: "Beta", tier_name: "essential" },
        ],
        memberships: [
          { workspace_id: "ws-1", clerk_user_id: "user_client", role: "admin" },
        ],
      }),
    });
    await expect(
      resolveAuthorization("user_client", { currentSlug: "beta" }),
    ).rejects.toBeInstanceOf(ClerkGateForbidden);
  });

  it("refuses when the requested workspace doesn't exist", async () => {
    setClerkGateForTesting({
      clerk: buildClerkFake(null),
      supabase: buildSupabaseFake({
        workspaces: [],
        memberships: [],
      }),
    });
    await expect(
      resolveAuthorization("user_client", { currentSlug: "ghost" }),
    ).rejects.toBeInstanceOf(ClerkGateForbidden);
  });
});
