import { describe, expect, it } from "vitest";

import { extractSignals } from "./signals.ts";
import { routeByHeuristics } from "./heuristics.ts";
import { routeTask, routeTaskSync } from "./route.ts";
import { DEFAULT_MODEL_REGISTRY } from "./registry.ts";
import type { ClassifierFn, RouterDecision } from "./types.ts";

describe("autorouter — manual picker path", () => {
  it("returns the override verbatim with confidence 1 and source 'manual'", async () => {
    const decision = await routeTask({
      prompt: "doesn't matter",
      manualOverride: { provider: "codex", model: "gpt-5.4" },
    });
    expect(decision.source).toBe("manual");
    expect(decision.selected_provider).toBe("codex");
    expect(decision.selected_model).toBe("gpt-5.4");
    expect(decision.confidence).toBe(1);
    expect(decision.fallback_provider).toBe("claudeAgent");
  });

  it("syncronous variant mirrors the async manual path", () => {
    const decision = routeTaskSync({
      prompt: "ignored",
      manualOverride: { provider: "claudeAgent", model: "claude-haiku-4-5" },
    });
    expect(decision.source).toBe("manual");
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.selected_model).toBe("claude-haiku-4-5");
  });
});

describe("autorouter — heuristic routing rules from spec", () => {
  it("routes repo-wide refactor to codex standard tier", () => {
    const decision = routeTaskSync({
      prompt: "Do a repo-wide rename of `oldName` to `newName` across the codebase",
      contextHints: { fileCount: 12 },
    });
    expect(decision.selected_provider).toBe("codex");
    expect(decision.tier).toBe("standard");
    expect(decision.selected_model).toBe(DEFAULT_MODEL_REGISTRY.codex.standard);
    expect(decision.source).toBe("heuristic");
  });

  it("routes brainstorming / design critique to claude (and escalates on architecture mention per spec)", () => {
    const decision = routeTaskSync({
      prompt: "What do you think about this architecture? Brainstorm tradeoffs for me.",
    });
    expect(decision.selected_provider).toBe("claudeAgent");
    // "architecture" is a complexity signal; spec says escalate.
    expect(decision.tier).toBe("heavy");
  });

  it("routes plain brainstorming (no complexity cue) to standard claude tier", () => {
    const decision = routeTaskSync({
      prompt: "Brainstorm naming options for this feature with me — what do you think?",
    });
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.tier).toBe("standard");
  });

  it("routes ambiguous open-ended question to claude", () => {
    const decision = routeTaskSync({ prompt: "How should we approach this?" });
    expect(decision.selected_provider).toBe("claudeAgent");
  });

  it("escalates to heavy tier on complexity signals", () => {
    const decision = routeTaskSync({
      prompt: "Investigate a flaky test caused by a race condition in the worker pool",
    });
    expect(decision.tier).toBe("heavy");
  });

  it("downgrades trivial single-file fixes to mini tier", () => {
    const decision = routeTaskSync({
      prompt: "fix typo in README.md — one liner change",
      contextHints: { fileCount: 1 },
    });
    expect(decision.tier).toBe("mini");
  });

  it("escalates tier when repo context is very large", () => {
    const decision = routeTaskSync({
      prompt: "Refactor session handling",
      contextHints: { fileCount: 5, repoTokens: 150_000 },
    });
    expect(decision.tier).toBe("heavy");
  });

  it("defaults to balanced Claude sonnet when no signals fire", () => {
    const decision = routeTaskSync({ prompt: "Help me with this." });
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.tier).toBe("standard");
  });
});

describe("autorouter — auto-recovery (spec: fails twice → switch provider)", () => {
  it("switches provider after 2 consecutive failures and goes heavy", () => {
    const decision = routeTaskSync({
      prompt: "Try this again",
      contextHints: { previousFailures: 2, lastFailedProvider: "codex" },
    });
    expect(decision.source).toBe("recovery");
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.tier).toBe("heavy");
  });

  it("ignores single-failure (recovery only kicks in at >= 2)", () => {
    const decision = routeTaskSync({
      prompt: "fix typo somewhere",
      contextHints: { previousFailures: 1, lastFailedProvider: "codex", fileCount: 1 },
    });
    expect(decision.source).toBe("heuristic");
  });
});

describe("autorouter — provider availability constraints", () => {
  it("reroutes to the only available provider when the heuristic winner is unavailable", () => {
    const decision = routeTaskSync(
      {
        prompt: "Generate tests for the auth module — repo-wide test generation",
      },
      { availableProviders: ["claudeAgent"] },
    );
    expect(decision.selected_provider).toBe("claudeAgent");
    expect(decision.reasoning).toContain("rerouted");
  });

  it("respects a model-slug registry override per (provider, tier)", () => {
    const decision = routeTaskSync(
      { prompt: "What do you think?" },
      { registry: { claudeAgent: { standard: "claude-sonnet-CUSTOM" } } },
    );
    expect(decision.selected_model).toBe("claude-sonnet-CUSTOM");
  });
});

describe("autorouter — classifier integration", () => {
  it("calls the classifier when heuristic confidence is below threshold", async () => {
    let classifierCalls = 0;
    const classify: ClassifierFn = async () => {
      classifierCalls += 1;
      const result: RouterDecision = {
        selected_provider: "codex",
        selected_model: "gpt-5.4",
        reasoning: "classifier override",
        confidence: 0.8,
        fallback_provider: "claudeAgent",
        tier: "standard",
        source: "classifier",
      };
      return result;
    };

    const decision = await routeTask(
      { prompt: "do the thing" }, // no strong signals → low confidence
      { classify, classifierThreshold: 0.9 },
    );

    expect(classifierCalls).toBe(1);
    expect(decision.source).toBe("classifier");
    expect(decision.selected_provider).toBe("codex");
  });

  it("skips the classifier when heuristics are confident", async () => {
    let classifierCalls = 0;
    const classify: ClassifierFn = async () => {
      classifierCalls += 1;
      throw new Error("should not be called");
    };

    const decision = await routeTask(
      {
        prompt: "Do a repo-wide rename across the codebase, multi-file",
        contextHints: { fileCount: 20 },
      },
      { classify },
    );

    expect(classifierCalls).toBe(0);
    expect(decision.source).toBe("heuristic");
  });

  it("falls back to heuristic decision when classifier throws", async () => {
    const classify: ClassifierFn = async () => {
      throw new Error("network down");
    };
    const decision = await routeTask(
      { prompt: "vague request" },
      { classify, classifierThreshold: 0.9 },
    );
    expect(decision.source).toBe("heuristic");
    expect(decision.reasoning).toContain("classifier failed");
  });
});

describe("autorouter — signal extraction", () => {
  it("counts path-like tokens in the prompt", () => {
    const signals = extractSignals(
      "Update src/components/Foo.tsx and apps/web/src/main.ts and packages/util/index.ts",
    );
    expect(signals.pathMentions).toBeGreaterThanOrEqual(3);
  });

  it("marks short questions as ambiguous", () => {
    const signals = extractSignals("What should we do?");
    expect(signals.ambiguity).toBeGreaterThanOrEqual(0.4);
  });

  it("returns zero counts for empty prompts", () => {
    const signals = extractSignals("");
    expect(signals.promptChars).toBe(0);
    expect(signals.promptWords).toBe(0);
    expect(signals.multiFileHits).toBe(0);
  });
});

describe("autorouter — decision shape matches spec example", () => {
  it("decision has all snake_case fields from the spec's example JSON", () => {
    const decision = routeTaskSync({ prompt: "anything" });
    expect(decision).toHaveProperty("selected_provider");
    expect(decision).toHaveProperty("selected_model");
    expect(decision).toHaveProperty("reasoning");
    expect(decision).toHaveProperty("confidence");
    expect(decision).toHaveProperty("fallback_provider");
    expect(typeof decision.confidence).toBe("number");
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });

  it("decision is JSON-serializable as in the spec's example", () => {
    const decision = routeByHeuristics(
      extractSignals("Refactor repo-wide; multi-file migration"),
      { fileCount: 8 },
      {},
    );
    const json = JSON.parse(JSON.stringify(decision));
    expect(json.selected_provider).toBeDefined();
    expect(json.selected_model).toBeDefined();
  });
});
