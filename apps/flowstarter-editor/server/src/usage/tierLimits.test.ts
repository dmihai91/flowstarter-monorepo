import { describe, expect, it } from "vitest";

import { SESSION_LIMITS_PER_TIER, computeUsage, sessionLimitFor } from "./tierLimits";

describe("SESSION_LIMITS_PER_TIER", () => {
  it("matches the master decisions doc §5", () => {
    expect(SESSION_LIMITS_PER_TIER).toEqual({
      essential: 15,
      pro: 50,
      commerce: 75,
      custom: null,
    });
  });
});

describe("sessionLimitFor", () => {
  it("returns the per-tier session cap", () => {
    expect(sessionLimitFor("essential")).toBe(15);
    expect(sessionLimitFor("pro")).toBe(50);
    expect(sessionLimitFor("commerce")).toBe(75);
  });
  it("returns null for the custom (unlimited) tier", () => {
    expect(sessionLimitFor("custom")).toBeNull();
  });
});

describe("computeUsage — Essential tier (15 sessions/mo)", () => {
  it("0 used, 0 rollover → 0% used, 15 remaining, not exhausted", () => {
    const usage = computeUsage({ tier: "essential", used: 0, rollover: 0 });
    expect(usage).toMatchObject({
      tier: "essential",
      used: 0,
      limit: 15,
      rollover: 0,
      total: 15,
      remaining: 15,
      percentUsed: 0,
      exhausted: false,
    });
  });

  it("12 used, 0 rollover → 80% used, 3 remaining, not exhausted", () => {
    const usage = computeUsage({ tier: "essential", used: 12, rollover: 0 });
    expect(usage.percentUsed).toBe(80);
    expect(usage.remaining).toBe(3);
    expect(usage.exhausted).toBe(false);
  });

  it("15 used, 0 rollover → 100% used, 0 remaining, exhausted", () => {
    const usage = computeUsage({ tier: "essential", used: 15, rollover: 0 });
    expect(usage.percentUsed).toBe(100);
    expect(usage.remaining).toBe(0);
    expect(usage.exhausted).toBe(true);
  });

  it("over-cap usage clamps remaining to 0 (no negatives)", () => {
    const usage = computeUsage({ tier: "essential", used: 99, rollover: 0 });
    expect(usage.remaining).toBe(0);
    expect(usage.exhausted).toBe(true);
    expect(usage.percentUsed).toBe(100);
  });
});

describe("computeUsage — rollover", () => {
  it("essential 15 + 5 rollover = 20 total", () => {
    const usage = computeUsage({ tier: "essential", used: 0, rollover: 5 });
    expect(usage.total).toBe(20);
    expect(usage.remaining).toBe(20);
  });

  it("uses rollover before exhausting", () => {
    const usage = computeUsage({ tier: "essential", used: 17, rollover: 5 });
    expect(usage.total).toBe(20);
    expect(usage.remaining).toBe(3);
    expect(usage.exhausted).toBe(false);
  });

  it("exhausts when total (limit + rollover) is reached", () => {
    const usage = computeUsage({ tier: "essential", used: 20, rollover: 5 });
    expect(usage.exhausted).toBe(true);
  });
});

describe("computeUsage — Custom tier (unlimited)", () => {
  it("never exhausts; total + remaining + percentUsed are null", () => {
    const usage = computeUsage({ tier: "custom", used: 9999, rollover: 0 });
    expect(usage).toMatchObject({
      tier: "custom",
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
  it("rounds 33.33% → 33", () => {
    const usage = computeUsage({ tier: "essential", used: 5, rollover: 0 });
    expect(usage.percentUsed).toBe(33);
  });

  it("rounds 66.67% → 67", () => {
    const usage = computeUsage({ tier: "essential", used: 10, rollover: 0 });
    expect(usage.percentUsed).toBe(67);
  });

  it("caps display at 100% even when math overflows", () => {
    const usage = computeUsage({ tier: "pro", used: 999, rollover: 0 });
    expect(usage.percentUsed).toBe(100);
  });
});
