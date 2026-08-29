import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import {
  InMemoryCredentialStore,
  type ImageContent,
} from '@earendil-works/pi-ai';
import {
  createAgentSession,
  DefaultResourceLoader,
  defineTool,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type ToolDefinition,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import {
  InvalidBrandConfigError,
  parseBrandConfig,
  stripJsonFence,
} from './brand-config';
import {
  resolveEditorPolicy,
  type EditorAuthorizationContext,
} from './editor-policy';
import {
  BRAND_INTELLIGENCE_SYSTEM_PROMPT,
  BRAND_CONFIG_REPAIR_SYSTEM_PROMPT,
  BUSINESS_NAMING_SYSTEM_PROMPT,
  INTAKE_INTERVIEW_SYSTEM_PROMPT,
  buildBusinessNamingPrompt,
  buildIntakeInterviewPrompt,
  buildBrandIntelligencePrompt,
  buildBrandConfigRepairPrompt,
  buildFullSiteTask,
  buildInlineEditorPrompt,
  buildPreviewTask,
  buildTemplateSelectionPrompt,
  buildTemplateSelectionRepairPrompt,
  FULL_SITE_CODING_SYSTEM_PROMPT,
  INLINE_GUARDRAILED_EDITOR_SYSTEM_PROMPT,
  PREVIEW_CODING_SYSTEM_PROMPT,
  TEMPLATE_SELECTION_SYSTEM_PROMPT,
  TEMPLATE_SELECTION_REPAIR_SYSTEM_PROMPT,
} from './prompts';
import type { TemplateLibrary } from './template-library-mcp';
import type {
  BrandConfig,
  BusinessIntakePayload,
  InlineEditRequest,
  InlineEditResult,
  ScrapeCorpus,
  TemplateCandidate,
  TemplateSelection,
} from './types';

const MAX_AGENT_FILE_BYTES = 1024 * 1024;
/** Read-only template source inlining for large-context preview models. */
const TEMPLATE_CONTEXT_EXTENSIONS = new Set([
  '.astro', '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.md', '.mdx',
  '.json', '.html', '.svg', '.txt', '.yml', '.yaml',
]);
const MAX_TEMPLATE_CONTEXT_FILE_CHARS = 40_000;
const MAX_TEMPLATE_CONTEXT_FILES = 160;
const MAX_AGENT_OUTPUT_CHARS = 200_000;
const MAX_INLINE_FILE_CHARS = 24_000;
const MAX_TEMPLATE_TREE_ENTRIES = 400;
const MAX_DESIGN_OPTIONS_CHARS = 8_000;

const CONTENT_SOURCE_CANDIDATES = [
  'src/content/site-labels.md',
  'src/content/content.md',
  'src/data/site.ts',
  'src/data/site.json',
] as const;

const STYLE_TOKEN_CANDIDATES = [
  'src/styles/global.css',
  'src/styles/globals.css',
  'src/styles/tokens.css',
  'src/styles/theme.css',
] as const;

const TEMPLATE_TREE_IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  '.astro',
  '.vinxi',
  '.netlify',
]);

/** The outcome of one bounded coding-agent session over an isolated workspace. */
export interface AgentBuildResult {
  summary: string;
  /** Workspace-relative paths the agent actually wrote or edited. */
  changedPaths: string[];
}

/**
 * What a Pi session was doing, in the same vocabulary the main app's LLM
 * wrapper uses for `llm_usage.action`. Derived from the caller, not the role:
 * naming and the intake interview share the cheap `intake` model tier but are
 * separate actions in the ledger.
 */
export type PiUsageAction =
  | 'preview_generate'
  | 'preview_edit'
  | 'intake_interview'
  | 'business_naming';

/** One assistant turn's token usage, normalized for the app's usage ledger. */
export interface PiUsageEvent {
  action: PiUsageAction;
  model: string;
  /** Fresh + cache-read + cache-write prompt tokens. */
  tokensIn: number;
  tokensOut: number;
  /** Subset of `tokensIn` served from the provider's prompt cache. */
  cachedTokens: number;
}

/** Default whole-run token ceiling for one preview build. */
export const DEFAULT_PI_MAX_RUN_TOKENS = 300_000;

/**
 * Thrown when the accumulated token spend of one `PiSdkFlowstarterAgents`
 * instance passes its run cap. The in-flight session is aborted first, so the
 * pipeline stops rather than continuing to burn budget.
 */
export class PiRunBudgetExceededError extends Error {
  readonly name = 'PiRunBudgetExceededError';
  constructor(
    readonly action: PiUsageAction,
    readonly usedTokens: number,
    readonly maxRunTokens: number,
  ) {
    super(
      `Pi run budget exceeded during "${action}": used ${usedTokens} of ${maxRunTokens} tokens for this preview`,
    );
  }
}

export interface PiSdkOptions {
  provider?: string;
  modelId?: string;
  apiKey?: string;
  thinkingLevel?:
    | 'off'
    | 'minimal'
    | 'low'
    | 'medium'
    | 'high'
    | 'xhigh'
    | 'max';
  timeoutMs?: number;
  isolatedAgentDir?: string;
  /**
   * Upper bound on requested completion tokens. Pi defaults to the model's
   * full output window (131k for GLM), which providers reject with a 402 when
   * the remaining account balance cannot cover the worst case. Clamping keeps
   * requests affordable without changing model choice.
   */
  maxOutputTokens?: number;
  /**
   * Fully-specified Pi model definition used verbatim instead of the runtime
   * catalog lookup. Lets brand-new provider models run before Pi's static
   * catalog learns about them; the caller owns the correctness of the shape.
   */
  modelOverride?: Record<string, unknown>;
  /**
   * Per-role overrides. Each agent role can run on its own model tier —
   * e.g. a cheap fast model for the preview coding agent, a stronger model
   * for brand analysis, template selection and full-site builds. Unset roles
   * inherit the top-level options.
   */
  roles?: Partial<Record<PiAgentRole, PiRoleModelChoice>>;
  /**
   * Receives every assistant turn's token usage. The main app pipes this into
   * its `llm_usage` ledger so Pi-driven work is accounted for alongside the
   * Vercel-AI-SDK calls. Failures are swallowed: accounting must never break a
   * build.
   */
  usageSink?: (usage: PiUsageEvent) => void | Promise<void>;
  /**
   * Whole-run token ceiling across every session this instance drives (one
   * instance == one preview). Defaults to
   * {@link DEFAULT_PI_MAX_RUN_TOKENS}; set to 0 to disable.
   */
  maxRunTokens?: number;
}

export type PiAgentRole =
  | 'brand'
  | 'templateSelection'
  | 'preview'
  | 'fullSite'
  | 'inlineEdit'
  /** Short, cheap, conversational turns during intake. */
  | 'intake';

export interface PiRoleModelChoice {
  provider?: string;
  modelId?: string;
  thinkingLevel?: PiSdkOptions['thinkingLevel'];
  timeoutMs?: number;
  maxOutputTokens?: number;
  modelOverride?: Record<string, unknown>;
}

export class PiSdkFlowstarterAgents {
  constructor(private readonly options: PiSdkOptions = {}) {}

  /** Tokens burned so far by this instance, across every session. */
  private runTokensUsed = 0;

  /** Tokens burned so far by this instance (one preview run). */
  get tokensUsed(): number {
    return this.runTokensUsed;
  }

  private get maxRunTokens(): number {
    const configured = this.options.maxRunTokens;
    return configured === undefined ? DEFAULT_PI_MAX_RUN_TOKENS : configured;
  }

  async analyzeBrand(
    intake: BusinessIntakePayload,
    corpus: ScrapeCorpus,
  ): Promise<BrandConfig> {
    if (intake.projectId !== corpus.projectId)
      throw new Error('Intake and corpus project IDs differ');
    const images: ImageContent[] = corpus.images.flatMap((image) =>
      image.base64
        ? [{ type: 'image', data: image.base64, mimeType: image.mediaType }]
        : [],
    );
    const output = await this.runTextSession({
      cwd: tmpdir(),
      systemPrompt: BRAND_INTELLIGENCE_SYSTEM_PROMPT,
      prompt: buildBrandIntelligencePrompt(intake, corpus),
      images,
      tools: [],
      role: 'brand',
      action: 'preview_generate',
    });
    const knownSourceIds = new Set([
      ...corpus.documents.map((document) => document.sourceId),
      ...corpus.images.map((image) => image.sourceId),
    ]);
    try {
      return parseBrandConfig(output, knownSourceIds);
    } catch (error) {
      if (!(error instanceof InvalidBrandConfigError)) throw error;

      const repairedOutput = await this.runTextSession({
        cwd: tmpdir(),
        systemPrompt: BRAND_CONFIG_REPAIR_SYSTEM_PROMPT,
        role: 'brand',
        action: 'preview_generate',
        prompt: buildBrandConfigRepairPrompt({
          candidate: output,
          issues: error.issues.slice(0, 40),
          knownSourceIds: Array.from(knownSourceIds),
        }),
        tools: [],
      });
      return parseBrandConfig(repairedOutput, knownSourceIds);
    }
  }

  async selectTemplate(input: {
    intake: BusinessIntakePayload;
    brandConfig: BrandConfig;
    library: TemplateLibrary;
  }): Promise<TemplateSelection> {
    const discoveredSlugs = new Set<string>();
    let highestRankedCandidate: TemplateCandidate | undefined;
    let searchCalls = 0;
    let detailCalls = 0;

    // Establish the authorized candidate boundary before the model session.
    // This also guarantees a deterministic fallback if a provider emits a bad
    // tool query or malformed final selection. The model must still call its
    // search tool below, so this does not bypass Pi's evidence-based choice.
    const baselineCandidates = await input.library.search(
      [
        input.intake.business.niche,
        input.intake.business.primaryGoal,
        input.brandConfig.voice.adjectives.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .slice(0, 300),
    );
    highestRankedCandidate = baselineCandidates[0];
    for (const candidate of baselineCandidates) {
      discoveredSlugs.add(candidate.slug);
    }

    const searchTool = defineTool({
      name: 'search_flowstarter_templates',
      label: 'Search Flowstarter templates',
      description:
        'Search the approved Flowstarter template library by business fit.',
      parameters: Type.Object({
        query: Type.String({ minLength: 1, maxLength: 300 }),
      }),
      execute: async (_id, params) => {
        if (++searchCalls > 3)
          return toolError('Template search call limit reached');
        const candidates = await input.library.search(params.query);
        highestRankedCandidate ??= candidates[0];
        for (const candidate of candidates) discoveredSlugs.add(candidate.slug);
        return toolText(JSON.stringify({ templates: candidates.slice(0, 12) }));
      },
    });

    const detailsTool = defineTool({
      name: 'get_flowstarter_template_details',
      label: 'Inspect Flowstarter template',
      description:
        'Inspect one template returned by search_flowstarter_templates.',
      parameters: Type.Object({
        slug: Type.String({ pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }),
      }),
      execute: async (_id, params) => {
        if (!discoveredSlugs.has(params.slug))
          return toolError('Inspect only a slug returned by search');
        if (++detailCalls > 4)
          return toolError('Template detail call limit reached');
        const details = JSON.stringify(
          await input.library.getDetails(params.slug),
        );
        return toolText(details.slice(0, 30_000));
      },
    });

    const output = await this.runTextSession({
      cwd: tmpdir(),
      systemPrompt: TEMPLATE_SELECTION_SYSTEM_PROMPT,
      role: 'templateSelection',
      action: 'preview_generate',
      prompt: buildTemplateSelectionPrompt(input),
      customTools: [searchTool, detailsTool],
      tools: [
        'search_flowstarter_templates',
        'get_flowstarter_template_details',
      ],
    });
    if (searchCalls === 0)
      throw new Error('Template selector did not query the approved library');
    try {
      return parseTemplateSelection(output, discoveredSlugs);
    } catch (error) {
      if (discoveredSlugs.size === 0) throw error;
      const repairedOutput = await this.runTextSession({
        cwd: tmpdir(),
        systemPrompt: TEMPLATE_SELECTION_REPAIR_SYSTEM_PROMPT,
        role: 'templateSelection',
        action: 'preview_generate',
        prompt: buildTemplateSelectionRepairPrompt({
          candidate: output,
          allowedSlugs: Array.from(discoveredSlugs),
        }),
        tools: [],
      });
      try {
        return parseTemplateSelection(repairedOutput, discoveredSlugs);
      } catch (repairError) {
        if (!highestRankedCandidate) throw repairError;
        return {
          slug: highestRankedCandidate.slug,
          reason:
            'Highest-ranked approved library result for the Pi agent\'s evidence-based search query.',
          matchedSignals: [
            highestRankedCandidate.category,
            ...highestRankedCandidate.useCase.slice(0, 5),
          ].filter((signal, index, signals) =>
            Boolean(signal) && signals.indexOf(signal) === index
          ),
          confidence: 0.5,
        };
      }
    }
  }

  /**
   * Candidate business names, offered only when the client asks. A client who
   * already has a name does not want a website tool renaming their business,
   * so nothing here runs unprompted.
   */
  async proposeBusinessNames(input: {
    niche: string;
    location: string;
    audience?: string;
    description?: string;
    locale?: string;
    avoid?: readonly string[];
    count?: number;
  }): Promise<Array<{ name: string; rationale: string }>> {
    const raw = await this.runTextSession({
      cwd: tmpdir(),
      tools: [],
      systemPrompt: BUSINESS_NAMING_SYSTEM_PROMPT,
      prompt: buildBusinessNamingPrompt({
        niche: input.niche.slice(0, 240),
        location: input.location.slice(0, 240),
        audience: input.audience?.slice(0, 500),
        description: input.description?.slice(0, 2_000),
        locale: input.locale ?? 'en',
        avoid: (input.avoid ?? []).slice(0, 20),
      }),
      role: 'intake',
      action: 'business_naming',
    });
    const parsed = parseJsonObject(raw, 'naming');
    const names = Array.isArray(parsed.names) ? parsed.names : [];
    const clean = names
      .filter(isRecord)
      .map((entry) => ({
        name: String(entry.name ?? '').trim(),
        rationale: String(entry.rationale ?? '').trim(),
      }))
      // A name that is empty, absurdly long, or carries markup is a model slip
      // rather than a suggestion; drop it instead of showing it to a client.
      .filter(
        (entry) =>
          entry.name.length > 0 &&
          entry.name.length <= 32 &&
          !/[<>{}\\|]/.test(entry.name) &&
          entry.rationale.length > 0,
      )
      .slice(0, input.count ?? 5);
    if (clean.length === 0) {
      throw new Error('Naming agent returned no usable candidates');
    }
    return clean;
  }

  /**
   * One turn of the intake conversation. The form already holds the hard
   * fields; this asks about the things a form answers badly and returns the
   * client's own words as corpus documents the brand agent can cite.
   */
  async interviewIntake(input: {
    known: Record<string, unknown>;
    transcript: ReadonlyArray<{ role: 'agent' | 'client'; text: string }>;
    maxQuestions?: number;
    locale?: string;
  }): Promise<
    | { status: 'ask'; question: string }
    | { status: 'complete'; documents: Array<{ topic: string; text: string }> }
  > {
    const maxQuestions = Math.min(Math.max(input.maxQuestions ?? 6, 1), 12);
    const asked = input.transcript.filter((turn) => turn.role === 'agent').length;
    const raw = await this.runTextSession({
      cwd: tmpdir(),
      tools: [],
      systemPrompt: INTAKE_INTERVIEW_SYSTEM_PROMPT,
      prompt: buildIntakeInterviewPrompt({
        known: input.known,
        transcript: input.transcript
          .slice(-24)
          .map((turn) => ({ role: turn.role, text: turn.text.slice(0, 2_000) })),
        maxQuestions,
        locale: input.locale ?? 'en',
      }),
      role: 'intake',
      action: 'intake_interview',
    });
    const parsed = parseJsonObject(raw, 'intake interview');

    if (parsed.status === 'ask' && asked < maxQuestions) {
      const question = String(parsed.question ?? '').trim();
      if (!question) throw new Error('Intake agent asked an empty question');
      return { status: 'ask', question: question.slice(0, 400) };
    }

    // Either the agent is done, or it wants to keep going past the budget it
    // was given. The cap is the operator's, not the model's, so a run that
    // overshoots is closed out with whatever it has.
    const documents = (Array.isArray(parsed.documents) ? parsed.documents : [])
      .filter(isRecord)
      .map((entry) => ({
        topic: String(entry.topic ?? '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60),
        text: String(entry.text ?? '').trim().slice(0, 1_200),
      }))
      .filter((entry) => entry.topic.length > 0 && entry.text.length > 0)
      .slice(0, 8);
    return { status: 'complete', documents };
  }

  async buildPreview(input: {
    workspaceRoot: string;
    intake: BusinessIntakePayload;
    brandConfig: BrandConfig;
    templateSlug: string;
    cachedAssets: Array<{ sourceId: string; publicPath: string }>;
    templateConfig?: Record<string, unknown>;
    /** Trusted orchestrator validation feedback for a bounded repair pass. */
    feedback?: string;
    /**
     * Inline the entire template source (read-only) into the prompt instead
     * of names-only fileTree. Meant for large-context budget models: the
     * agent sees every component and layout without spending tool calls.
     */
    fullTemplateContext?: boolean;
  }): Promise<AgentBuildResult> {
    const changedPaths = new Set<string>();
    const tools = await createBoundedFileTools(
      input.workspaceRoot,
      'preview',
      (path) => changedPaths.add(path),
    );
    const editablePaths = await probeWorkspaceFiles(
      input.workspaceRoot,
      CONTENT_SOURCE_CANDIDATES,
    );
    if (editablePaths.length === 0) {
      throw new Error('Selected template has no documented editable content source');
    }
    const styleTokenPaths = await probeWorkspaceFiles(
      input.workspaceRoot,
      STYLE_TOKEN_CANDIDATES,
    );
    const fileTree = await listTemplateFiles(input.workspaceRoot);
    const editableFiles = await Promise.all(
      [...editablePaths, ...styleTokenPaths].map((path) =>
        inlineWorkspaceFile(input.workspaceRoot, path),
      ),
    );
    const alreadyInlined = new Set([...editablePaths, ...styleTokenPaths]);
    const templateFiles = input.fullTemplateContext
      ? (
          await Promise.all(
            fileTree
              .filter(
                (path) =>
                  !alreadyInlined.has(path) &&
                  TEMPLATE_CONTEXT_EXTENSIONS.has(
                    path.slice(path.lastIndexOf('.')),
                  ),
              )
              .map((path) => inlineWorkspaceFile(input.workspaceRoot, path)),
          )
        )
          .filter((file) => file.content.length <= MAX_TEMPLATE_CONTEXT_FILE_CHARS)
          .slice(0, MAX_TEMPLATE_CONTEXT_FILES)
      : undefined;
    const summary = await this.runTextSession({
      cwd: input.workspaceRoot,
      systemPrompt: PREVIEW_CODING_SYSTEM_PROMPT,
      prompt: buildPreviewTask({
        intake: input.intake,
        brandConfig: input.brandConfig,
        templateSlug: input.templateSlug,
        cachedAssets: input.cachedAssets,
        editablePaths,
        styleTokenPaths,
        fileTree,
        editableFiles,
        templateFiles,
        designOptions: extractDesignOptions(input.templateConfig),
        assetLibrary: extractAssetLibrary(input.templateConfig),
        feedback: input.feedback,
      }),
      customTools: tools,
      tools: tools.map((tool) => tool.name),
      role: 'preview',
      action: 'preview_generate',
    });
    return { summary, changedPaths: Array.from(changedPaths) };
  }

  async buildFullSite(input: {
    workspaceRoot: string;
    projectId: string;
    intake: BusinessIntakePayload;
    brandConfig: BrandConfig;
    requiredIntegrations: string[];
  }): Promise<AgentBuildResult> {
    const changedPaths = new Set<string>();
    const tools = await createBoundedFileTools(
      input.workspaceRoot,
      'full',
      (path) => changedPaths.add(path),
    );
    const summary = await this.runTextSession({
      cwd: input.workspaceRoot,
      systemPrompt: FULL_SITE_CODING_SYSTEM_PROMPT,
      prompt: buildFullSiteTask(input),
      customTools: tools,
      tools: tools.map((tool) => tool.name),
      role: 'fullSite',
      action: 'preview_generate',
    });
    return { summary, changedPaths: Array.from(changedPaths) };
  }

  async editInline(
    request: InlineEditRequest,
    authorization: EditorAuthorizationContext,
  ): Promise<InlineEditResult> {
    const policy = resolveEditorPolicy(authorization, 'content');
    if (policy.action !== 'inline_content_agent') {
      throw new Error(`Inline editor access denied: ${policy.reason}`);
    }
    if (authorization.actorId !== request.requestedBy) {
      throw new Error('Inline editor actor mismatch');
    }
    let toolCalls = 0;
    let result: InlineEditResult | undefined;
    const modifyTool = defineTool({
      name: 'modify_element_content',
      label: 'Modify element content',
      description:
        'Return one plain-text replacement for the exact authorized element.',
      parameters: Type.Object({
        targetId: Type.String({ minLength: 1, maxLength: 160 }),
        replacementContent: Type.String({ maxLength: 5_000 }),
      }),
      execute: async (_id, params) => {
        toolCalls++;
        if (toolCalls > 1)
          return toolError('Only one content modification is permitted');
        if (params.targetId !== request.targetId)
          return toolError('Target identifier mismatch');
        assertSafeInlineContent(params.replacementContent);
        result = {
          targetId: request.targetId,
          originalContent: request.originalContent,
          replacementContent: params.replacementContent,
        };
        return toolText('Localized content replacement accepted');
      },
    });

    await this.runTextSession({
      cwd: tmpdir(),
      systemPrompt: INLINE_GUARDRAILED_EDITOR_SYSTEM_PROMPT,
      prompt: buildInlineEditorPrompt(request),
      customTools: [modifyTool],
      tools: ['modify_element_content'],
      role: 'inlineEdit',
      action: 'preview_edit',
    });
    if (toolCalls !== 1 || !result)
      throw new Error('Inline editor did not produce exactly one valid change');
    return result;
  }

  private resolveRole(role: PiAgentRole): Required<Pick<PiSdkOptions, never>> &
    Pick<PiSdkOptions, 'provider' | 'modelId' | 'thinkingLevel' | 'timeoutMs' | 'maxOutputTokens' | 'modelOverride'> {
    const base = this.options;
    const override = base.roles?.[role] ?? {};
    return {
      provider: override.provider ?? base.provider,
      modelId: override.modelId ?? base.modelId,
      thinkingLevel: override.thinkingLevel ?? base.thinkingLevel,
      timeoutMs: override.timeoutMs ?? base.timeoutMs,
      maxOutputTokens: override.maxOutputTokens ?? base.maxOutputTokens,
      // A role override with its own modelId must not inherit the base
      // modelOverride object, which would silently pin the base model.
      modelOverride:
        override.modelOverride ??
        (override.modelId ? undefined : base.modelOverride),
    };
  }

  private async runTextSession(input: {
    cwd: string;
    systemPrompt: string;
    prompt: string;
    images?: ImageContent[];
    customTools?: ToolDefinition[];
    tools: string[];
    role?: PiAgentRole;
    /** Ledger action for this session's usage. */
    action: PiUsageAction;
  }): Promise<string> {
    const cfg = input.role ? this.resolveRole(input.role) : this.options;
    const agentDir =
      this.options.isolatedAgentDir ??
      resolve(tmpdir(), 'flowstarter-pi-isolated');
    await mkdir(agentDir, { recursive: true, mode: 0o700 });
    const settingsManager = SettingsManager.inMemory({
      compaction: { enabled: false },
      retry: { enabled: true, maxRetries: 2 },
    });
    const loader = new DefaultResourceLoader({
      cwd: input.cwd,
      agentDir,
      settingsManager,
      noExtensions: true,
      noSkills: true,
      noPromptTemplates: true,
      noThemes: true,
      noContextFiles: true,
      systemPromptOverride: () => input.systemPrompt,
    });
    await loader.reload();

    const modelRuntime = await ModelRuntime.create({
      credentials: new InMemoryCredentialStore(),
      allowModelNetwork: false,
      refreshOnCreate: false,
    });
    if (this.options.apiKey) {
      const provider = cfg.provider ?? this.options.provider;
      if (!provider)
        throw new Error('Pi provider is required when apiKey is supplied');
      await modelRuntime.setRuntimeApiKey(provider, this.options.apiKey);
    }
    const resolvedModel = cfg.modelOverride
      ? (cfg.modelOverride as unknown as ReturnType<ModelRuntime['getModel']>)
      : cfg.provider && cfg.modelId
        ? modelRuntime.getModel(cfg.provider, cfg.modelId)
        : undefined;
    const model =
      resolvedModel && cfg.maxOutputTokens
        ? {
            ...resolvedModel,
            maxTokens: Math.min(
              resolvedModel.maxTokens ?? cfg.maxOutputTokens,
              cfg.maxOutputTokens,
            ),
          }
        : resolvedModel;
    if (cfg.provider && cfg.modelId && !model && !cfg.modelOverride) {
      throw new Error(
        `Unknown Pi model ${cfg.provider}/${cfg.modelId}`,
      );
    }

    const { session } = await createAgentSession({
      cwd: input.cwd,
      agentDir,
      model,
      modelRuntime,
      thinkingLevel: cfg.thinkingLevel ?? 'medium',
      tools: input.tools,
      customTools: input.customTools,
      resourceLoader: loader,
      sessionManager: SessionManager.inMemory(input.cwd),
      settingsManager,
    });
    if (!session.model) {
      session.dispose();
      throw new Error('No authenticated Pi model is available');
    }

    let output = '';
    let sessionError: string | undefined;
    let budgetExceeded = false;
    const maxRunTokens = this.maxRunTokens;
    const unsubscribe = session.subscribe((event) => {
      if (
        event.type === 'message_update' &&
        event.assistantMessageEvent.type === 'text_delta'
      ) {
        output += event.assistantMessageEvent.delta;
        if (output.length > MAX_AGENT_OUTPUT_CHARS) void session.abort();
      }
      // Providers report failures (quota, auth, model errors) as an assistant
      // message with stopReason 'error'. Without capturing it here the caller
      // receives an empty string and a misleading downstream parse failure.
      if (event.type === 'message_end') {
        const message = event.message as {
          role?: string;
          stopReason?: string;
          errorMessage?: string;
          model?: string;
          usage?: PiRawUsage;
        };
        if (message?.role !== 'assistant') return;
        if (message.stopReason === 'error') {
          sessionError = message.errorMessage ?? 'unknown provider error';
        }
        if (!message.usage) return;

        // Accounting + the run cap. Every assistant turn counts, including the
        // ones that only called tools, because every turn re-sends the context.
        const usage = normalizePiUsage(message.usage);
        this.runTokensUsed += usage.totalTokens;
        const sink = this.options.usageSink;
        if (sink) {
          try {
            void Promise.resolve(
              sink({
                action: input.action,
                model: message.model ?? cfg.modelId ?? 'unknown',
                tokensIn: usage.tokensIn,
                tokensOut: usage.tokensOut,
                cachedTokens: usage.cachedTokens,
              }),
            ).catch(() => {
              /* accounting is best-effort */
            });
          } catch {
            /* accounting is best-effort */
          }
        }
        if (maxRunTokens > 0 && this.runTokensUsed > maxRunTokens) {
          budgetExceeded = true;
          void session.abort();
        }
      }
    });

    const timeoutMs = cfg.timeoutMs ?? 180_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        session.prompt(input.prompt, {
          images: input.images,
          expandPromptTemplates: false,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            void session.abort();
            reject(new Error(`Pi agent timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
      if (budgetExceeded) {
        throw new PiRunBudgetExceededError(
          input.action,
          this.runTokensUsed,
          maxRunTokens,
        );
      }
      if (sessionError) {
        throw new Error(`Pi session failed: ${sessionError.slice(0, 500)}`);
      }
      if (output.length > MAX_AGENT_OUTPUT_CHARS)
        throw new Error('Pi agent output exceeded limit');
      return output.trim();
    } finally {
      if (timer) clearTimeout(timer);
      unsubscribe();
      session.dispose();
    }
  }
}

/** Pi's per-turn token accounting, as reported on an assistant message. */
interface PiRawUsage {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  totalTokens?: number;
}

function positive(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}

/**
 * Pi splits prompt tokens into fresh / cache-read / cache-write. The ledger
 * wants one `tokens_in` (everything the prompt cost) plus the cached subset,
 * so cache reads and writes are folded back into the input total.
 */
export function normalizePiUsage(usage: PiRawUsage | undefined): {
  tokensIn: number;
  tokensOut: number;
  cachedTokens: number;
  totalTokens: number;
} {
  const cachedTokens = positive(usage?.cacheRead);
  const tokensIn =
    positive(usage?.input) + cachedTokens + positive(usage?.cacheWrite);
  const tokensOut = positive(usage?.output);
  return {
    tokensIn,
    tokensOut,
    cachedTokens,
    totalTokens: positive(usage?.totalTokens) || tokensIn + tokensOut,
  };
}

type FileTool = ToolDefinition;
type FileMode = 'preview' | 'full';

export async function createBoundedFileTools(
  root: string,
  mode: FileMode,
  onMutate?: (path: string) => void,
): Promise<FileTool[]> {
  const canonicalRoot = await realpath(root);

  const readTool = defineTool({
    name: 'read_file',
    label: 'Read workspace file',
    description: 'Read one UTF-8 text file inside the isolated site workspace.',
    parameters: Type.Object({
      path: Type.String({ minLength: 1, maxLength: 300 }),
    }),
    execute: async (_id, params) => {
      const path = await resolveBoundedPath(canonicalRoot, params.path, true);
      const info = await stat(path);
      if (!info.isFile() || info.size > MAX_AGENT_FILE_BYTES)
        return toolError('File is not readable text');
      const content = await readFile(path, 'utf8');
      if (content.includes('\0'))
        return toolError('Binary files are not readable');
      return toolText(content);
    },
  });

  const writeTool = defineTool({
    name: 'write_file',
    label: 'Write workspace file',
    description:
      'Write one authorized UTF-8 source/content file inside the isolated site workspace.',
    parameters: Type.Object({
      path: Type.String({ minLength: 1, maxLength: 300 }),
      content: Type.String({ maxLength: MAX_AGENT_FILE_BYTES }),
    }),
    execute: async (_id, params) => {
      assertMutableAgentPath(params.path, mode);
      const path = await resolveBoundedPath(canonicalRoot, params.path, false);
      await mkdir(resolve(path, '..'), { recursive: true });
      await writeFile(path, params.content, {
        encoding: 'utf8',
        flag: 'w',
        mode: 0o644,
      });
      onMutate?.(params.path);
      return toolText(
        `Wrote ${Buffer.byteLength(params.content, 'utf8')} bytes`,
      );
    },
  });

  const editTool = defineTool({
    name: 'edit_file',
    label: 'Edit workspace file',
    description:
      'Replace one exact unique text fragment in an authorized workspace file.',
    parameters: Type.Object({
      path: Type.String({ minLength: 1, maxLength: 300 }),
      oldText: Type.String({ minLength: 1, maxLength: MAX_AGENT_FILE_BYTES }),
      newText: Type.String({ maxLength: MAX_AGENT_FILE_BYTES }),
    }),
    execute: async (_id, params) => {
      assertMutableAgentPath(params.path, mode);
      const path = await resolveBoundedPath(canonicalRoot, params.path, true);
      const content = await readFile(path, 'utf8');
      const first = content.indexOf(params.oldText);
      if (first < 0) return toolError('oldText was not found');
      if (content.indexOf(params.oldText, first + params.oldText.length) >= 0) {
        return toolError(
          'oldText is not unique; provide a larger exact fragment',
        );
      }
      const updated = `${content.slice(0, first)}${params.newText}${content.slice(
        first + params.oldText.length,
      )}`;
      if (Buffer.byteLength(updated, 'utf8') > MAX_AGENT_FILE_BYTES)
        return toolError('Edited file is too large');
      await writeFile(path, updated, 'utf8');
      onMutate?.(params.path);
      return toolText('Applied one exact replacement');
    },
  });

  return [readTool, writeTool, editTool];
}

async function resolveBoundedPath(
  root: string,
  input: string,
  mustExist: boolean,
): Promise<string> {
  if (
    isAbsolute(input) ||
    input.includes('\\') ||
    input
      .split('/')
      .some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error('Only normalized relative workspace paths are allowed');
  }
  const candidate = resolve(root, input);
  assertContained(root, candidate);
  if (mustExist) {
    const target = await realpath(candidate);
    assertContained(root, target);
    return target;
  }

  let ancestor = candidate;
  while (ancestor !== root) {
    try {
      const info = await lstat(ancestor);
      if (info.isSymbolicLink())
        throw new Error('Symbolic-link writes are not allowed');
      const target = await realpath(ancestor);
      assertContained(root, target);
      break;
    } catch (error) {
      if (isMissingPathError(error)) {
        ancestor = resolve(ancestor, '..');
        continue;
      }
      throw error;
    }
  }
  return candidate;
}

function assertContained(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('Path escapes the isolated workspace');
  }
}

function assertMutableAgentPath(path: string, mode: FileMode): void {
  const normalized = path.toLowerCase();
  const segments = normalized.split('/');
  const basename = segments.at(-1) ?? '';
  const alwaysDenied =
    segments.includes('.git') ||
    segments.includes('node_modules') ||
    segments.includes('dist') ||
    segments.includes('.astro') ||
    basename === 'package.json' ||
    basename.includes('lock') ||
    basename.startsWith('.env') ||
    basename.includes('secret') ||
    basename.includes('credential') ||
    basename === 'astro.config.mjs' ||
    basename === 'astro.config.js' ||
    basename.startsWith('vite.config') ||
    basename.startsWith('next.config') ||
    segments.includes('.github');
  if (alwaysDenied)
    throw new Error('This path is immutable for the coding agent');

  if (mode === 'preview') {
    const allowed =
      normalized.startsWith('src/content/') ||
      normalized.startsWith('src/data/') ||
      normalized.startsWith('src/styles/') ||
      normalized.startsWith('public/flowstarter-assets/') ||
      normalized.endsWith('.md') ||
      normalized.endsWith('.mdx');
    if (!allowed)
      throw new Error(
        'Preview agent may edit only content, data, style-token, and cached-asset files',
      );
  }
}

async function probeWorkspaceFiles(
  root: string,
  candidates: readonly string[],
): Promise<string[]> {
  const found: string[] = [];
  for (const path of candidates) {
    try {
      const info = await stat(resolve(root, path));
      if (info.isFile()) found.push(path);
    } catch (error) {
      if (!isMissingPathError(error)) throw error;
    }
  }
  return found;
}

/** Bounded, dependency-free file listing so the agent knows the template's real shape. */
async function listTemplateFiles(root: string): Promise<string[]> {
  const entries: string[] = [];
  const walk = async (directory: string, prefix: string): Promise<void> => {
    if (entries.length >= MAX_TEMPLATE_TREE_ENTRIES) return;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entries.length >= MAX_TEMPLATE_TREE_ENTRIES) return;
      if (entry.name.startsWith('.') && entry.isDirectory()) continue;
      if (TEMPLATE_TREE_IGNORED_DIRECTORIES.has(entry.name)) continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(resolve(directory, entry.name), relativePath);
      } else if (entry.isFile()) {
        entries.push(relativePath);
      }
    }
  };
  await walk(root, '');
  return entries.sort();
}

async function inlineWorkspaceFile(
  root: string,
  path: string,
): Promise<{ path: string; content: string; truncated?: boolean }> {
  const content = await readFile(resolve(root, path), 'utf8');
  if (content.length <= MAX_INLINE_FILE_CHARS) return { path, content };
  return {
    path,
    content: content.slice(0, MAX_INLINE_FILE_CHARS),
    truncated: true,
  };
}

/** Project only the curated design choices out of an untrusted template config. */
function extractDesignOptions(
  config: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!isRecord(config)) return undefined;
  const options: Record<string, unknown> = {};
  if (Array.isArray(config.palettes)) options.palettes = config.palettes;
  if (Array.isArray(config.fonts)) options.fonts = config.fonts;
  if (Object.keys(options).length === 0) return undefined;
  if (JSON.stringify(options).length > MAX_DESIGN_OPTIONS_CHARS) {
    return undefined;
  }
  return options;
}

/**
 * The template's curated artwork manifest: honest descriptions of each
 * shipped image so a text-only agent can pick fitting art. Trusted template
 * metadata, size-bounded like designOptions.
 */
function extractAssetLibrary(
  config: Record<string, unknown> | undefined,
): Array<Record<string, unknown>> | undefined {
  if (!isRecord(config) || !Array.isArray(config.assetLibrary)) return undefined;
  const entries = config.assetLibrary.filter(
    (entry): entry is Record<string, unknown> =>
      isRecord(entry) &&
      typeof entry.path === 'string' &&
      typeof entry.description === 'string',
  );
  if (entries.length === 0) return undefined;
  if (JSON.stringify(entries).length > MAX_DESIGN_OPTIONS_CHARS) return undefined;
  return entries;
}

function parseTemplateSelection(
  raw: string,
  discoveredSlugs: ReadonlySet<string>,
): TemplateSelection {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Template selector returned invalid JSON');
  }
  if (!isRecord(value)) throw new Error('Template selection must be an object');
  const keys = Object.keys(value).sort().join(',');
  if (keys !== 'confidence,matchedSignals,reason,slug')
    throw new Error('Template selection has invalid keys');
  if (typeof value.slug !== 'string' || !discoveredSlugs.has(value.slug)) {
    throw new Error(
      'Template selector chose a slug that was not returned by the library',
    );
  }
  if (
    typeof value.reason !== 'string' ||
    value.reason.length === 0 ||
    value.reason.length > 500
  ) {
    throw new Error('Template selection reason is invalid');
  }
  if (
    !Array.isArray(value.matchedSignals) ||
    value.matchedSignals.length === 0 ||
    value.matchedSignals.length > 12 ||
    value.matchedSignals.some(
      (signal) => typeof signal !== 'string' || signal.length > 120,
    )
  ) {
    throw new Error('Template matchedSignals are invalid');
  }
  if (
    typeof value.confidence !== 'number' ||
    value.confidence < 0 ||
    value.confidence > 1
  ) {
    throw new Error('Template confidence is invalid');
  }
  return value as unknown as TemplateSelection;
}

function assertSafeInlineContent(content: string): void {
  if (
    content.includes('<') ||
    content.includes('>') ||
    content.includes('```') ||
    /data-flowstarter-id/i.test(content) ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(content)
  ) {
    throw new Error('Inline replacement must be safe plain text');
  }
}

function toolText(text: string) {
  return { content: [{ type: 'text' as const, text }], details: {} };
}

function toolError(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    details: {},
    isError: true,
  };
}

function isMissingPathError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}


/**
 * Parses one JSON object from a model turn. Providers still wrap JSON in a
 * fence now and then; anything else is a contract violation worth naming.
 */
function parseJsonObject(raw: string, label: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(stripJsonFence(raw));
  } catch {
    throw new Error(`${label} agent did not return JSON`);
  }
  if (!isRecord(value)) throw new Error(`${label} agent did not return an object`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
