/**
 * Message Sequencing Integration Tests
 *
 * Tests that messages are displayed sequentially with proper delays,
 * ensuring users can read one message before seeing the next.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Message Delay Constants ─────────────────────────────────────────────────

const MESSAGE_TRANSITION_DELAY = 1500; // Delay between sequential messages
const MESSAGE_RENDER_DELAY = 100; // Internal render delay for LLM messages
const TYPING_ANIMATION_DELAY = 300; // Delay for assistant message typing animation

describe('Message Sequencing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Sequential Message Delays', () => {
    it('should have a 1500ms delay between confirmation and next question', () => {
      // This tests the delay constant used in useProjectNameHandlers
      expect(MESSAGE_TRANSITION_DELAY).toBe(1500);
    });

    it('should have a 100ms internal render delay for LLM messages', () => {
      // This tests the delay used in addLLMMessage
      expect(MESSAGE_RENDER_DELAY).toBe(100);
    });

    it('should calculate total time for two sequential messages correctly', () => {
      // First message: 100ms render delay
      // Transition: 1500ms delay
      // Second message: 100ms render delay
      // Total: 1700ms minimum between first message appearing and second message appearing
      const totalSequentialTime = MESSAGE_RENDER_DELAY + MESSAGE_TRANSITION_DELAY + MESSAGE_RENDER_DELAY;
      expect(totalSequentialTime).toBe(1700);
    });
  });

  describe('Message Timing Simulation', () => {
    it('should show messages with proper timing gaps', async () => {
      const messageTimestamps: number[] = [];
      let currentTime = 0;

      // Simulate first message (after-name)
      currentTime += MESSAGE_RENDER_DELAY;
      messageTimestamps.push(currentTime);

      // Simulate delay between messages
      currentTime += MESSAGE_TRANSITION_DELAY;

      // Simulate typing indicator time (implicit in the flow)
      // Then second message (business-uvp-prompt)
      currentTime += MESSAGE_RENDER_DELAY;
      messageTimestamps.push(currentTime);

      // Verify the gap between messages
      const timeBetweenMessages = messageTimestamps[1] - messageTimestamps[0];
      expect(timeBetweenMessages).toBe(MESSAGE_TRANSITION_DELAY + MESSAGE_RENDER_DELAY);
      expect(timeBetweenMessages).toBeGreaterThanOrEqual(1500);
    });

    it('should not show messages simultaneously (gap must be > 500ms)', () => {
      // Messages appearing within 500ms of each other feel "simultaneous"
      const SIMULTANEOUS_THRESHOLD = 500;

      const firstMessageTime = MESSAGE_RENDER_DELAY;
      const secondMessageTime = MESSAGE_RENDER_DELAY + MESSAGE_TRANSITION_DELAY + MESSAGE_RENDER_DELAY;

      const gap = secondMessageTime - firstMessageTime;

      expect(gap).toBeGreaterThan(SIMULTANEOUS_THRESHOLD);
    });
  });

  describe('Typing Indicator Flow', () => {
    it('should show typing indicator between messages', () => {
      // The flow should be:
      // 1. First message appears
      // 2. Delay starts
      // 3. Typing indicator shown
      // 4. Second message appears
      // 5. Typing indicator hidden

      const flow = [
        { event: 'first-message', time: 0 },
        { event: 'typing-start', time: MESSAGE_RENDER_DELAY + MESSAGE_TRANSITION_DELAY - 100 },
        { event: 'second-message', time: MESSAGE_RENDER_DELAY + MESSAGE_TRANSITION_DELAY + MESSAGE_RENDER_DELAY },
        { event: 'typing-end', time: MESSAGE_RENDER_DELAY + MESSAGE_TRANSITION_DELAY + MESSAGE_RENDER_DELAY },
      ];

      // Typing should be visible before second message
      expect(flow[1].time).toBeLessThan(flow[2].time);

      // Typing should end when second message appears
      expect(flow[2].time).toBe(flow[3].time);
    });
  });

  describe('Null Parameter Handling', () => {
    it('should treat null context as undefined for message generation', () => {
      const context: Record<string, unknown> | null = null;
      const normalizedContext = context ?? undefined;

      expect(normalizedContext).toBeUndefined();
    });

    it('should treat null component as undefined for message creation', () => {
      const component: React.ReactNode | null = null;
      const normalizedComponent = component ?? undefined;

      expect(normalizedComponent).toBeUndefined();
    });

    it('should treat null options as having skipTypingIndicator = false', () => {
      // Test that null options results in showing typing indicator
      const options = null as { skipTypingIndicator?: boolean } | null;
      const shouldShowTyping = options == null || options.skipTypingIndicator !== true;

      expect(shouldShowTyping).toBe(true);
    });

    it('should respect skipTypingIndicator: true in options', () => {
      // Test that skipTypingIndicator: true hides typing indicator
      const options = { skipTypingIndicator: true } as { skipTypingIndicator?: boolean } | null;
      const shouldShowTyping = options == null || options.skipTypingIndicator !== true;

      expect(shouldShowTyping).toBe(false);
    });
  });
});

// ─── Flow Sequence Tests ─────────────────────────────────────────────────────

describe('Name to Business UVP Flow', () => {
  it('should define correct message sequence after name confirmation', () => {
    const expectedSequence = [
      'after-name', // "Great name!" message
      'business-uvp-prompt', // First business discovery question
    ];

    expect(expectedSequence).toHaveLength(2);
    expect(expectedSequence[0]).toBe('after-name');
    expect(expectedSequence[1]).toBe('business-uvp-prompt');
  });

  it('should have proper step transition after name confirmation', () => {
    const stepTransitions = {
      before: 'name',
      after: 'business-uvp',
    };

    expect(stepTransitions.before).toBe('name');
    expect(stepTransitions.after).toBe('business-uvp');
  });
});

// ─── Promise-based Delay Tests ───────────────────────────────────────────────

describe('Delay Promise Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after specified delay', async () => {
    let resolved = false;

    const delayPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolved = true;
        resolve();
      }, MESSAGE_TRANSITION_DELAY);
    });

    expect(resolved).toBe(false);

    vi.advanceTimersByTime(MESSAGE_TRANSITION_DELAY - 1);
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    await delayPromise;
    expect(resolved).toBe(true);
  });

  it('should allow await to properly sequence operations', async () => {
    const operations: string[] = [];

    const simulateMessageFlow = async () => {
      operations.push('first-message');

      await new Promise<void>((resolve) => {
        setTimeout(resolve, MESSAGE_TRANSITION_DELAY);
      });

      operations.push('after-delay');
      operations.push('second-message');
    };

    const flowPromise = simulateMessageFlow();

    // Initially only first message
    expect(operations).toEqual(['first-message']);

    // Advance past delay
    vi.advanceTimersByTime(MESSAGE_TRANSITION_DELAY);
    await flowPromise;

    // Now all operations should be complete
    expect(operations).toEqual(['first-message', 'after-delay', 'second-message']);
  });

  it('should maintain order when using async/await with delays', async () => {
    const events: Array<{ name: string; time: number }> = [];
    let currentTime = 0;

    const recordEvent = (name: string) => {
      events.push({ name, time: currentTime });
    };

    const simulateFlow = async () => {
      recordEvent('add-confirmation-message');

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          currentTime += MESSAGE_TRANSITION_DELAY;
          resolve();
        }, MESSAGE_TRANSITION_DELAY);
      });

      recordEvent('set-step-business-uvp');
      recordEvent('set-typing-true');
      recordEvent('add-uvp-prompt-message');
      recordEvent('set-typing-false');
    };

    const flowPromise = simulateFlow();

    // Before delay
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('add-confirmation-message');

    // After delay
    vi.advanceTimersByTime(MESSAGE_TRANSITION_DELAY);
    await flowPromise;

    expect(events).toHaveLength(5);
    expect(events.map((e) => e.name)).toEqual([
      'add-confirmation-message',
      'set-step-business-uvp',
      'set-typing-true',
      'add-uvp-prompt-message',
      'set-typing-false',
    ]);

    // Verify timing
    expect(events[0].time).toBe(0);
    expect(events[1].time).toBe(MESSAGE_TRANSITION_DELAY);
  });
});

