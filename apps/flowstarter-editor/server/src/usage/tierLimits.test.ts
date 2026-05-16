import { describe, expect, it } from "vitest";

import { SESSION_LIMITS_PER_TIER, computeUsage, sessionLimitFor } from "./tierLimits";

describe("SESSION_LIMITS_PER_TIER", () => {
  it("derives per-plan session caps from PLAN_ENTITLEMENTS", () => {
    expect(SESSION_LIMITS_PER_TIER).toEqual({
      starter: 30,
      pro: 60,
      max: 120,
      ecommerce: 90,
      admin: null,
    });
  });
});

describe("sessionLimitFor", () => {
  it("returns the per-plan session cap", () => {
    expect(sessionLimitFor("starter")).toBe(30);
    expect(sessionLimitFor("pro")).toBe(60);
    expect(sessionLimitFor("max")).toBe(120);
    expect(sessionLimitFor("ecommerce")).toBe(90);
  });
  it("returns null for the admin (unlimited) plan", () => {
    expect(sessionLimitFor("admin")).toBeNull();
  });
});

describe("computeUsage — Starter plan (30 sessions/mo)", () => {
  it("0 used, 0 rollover → 0% used, 30 remaining, not exhausted", () => {
    const usage = computeUsage({ tier: "starter", used: 0, rollover: 0 });
    expect(usage).toMatchObject({
      tier: "starter",
      used: 0,
      limit: 30,
      rollover: 0,
      total: 30,
      remaining: 30,
      percentUsed: 0,
      exhausted: false,
    });
  });

  it("24 used, 0 rollover → 80% used, 6 remaining, not exhausted", () => {
    const usage = computeUsage({ tier: "starter", used: 24, rollover: 0 });
    expect(usage.percentUsed).toBe(80);
    expect(usage.remaining).toBe(6);
    expect(usage.exhausted).toBe(false);
  });

  it("30 used, 0 rollover → 100% used, 0 remaining, exhausted", () => {
    const usage = computeUsage({ tier: "starter", used: 30, rollover: 0 });
    expect(usage.percentUsed).toBe(100);
    expect(usage.remaining).toBe(0);
    expect(usage.exhausted).toBe(true);
  });

  it("over-cap usage clamps remaining to 0 (no negatives)", () => {
    const usage = computeUsage({ tier: "starter", used: 999, rollover: 0 });
    expect(usage.remaining).toBe(0);
    expect(usage.exhausted).toBe(true);
    expect(usage.percentUsed).toBe(100);
  });
});

describe("computeUsage — rollover", () => {
  it("starter 30 + 5 rollover = 35 total", () => {
    const usage = computeUsage({ tier: "starter", used: 0, rollover: 5 });
    expect(usage.total).toBe(35);
    expect(usage.remaining).toBe(35);
  });

  it("uses rollover before exhausting", () => {
    const usage = computeUsage({ tier: "starter", used: 32, rollover: 5 });
    expect(usage.total).toBe(35);
    expect(usage.remaining).toBe(3);
    expect(usage.exhausted).toBe(false);
  });

  it("exhausts when total (limit + rollover) is reached", () => {
    const usage = computeUsage({ tier: "starter", used: 35, rollover: 5 });
    expect(usage.exhausted).toBe(true);
  });
});

describe("computeUsage — Admin plan (unlimited)", () => {
  it("never exhausts; total + remaining + percentUsed are null", () => {
    const usage = computeUsage({ tier: "admin", used: 9999, rollover: 0 });
    expect(usage).toMatchObject({
      tier: "admin",
      used: 9999,
      limit: null,
      total: null,
      remaining: null,
      percentUsed: null,
      exhausted: false,
    });
  });
});

describe("computeUsage — percent rounding", () => {
  it("rounds 33.33% → 33 (10/30 on starter)", () => {
    const usage = computeUsage({ tier: "starter", used: 10, rollover: 0 });
    expect(usage.percentUsed).toBe(33);
  });

  it("rounds 66.67% → 67 (20/30 on starter)", () => {
    const usage = computeUsage({ tier: "starter", used: 20, rollover: 0 });
    expect(usage.percentUsed).toBe(67);
  });

  it("caps display at 100% even when math overflows", () => {
    const usage = computeUsage({ tier: "pro", used: 999, rollover: 0 });
    expect(usage.percentUsed).toBe(100);
  });
});
