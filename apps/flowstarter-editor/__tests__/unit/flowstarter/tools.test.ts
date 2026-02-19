/**
 * Flowstarter Tools Unit Tests
 *
 * Tests for the Flowstarter tools:
 * - SearchTool: Tavily-based web search
 * - SelfHealingTool: Three-tier error fixing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SearchTool,
  getSearchTool,
  resetSearchTool,
  type SearchInput,
  type SearchOutput,
} from '~/lib/flowstarter/tools/search-tool';
import {
  SelfHealingTool,
  getSelfHealingTool,
  resetSelfHealingTool,
  type SelfHealingInput,
  type SelfHealingOutput,
} from '~/lib/flowstarter/tools/self-healing-tool';

// Mock fetch for SearchTool
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock LLM service for SelfHealingTool
vi.mock('~/lib/services/llm', () => ({
  generateJSON: vi.fn(),
}));

// Mock logger
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { generateJSON } from '~/lib/services/llm';
const mockedGenerateJSON = vi.mocked(generateJSON);

describe('Flowstarter Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSearchTool();
    resetSelfHealingTool();
    // Set env variable for tests
    process.env.TAVILY_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    resetSearchTool();
    resetSelfHealingTool();
  });

  // ============================================================================
  // SearchTool Tests
  // ============================================================================

  describe('SearchTool', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const tool1 = getSearchTool();
        const tool2 = getSearchTool();
        expect(tool1).toBe(tool2);
      });

      it('should create new instance after reset', () => {
        const tool1 = getSearchTool();
        resetSearchTool();
        const tool2 = getSearchTool();
        expect(tool1).not.toBe(tool2);
      });
    });

    describe('Tool Configuration', () => {
      it('should have correct name', () => {
        const tool = new SearchTool('test-key');
        expect(tool.getConfig().name).toBe('search');
      });

      it('should have correct version', () => {
        const tool = new SearchTool('test-key');
        expect(tool.getConfig().version).toBe('1.0.0');
      });

      it('should be cacheable', () => {
        const tool = new SearchTool('test-key');
        expect(tool.getConfig().cacheable).toBe(true);
      });

      it('should require network', () => {
        const tool = new SearchTool('test-key');
        expect(tool.getConfig().requiresNetwork).toBe(true);
      });
    });

    describe('Input Validation', () => {
      it('should reject empty query', async () => {
        const tool = new SearchTool('test-key');
        const result = await tool.run({ query: '' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Query is required');
      });

      it('should reject query over 400 characters', async () => {
        const tool = new SearchTool('test-key');
        const longQuery = 'a'.repeat(401);
        const result = await tool.run({ query: longQuery });

        expect(result.success).toBe(false);
        expect(result.error).toContain('400 characters');
      });

      it('should reject maxResults outside range', async () => {
        const tool = new SearchTool('test-key');
        const result = await tool.run({ query: 'test', maxResults: 25 });

        expect(result.success).toBe(false);
        expect(result.error).toContain('between 1 and 20');
      });

      it('should reject when API key is not configured', async () => {
        delete process.env.TAVILY_API_KEY;
        resetSearchTool();
        const tool = new SearchTool(); // No API key

        const result = await tool.run({ query: 'test' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('TAVILY_API_KEY');
      });
    });

    describe('Search Execution', () => {
      it('should call Tavily API with correct parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'test query',
              results: [
                { title: 'Result 1', url: 'https://example.com', content: 'Test content', score: 0.9 },
              ],
              response_time: 0.5,
            }),
        });

        const tool = new SearchTool('test-key');
        const result = await tool.run({
          query: 'test query',
          searchDepth: 'advanced',
          maxResults: 10,
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.tavily.com/search',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.query).toBe('test query');
        expect(body.search_depth).toBe('advanced');
        expect(body.max_results).toBe(10);
      });

      it('should return search results', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'test',
              results: [
                {
                  title: 'How to fix React error',
                  url: 'https://stackoverflow.com/q/123',
                  content: 'The solution is to...',
                  score: 0.95,
                },
              ],
              answer: 'You can fix this by...',
              response_time: 0.3,
            }),
        });

        const tool = new SearchTool('test-key');
        const result = await tool.run({
          query: 'React error fix',
          includeAnswer: true,
        });

        expect(result.success).toBe(true);
        expect(result.data?.results).toHaveLength(1);
        expect(result.data?.results[0].title).toBe('How to fix React error');
        expect(result.data?.answer).toBe('You can fix this by...');
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Invalid API key'),
        });

        const tool = new SearchTool('test-key');
        const result = await tool.run({ query: 'test' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Tavily API error');
      });
    });

    describe('Convenience Methods', () => {
      beforeEach(() => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'test',
              results: [{ title: 'Fix', url: 'https://so.com', content: 'Solution', score: 0.8 }],
              answer: 'Solution answer',
            }),
        });
      });

      it('should search for error solutions', async () => {
        const tool = new SearchTool('test-key');
        const result = await tool.searchError('Cannot read property of undefined', 'react');

        expect(result).not.toBeNull();
        expect(result?.results).toBeDefined();
      });

      it('should clean up error message for search', async () => {
        const tool = new SearchTool('test-key');
        await tool.searchError('/Users/dev/project/src/index.tsx:15:3 Error: Missing import');

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        // Should remove file paths and line numbers
        expect(body.query).not.toContain('/Users');
        expect(body.query).not.toContain(':15:3');
        expect(body.query).toContain('fix solution');
      });

      it('should search for code examples', async () => {
        const tool = new SearchTool('test-key');
        const result = await tool.searchCode('useState hook', 'react');

        expect(result).not.toBeNull();

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.query).toContain('react');
        expect(body.query).toContain('useState');
        expect(body.query).toContain('code example');
      });
    });

    describe('Schema Methods', () => {
      it('should return input schema', () => {
        const tool = new SearchTool('test-key');
        const schema = tool.getInputSchema();

        expect(schema).toHaveProperty('properties');
        expect((schema as Record<string, unknown>).properties).toHaveProperty('query');
      });

      it('should return output schema', () => {
        const tool = new SearchTool('test-key');
        const schema = tool.getOutputSchema();

        expect(schema).toHaveProperty('properties');
        expect((schema as Record<string, unknown>).properties).toHaveProperty('results');
      });
    });
  });

  // ============================================================================
  // SelfHealingTool Tests
  // ============================================================================

  describe('SelfHealingTool', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const tool1 = getSelfHealingTool();
        const tool2 = getSelfHealingTool();
        expect(tool1).toBe(tool2);
      });

      it('should create new instance after reset', () => {
        const tool1 = getSelfHealingTool();
        resetSelfHealingTool();
        const tool2 = getSelfHealingTool();
        expect(tool1).not.toBe(tool2);
      });
    });

    describe('Tool Configuration', () => {
      it('should have correct name', () => {
        const tool = new SelfHealingTool();
        expect(tool.getConfig().name).toBe('self-healing');
      });

      it('should have correct version', () => {
        const tool = new SelfHealingTool();
        expect(tool.getConfig().version).toBe('2.0.0');
      });

      it('should not be cacheable', () => {
        const tool = new SelfHealingTool();
        expect(tool.getConfig().cacheable).toBe(false);
      });
    });

    describe('Input Validation', () => {
      it('should reject empty content', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '',
          file: 'test.ts',
          errorMessage: 'Error',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Content is required');
      });

      it('should reject missing file path', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1',
          file: '',
          errorMessage: 'Error',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('File path is required');
      });

      it('should reject missing error message', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1',
          file: 'test.ts',
          errorMessage: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Error message is required');
      });
    });

    describe('Tier 1: Rule-based Fixes', () => {
      it('should replace font-display with font-sans', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<div class="font-display text-lg">Hello</div>',
          file: 'component.astro',
          errorMessage: 'Unknown utility class: font-display',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(true);
        expect(result.data?.tier).toBe('rule');
        expect(result.data?.fixedContent).toContain('font-sans');
        expect(result.data?.fixedContent).not.toContain('font-display');
      });

      it('should replace bg-dark with bg-gray-900', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<div class="bg-dark p-4">Content</div>',
          file: 'layout.astro',
          errorMessage: 'Unknown utility class: bg-dark',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(true);
        expect(result.data?.fixedContent).toContain('bg-gray-900');
      });

      it('should replace text-primary with text-blue-600', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<span class="text-primary font-bold">Text</span>',
          file: 'component.tsx',
          errorMessage: 'Unknown utility class: text-primary',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixedContent).toContain('text-blue-600');
      });

      it('should replace hover:bg-primary-dark with hover:bg-blue-700', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<button class="bg-blue-600 hover:bg-primary-dark">Click</button>',
          file: 'button.tsx',
          errorMessage: 'Unknown utility class: hover:bg-primary-dark',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixedContent).toContain('hover:bg-blue-700');
      });

      it('should remove astro-icon imports when Icon not found', async () => {
        const tool = new SelfHealingTool();
        const content = `---
import { Icon } from 'astro-icon/components';
---
<div>
  <Icon name="mdi:home" />
</div>`;

        const result = await tool.run({
          content,
          file: 'header.astro',
          errorMessage: "Cannot find module 'astro-icon/components'",
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(true);
        expect(result.data?.fixedContent).not.toContain("import { Icon }");
        expect(result.data?.fixedContent).toContain('Icon removed');
      });

      it('should return no fix when content has no matching patterns', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<div class="flex items-center">No custom classes</div>',
          file: 'component.astro',
          errorMessage: 'Some other error',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
        expect(result.data?.tier).toBe('none');
      });

      it('should skip non-CSS/JS files', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'font-display in plain text',
          file: 'readme.md',
          errorMessage: 'Error',
          enableTiers: { rule: true, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
      });
    });

    describe('Tier 3: LLM-based Fixes', () => {
      beforeEach(() => {
        // Mock search tool to avoid Tier 2
        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'error',
              results: [],
            }),
        });
      });

      it('should apply LLM fix when rule-based fails', async () => {
        mockedGenerateJSON.mockResolvedValue({
          success: true,
          fixedContent: 'const x: number = 1;',
          summary: 'Added type annotation',
        });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1',
          file: 'test.ts',
          errorMessage: 'Type error: implicit any',
          enableTiers: { rule: true, search: false, llm: true },
          maxLLMAttempts: 1,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(true);
        expect(result.data?.tier).toBe('llm');
        expect(result.data?.fixedContent).toBe('const x: number = 1;');
        expect(result.data?.summary).toBe('Added type annotation');
      });

      it('should reject LLM fix that returns same content', async () => {
        mockedGenerateJSON.mockResolvedValue({
          success: true,
          fixedContent: 'const x = 1', // Same as input
          summary: 'No change needed',
        });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 1,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
        expect(result.data?.tier).toBe('none');
      });

      it('should retry LLM multiple times', async () => {
        mockedGenerateJSON
          .mockRejectedValueOnce(new Error('LLM error'))
          .mockResolvedValueOnce({
            success: true,
            fixedContent: 'fixed content here',
            summary: 'Fixed on retry',
          });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'broken code',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 2,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(true);
        expect(result.data?.attempts).toBe(2);
        expect(mockedGenerateJSON).toHaveBeenCalledTimes(2);
      });

      it('should fail after max LLM attempts exhausted', async () => {
        mockedGenerateJSON.mockRejectedValue(new Error('LLM error'));

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'broken code',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 2,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
        expect(result.data?.tier).toBe('none');
        expect(result.data?.attempts).toBe(2);
      });
    });

    describe('Fix Validation', () => {
      it('should reject fix with unbalanced brackets', async () => {
        mockedGenerateJSON.mockResolvedValue({
          success: true,
          fixedContent: 'function test() { return { broken;',
          summary: 'Fixed function',
        });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'function test() {}',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 1,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false); // Should be rejected
      });

      it('should reject Astro fix with invalid frontmatter markers', async () => {
        mockedGenerateJSON.mockResolvedValue({
          success: true,
          fixedContent: '---\nconst x = 1\n<div>Missing closing frontmatter</div>',
          summary: 'Fixed Astro',
        });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '---\nconst x = 1\n---\n<div>Valid</div>',
          file: 'test.astro',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 1,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false); // Should be rejected due to odd frontmatter markers
      });

      it('should reject near-empty fix', async () => {
        mockedGenerateJSON.mockResolvedValue({
          success: true,
          fixedContent: '   ',
          summary: 'Cleared file',
        });

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1;',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: false, search: false, llm: true },
          maxLLMAttempts: 1,
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
      });
    });

    describe('Tier Control', () => {
      it('should skip rule tier when disabled', async () => {
        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: '<div class="font-display">Test</div>',
          file: 'test.astro',
          errorMessage: 'Unknown class',
          enableTiers: { rule: false, search: false, llm: false },
        });

        expect(result.success).toBe(true);
        expect(result.data?.fixed).toBe(false);
        expect(result.data?.attempts).toBe(0);
      });

      it('should track attempts across tiers', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ query: 'test', results: [] }),
        });
        mockedGenerateJSON.mockRejectedValue(new Error('LLM error'));

        const tool = new SelfHealingTool();
        const result = await tool.run({
          content: 'const x = 1',
          file: 'test.ts',
          errorMessage: 'Error',
          enableTiers: { rule: true, search: true, llm: true },
          maxLLMAttempts: 2,
        });

        expect(result.success).toBe(true);
        expect(result.data?.attempts).toBe(4); // 1 rule + 1 search + 2 LLM
      });
    });

    describe('Schema Methods', () => {
      it('should return input schema', () => {
        const tool = new SelfHealingTool();
        const schema = tool.getInputSchema();

        expect(schema).toHaveProperty('properties');
        const props = (schema as Record<string, Record<string, unknown>>).properties;
        expect(props).toHaveProperty('content');
        expect(props).toHaveProperty('file');
        expect(props).toHaveProperty('errorMessage');
      });

      it('should return output schema', () => {
        const tool = new SelfHealingTool();
        const schema = tool.getOutputSchema();

        expect(schema).toHaveProperty('properties');
        const props = (schema as Record<string, Record<string, unknown>>).properties;
        expect(props).toHaveProperty('fixed');
        expect(props).toHaveProperty('tier');
      });
    });
  });
});

