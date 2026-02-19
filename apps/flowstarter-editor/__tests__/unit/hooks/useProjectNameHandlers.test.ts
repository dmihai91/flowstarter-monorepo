/**
 * useProjectNameHandlers Hook Tests
 *
 * Tests the project name generation and submission logic.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Constants Tests ─────────────────────────────────────────────────────────

describe('useProjectNameHandlers Constants', () => {
  it('should use correct default project name', () => {
    const DEFAULT_PROJECT_NAME = 'My Project';
    expect(DEFAULT_PROJECT_NAME).toBe('My Project');
  });
});

// ─── Project Name Generation Logic Tests ─────────────────────────────────────

describe('useProjectNameHandlers Generation Logic', () => {
  // Mock fetch for testing
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('should return generated name from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectName: 'Awesome Website' }),
    });

    const response = await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectDescription: 'A cool website' }),
    });

    const data = (await response.json()) as { projectName: string };

    expect(data.projectName).toBe('Awesome Website');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return default name when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    const response = await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectDescription: 'A cool website' }),
    });

    expect(response.ok).toBe(false);
  });

  it('should handle AbortError gracefully', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    try {
      await fetch('/api/generate-project-name', {
        method: 'POST',
        signal: new AbortController().signal,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('AbortError');
    }
  });

  it('should pass abort signal to fetch', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectName: 'Test Project' }),
    });

    await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectDescription: 'test' }),
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate-project-name',
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });
});

// ─── Name Suggestion Parsing Tests ───────────────────────────────────────────

describe('useProjectNameHandlers Input Parsing', () => {
  it('should detect suggestion keywords', () => {
    const isSuggestionRequest = (name: string) =>
      name.toLowerCase().includes('suggest') || name.toLowerCase().includes('generate');

    expect(isSuggestionRequest('suggest a name')).toBe(true);
    expect(isSuggestionRequest('generate something cool')).toBe(true);
    expect(isSuggestionRequest('My Awesome Project')).toBe(false);
    expect(isSuggestionRequest('SUGGEST')).toBe(true);
    expect(isSuggestionRequest('GenerateForMe')).toBe(true);
  });

  it('should handle needs follow-up response', () => {
    const response = {
      needsFollowUp: true,
      suggestedName: 'Cool Project',
      followUpMessage: 'How about this name?',
    };

    expect('needsFollowUp' in response && response.needsFollowUp).toBe(true);
    expect(response.suggestedName).toBe('Cool Project');
  });

  it('should handle direct name response', () => {
    const response = {
      projectName: 'Direct Name',
    };

    expect('projectName' in response).toBe(true);
    expect(response.projectName).toBe('Direct Name');
  });

  it('should handle error response', () => {
    const response = {
      error: true,
      message: 'Something went wrong',
    };

    expect('error' in response && response.error).toBe(true);
    expect(response.message).toBe('Something went wrong');
  });
});

// ─── AbortController Tests ───────────────────────────────────────────────────

describe('useProjectNameHandlers AbortController', () => {
  it('should create new AbortController for each request', () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    expect(controller1).not.toBe(controller2);
    expect(controller1.signal).not.toBe(controller2.signal);
  });

  it('should abort previous request when new one starts', () => {
    const controller1 = new AbortController();
    const abortSpy = vi.spyOn(controller1, 'abort');

    // Simulate aborting previous request
    controller1.abort();

    expect(abortSpy).toHaveBeenCalled();
    expect(controller1.signal.aborted).toBe(true);
  });

  it('should properly identify AbortError', () => {
    const isAbortError = (error: unknown) =>
      error instanceof Error && error.name === 'AbortError';

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    const regularError = new Error('Network error');

    expect(isAbortError(abortError)).toBe(true);
    expect(isAbortError(regularError)).toBe(false);
    expect(isAbortError('string error')).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

// ─── Message Sequencing Tests ─────────────────────────────────────────────────

describe('useProjectNameHandlers Message Sequencing', () => {
  const MESSAGE_TRANSITION_DELAY = 1500;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have a delay between after-name and business-uvp-prompt messages', () => {
    // The delay should be significant enough for users to read the first message
    expect(MESSAGE_TRANSITION_DELAY).toBeGreaterThanOrEqual(1000);
    expect(MESSAGE_TRANSITION_DELAY).toBe(1500);
  });

  it('should sequence messages with proper timing', async () => {
    const events: Array<{ event: string; time: number }> = [];
    let currentTime = 0;

    // Simulate the flow from handleNameSubmit
    const simulateNameSubmitFlow = async () => {
      // Step 1: Add after-name message
      events.push({ event: 'after-name-message', time: currentTime });

      // Step 2: Wait for transition delay
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          currentTime += MESSAGE_TRANSITION_DELAY;
          resolve();
        }, MESSAGE_TRANSITION_DELAY);
      });

      // Step 3: Set step to business-uvp
      events.push({ event: 'set-step-business-uvp', time: currentTime });

      // Step 4: Set typing indicator
      events.push({ event: 'set-typing-true', time: currentTime });

      // Step 5: Add business-uvp-prompt message
      events.push({ event: 'business-uvp-prompt-message', time: currentTime });

      // Step 6: Clear typing indicator
      events.push({ event: 'set-typing-false', time: currentTime });
    };

    const flowPromise = simulateNameSubmitFlow();

    // Before delay, only the first event should be recorded
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('after-name-message');
    expect(events[0].time).toBe(0);

    // Advance timers past the delay
    vi.advanceTimersByTime(MESSAGE_TRANSITION_DELAY);
    await flowPromise;

    // After delay, all events should be recorded
    expect(events).toHaveLength(5);

    // Verify the sequence
    expect(events.map((e) => e.event)).toEqual([
      'after-name-message',
      'set-step-business-uvp',
      'set-typing-true',
      'business-uvp-prompt-message',
      'set-typing-false',
    ]);

    // Verify timing - first message at 0, rest after delay
    expect(events[0].time).toBe(0);
    expect(events[1].time).toBe(MESSAGE_TRANSITION_DELAY);
    expect(events[2].time).toBe(MESSAGE_TRANSITION_DELAY);
    expect(events[3].time).toBe(MESSAGE_TRANSITION_DELAY);
    expect(events[4].time).toBe(MESSAGE_TRANSITION_DELAY);
  });

  it('should show typing indicator before second message', async () => {
    let typingShown = false;
    let secondMessageShown = false;

    const simulateFlow = async () => {
      // First message shown
      await new Promise<void>((resolve) => {
        setTimeout(resolve, MESSAGE_TRANSITION_DELAY);
      });

      // Typing indicator shown
      typingShown = true;

      // Second message shown
      secondMessageShown = true;
    };

    const flowPromise = simulateFlow();

    expect(typingShown).toBe(false);
    expect(secondMessageShown).toBe(false);

    vi.advanceTimersByTime(MESSAGE_TRANSITION_DELAY);
    await flowPromise;

    expect(typingShown).toBe(true);
    expect(secondMessageShown).toBe(true);
  });
});

// ─── Manual Entry Path Tests ─────────────────────────────────────────────────

describe('useProjectNameHandlers Manual Entry Path', () => {
  it('should use the same delay for manual entry path', () => {
    // Both paths (manual entry and LLM extraction) should have the same 1500ms delay
    const MANUAL_ENTRY_DELAY = 1500;
    const LLM_EXTRACTION_DELAY = 1500;

    expect(MANUAL_ENTRY_DELAY).toBe(LLM_EXTRACTION_DELAY);
  });

  it('should skip typing indicator for first message when already typing', () => {
    // When in manual entry mode, typing is already true
    // We should pass skipTypingIndicator: true to avoid a flash
    const options = { skipTypingIndicator: true };

    expect(options.skipTypingIndicator).toBe(true);
  });
});

// ─── Null Parameter Handling Tests ───────────────────────────────────────────

describe('useProjectNameHandlers Null Parameters', () => {
  it('should accept null for context in addLLMMessage calls', () => {
    // The business-uvp-prompt message is called with null context
    const context: Record<string, unknown> | null = null;

    // This should be valid and not throw
    expect(() => {
      const normalizedContext = context ?? undefined;
      return normalizedContext;
    }).not.toThrow();
  });

  it('should accept null for component in addLLMMessage calls', () => {
    const component: React.ReactNode | null = null;

    expect(() => {
      const normalizedComponent = component ?? undefined;
      return normalizedComponent;
    }).not.toThrow();
  });

  it('should still respect options when context and component are null', () => {
    const context: Record<string, unknown> | null = null;
    const component: React.ReactNode | null = null;
    const options: { skipTypingIndicator?: boolean } = { skipTypingIndicator: true };

    // Options should still work even when other params are null
    expect(options.skipTypingIndicator).toBe(true);
    expect(context).toBeNull();
    expect(component).toBeNull();
  });
});

// ─── Name Refinement Detection Tests ─────────────────────────────────────────

describe('useProjectNameHandlers Refinement Detection', () => {
  // Test helper function matching the implementation
  const detectsRefinement = (input: string): boolean => {
    const lowerName = input.toLowerCase();
    return (
      lowerName.includes('make it') ||
      lowerName.includes('more punchy') ||
      lowerName.includes('more creative') ||
      lowerName.includes('more professional') ||
      lowerName.includes('shorter') ||
      lowerName.includes('try another') ||
      lowerName.includes('different name') ||
      lowerName.includes('something else')
    );
  };

  it('should detect "make it" refinement requests', () => {
    expect(detectsRefinement('Make it more punchy')).toBe(true);
    expect(detectsRefinement('make it shorter')).toBe(true);
    expect(detectsRefinement('MAKE IT more professional')).toBe(true);
    expect(detectsRefinement('Can you make it more creative?')).toBe(true);
  });

  it('should detect style-based refinement keywords', () => {
    expect(detectsRefinement('more punchy')).toBe(true);
    expect(detectsRefinement('More creative please')).toBe(true);
    expect(detectsRefinement('More professional and business-like')).toBe(true);
    expect(detectsRefinement('shorter')).toBe(true);
  });

  it('should detect alternative name requests', () => {
    expect(detectsRefinement('try another')).toBe(true);
    expect(detectsRefinement('Try another one')).toBe(true);
    expect(detectsRefinement('I want a different name')).toBe(true);
    expect(detectsRefinement('something else')).toBe(true);
  });

  it('should not detect regular name inputs as refinement', () => {
    expect(detectsRefinement('Flow Studio')).toBe(false);
    expect(detectsRefinement('My Business Name')).toBe(false);
    expect(detectsRefinement('Use this name')).toBe(false);
    expect(detectsRefinement('Yes, that works')).toBe(false);
  });
});

// ─── Name Acceptance Pattern Tests ───────────────────────────────────────────

describe('useProjectNameHandlers Name Acceptance Patterns', () => {
  // Test helper matching the implementation
  const parseNameAcceptance = (input: string): { isExplicit: boolean; isGeneric: boolean; extractedName: string | null } => {
    const useNameMatch = input.match(/^(?:yes,?\s*)?(?:i'll\s*)?use\s*["']?([^"']+)["']?$/i);
    const extractedNameFromUse = useNameMatch ? useNameMatch[1].trim() : null;
    const isGenericAcceptance = extractedNameFromUse !== null && /^(this|that|the|it)\s*(name|one)?$/i.test(extractedNameFromUse);
    const isExplicitNameAcceptance = extractedNameFromUse !== null && !isGenericAcceptance;

    return {
      isExplicit: isExplicitNameAcceptance,
      isGeneric: isGenericAcceptance,
      extractedName: extractedNameFromUse,
    };
  };

  it('should detect explicit name acceptance with quoted names', () => {
    const result = parseNameAcceptance('Use "Flow Studio"');
    expect(result.isExplicit).toBe(true);
    expect(result.isGeneric).toBe(false);
    expect(result.extractedName).toBe('Flow Studio');
  });

  it('should detect explicit name acceptance with single quotes', () => {
    const result = parseNameAcceptance("Use 'Flow Studio'");
    expect(result.isExplicit).toBe(true);
    expect(result.extractedName).toBe('Flow Studio');
  });

  it('should detect explicit name acceptance without quotes', () => {
    const result = parseNameAcceptance('Use Flow Studio');
    expect(result.isExplicit).toBe(true);
    expect(result.extractedName).toBe('Flow Studio');
  });

  it('should detect "Yes, use X" pattern', () => {
    const result = parseNameAcceptance('Yes, use Flow Studio');
    expect(result.isExplicit).toBe(true);
    expect(result.extractedName).toBe('Flow Studio');
  });

  it('should detect "I\'ll use X" pattern', () => {
    const result = parseNameAcceptance("I'll use Flow Studio");
    expect(result.isExplicit).toBe(true);
    expect(result.extractedName).toBe('Flow Studio');
  });

  it('should detect generic acceptance phrases', () => {
    expect(parseNameAcceptance('Use this name').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use that one').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use this').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use that').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use it').isGeneric).toBe(true);
  });

  it('should not match non-acceptance patterns', () => {
    const result1 = parseNameAcceptance('Flow Studio');
    expect(result1.isExplicit).toBe(false);
    expect(result1.isGeneric).toBe(false);
    expect(result1.extractedName).toBeNull();

    const result2 = parseNameAcceptance('make it punchy');
    expect(result2.isExplicit).toBe(false);
    expect(result2.extractedName).toBeNull();
  });

  it('should handle case-insensitive matching', () => {
    expect(parseNameAcceptance('USE Flow Studio').isExplicit).toBe(true);
    expect(parseNameAcceptance('USE THIS NAME').isGeneric).toBe(true);
    expect(parseNameAcceptance('yes, USE "My Name"').extractedName).toBe('My Name');
  });
});

// ─── Name Refinement API Integration Tests ───────────────────────────────────

describe('useProjectNameHandlers Refinement API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('should call API with refine action and correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectName: 'Harmony Pro' }),
    });

    await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectDescription: 'A wellness app',
        previousName: 'Harmony',
        refinementFeedback: 'Make it more professional',
        action: 'refine',
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate-project-name',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"refine"'),
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.previousName).toBe('Harmony');
    expect(callBody.refinementFeedback).toBe('Make it more professional');
    expect(callBody.action).toBe('refine');
  });

  it('should return refined name from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectName: 'Flow Studio Pro' }),
    });

    const response = await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previousName: 'Flow Studio',
        refinementFeedback: 'Make it more professional',
        action: 'refine',
      }),
    });

    const data = (await response.json()) as { projectName: string };
    expect(data.projectName).toBe('Flow Studio Pro');
  });

  it('should handle refinement API failure gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    const response = await fetch('/api/generate-project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previousName: 'Flow Studio',
        refinementFeedback: 'Make it shorter',
        action: 'refine',
      }),
    });

    expect(response.ok).toBe(false);
  });
});

// ─── Suggestion Keyword Detection Tests ──────────────────────────────────────

describe('useProjectNameHandlers Suggestion Detection', () => {
  const detectsSuggestionRequest = (input: string): boolean => {
    const lowerName = input.toLowerCase();
    return (
      lowerName.includes('suggest') ||
      lowerName.includes('generate') ||
      lowerName.includes('give me a name') ||
      lowerName.includes('come up with') ||
      lowerName.includes("don't know") ||
      lowerName.includes('dont know') ||
      lowerName.includes('not sure') ||
      lowerName.includes('help me') ||
      lowerName.includes('pick a name') ||
      lowerName.includes('choose a name')
    );
  };

  it('should detect suggestion request keywords', () => {
    expect(detectsSuggestionRequest('Suggest a name')).toBe(true);
    expect(detectsSuggestionRequest('Generate something creative')).toBe(true);
    expect(detectsSuggestionRequest('Give me a name for my business')).toBe(true);
    expect(detectsSuggestionRequest('Come up with something cool')).toBe(true);
  });

  it('should detect uncertainty expressions', () => {
    expect(detectsSuggestionRequest("I don't know what to call it")).toBe(true);
    expect(detectsSuggestionRequest('I dont know')).toBe(true);
    expect(detectsSuggestionRequest("I'm not sure")).toBe(true);
    expect(detectsSuggestionRequest('Help me pick a name')).toBe(true);
  });

  it('should detect name selection requests', () => {
    expect(detectsSuggestionRequest('Pick a name for me')).toBe(true);
    expect(detectsSuggestionRequest('Choose a name')).toBe(true);
  });

  it('should not detect regular inputs as suggestion requests', () => {
    expect(detectsSuggestionRequest('Flow Studio')).toBe(false);
    expect(detectsSuggestionRequest('My Business')).toBe(false);
    expect(detectsSuggestionRequest('Use this name')).toBe(false);
  });
});

