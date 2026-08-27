/**
 * Parity guard: the router's slug parsing must match the editor gate's
 * `parseWorkspaceSlugFromHost` (clerkGate.ts:256-270) exactly. If these
 * drift, routing and auth disagree.
 */

import { describe, expect, test } from "bun:test";
import { parseWorkspaceSlugFromHost as parse } from "../src/slug.ts";

describe("parseWorkspaceSlugFromHost (mirror of clerkGate)", () => {
  test("nullish / empty → null", () => {
    expect(parse(null)).toBeNull();
    expect(parse(undefined)).toBeNull();
    expect(parse("")).toBeNull();
  });

  test("local dev → null", () => {
    expect(parse("localhost")).toBeNull();
    expect(parse("localhost:3000")).toBeNull();
    expect(parse("box.local")).toBeNull();
  });

  test("workspace subdomain → slug (port + case stripped)", () => {
    expect(parse("acme.flowstarter.net")).toBe("acme");
    expect(parse("acme.flowstarter.net:443")).toBe("acme");
    expect(parse("ACME.Flowstarter.NET")).toBe("acme");
    expect(parse("a1-b2.flowstarter.net")).toBe("a1-b2");
  });

  test("apex / www / nested → null", () => {
    expect(parse("flowstarter.net")).toBeNull();
    expect(parse("www.flowstarter.net")).toBeNull();
    expect(parse("a.b.flowstarter.net")).toBeNull();
  });

  test("foreign domain → null", () => {
    expect(parse("acme.example.com")).toBeNull();
  });

  test("invalid slug charset / dashes → null", () => {
    expect(parse("ac_me.flowstarter.net")).toBeNull();
    expect(parse("-acme.flowstarter.net")).toBeNull();
    expect(parse("acme-.flowstarter.net")).toBeNull();
  });

  test("comma-joined Host → first value", () => {
    expect(parse("acme.flowstarter.net, evil.com")).toBe("acme");
  });

  test("EDITOR_PUBLIC_DOMAIN override", () => {
    expect(parse("acme.flowstarter.app", "flowstarter.app")).toBe("acme");
    expect(parse("acme.flowstarter.net", "flowstarter.app")).toBeNull();
  });
});
