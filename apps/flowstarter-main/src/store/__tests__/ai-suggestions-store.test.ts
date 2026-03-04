import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectAIStore } from '../ai-suggestions-store';

describe('useProjectAIStore', () => {
  beforeEach(() => {
    useProjectAIStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useProjectAIStore.getState();
    expect(state.suggestions.names).toEqual([]);
    expect(state.suggestions.description).toBe('');
    expect(state.suggestions.targetUsers).toBe('');
    expect(state.suggestions.businessGoals).toEqual([]);
    expect(state.suggestions.USP).toBe('');
    expect(state.showSuggestions).toBe(false);
    expect(state.isGenerating).toBe(false);
    expect(state.loading).toEqual({
      names: false,
      description: false,
      targetUsers: false,
      USP: false,
      businessGoals: false,
    });
    expect(state.currentActionByField).toEqual({});
    expect(state.moderationError).toBeNull();
    expect(state.sufficiency).toBeNull();
  });

  describe('setSuggestions', () => {
    it('merges partial suggestions', () => {
      useProjectAIStore.getState().setSuggestions({ names: ['Foo', 'Bar'] });
      const s = useProjectAIStore.getState().suggestions;
      expect(s.names).toEqual(['Foo', 'Bar']);
      expect(s.description).toBe('');
    });

    it('merges multiple fields', () => {
      useProjectAIStore.getState().setSuggestions({
        description: 'A cool project',
        targetUsers: 'developers',
      });
      const s = useProjectAIStore.getState().suggestions;
      expect(s.description).toBe('A cool project');
      expect(s.targetUsers).toBe('developers');
    });

    it('preserves previously set fields', () => {
      useProjectAIStore.getState().setSuggestions({ names: ['A'] });
      useProjectAIStore.getState().setSuggestions({ description: 'desc' });
      expect(useProjectAIStore.getState().suggestions.names).toEqual(['A']);
      expect(useProjectAIStore.getState().suggestions.description).toBe('desc');
    });
  });

  describe('setShowSuggestions', () => {
    it('sets to true', () => {
      useProjectAIStore.getState().setShowSuggestions(true);
      expect(useProjectAIStore.getState().showSuggestions).toBe(true);
    });

    it('sets to false', () => {
      useProjectAIStore.getState().setShowSuggestions(true);
      useProjectAIStore.getState().setShowSuggestions(false);
      expect(useProjectAIStore.getState().showSuggestions).toBe(false);
    });
  });

  describe('setIsGenerating', () => {
    it('sets generating state', () => {
      useProjectAIStore.getState().setIsGenerating(true);
      expect(useProjectAIStore.getState().isGenerating).toBe(true);
    });
  });

  describe('setFieldLoading', () => {
    it('sets loading for specific field', () => {
      useProjectAIStore.getState().setFieldLoading('names', true);
      expect(useProjectAIStore.getState().loading.names).toBe(true);
      expect(useProjectAIStore.getState().loading.description).toBe(false);
    });

    it('toggles loading for a field', () => {
      useProjectAIStore.getState().setFieldLoading('description', true);
      useProjectAIStore.getState().setFieldLoading('description', false);
      expect(useProjectAIStore.getState().loading.description).toBe(false);
    });

    it('sets multiple fields independently', () => {
      useProjectAIStore.getState().setFieldLoading('names', true);
      useProjectAIStore.getState().setFieldLoading('USP', true);
      const loading = useProjectAIStore.getState().loading;
      expect(loading.names).toBe(true);
      expect(loading.USP).toBe(true);
      expect(loading.description).toBe(false);
    });
  });

  describe('setFieldAction', () => {
    it('sets action for a field', () => {
      useProjectAIStore.getState().setFieldAction('names', 'makeItCatchy');
      expect(useProjectAIStore.getState().currentActionByField.names).toBe('makeItCatchy');
    });

    it('overwrites existing action', () => {
      useProjectAIStore.getState().setFieldAction('names', 'makeItCatchy');
      useProjectAIStore.getState().setFieldAction('names', 'makeItShorter');
      expect(useProjectAIStore.getState().currentActionByField.names).toBe('makeItShorter');
    });

    it('sets actions for multiple fields', () => {
      useProjectAIStore.getState().setFieldAction('names', 'regenerate');
      useProjectAIStore.getState().setFieldAction('description', 'makeItPunchy');
      const actions = useProjectAIStore.getState().currentActionByField;
      expect(actions.names).toBe('regenerate');
      expect(actions.description).toBe('makeItPunchy');
    });

    it('clears action with empty string', () => {
      useProjectAIStore.getState().setFieldAction('names', 'regenerate');
      useProjectAIStore.getState().setFieldAction('names', '');
      expect(useProjectAIStore.getState().currentActionByField.names).toBe('');
    });
  });

  describe('setModerationError', () => {
    it('sets moderation error', () => {
      const err = {
        error: 'blocked',
        message: 'Content blocked',
        details: ['reason1'],
        code: 'MOD_001',
        requestId: 'req-1',
        timestamp: '2024-01-01',
      };
      useProjectAIStore.getState().setModerationError(err);
      expect(useProjectAIStore.getState().moderationError).toEqual(err);
    });

    it('clears moderation error', () => {
      useProjectAIStore.getState().setModerationError({
        error: 'blocked',
        message: 'msg',
        details: [],
        code: 'MOD',
        requestId: 'r',
        timestamp: 't',
      });
      useProjectAIStore.getState().setModerationError(null);
      expect(useProjectAIStore.getState().moderationError).toBeNull();
    });
  });

  describe('setSufficiency', () => {
    it('sets sufficiency result', () => {
      useProjectAIStore.getState().setSufficiency({
        isSufficient: true,
      });
      expect(useProjectAIStore.getState().sufficiency).toEqual({ isSufficient: true });
    });

    it('sets sufficiency with follow-up questions', () => {
      useProjectAIStore.getState().setSufficiency({
        isSufficient: false,
        followUpQuestions: ['What is your target market?'],
      });
      const suf = useProjectAIStore.getState().sufficiency;
      expect(suf?.isSufficient).toBe(false);
      expect(suf?.followUpQuestions).toEqual(['What is your target market?']);
    });

    it('clears sufficiency', () => {
      useProjectAIStore.getState().setSufficiency({ isSufficient: true });
      useProjectAIStore.getState().setSufficiency(null);
      expect(useProjectAIStore.getState().sufficiency).toBeNull();
    });
  });

  describe('clearValidation', () => {
    it('clears both moderationError and sufficiency', () => {
      useProjectAIStore.getState().setModerationError({
        error: 'e',
        message: 'm',
        details: [],
        code: 'c',
        requestId: 'r',
        timestamp: 't',
      });
      useProjectAIStore.getState().setSufficiency({ isSufficient: false });
      useProjectAIStore.getState().clearValidation();
      expect(useProjectAIStore.getState().moderationError).toBeNull();
      expect(useProjectAIStore.getState().sufficiency).toBeNull();
    });

    it('does not affect other state', () => {
      useProjectAIStore.getState().setSuggestions({ names: ['Test'] });
      useProjectAIStore.getState().setIsGenerating(true);
      useProjectAIStore.getState().clearValidation();
      expect(useProjectAIStore.getState().suggestions.names).toEqual(['Test']);
      expect(useProjectAIStore.getState().isGenerating).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Modify everything
      useProjectAIStore.getState().setSuggestions({ names: ['X'], description: 'Y' });
      useProjectAIStore.getState().setShowSuggestions(true);
      useProjectAIStore.getState().setIsGenerating(true);
      useProjectAIStore.getState().setFieldLoading('names', true);
      useProjectAIStore.getState().setFieldAction('names', 'regenerate');
      useProjectAIStore.getState().setModerationError({
        error: 'e',
        message: 'm',
        details: [],
        code: 'c',
        requestId: 'r',
        timestamp: 't',
      });
      useProjectAIStore.getState().setSufficiency({ isSufficient: true });

      // Reset
      useProjectAIStore.getState().reset();

      const state = useProjectAIStore.getState();
      expect(state.suggestions.names).toEqual([]);
      expect(state.suggestions.description).toBe('');
      expect(state.showSuggestions).toBe(false);
      expect(state.isGenerating).toBe(false);
      expect(state.loading.names).toBe(false);
      expect(state.currentActionByField).toEqual({});
      expect(state.moderationError).toBeNull();
      expect(state.sufficiency).toBeNull();
    });
  });
});
