import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AgentActivityEvent, SiteGenerationInput, GeneratedFile } from '../../services/claude-agent/types';

// Mock the Claude Agent SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock fs/promises
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('file content'),
    readdir: vi.fn().mockResolvedValue([]),
    rm: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../postProcessAstro', () => ({
  fixContentImports: vi.fn((files: GeneratedFile[]) => files),
}));

vi.mock('../templateIndex', () => ({
  buildTemplateIndex: vi.fn(() => 'template index summary'),
}));

// Mock cost tracker
vi.mock('~/lib/.server/llm/cost-tracker', () => ({
  trackLLMUsage: vi.fn(),
  syncCostsToSupabase: vi.fn().mockResolvedValue(undefined),
}));

describe('agentPipeline', () => {
  const baseInput: SiteGenerationInput = {
    projectId: 'test-123',
    siteName: 'Test Dental',
    businessInfo: {
      name: 'Test Dental',
      description: 'A dental clinic',
      services: ['Cleaning', 'Fillings'],
      contact: { email: 'test@dental.ro', phone: '+40721234567' },
    },
    template: { slug: 'coach-pro', name: 'Coach Pro' },
    design: { primaryColor: '#059669' },
  };

  const templateFiles: GeneratedFile[] = [
    { path: 'src/pages/index.astro', content: '<html></html>' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('checks ANTHROPIC_API_KEY for availability', async () => {
    const { isAgentPipelineAvailable } = await import('../agentPipeline.server');
    expect(isAgentPipelineAvailable()).toBe(true);

    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAgentPipelineAvailable()).toBe(false);
    process.env.ANTHROPIC_API_KEY = saved;
  });

  it('returns false when AGENTS_SDK_ENABLED is false', async () => {
    process.env.AGENTS_SDK_ENABLED = 'false';
    const { isAgentPipelineAvailable } = await import('../agentPipeline.server');
    expect(isAgentPipelineAvailable()).toBe(false);
    delete process.env.AGENTS_SDK_ENABLED;
  });

  it('runs dry run in test environment and emits done event', async () => {
    const events: AgentActivityEvent[] = [];
    const input = { ...baseInput, onAgentEvent: (e: AgentActivityEvent) => events.push(e) };

    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(input, templateFiles);

    expect(result.success).toBe(true);
    expect(result.files?.length ?? 0).toBeGreaterThan(0);

    const types = events.map(e => e.type);
    expect(types).toContain('text'); // progress messages
    expect(types).toContain('done');

    const doneEvent = events.find(e => e.type === 'done') as Extract<AgentActivityEvent, { type: 'done' }>;
    expect(doneEvent).toBeDefined();
    expect(doneEvent.turns).toBe(0); // dry run = 0 turns
  });

  it('returns zero cost in dry run mode', async () => {
    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(baseInput, templateFiles);

    expect(result.cost).toBeDefined();
    expect(result.cost!.totalCostUSD).toBe(0);
  });

  it('returns template files in dry run mode', async () => {
    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(baseInput, templateFiles);

    expect(result.success).toBe(true);
    expect(result.files?.length).toBe(templateFiles.length);
    expect(result.files?.[0]?.path).toBe('src/pages/index.astro');
  });

  it('handles missing onAgentEvent gracefully', async () => {
    const { runAgentPipeline } = await import('../agentPipeline.server');
    // Should not throw when no event handler provided
    const result = await runAgentPipeline(baseInput, templateFiles);
    expect(result.success).toBe(true);
  });
});
