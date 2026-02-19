import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectAIStore } from '../ai-suggestions-store';

describe('ai-suggestions-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useProjectAIStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useProjectAIStore());

      expect(result.current.suggestions).toEqual({
        names: [],
        description: '',
        targetUsers: '',
        businessGoals: [],
        businessModel: '',
        brandTone: '',
        keyServices: '',
        USP: '',
        primaryCTA: '',
        contactPreference: '',
        additionalFeatures: '',
      });
      expect(result.current.showSuggestions).toBe(false);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.loading).toEqual({
        names: false,
        description: false,
        targetUsers: false,
        USP: false,
        businessGoals: false,
      });
      expect(result.current.currentActionByField).toEqual({});
      expect(result.current.moderationError).toBeNull();
      expect(result.current.sufficiency).toBeNull();
    });
  });

  describe('setSuggestions', () => {
    it('should update suggestions partially', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSuggestions({
          names: ['Project Alpha', 'Project Beta'],
          description: 'A new project description',
        });
      });

      expect(result.current.suggestions.names).toEqual([
        'Project Alpha',
        'Project Beta',
      ]);
      expect(result.current.suggestions.description).toBe(
        'A new project description'
      );
      expect(result.current.suggestions.targetUsers).toBe(''); // Should remain unchanged
    });

    it('should merge new suggestions with existing ones', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSuggestions({ names: ['Name 1'] });
        result.current.setSuggestions({ description: 'Description 1' });
      });

      expect(result.current.suggestions.names).toEqual(['Name 1']);
      expect(result.current.suggestions.description).toBe('Description 1');
    });

    it('should update all suggestion fields', () => {
      const { result } = renderHook(() => useProjectAIStore());
      const completeSuggestions = {
        names: ['Project 1', 'Project 2', 'Project 3'],
        description: 'Complete description',
        targetUsers: 'Target audience',
        businessGoals: ['Goal 1', 'Goal 2'],
        businessModel: 'B2B SaaS',
        brandTone: 'Professional',
        keyServices: 'Service 1, Service 2',
        USP: 'Unique selling point',
        primaryCTA: 'Get Started',
        contactPreference: 'Email',
        additionalFeatures: 'Feature 1, Feature 2',
      };

      act(() => {
        result.current.setSuggestions(completeSuggestions);
      });

      expect(result.current.suggestions).toEqual(completeSuggestions);
    });
  });

  describe('generation flags', () => {
    it('should toggle showSuggestions', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setShowSuggestions(true);
      });
      expect(result.current.showSuggestions).toBe(true);

      act(() => {
        result.current.setShowSuggestions(false);
      });
      expect(result.current.showSuggestions).toBe(false);
    });

    it('should toggle isGenerating', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setIsGenerating(true);
      });
      expect(result.current.isGenerating).toBe(true);

      act(() => {
        result.current.setIsGenerating(false);
      });
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('field loading states', () => {
    it('should set loading state for individual fields', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldLoading('names', true);
      });
      expect(result.current.loading.names).toBe(true);
      expect(result.current.loading.description).toBe(false);

      act(() => {
        result.current.setFieldLoading('description', true);
      });
      expect(result.current.loading.names).toBe(true);
      expect(result.current.loading.description).toBe(true);
    });

    it('should handle all field loading states', () => {
      const { result } = renderHook(() => useProjectAIStore());
      const fields = [
        'names',
        'description',
        'targetUsers',
        'USP',
        'businessGoals',
      ] as const;

      fields.forEach((field) => {
        act(() => {
          result.current.setFieldLoading(field, true);
        });
        expect(result.current.loading[field]).toBe(true);
      });
    });

    it('should clear loading state for fields', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldLoading('names', true);
        result.current.setFieldLoading('names', false);
      });

      expect(result.current.loading.names).toBe(false);
    });
  });

  describe('field action tracking', () => {
    it('should set action for specific field', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldAction('description', 'makeItCatchy');
      });

      expect(result.current.currentActionByField.description).toBe(
        'makeItCatchy'
      );
    });

    it('should track multiple field actions', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldAction('description', 'makeItCatchy');
        result.current.setFieldAction('USP', 'makeItPunchy');
        result.current.setFieldAction('targetUsers', 'alternatives');
      });

      expect(result.current.currentActionByField.description).toBe(
        'makeItCatchy'
      );
      expect(result.current.currentActionByField.USP).toBe('makeItPunchy');
      expect(result.current.currentActionByField.targetUsers).toBe(
        'alternatives'
      );
    });

    it('should handle all chip actions', () => {
      const { result } = renderHook(() => useProjectAIStore());
      const actions = [
        'makeItCatchy',
        'makeItShorter',
        'makeItPunchy',
        'makeItBenefitFocused',
        'alternatives',
        'regenerate',
        '',
      ] as const;

      actions.forEach((action) => {
        act(() => {
          result.current.setFieldAction('description', action);
        });
        expect(result.current.currentActionByField.description).toBe(action);
      });
    });

    it('should update action for same field', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldAction('description', 'makeItCatchy');
        result.current.setFieldAction('description', 'makeItShorter');
      });

      expect(result.current.currentActionByField.description).toBe(
        'makeItShorter'
      );
    });
  });

  describe('content moderation', () => {
    it('should set moderation error', () => {
      const { result } = renderHook(() => useProjectAIStore());
      const error = {
        error: 'Content Policy Violation',
        message: 'Prohibited content detected',
        details: ['Reason 1', 'Reason 2'],
        code: 'CONTENT_REJECTED',
        requestId: 'req_123',
        timestamp: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.setModerationError(error);
      });

      expect(result.current.moderationError).toEqual(error);
    });

    it('should clear moderation error', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setModerationError({
          error: 'Test error',
          message: 'Test',
          details: [],
          code: 'TEST',
          requestId: 'test',
          timestamp: '2024-01-01',
        });
        result.current.setModerationError(null);
      });

      expect(result.current.moderationError).toBeNull();
    });

    it('should handle moderation error with multiple details', () => {
      const { result } = renderHook(() => useProjectAIStore());
      const error = {
        error: 'Violation',
        message: 'Multiple issues',
        details: [
          'Adult content detected',
          'Hate speech detected',
          'Violence detected',
        ],
        code: 'MULTIPLE_VIOLATIONS',
        requestId: 'req_456',
        timestamp: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.setModerationError(error);
      });

      expect(result.current.moderationError?.details).toHaveLength(3);
    });
  });

  describe('sufficiency validation', () => {
    it('should set sufficiency state', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSufficiency({
          isSufficient: true,
          followUpQuestions: ['What is your budget?', 'What is your timeline?'],
        });
      });

      expect(result.current.sufficiency?.isSufficient).toBe(true);
      expect(result.current.sufficiency?.followUpQuestions).toHaveLength(2);
    });

    it('should set insufficient state with follow-up questions', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSufficiency({
          isSufficient: false,
          followUpQuestions: ['Tell me more about your target audience'],
        });
      });

      expect(result.current.sufficiency?.isSufficient).toBe(false);
      expect(result.current.sufficiency?.followUpQuestions).toBeDefined();
    });

    it('should clear sufficiency state', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSufficiency({ isSufficient: true });
        result.current.setSufficiency(null);
      });

      expect(result.current.sufficiency).toBeNull();
    });

    it('should set sufficiency without follow-up questions', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setSufficiency({ isSufficient: true });
      });

      expect(result.current.sufficiency?.isSufficient).toBe(true);
      expect(result.current.sufficiency?.followUpQuestions).toBeUndefined();
    });
  });

  describe('clearValidation', () => {
    it('should clear both moderation error and sufficiency', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setModerationError({
          error: 'Test',
          message: 'Test',
          details: [],
          code: 'TEST',
          requestId: 'test',
          timestamp: '2024-01-01',
        });
        result.current.setSufficiency({ isSufficient: false });
        result.current.clearValidation();
      });

      expect(result.current.moderationError).toBeNull();
      expect(result.current.sufficiency).toBeNull();
    });

    it('should work when validation is already clear', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.clearValidation();
      });

      expect(result.current.moderationError).toBeNull();
      expect(result.current.sufficiency).toBeNull();
    });
  });

  describe('reset functionality', () => {
    it('should reset entire store to initial state', () => {
      const { result } = renderHook(() => useProjectAIStore());

      // Set various states
      act(() => {
        result.current.setSuggestions({
          names: ['Name 1'],
          description: 'Description',
        });
        result.current.setShowSuggestions(true);
        result.current.setIsGenerating(true);
        result.current.setFieldLoading('names', true);
        result.current.setFieldAction('description', 'makeItCatchy');
        result.current.setModerationError({
          error: 'Test',
          message: 'Test',
          details: [],
          code: 'TEST',
          requestId: 'test',
          timestamp: '2024-01-01',
        });
        result.current.setSufficiency({ isSufficient: false });
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.suggestions).toEqual({
        names: [],
        description: '',
        targetUsers: '',
        businessGoals: [],
        businessModel: '',
        brandTone: '',
        keyServices: '',
        USP: '',
        primaryCTA: '',
        contactPreference: '',
        additionalFeatures: '',
      });
      expect(result.current.showSuggestions).toBe(false);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.loading).toEqual({
        names: false,
        description: false,
        targetUsers: false,
        USP: false,
        businessGoals: false,
      });
      expect(result.current.currentActionByField).toEqual({});
      expect(result.current.moderationError).toBeNull();
      expect(result.current.sufficiency).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle full AI generation workflow', () => {
      const { result } = renderHook(() => useProjectAIStore());

      // Start generation
      act(() => {
        result.current.setIsGenerating(true);
        result.current.setFieldLoading('names', true);
        result.current.setFieldLoading('description', true);
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.loading.names).toBe(true);

      // Receive suggestions
      act(() => {
        result.current.setSuggestions({
          names: ['Project Alpha', 'Project Beta', 'Project Gamma'],
          description: 'Generated description',
          targetUsers: 'Generated target users',
          USP: 'Generated USP',
        });
        result.current.setFieldLoading('names', false);
        result.current.setFieldLoading('description', false);
        result.current.setIsGenerating(false);
        result.current.setShowSuggestions(true);
      });

      expect(result.current.suggestions.names).toHaveLength(3);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.showSuggestions).toBe(true);
    });

    it('should handle field-specific regeneration', () => {
      const { result } = renderHook(() => useProjectAIStore());

      // Initial suggestions
      act(() => {
        result.current.setSuggestions({
          description: 'Original description',
          targetUsers: 'Original users',
        });
      });

      // Regenerate description with specific action
      act(() => {
        result.current.setFieldAction('description', 'makeItCatchy');
        result.current.setFieldLoading('description', true);
      });

      expect(result.current.currentActionByField.description).toBe(
        'makeItCatchy'
      );
      expect(result.current.loading.description).toBe(true);

      // Update with new description
      act(() => {
        result.current.setSuggestions({
          description: 'Catchy new description!',
        });
        result.current.setFieldLoading('description', false);
      });

      expect(result.current.suggestions.description).toBe(
        'Catchy new description!'
      );
      expect(result.current.suggestions.targetUsers).toBe('Original users'); // Unchanged
    });

    it('should handle moderation rejection during generation', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setIsGenerating(true);
        result.current.setModerationError({
          error: 'Content Policy Violation',
          message: 'Content not allowed',
          details: ['Inappropriate content'],
          code: 'CONTENT_REJECTED',
          requestId: 'req_789',
          timestamp: '2024-01-01T00:00:00Z',
        });
        result.current.setIsGenerating(false);
      });

      expect(result.current.moderationError).toBeDefined();
      expect(result.current.isGenerating).toBe(false);
    });

    it('should track multiple simultaneous field loads', () => {
      const { result } = renderHook(() => useProjectAIStore());

      act(() => {
        result.current.setFieldLoading('names', true);
        result.current.setFieldLoading('description', true);
        result.current.setFieldLoading('USP', true);
      });

      expect(result.current.loading.names).toBe(true);
      expect(result.current.loading.description).toBe(true);
      expect(result.current.loading.USP).toBe(true);

      // Complete one field
      act(() => {
        result.current.setFieldLoading('names', false);
      });

      expect(result.current.loading.names).toBe(false);
      expect(result.current.loading.description).toBe(true);
      expect(result.current.loading.USP).toBe(true);
    });

    it('should handle sufficiency check with validation', () => {
      const { result } = renderHook(() => useProjectAIStore());

      // Check is insufficient
      act(() => {
        result.current.setSufficiency({
          isSufficient: false,
          followUpQuestions: [
            'What industry are you in?',
            'Who is your target audience?',
          ],
        });
      });

      expect(result.current.sufficiency?.isSufficient).toBe(false);
      expect(result.current.sufficiency?.followUpQuestions).toHaveLength(2);

      // User provides more info, now sufficient
      act(() => {
        result.current.setSufficiency({ isSufficient: true });
      });

      expect(result.current.sufficiency?.isSufficient).toBe(true);
    });
  });
});
