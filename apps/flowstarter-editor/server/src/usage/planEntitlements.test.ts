import { describe, expect, it } from "vitest";

import {
  PLAN_ENTITLEMENTS,
  PLAN_RANK,
  allowsCodeExperimentation,
  allowsManualModelPicker,
  entitlementForPlan,
  normalisePlanKey,
  pickHighestPlan,
  type PlanKey,
} from "./planEntitlements";

const ALL_PLANS: PlanKey[] = ["starter", "pro", "max", "ecommerce", "admin"];

describe("PLAN_ENTITLEMENTS — agreed matrix", () => {
  it("starter: 30 sessions, €0.50 per-edit cap, €20 monthly budget, locked autorouter, constrained, no store ops", () => {
    expect(PLAN_ENTITLEMENTS.starter).toMatchObject({
      sessionsPerMonth: 30,
      eurCostCapPerSession: 0.5,
      monthlySoftThresholdEur: 15,
      monthlyHardCeilingEur: 20,
      modelAccess: "autorouter-locked",
      editScope: "constrained",
      storeOps: false,
    });
  });

  it("pro: 60 sessions, €0.50 per-edit cap, €50 monthly budget, picker unlocked, constrained", () => {
    expect(PLAN_ENTITLEMENTS.pro).toMatchObject({
      sessionsPerMonth: 60,
      eurCostCapPerSession: 0.5,
      monthlySoftThresholdEur: 38,
      monthlyHardCeilingEur: 50,
      modelAccess: "autorouter+picker",
      editScope: "constrained",
      storeOps: false,
    });
  });

  it("max: 120 sessions, €0.50 per-edit cap, €150 monthly budget, code unlocked", () => {
    expect(PLAN_ENTITLEMENTS.max).toMatchObject({
      sessionsPerMonth: 120,
      eurCostCapPerSession: 0.5,
      monthlySoftThresholdEur: 112,
      monthlyHardCeilingEur: 150,
      modelAccess: "autorouter+picker+code",
      editScope: "code",
      storeOps: false,
    });
  });

  it("ecommerce: Pro+ sessions, €0.50 per-edit cap, €75 monthly budget, store ops with a separate allowance", () => {
    expect(PLAN_ENTITLEMENTS.ecommerce).toMatchObject({
      sessionsPerMonth: 90,
      eurCostCapPerSession: 0.5,
      monthlySoftThresholdEur: 56,
      monthlyHardCeilingEur: 75,
      modelAccess: "autorouter+picker",
      editScope: "constrained",
      storeOps: true,
      storeOpsAllowance: 200,
    });
  });

  it("admin: unlimited everything, full access", () => {
    expect(PLAN_ENTITLEMENTS.admin).toMatchObject({
      sessionsPerMonth: null,
      eurCostCapPerSession: null,
      monthlySoftThresholdEur: null,
      monthlyHardCeilingEur: null,
      modelAccess: "autorouter+picker+code",
      editScope: "code",
      storeOps: true,
      storeOpsAllowance: null,
    });
  });

  it("every plan key has a self-consistent `plan` field", () => {
    for (const plan of ALL_PLANS) {
      expect(entitlementForPlan(plan).plan).toBe(plan);
    }
  });

  it("hard ceiling is always >= soft threshold where both are set", () => {
    for (const plan of ALL_PLANS) {
      const e = entitlementForPlan(plan);
      if (e.monthlySoftThresholdEur !== null && e.monthlyHardCeilingEur !== null) {
        expect(e.monthlyHardCeilingEur).toBeGreaterThanOrEqual(e.monthlySoftThresholdEur);
      }
    }
  });
});

describe("normalisePlanKey — read-boundary normalization", () => {
  it("passes through canonical plan keys", () => {
    for (const plan of ALL_PLANS) {
      expect(normalisePlanKey(plan)).toBe(plan);
    }
  });

  it("maps legacy Supabase tier_name strings", () => {
    expect(normalisePlanKey("essential")).toBe("starter");
    expect(normalisePlanKey("commerce")).toBe("ecommerce");
    expect(normalisePlanKey("custom")).toBe("admin");
  });

  it("is case/whitespace tolerant", () => {
    expect(normalisePlanKey("  Essential ")).toBe("starter");
    expect(normalisePlanKey("PRO")).toBe("pro");
  });

  it("defaults unknown / null / empty to starter", () => {
    expect(normalisePlanKey(null)).toBe("starter");
    expect(normalisePlanKey(undefined)).toBe("starter");
    expect(normalisePlanKey("")).toBe("starter");
    expect(normalisePlanKey("enterprise")).toBe("starter");
  });
});

describe("pickHighestPlan", () => {
  it("ranks admin > max > ecommerce > pro > starter", () => {
    expect(PLAN_RANK.admin).toBeGreaterThan(PLAN_RANK.max);
    expect(PLAN_RANK.max).toBeGreaterThan(PLAN_RANK.ecommerce);
    expect(PLAN_RANK.ecommerce).toBeGreaterThan(PLAN_RANK.pro);
    expect(PLAN_RANK.pro).toBeGreaterThan(PLAN_RANK.starter);
  });

  it("picks the highest across mixed legacy + canonical strings", () => {
    expect(pickHighestPlan(["essential", "pro", "commerce"])).toBe("ecommerce");
    expect(pickHighestPlan(["starter", "max"])).toBe("max");
    expect(pickHighestPlan([null, "essential"])).toBe("starter");
    expect(pickHighestPlan([])).toBe("starter");
  });
});

describe("capability helpers", () => {
  it("allowsManualModelPicker is false only for Starter", () => {
    expect(allowsManualModelPicker("starter")).toBe(false);
    expect(allowsManualModelPicker("pro")).toBe(true);
    expect(allowsManualModelPicker("max")).toBe(true);
    expect(allowsManualModelPicker("ecommerce")).toBe(true);
    expect(allowsManualModelPicker("admin")).toBe(true);
  });

  it("allowsCodeExperimentation is true only for Max + Admin", () => {
    expect(allowsCodeExperimentation("starter")).toBe(false);
    expect(allowsCodeExperimentation("pro")).toBe(false);
    expect(allowsCodeExperimentation("ecommerce")).toBe(false);
    expect(allowsCodeExperimentation("max")).toBe(true);
    expect(allowsCodeExperimentation("admin")).toBe(true);
  });
});
