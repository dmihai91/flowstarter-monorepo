import { afterEach, describe, expect, it } from "vitest";

import {
  configureWorkspaceSlug,
  evaluateGate,
  formatLimitReachedMessage,
  gateForConfiguredWorkspace,
  getConfiguredWorkspaceSlug,
  isNewUtcMonth,
  recordTurnCostForConfiguredWorkspace,
  usdToEur,
  utcMonthStart,
} from "./usageAccounting";

describe("isNewUtcMonth", () => {
  it("false within the same UTC month", () => {
    expect(isNewUtcMonth("2026-05-01", new Date("2026-05-31T23:59:59Z"))).toBe(false);
  });
  it("true once the month advances", () => {
    expect(isNewUtcMonth("2026-05-01", new Date("2026-06-01T00:00:00Z"))).toBe(true);
  });
  it("true across a year boundary", () => {
    expect(isNewUtcMonth("2025-12-01", new Date("2026-01-15T00:00:00Z"))).toBe(true);
  });
  it("false for a future-dated marker (no negative reset)", () => {
    expect(isNewUtcMonth("2026-06-01", new Date("2026-05-15T00:00:00Z"))).toBe(false);
  });
  it("treats an unparseable marker as stale (reset)", () => {
    expect(isNewUtcMonth("not-a-date", new Date("2026-05-15T00:00:00Z"))).toBe(true);
  });
});

describe("utcMonthStart", () => {
  it("returns the first day of the UTC month", () => {
    expect(utcMonthStart(new Date("2026-05-31T23:59:59Z"))).toBe("2026-05-01");
    expect(utcMonthStart(new Date("2026-01-09T10:00:00Z"))).toBe("2026-01-01");
  });
});

describe("usdToEur", () => {
  it("applies the rate", () => {
    expect(usdToEur(10, 0.9)).toBeCloseTo(9);
    expect(usdToEur(0, 0.92)).toBe(0);
  });
});

describe("configureWorkspaceSlug / getConfiguredWorkspaceSlug", () => {
  afterEach(() => configureWorkspaceSlug(null));

  it("stores and returns a slug", () => {
    configureWorkspaceSlug("lebadusul");
    expect(getConfiguredWorkspaceSlug()).toBe("lebadusul");
  });
  it("trims surrounding whitespace", () => {
    configureWorkspaceSlug("  lebadusul  ");
    expect(getConfiguredWorkspaceSlug()).toBe("lebadusul");
  });
  it("treats empty / whitespace / null / undefined as unset", () => {
    configureWorkspaceSlug("x");
    configureWorkspaceSlug("   ");
    expect(getConfiguredWorkspaceSlug()).toBe(null);
    configureWorkspaceSlug("y");
    configureWorkspaceSlug(null);
    expect(getConfiguredWorkspaceSlug()).toBe(null);
    configureWorkspaceSlug(undefined);
    expect(getConfiguredWorkspaceSlug()).toBe(null);
  });
});

describe("configured-workspace hot-path hooks (fail-open)", () => {
  afterEach(() => configureWorkspaceSlug(null));

  it("gateForConfiguredWorkspace → null when no slug configured (no DB touch)", async () => {
    configureWorkspaceSlug(null);
    expect(await gateForConfiguredWorkspace()).toBe(null);
  });

  it("gateForConfiguredWorkspace → null (fail-open) when configured but Supabase unavailable", async () => {
    // Test env has no SUPABASE_* — getUsageSupabase throws, gateForSlug swallows → null.
    configureWorkspaceSlug("lebadusul");
    expect(await gateForConfiguredWorkspace()).toBe(null);
  });

  it("recordTurnCostForConfiguredWorkspace → false when no slug configured", async () => {
    configureWorkspaceSlug(null);
    expect(await recordTurnCostForConfiguredWorkspace(0.42)).toBe(false);
  });

  it("recordTurnCostForConfiguredWorkspace → false for non-positive cost (no DB touch)", async () => {
    configureWorkspaceSlug("lebadusul");
    expect(await recordTurnCostForConfiguredWorkspace(0)).toBe(false);
    expect(await recordTurnCostForConfiguredWorkspace(-1)).toBe(false);
  });

  it("recordTurnCostForConfiguredWorkspace → false (fail-open) when Supabase unavailable", async () => {
    configureWorkspaceSlug("lebadusul");
    expect(await recordTurnCostForConfiguredWorkspace(0.42)).toBe(false);
  });
});

describe("formatLimitReachedMessage", () => {
  const base = {
    blocked: true as const,
    softReached: true,
    sessionsUsed: 0,
    sessionLimit: null,
    aiCostEur: 0,
    monthlyBudgetEur: null,
    perEditCapEur: null,
  };

  it("budget reason on a non-max tier → upgrade wording", () => {
    const msg = formatLimitReachedMessage({
      ...base,
      tier: "pro",
      isMax: false,
      reason: "budget",
    });
    expect(msg).toContain("Pro");
    expect(msg).toMatch(/budget/i);
    expect(msg).toMatch(/upgrade/i);
    expect(msg).not.toMatch(/contact us/i);
  });

  it("max tier → contact-us wording (no upgrade)", () => {
    const msg = formatLimitReachedMessage({
      ...base,
      tier: "max",
      isMax: true,
      reason: "budget",
    });
    expect(msg).toContain("Max");
    expect(msg).toMatch(/contact us/i);
    expect(msg).not.toMatch(/upgrade/i);
  });

  it("sessions reason → sessions wording", () => {
    const msg = formatLimitReachedMessage({
      ...base,
      tier: "starter",
      isMax: false,
      reason: "sessions",
    });
    expect(msg).toMatch(/sessions/i);
    expect(msg).toContain("Starter");
  });
});

describe("evaluateGate", () => {
  // Use usdEur = 1 so € equals the stored USD figure for clean assertions.
  const RATE = 1;

  it("starter under both limits → not blocked", () => {
    const d = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 5, rolloverRemaining: 0, aiCostUsdThisMonth: 3 },
      RATE,
    );
    expect(d.blocked).toBe(false);
    expect(d.reason).toBe(null);
    expect(d.sessionLimit).toBe(30);
    expect(d.monthlyBudgetEur).toBe(20);
    expect(d.perEditCapEur).toBe(0.5);
    expect(d.isMax).toBe(false);
  });

  it("blocks on session count when exhausted", () => {
    const d = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 30, rolloverRemaining: 0, aiCostUsdThisMonth: 1 },
      RATE,
    );
    expect(d.blocked).toBe(true);
    expect(d.reason).toBe("sessions");
  });

  it("rollover extends the session limit", () => {
    const justUnder = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 34, rolloverRemaining: 5, aiCostUsdThisMonth: 0 },
      RATE,
    );
    expect(justUnder.sessionLimit).toBe(35);
    expect(justUnder.blocked).toBe(false);
    const at = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 35, rolloverRemaining: 5, aiCostUsdThisMonth: 0 },
      RATE,
    );
    expect(at.blocked).toBe(true);
    expect(at.reason).toBe("sessions");
  });

  it("blocks on monthly budget, which takes reason priority", () => {
    const d = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 40, rolloverRemaining: 0, aiCostUsdThisMonth: 20 },
      RATE,
    );
    expect(d.blocked).toBe(true);
    expect(d.reason).toBe("budget"); // budget wins even though sessions also exhausted
  });

  it("flags the soft threshold without blocking", () => {
    const d = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 1, rolloverRemaining: 0, aiCostUsdThisMonth: 16 },
      RATE,
    );
    expect(d.softReached).toBe(true);
    expect(d.blocked).toBe(false);
  });

  it("pro budget is €50; isMax false", () => {
    const d = evaluateGate(
      { tier: "pro", sessionsUsedThisMonth: 0, rolloverRemaining: 0, aiCostUsdThisMonth: 49 },
      RATE,
    );
    expect(d.monthlyBudgetEur).toBe(50);
    expect(d.blocked).toBe(false);
  });

  it("max flags isMax and has the €150 budget", () => {
    const d = evaluateGate(
      { tier: "max", sessionsUsedThisMonth: 0, rolloverRemaining: 0, aiCostUsdThisMonth: 0 },
      RATE,
    );
    expect(d.isMax).toBe(true);
    expect(d.monthlyBudgetEur).toBe(150);
  });

  it("admin (null limits) never blocks and has no per-edit cap", () => {
    const d = evaluateGate(
      { tier: "admin", sessionsUsedThisMonth: 9999, rolloverRemaining: 0, aiCostUsdThisMonth: 9999 },
      RATE,
    );
    expect(d.blocked).toBe(false);
    expect(d.sessionLimit).toBe(null);
    expect(d.monthlyBudgetEur).toBe(null);
    expect(d.perEditCapEur).toBe(null);
  });

  it("applies the fx rate to the cost comparison", () => {
    // 25 USD * 0.92 = 23 EUR ≥ 20 budget → over budget
    const over = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 0, rolloverRemaining: 0, aiCostUsdThisMonth: 25 },
      0.92,
    );
    expect(over.blocked).toBe(true);
    expect(over.reason).toBe("budget");
    // 20 USD * 0.92 = 18.4 EUR < 20 budget → not blocked
    const under = evaluateGate(
      { tier: "starter", sessionsUsedThisMonth: 0, rolloverRemaining: 0, aiCostUsdThisMonth: 20 },
      0.92,
    );
    expect(under.blocked).toBe(false);
  });
});
