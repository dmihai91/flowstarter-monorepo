import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AgentActivityEvent, SiteGenerationInput, GeneratedFile } from '../../services/claude-agent/types';

// Mock Anthropic
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(public config: Record<string, unknown>) {}
    },
  };
});

// Mock fs/promises with importOriginal
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

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
    const fs = await import('fs/promises');
    (fs.readdir as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('checks OPEN_ROUTER_API_KEY for availability', async () => {
    const { isAgentPipelineAvailable } = await import('../agentPipeline.server');
    expect(isAgentPipelineAvailable()).toBe(true);
    const saved = process.env.OPEN_ROUTER_API_KEY;
    delete process.env.OPEN_ROUTER_API_KEY;
    expect(isAgentPipelineAvailable()).toBe(false);
    process.env.OPEN_ROUTER_API_KEY = saved;
  });

  it('returns false when AGENTS_SDK_ENABLED is false', async () => {
    process.env.AGENTS_SDK_ENABLED = 'false';
    const { isAgentPipelineAvailable } = await import('../agentPipeline.server');
    expect(isAgentPipelineAvailable()).toBe(false);
    delete process.env.AGENTS_SDK_ENABLED;
  });

  it('emits thinking, tool_call, file_write, and done events', async () => {
    const events: AgentActivityEvent[] = [];
    const input = { ...baseInput, onAgentEvent: (e: AgentActivityEvent) => events.push(e) };

    mockCreate
      .mockResolvedValueOnce({
        content: [
          { type: 'thinking', thinking: 'Planning website' },
          { type: 'tool_use', id: 'tu1', name: 'write_file', input: { path: 'index.astro', content: '<html/>' } },
        ],
        usage: { input_tokens: 1000, output_tokens: 500 },
      })
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Done.' }],
        usage: { input_tokens: 800, output_tokens: 100 },
      });

    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(input, templateFiles);
    expect(result.success).toBe(true);

    const types = events.map(e => e.type);
    expect(types).toContain('thinking');
    expect(types).toContain('tool_call');
    expect(types).toContain('file_write');
    expect(types).toContain('done');

    const doneEvent = events.find(e => e.type === 'done') as Extract<AgentActivityEvent, { type: 'done' }>;
    expect(doneEvent.cost_usd).toBeGreaterThan(0);
    expect(doneEvent.turns).toBe(2);
  });

  it('returns cost breakdown with model info', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Done.' }],
      usage: { input_tokens: 5000, output_tokens: 2000 },
    });

    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(baseInput, templateFiles);

    expect(result.cost).toBeDefined();
    expect(result.cost!.totalCostUSD).toBeGreaterThan(0);
    expect(result.cost!.breakdown[0].model).toBe('anthropic/claude-sonnet-4-6');
  });

  it('handles API errors gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit'));
    const events: AgentActivityEvent[] = [];
    const input = { ...baseInput, onAgentEvent: (e: AgentActivityEvent) => events.push(e) };

    const { runAgentPipeline } = await import('../agentPipeline.server');
    const result = await runAgentPipeline(input, templateFiles);

    expect(result.success).toBe(false);
    expect(result.error).toContain('API rate limit');
    expect(events.some(e => e.type === 'error')).toBe(true);
  });

  it('uses prompt caching with cache_control', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Done.' }],
      usage: { input_tokens: 1000, output_tokens: 100, cache_read_input_tokens: 500, cache_creation_input_tokens: 200 },
    });

    const { runAgentPipeline } = await import('../agentPipeline.server');
    await runAgentPipeline(baseInput, templateFiles);

    const call = mockCreate.mock.calls[0][0];
    expect(call.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(call.messages[0].content[0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('passes correct model to Anthropic SDK', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Done.' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const { runAgentPipeline } = await import('../agentPipeline.server');
    await runAgentPipeline(baseInput, templateFiles);

    expect(mockCreate.mock.calls[0][0].model).toBe('anthropic/claude-sonnet-4-6');
  });
});
