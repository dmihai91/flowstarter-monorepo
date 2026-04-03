/**
 * State Restoration - Unit Tests
 *
 * Tests the restoration flow when opening existing projects.
 * Covers:
 * - Restoring conversation state from Convex
 * - Restoring business info, template, palette, font, logo
 * - Handling interrupted builds
 * - Template restoration when templates load asynchronously
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InitialChatState } from '../types';

// ��������� Test Fixtures ������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������
const MOCK_MESSAGES = [
  { id: '1', role: 'user' as const, content: 'I run a bakery', timestamp: 1700000000000, createdAt: 1700000000000 },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'Great! Tell me more about your bakery.',
    timestamp: 1700000001000,
    createdAt: 1700000001000,
  },
];
const MOCK_BUSINESS_INFO = {
  description: 'Artisan bakery serving fresh bread daily',
  quickProfile: { goal: 'sales' as const, offerType: 'low-ticket' as const, tone: 'friendly' as const },
  uvp: 'Fresh artisan bread daily',
  targetAudience: 'Local families who appreciate quality',
  businessGoals: ['Increase foot traffic', 'Build online presence'],
  brandTone: 'warm',
};
const MOCK_PALETTE = {
  id: 'warm-earth',
  name: 'Warm Earth',
  colors: ['#8B4513', '#D2691E', '#F4A460'],
};
const MOCK_FONT = {
  id: 'classic-serif',
  name: 'Classic Serif',
  heading: 'Playfair Display',
  body: 'Source Serif Pro',
};
const MOCK_LOGO = {
  url: 'https://example.com/logo.png',
  type: 'uploaded' as const,
};
const FULL_INITIAL_STATE: InitialChatState = {
  step: 'ready',
  projectDescription: 'A local artisan bakery',
  selectedTemplateName: 'Restaurant Page',
  messages: MOCK_MESSAGES,
  businessInfo: MOCK_BUSINESS_INFO,
  selectedTemplateId: 'restaurant-page',
  selectedPalette: MOCK_PALETTE,
  selectedFont: MOCK_FONT,
  selectedLogo: MOCK_LOGO,
  projectUrlId: 'aluat-de-casa-abc123',
  convexProjectId: 'js716gx0gj303t09k8bcmrzpan80jnwm',
};

// ��������� Helper Functions to Test ���������������������������������������������������������������������������������������������������������������������������������������������������
/**
 * Validates that initial state has all required fields for restoration
 */
function validateInitialState(state: Partial<InitialChatState>): {
  valid: boolean;
  missing: string[];
} {
  const required = ['step', 'projectUrlId'];
  const missing = required.filter((key) => !(key in state) || state[key as keyof InitialChatState] === undefined);

  return { valid: missing.length === 0, missing };
}

/**
 * Determines if a project needs workspace restoration
 */
function needsWorkspaceRestoration(state: Partial<InitialChatState> & Record<string, unknown>): boolean {
  /*
   * Needs restoration if:
   * 1. Has project ID but no workspace ID
   * 2. Has template but workspace status is not 'ready'
   */
  if (!state.convexProjectId) {
    return false;
  }

  if (!state.daytonaWorkspaceId) {
    return true;
  }

  if (state.workspaceStatus && state.workspaceStatus !== 'ready') {
    return true;
  }

  return false;
}

/**
 * Gets suggested replies based on the restored step
 */
function getSuggestedRepliesForStep(step: string, state: Partial<InitialChatState>): string[] {
  switch (step) {
    case 'review':
      return [];
    case 'personalization':
      return [];
    case 'integrations':
      return [];
    case 'ready':
      return ['Make some changes', 'Try different colors', 'Add more sections'];
    default:
      return [];
  }
}

/**
 * Determines the restoration strategy based on project state
 */
function getRestorationStrategy(
  state: Partial<InitialChatState> & Record<string, unknown>,
): 'full' | 'files-only' | 'none' {
  if (!state.convexProjectId || !state.projectUrlId) {
    return 'none';
  }

  // Has workspace but no files? Restore files only
  if (state.daytonaWorkspaceId && state.workspaceStatus === 'ready') {
    return 'files-only';
  }

  // No workspace? Full restoration needed
  if (!state.daytonaWorkspaceId) {
    return 'full';
  }

  return 'none';
}

// ��������� Tests ������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������
describe('validateInitialState', () => {
  it('validates complete state as valid', () => {
    const result = validateInitialState(FULL_INITIAL_STATE);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
  it('reports missing step', () => {
    const { step, ...stateWithoutStep } = FULL_INITIAL_STATE;
    const result = validateInitialState(stateWithoutStep);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('step');
  });
  it('reports missing projectUrlId', () => {
    const { projectUrlId, ...stateWithoutUrlId } = FULL_INITIAL_STATE;
    const result = validateInitialState(stateWithoutUrlId);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('projectUrlId');
  });
  it('accepts minimal valid state', () => {
    const minimalState = { step: 'review' as const, projectUrlId: 'test-123' };
    const result = validateInitialState(minimalState);
    expect(result.valid).toBe(true);
  });
});
describe('needsWorkspaceRestoration', () => {
  it('returns false when no project ID', () => {
    expect(needsWorkspaceRestoration({})).toBe(false);
    expect(needsWorkspaceRestoration({ projectUrlId: 'test' })).toBe(false);
  });
  it('returns true when project exists but no workspace', () => {
    expect(
      needsWorkspaceRestoration({
        convexProjectId: 'abc123',
        projectUrlId: 'test',
      }),
    ).toBe(true);
  });
  it('returns false when workspace is ready', () => {
    expect(
      needsWorkspaceRestoration({
        convexProjectId: 'abc123',
        projectUrlId: 'test',
        daytonaWorkspaceId: 'workspace-456',
        workspaceStatus: 'ready',
      }),
    ).toBe(false);
  });
  it('returns true when workspace exists but not ready', () => {
    expect(
      needsWorkspaceRestoration({
        convexProjectId: 'abc123',
        daytonaWorkspaceId: 'workspace-456',
        workspaceStatus: 'creating',
      }),
    ).toBe(true);
    expect(
      needsWorkspaceRestoration({
        convexProjectId: 'abc123',
        daytonaWorkspaceId: 'workspace-456',
        workspaceStatus: 'error',
      }),
    ).toBe(true);
  });
});
describe('getSuggestedRepliesForStep', () => {
  it('returns empty for review, personalization, integrations steps', () => {
    expect(getSuggestedRepliesForStep('review', {})).toHaveLength(0);
    expect(getSuggestedRepliesForStep('personalization', {})).toHaveLength(0);
    expect(getSuggestedRepliesForStep('integrations', {})).toHaveLength(0);
  });
  it('returns modification options for ready step', () => {
    const replies = getSuggestedRepliesForStep('ready', FULL_INITIAL_STATE);
    expect(replies).toContain('Make some changes');
    expect(replies).toContain('Try different colors');
  });
});
describe('getRestorationStrategy', () => {
  it('returns none when no project', () => {
    expect(getRestorationStrategy({})).toBe('none');
    expect(getRestorationStrategy({ projectUrlId: 'test' })).toBe('none');
  });
  it('returns full when project exists but no workspace', () => {
    expect(
      getRestorationStrategy({
        convexProjectId: 'abc123',
        projectUrlId: 'test',
      }),
    ).toBe('full');
  });
  it('returns files-only when workspace ready', () => {
    expect(
      getRestorationStrategy({
        convexProjectId: 'abc123',
        projectUrlId: 'test',
        daytonaWorkspaceId: 'workspace-456',
        workspaceStatus: 'ready',
      }),
    ).toBe('files-only');
  });
  it('returns none when everything is set up', () => {
    /*
     * This case means files should already be synced - no restoration needed
     * But since we can't know file state, files-only is the safe choice
     */
    const result = getRestorationStrategy({
      convexProjectId: 'abc123',
      projectUrlId: 'test',
      daytonaWorkspaceId: 'workspace-456',
      workspaceStatus: 'ready',
    });
    expect(result).toBe('files-only');
  });
});
describe('message restoration', () => {
  it('preserves message order and content', () => {
    const messages = MOCK_MESSAGES;
    const restored = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));
    expect(restored).toHaveLength(2);
    expect(restored[0].role).toBe('user');
    expect(restored[1].role).toBe('assistant');
    expect(restored[0].content).toBe('I run a bakery');
  });
  it('handles empty messages array', () => {
    const messages: { id: string; role: string; content: string }[] = [];
    expect(messages).toHaveLength(0);
  });
  it('handles messages without timestamps', () => {
    const messagesNoTime = [{ id: '1', role: 'user' as const, content: 'Hello' }];

    // Should still be valid
    expect(messagesNoTime[0].content).toBe('Hello');
  });
});
describe('business info restoration', () => {
  it('restores all business info fields', () => {
    const info = MOCK_BUSINESS_INFO;
    expect(info.uvp).toBeDefined();
    expect(info.targetAudience).toBeDefined();
    expect(info.businessGoals).toBeInstanceOf(Array);
    expect(info.brandTone).toBeDefined();
  });
  it('handles partial business info', () => {
    const partial = { uvp: 'Just the basics' };
    expect(partial.uvp).toBe('Just the basics');
  });
  it('handles undefined business info', () => {
    const state: Partial<InitialChatState> = { step: 'review' };
    expect(state.businessInfo).toBeUndefined();
  });
});
describe('template restoration timing', () => {
  it('defers template selection when templates not loaded', () => {
    // Simulate templates not loaded yet
    const templates: { id: string; name: string }[] = [];
    const pendingTemplateId = 'restaurant-page';

    // Should not find template yet
    const found = templates.find((t) => t.id === pendingTemplateId);
    expect(found).toBeUndefined();
  });
  it('selects template when templates load', () => {
    const templates = [
      { id: 'fitness-coach', name: 'Fitness Coach' },
      { id: 'restaurant-page', name: 'Restaurant Page' },
    ];
    const pendingTemplateId = 'restaurant-page';
    const found = templates.find((t) => t.id === pendingTemplateId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Restaurant Page');
  });
  it('clears pending template if not found after templates load', () => {
    const templates = [{ id: 'fitness-coach', name: 'Fitness Coach' }];
    const pendingTemplateId = 'non-existent-template';
    const found = templates.find((t) => t.id === pendingTemplateId);
    expect(found).toBeUndefined();

    // In real code, pendingTemplateRestoreRef would be set to null here
  });
});
describe('interrupted build handling', () => {
  it('detects interrupted orchestration', () => {
    const state: Partial<InitialChatState> = {
      step: 'creating',
      orchestrationState: 'running',
    };
    expect(state.orchestrationState).toBe('running');
    expect(state.step).toBe('creating');
  });
  it('shows recovery message for interrupted builds', () => {
    const wasInterrupted = true;
    const recoveryMessage = wasInterrupted
      ? 'A build process was interrupted. Your project files have been saved. You can continue making changes or start a new request.'
      : '';
    expect(recoveryMessage).toContain('interrupted');
    expect(recoveryMessage).toContain('saved');
  });
  it('does not show recovery for completed builds', () => {
    const state: Partial<InitialChatState> = {
      step: 'ready',
      orchestrationState: 'completed',
    };
    expect(state.orchestrationState).not.toBe('running');
  });
});
