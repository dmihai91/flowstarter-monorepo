import type { ModelSelection, ServerProvider } from "@flowstarter/editor-contracts";
import { describe, expect, it } from "vitest";

import {
  AUTOROUTE_MODEL_SLUG,
  isAutoRouteSelection,
  makeAutoRouteModelSelection,
  resolveModelSelectionForTurn,
  resolveModelSelectionForTurnSync,
} from "./resolveModelSelection.ts";

const NOW = "2026-01-01T00:00:00.000Z";

function makeProvider(provider: "codex" | "claudeAgent", enabled: boolean): ServerProvider {
  return {
    provider,
    enabled,
    checkedAt: NOW,
    models: [],
    probe: {
      installed: enabled,
      version: enabled ? "1.0.0" : null,
      status: enabled ? "ok" : "warning",
      auth: { status: enabled ? "ok" : "unknown" },
      message: null,
    },
  } as unknown as ServerProvider;
}

describe("resolveModelSelectionForTurn — passthrough for concrete selections", () => {
  it("returns the original selection unchanged when model is not the auto sentinel", async () => {
    const selection: ModelSelection = {
      provider: "claudeAgent",
      model: "claude-sonnet-4-6",
    };
    const result = await resolveModelSelectionForTurn({
      modelSelection: selection,
      prompt: "anything",
      providers: [makeProvider("claudeAgent", true), makeProvider("codex", true)],
    });
    expect(result.modelSelection).toBe(selection);
    expect(result.decision).toBeNull();
  });
});

describe("resolveModelSelectionForTurn — auto-route sentinel triggers routing", () => {
  it("substitutes a concrete (provider, model) for a multi-file Codex-favored task", async () => {
    const result = await resolveModelSelectionForTurn({
      modelSelection: makeAutoRouteModelSelection(),
      prompt: "Do a repo-wide rename across the codebase — multi-file migration",
      providers: [makeProvider("claudeAgent", true), makeProvider("codex", true)],
      contextHints: { fileCount: 12 },
    });
    expect(result.decision).not.toBeNull();
    expect(result.decision?.source).toBe("heuristic");
    expect(result.modelSelection.provider).toBe("codex");
    expect(result.modelSelection.model.length).toBeGreaterThan(0);
    expect(isAutoRouteSelection(result.modelSelection)).toBe(false);
  });

  it("routes brainstorming to Claude even when Codex is enabled", async () => {
    const result = await resolveModelSelectionForTurn({
      modelSelection: makeAutoRouteModelSelection(),
      prompt: "Brainstorm naming options with me — what do you think?",
      providers: [makeProvider("claudeAgent", true), makeProvider("codex", true)],
    });
    expect(result.modelSelection.provider).toBe("claudeAgent");
  });

  it("falls back to Claude when only Claude is enabled (Codex CLI missing)", async () => {
    const result = await resolveModelSelectionForTurn({
      modelSelection: makeAutoRouteModelSelection(),
      prompt: "Do a repo-wide rename — multi-file refactor",
      providers: [makeProvider("claudeAgent", true), makeProvider("codex", false)],
    });
    expect(result.modelSelection.provider).toBe("claudeAgent");
    expect(result.decision?.reasoning).toContain("rerouted");
  });

  it("synchronous variant returns the same shape and works for previews", () => {
    const result = resolveModelSelectionForTurnSync({
      modelSelection: makeAutoRouteModelSelection(),
      prompt: "fix typo in README",
      providers: [makeProvider("claudeAgent", true), makeProvider("codex", true)],
      contextHints: { fileCount: 1 },
    });
    expect(result.modelSelection.provider).toBe("claudeAgent");
    expect(result.decision?.tier).toBe("mini");
  });
});

describe("makeAutoRouteModelSelection", () => {
  it("produces a passable ModelSelection with the auto sentinel", () => {
    const selection = makeAutoRouteModelSelection();
    expect(selection.model).toBe(AUTOROUTE_MODEL_SLUG);
    expect(isAutoRouteSelection(selection)).toBe(true);
  });

  it("honors the preferred-provider hint for codex", () => {
    const selection = makeAutoRouteModelSelection("codex");
    expect(selection.provider).toBe("codex");
    expect(selection.model).toBe(AUTOROUTE_MODEL_SLUG);
  });
});
