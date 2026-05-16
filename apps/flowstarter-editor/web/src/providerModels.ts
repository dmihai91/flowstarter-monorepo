import {
  DEFAULT_MODEL_BY_PROVIDER,
  type ModelCapabilities,
  type ProviderKind,
  type ServerProvider,
  type ServerProviderModel,
} from "@flowstarter/editor-contracts";
import { normalizeModelSlug } from "@flowstarter/editor-shared/model";

/**
 * Sentinel stored in composer draft / thread UI meaning "use the server's default
 * Claude catalog pick", resolved client-side to a concrete slug before RPC.
 * Default target is {@link DEFAULT_MODEL_BY_PROVIDER}.claudeAgent (`claude-sonnet-4-6`)
 * unless the live provider snapshot lists a different first non-custom model.
 */
export const CLAUDE_EDITOR_AUTO_MODEL_SLUG = "auto";

const EMPTY_CAPABILITIES: ModelCapabilities = {
  reasoningEffortLevels: [],
  supportsFastMode: false,
  supportsThinkingToggle: false,
  contextWindowOptions: [],
  promptInjectedEffortLevels: [],
};

export function getProviderModels(
  providers: ReadonlyArray<ServerProvider>,
  provider: ProviderKind,
): ReadonlyArray<ServerProviderModel> {
  return providers.find((candidate) => candidate.provider === provider)?.models ?? [];
}

export function getProviderSnapshot(
  providers: ReadonlyArray<ServerProvider>,
  provider: ProviderKind,
): ServerProvider | undefined {
  return providers.find((candidate) => candidate.provider === provider);
}

export function isProviderEnabled(
  providers: ReadonlyArray<ServerProvider>,
  provider: ProviderKind,
): boolean {
  return getProviderSnapshot(providers, provider)?.enabled ?? true;
}

export function resolveSelectableProvider(
  providers: ReadonlyArray<ServerProvider>,
  provider: ProviderKind | null | undefined,
): ProviderKind {
  // Both providers ship in Flowstarter Editor. Default to Claude when the
  // caller hasn't expressed a preference; fall back to whichever provider
  // the server reports as currently enabled.
  const requested = provider ?? "claudeAgent";
  if (isProviderEnabled(providers, requested)) {
    return requested;
  }
  return providers.find((candidate) => candidate.enabled)?.provider ?? requested;
}

export function getProviderModelCapabilities(
  models: ReadonlyArray<ServerProviderModel>,
  model: string | null | undefined,
  provider: ProviderKind,
): ModelCapabilities {
  const slug = normalizeModelSlug(model, provider);
  return models.find((candidate) => candidate.slug === slug)?.capabilities ?? EMPTY_CAPABILITIES;
}

export function getDefaultServerModel(
  providers: ReadonlyArray<ServerProvider>,
  provider: ProviderKind,
): string {
  const models = getProviderModels(providers, provider);
  return (
    models.find((model) => !model.isCustom)?.slug ??
    models[0]?.slug ??
    DEFAULT_MODEL_BY_PROVIDER[provider]
  );
}

/** Catalog rows that belong in the Flowstarter Claude picker (drops stray non-Claude slugs). */
export function isClaudeEditorCatalogSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  return s.startsWith("claude-") || s.startsWith("claude/");
}

export function filterClaudeEditorCatalogModels(
  models: ReadonlyArray<ServerProviderModel>,
): ServerProviderModel[] {
  return models.filter((model) => isClaudeEditorCatalogSlug(model.slug));
}

export function resolveClaudeEditorModelForTurn(
  model: string,
  providers: ReadonlyArray<ServerProvider>,
): string {
  if (model.trim() === CLAUDE_EDITOR_AUTO_MODEL_SLUG) {
    return getDefaultServerModel(providers, "claudeAgent");
  }
  return model;
}
