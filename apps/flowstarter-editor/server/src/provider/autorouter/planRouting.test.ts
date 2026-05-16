import { describe, expect, it } from "vitest";

import { routeTaskSync } from "./route.ts";
import { LOCKED_SMALL_SLUGS, planRouterPolicy } from "./planRouting.ts";

describe("planRouterPolicy — Starter (autorouter-locked)", () => {
  it("pins a small-model registry and disables the manual picker", () => {
    const policy = planRouterPolicy("starter");
    expect(policy.modelLocked).toBe(true);
    expect(policy.allowManualOverride).toBe(false);
    expect(policy.allowCodeExperimentation).toBe(false);
    expect(policy.routerConfig.registry).toEqual({
      claudeAgent: {
        mini: "claude-sonnet-4-6",
        standard: "claude-sonnet-4-6",
        heavy: "claude-sonnet-4-6",
      },
      codex: {
        mini: "gpt-5.4-mini",
        standard: "gpt-5.4-mini",
        heavy: "gpt-5.4-mini",
      },
    });
  });

  it("keeps Starter on the small model even when heuristics escalate to heavy", () => {
    const policy = planRouterPolicy("starter");
    // A complexity-laden prompt the heuristics would push to the heavy tier.
    const decision = routeTaskSync(
      {
        prompt:
          "Investigate a subtle race condition / deadlock in the distributed worker pool architecture",
      },
      policy.routerConfig,
    );
    expect(decision.tier).toBe("heavy");
    // ...but the resolved slug is still the locked small model.
    expect([LOCKED_SMALL_SLUGS.claudeAgent, LOCKED_SMALL_SLUGS.codex]).toContain(
      decision.selected_model,
    );
  });
});

describe("planRouterPolicy — Pro / Ecommerce (autorouter+picker)", () => {
  it("no registry override; manual picker allowed; no code experimentation", () => {
    for (const plan of ["pro", "ecommerce"] as const) {
      const policy = planRouterPolicy(plan);
      expect(policy.modelLocked).toBe(false);
      expect(policy.allowManualOverride).toBe(true);
      expect(policy.allowCodeExperimentation).toBe(false);
      expect(policy.routerConfig.registry).toBeUndefined();
    }
  });

  it("Pro routing escalates to the real heavy model (not pinned)", () => {
    const policy = planRouterPolicy("pro");
    const decision = routeTaskSync(
      { prompt: "Investigate a subtle race condition in the architecture" },
      policy.routerConfig,
    );
    expect(decision.tier).toBe("heavy");
    expect(decision.selected_model).not.toBe(LOCKED_SMALL_SLUGS.claudeAgent);
  });
});

describe("planRouterPolicy — Max / Admin (autorouter+picker+code)", () => {
  it("unlocks manual override AND code experimentation", () => {
    for (const plan of ["max", "admin"] as const) {
      const policy = planRouterPolicy(plan);
      expect(policy.modelLocked).toBe(false);
      expect(policy.allowManualOverride).toBe(true);
      expect(policy.allowCodeExperimentation).toBe(true);
    }
  });
});

describe("planRouterPolicy — provider availability passthrough", () => {
  it("threads availableProviders into the router config", () => {
    const policy = planRouterPolicy("pro", ["claudeAgent"]);
    expect(policy.routerConfig.availableProviders).toEqual(["claudeAgent"]);
  });

  it("locked Starter still respects single-provider hosts", () => {
    const policy = planRouterPolicy("starter", ["claudeAgent"]);
    const decision = routeTaskSync(
      { prompt: "repo-wide multi-file refactor across the codebase" },
      policy.routerConfig,
    );
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.selected_model).toBe(LOCKED_SMALL_SLUGS.claudeAgent);
  });
});
