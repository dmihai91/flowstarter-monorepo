import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useValidationStatus } from '../useValidationStatus';

// Mock the useAssistantValidation hook - must use factory function
vi.mock('@/hooks/useAssistantValidation', () => ({
  useAssistantValidation: vi.fn(),
}));

// Import the mocked function after the mock is defined
import { useAssistantValidation } from '@/hooks/useAssistantValidation';

describe('useValidationStatus', () => {
  const mockPromptExamples = [
    'Create a portfolio website',
    'Build an e-commerce platform',
    'Launch a SaaS product',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value
    (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
      isValid: false,
      isGibberish: false,
      phraseCount: 0,
      wordCount: 0,
      meetsPhraseRequirement: false,
      meetsContentRequirement: false,
      hasContent: false,
    });
  });

  describe('with empty or insufficient input', () => {
    it('should return null status for empty description', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: '',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBeNull();
      expect(result.current.isSuggestedPrompt).toBe(false);
    });

    it('should return null status for very short description', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'short',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBeNull();
    });

    it('should return null for input with less than 10 characters', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'test desc',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBeNull();
    });
  });

  describe('generating state', () => {
    it('should return generating status when generation is in progress', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'A detailed project description that is long enough',
          isGenerating: true,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBe('generating');
    });

    it('should prioritize generating over validation', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'A description that would normally be insufficient',
          isGenerating: true,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBe('generating');
    });
  });

  describe('suggested prompts', () => {
    it('should recognize exact match with suggested prompt', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'Create a portfolio website',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(true);
      expect(result.current.validationStatus).toBe('sufficient');
    });

    it('should mark suggested prompt as sufficient even if validation would fail', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'Build an e-commerce platform',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(true);
      expect(result.current.validationStatus).toBe('sufficient');
    });

    it('should not recognize partial match as suggested prompt', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'Create a portfolio',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(false);
    });

    it('should be case sensitive when matching suggested prompts', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'create a portfolio website',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(false);
    });
  });

  describe('validation with custom descriptions', () => {
    it('should return sufficient for valid custom description', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc:
            'I need a website for my bakery business with online ordering',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(false);
      expect(result.current.validationStatus).toBe('sufficient');
    });

    it('should return insufficient for invalid custom description', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'I need a website for my business',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(false);
      expect(result.current.validationStatus).toBe('insufficient');
    });

    it('should handle long detailed descriptions', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
      });

      const longDescription = `
        I need a comprehensive e-commerce platform for my clothing brand.
        The website should have product catalog, shopping cart, payment integration,
        user accounts, order tracking, and inventory management.
        Target audience is fashion-conscious millennials aged 25-35.
      `.trim();

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: longDescription,
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBe('sufficient');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in description', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
        isGibberish: false,
        phraseCount: 0,
        wordCount: 0,
        meetsPhraseRequirement: false,
        meetsContentRequirement: false,
        hasContent: false,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: '   short   ',
          isGenerating: false,
          promptExamples: mockPromptExamples,
        })
      );

      expect(result.current.validationStatus).toBeNull();
    });

    it('should handle empty prompt examples array', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });

      const { result } = renderHook(() =>
        useValidationStatus({
          userDesc: 'A valid description with enough detail',
          isGenerating: false,
          promptExamples: [],
        })
      );

      expect(result.current.isSuggestedPrompt).toBe(false);
      expect(result.current.validationStatus).toBe('sufficient');
    });

    it('should handle validation changing from insufficient to sufficient', () => {
      // Set initial mock
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
        isGibberish: false,
        phraseCount: 1,
        wordCount: 5,
        meetsPhraseRequirement: false,
        meetsContentRequirement: false,
        hasContent: true,
      });

      const { result, rerender } = renderHook(
        ({ userDesc }) =>
          useValidationStatus({
            userDesc,
            isGenerating: false,
            promptExamples: mockPromptExamples,
          }),
        { initialProps: { userDesc: 'short description' } }
      );

      expect(result.current.validationStatus).toBe('insufficient');

      // Update mock for rerender
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });

      rerender({
        userDesc:
          'Now a much longer and more detailed description with specific requirements',
      });

      expect(result.current.validationStatus).toBe('sufficient');
    });
  });

  describe('state transitions', () => {
    it('should transition from null to insufficient to sufficient', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
        isGibberish: false,
        phraseCount: 0,
        wordCount: 0,
        meetsPhraseRequirement: false,
        meetsContentRequirement: false,
        hasContent: false,
      });

      const { result, rerender } = renderHook(
        ({ userDesc }) =>
          useValidationStatus({
            userDesc,
            isGenerating: false,
            promptExamples: mockPromptExamples,
          }),
        { initialProps: { userDesc: '' } }
      );

      // Start with empty (null)
      expect(result.current.validationStatus).toBeNull();

      // Add insufficient text
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: false,
        isGibberish: false,
        phraseCount: 1,
        wordCount: 5,
        meetsPhraseRequirement: false,
        meetsContentRequirement: false,
        hasContent: true,
      });
      rerender({ userDesc: 'need a website' });
      expect(result.current.validationStatus).toBe('insufficient');

      // Make it sufficient
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });
      rerender({
        userDesc:
          'I need a website for my consulting business with contact forms and portfolio',
      });
      expect(result.current.validationStatus).toBe('sufficient');
    });

    it('should handle generating state interruption', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });

      const { result, rerender } = renderHook(
        ({ isGenerating }) =>
          useValidationStatus({
            userDesc: 'A detailed description that would be sufficient',
            isGenerating,
            promptExamples: mockPromptExamples,
          }),
        { initialProps: { isGenerating: false } }
      );

      expect(result.current.validationStatus).toBe('sufficient');

      // Start generating
      rerender({ isGenerating: true });
      expect(result.current.validationStatus).toBe('generating');

      // Complete generating
      rerender({ isGenerating: false });
      expect(result.current.validationStatus).toBe('sufficient');
    });
  });

  describe('integration scenarios', () => {
    it('should work with real-world business descriptions', () => {
      (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
        isValid: true,
        isGibberish: false,
        phraseCount: 2,
        wordCount: 20,
        meetsPhraseRequirement: true,
        meetsContentRequirement: true,
        hasContent: true,
      });

      const descriptions = [
        'Online booking system for yoga studio with class schedules',
        'Real estate listing platform with property search and virtual tours',
        'Restaurant menu and reservation system with delivery integration',
        'Personal training app with workout tracking and meal plans',
      ];

      descriptions.forEach((desc) => {
        const { result } = renderHook(() =>
          useValidationStatus({
            userDesc: desc,
            isGenerating: false,
            promptExamples: mockPromptExamples,
          })
        );

        expect(result.current.validationStatus).toBe('sufficient');
        expect(result.current.isSuggestedPrompt).toBe(false);
      });
    });

    it('should handle rapid typing simulation', () => {
      const typingSequence = [
        'I',
        'I need',
        'I need a',
        'I need a website',
        'I need a website for',
        'I need a website for my',
        'I need a website for my bakery',
        'I need a website for my bakery with online ordering',
      ];

      typingSequence.forEach((text, index) => {
        const isLongEnough = text.length >= 10;
        const isValidValue = isLongEnough && index > 5;

        (useAssistantValidation as ReturnType<typeof vi.fn>).mockReturnValue({
          isValid: isValidValue,
          isGibberish: false,
          phraseCount: isValidValue ? 2 : 1,
          wordCount: isValidValue ? 20 : 5,
          meetsPhraseRequirement: isValidValue,
          meetsContentRequirement: isValidValue,
          hasContent: isLongEnough,
        });

        const { result } = renderHook(() =>
          useValidationStatus({
            userDesc: text,
            isGenerating: false,
            promptExamples: mockPromptExamples,
          })
        );

        if (!isLongEnough) {
          expect(result.current.validationStatus).toBeNull();
        } else if (index > 5) {
          expect(result.current.validationStatus).toBe('sufficient');
        } else {
          expect(result.current.validationStatus).toBe('insufficient');
        }
      });
    });
  });
});
