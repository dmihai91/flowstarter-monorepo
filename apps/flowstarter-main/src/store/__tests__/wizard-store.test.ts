import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore, initialProjectConfig } from '../wizard-store';

describe('wizard-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useWizardStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useWizardStore());

      expect(result.current.currentStep).toBe('details');
      expect(result.current.projectConfig).toEqual(initialProjectConfig);
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.selectedIndustry).toBeUndefined();
      expect(result.current.hasAIGenerated).toBe(false);
      expect(result.current.isDiscarding).toBe(false);
      expect(result.current.detailsPhase).toBe('collect');
      expect(result.current.showSummary).toBe(false);
      expect(result.current.templatePath).toBeNull();
      expect(result.current.showAssistantTransition).toBe(false);
      expect(result.current.lastGeneratedDescription).toBeNull();
      expect(result.current.startedWithTemplate).toBe(false);
      expect(result.current.skipLoadingScreen).toBe(false);
      expect(result.current.prefillData).toBeNull();
      expect(result.current.prefillImages).toEqual([]);
      expect(result.current.wizardActions.canPublish).toBe(false);
    });
  });

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setCurrentStep('template');
      });

      expect(result.current.currentStep).toBe('template');
    });

    it('should handle all wizard steps', () => {
      const { result } = renderHook(() => useWizardStore());
      const steps = ['details', 'template', 'design', 'review'] as const;

      steps.forEach((step) => {
        act(() => {
          result.current.setCurrentStep(step);
        });
        expect(result.current.currentStep).toBe(step);
      });
    });
  });

  describe('setProjectConfig', () => {
    it('should update project config', () => {
      const { result } = renderHook(() => useWizardStore());
      const newConfig = {
        ...initialProjectConfig,
        name: 'Test Project',
        description: 'Test Description',
      };

      act(() => {
        result.current.setProjectConfig(newConfig);
      });

      expect(result.current.projectConfig.name).toBe('Test Project');
      expect(result.current.projectConfig.description).toBe('Test Description');
    });

    it('should handle partial config updates', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setProjectConfig({
          ...result.current.projectConfig,
          targetUsers: 'Small business owners',
        });
      });

      expect(result.current.projectConfig.targetUsers).toBe(
        'Small business owners'
      );
      expect(result.current.projectConfig.name).toBe('');
    });
  });

  describe('wizard navigation flags', () => {
    it('should set isLoaded flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setIsLoaded(true);
      });

      expect(result.current.isLoaded).toBe(true);
    });

    it('should set hasAIGenerated flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setHasAIGenerated(true);
      });

      expect(result.current.hasAIGenerated).toBe(true);
    });

    it('should set isDiscarding flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setIsDiscarding(true);
      });

      expect(result.current.isDiscarding).toBe(true);
    });

    it('should toggle details phase between collect and refine', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setDetailsPhase('refine');
      });
      expect(result.current.detailsPhase).toBe('refine');

      act(() => {
        result.current.setDetailsPhase('collect');
      });
      expect(result.current.detailsPhase).toBe('collect');
    });

    it('should set showSummary flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setShowSummary(true);
      });

      expect(result.current.showSummary).toBe(true);
    });
  });

  describe('template path management', () => {
    it('should set template path to recommendations', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setTemplatePath('recommendations');
      });

      expect(result.current.templatePath).toBe('recommendations');
    });

    it('should set template path to gallery', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setTemplatePath('gallery');
      });

      expect(result.current.templatePath).toBe('gallery');
    });

    it('should set template path to scratch', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setTemplatePath('scratch');
      });

      expect(result.current.templatePath).toBe('scratch');
    });

    it('should set template path to null', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setTemplatePath('gallery');
        result.current.setTemplatePath(null);
      });

      expect(result.current.templatePath).toBeNull();
    });
  });

  describe('assistant transition', () => {
    it('should toggle showAssistantTransition', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setShowAssistantTransition(true);
      });
      expect(result.current.showAssistantTransition).toBe(true);

      act(() => {
        result.current.setShowAssistantTransition(false);
      });
      expect(result.current.showAssistantTransition).toBe(false);
    });

    it('should set lastGeneratedDescription', () => {
      const { result } = renderHook(() => useWizardStore());
      const description = 'AI generated description';

      act(() => {
        result.current.setLastGeneratedDescription(description);
      });

      expect(result.current.lastGeneratedDescription).toBe(description);
    });
  });

  describe('template-first flow', () => {
    it('should set startedWithTemplate flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setStartedWithTemplate(true);
      });

      expect(result.current.startedWithTemplate).toBe(true);
    });

    it('should set skipLoadingScreen flag', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setSkipLoadingScreen(true);
      });

      expect(result.current.skipLoadingScreen).toBe(true);
    });
  });

  describe('hosted domain availability', () => {
    it('should set hosted availability state', () => {
      const { result } = renderHook(() => useWizardStore());
      const availabilityState = {
        suggestedDomain: 'test-project.flowstarter.app',
        isAvailable: true,
        checking: false,
        lastCheckedName: 'test-project',
        error: undefined,
      };

      act(() => {
        result.current.setHostedAvailability(availabilityState);
      });

      expect(result.current.hostedAvailability).toEqual(availabilityState);
    });

    it('should reset hosted availability', () => {
      const { result } = renderHook(() => useWizardStore());

      // Set some availability state first
      act(() => {
        result.current.setHostedAvailability({
          suggestedDomain: 'test.flowstarter.app',
          isAvailable: true,
          checking: false,
          lastCheckedName: 'test',
          error: undefined,
        });
      });

      // Reset it
      act(() => {
        result.current.resetHostedAvailability();
      });

      expect(result.current.hostedAvailability).toEqual({
        suggestedDomain: null,
        isAvailable: null,
        checking: false,
        lastCheckedName: null,
        error: undefined,
      });
    });
  });

  describe('prefill data management', () => {
    it('should set prefill data', () => {
      const { result } = renderHook(() => useWizardStore());
      const prefillData = {
        name: 'Prefilled Project',
        description: 'Prefilled description',
        images: ['image1.jpg', 'image2.jpg'],
      };

      act(() => {
        result.current.setPrefillData(prefillData);
      });

      expect(result.current.prefillData).toEqual(prefillData);
    });

    it('should set prefill images', () => {
      const { result } = renderHook(() => useWizardStore());
      const images = [
        { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
        { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
      ];

      act(() => {
        result.current.setPrefillImages(images);
      });

      expect(result.current.prefillImages).toEqual(images);
    });

    it('should clear prefill data', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setPrefillData({ name: 'Test' });
        result.current.setPrefillData(null);
      });

      expect(result.current.prefillData).toBeNull();
    });
  });

  describe('wizard actions', () => {
    it('should set wizard actions', () => {
      const { result } = renderHook(() => useWizardStore());
      const onCancel = () => console.log('cancel');
      const onPublish = () => console.log('publish');

      act(() => {
        result.current.setWizardActions({
          onCancel,
          onPublish,
          canPublish: true,
        });
      });

      expect(result.current.wizardActions.onCancel).toBe(onCancel);
      expect(result.current.wizardActions.onPublish).toBe(onPublish);
      expect(result.current.wizardActions.canPublish).toBe(true);
    });

    it('should merge wizard actions', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setWizardActions({ canPublish: true });
      });
      expect(result.current.wizardActions.canPublish).toBe(true);

      act(() => {
        result.current.setWizardActions({
          onCancel: () => {},
        });
      });
      expect(result.current.wizardActions.canPublish).toBe(true);
      expect(result.current.wizardActions.onCancel).toBeDefined();
    });
  });

  describe('industry selection', () => {
    it('should set selected industry', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setSelectedIndustry('technology');
      });

      expect(result.current.selectedIndustry).toBe('technology');
    });

    it('should clear selected industry', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setSelectedIndustry('technology');
        result.current.setSelectedIndustry(undefined);
      });

      expect(result.current.selectedIndustry).toBeUndefined();
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useWizardStore());

      // Change multiple state values
      act(() => {
        result.current.setCurrentStep('review');
        result.current.setProjectConfig({
          ...initialProjectConfig,
          name: 'Test Project',
        });
        result.current.setIsLoaded(true);
        result.current.setHasAIGenerated(true);
        result.current.setDetailsPhase('refine');
        result.current.setShowSummary(true);
        result.current.setTemplatePath('gallery');
        result.current.setStartedWithTemplate(true);
      });

      // Reset everything
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe('details');
      expect(result.current.projectConfig).toEqual(initialProjectConfig);
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.detailsPhase).toBe('collect');
      expect(result.current.showSummary).toBe(false);
      expect(result.current.templatePath).toBeNull();
      expect(result.current.showAssistantTransition).toBe(false);
      expect(result.current.startedWithTemplate).toBe(false);
      expect(result.current.skipLoadingScreen).toBe(false);
      expect(result.current.prefillData).toBeNull();
      expect(result.current.prefillImages).toEqual([]);
    });

    it('should reset with custom initial config', () => {
      const { result } = renderHook(() => useWizardStore());
      const customConfig = {
        ...initialProjectConfig,
        name: 'Custom Initial Project',
      };

      act(() => {
        result.current.reset(customConfig);
      });

      expect(result.current.projectConfig.name).toBe('Custom Initial Project');
      expect(result.current.currentStep).toBe('details');
    });

    it('should preserve isDiscarding state during reset', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setIsDiscarding(true);
        result.current.reset();
      });

      // isDiscarding should be preserved to prevent flicker
      expect(result.current.isDiscarding).toBe(true);
    });
  });

  describe('complex workflow scenarios', () => {
    it('should handle AI-generated flow', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        // Simulate AI generation
        result.current.setHasAIGenerated(true);
        result.current.setDetailsPhase('refine');
        result.current.setShowSummary(true);
        result.current.setLastGeneratedDescription('AI generated description');
        result.current.setProjectConfig({
          ...initialProjectConfig,
          name: 'AI Project',
          description: 'AI generated description',
          targetUsers: 'Target users',
          businessGoals: 'Business goals',
        });
      });

      expect(result.current.hasAIGenerated).toBe(true);
      expect(result.current.detailsPhase).toBe('refine');
      expect(result.current.showSummary).toBe(true);
      expect(result.current.lastGeneratedDescription).toBe(
        'AI generated description'
      );
      expect(result.current.projectConfig.name).toBe('AI Project');
    });

    it('should handle template-first flow', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setStartedWithTemplate(true);
        result.current.setCurrentStep('template');
        result.current.setTemplatePath('gallery');
      });

      expect(result.current.startedWithTemplate).toBe(true);
      expect(result.current.currentStep).toBe('template');
      expect(result.current.templatePath).toBe('gallery');
    });

    it('should handle details-first with assistant transition', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        result.current.setCurrentStep('details');
        result.current.setDetailsPhase('refine');
        result.current.setShowAssistantTransition(true);
        result.current.setTemplatePath('recommendations');
      });

      expect(result.current.currentStep).toBe('details');
      expect(result.current.detailsPhase).toBe('refine');
      expect(result.current.showAssistantTransition).toBe(true);
      expect(result.current.templatePath).toBe('recommendations');
    });

    it('should handle draft discard flow', () => {
      const { result } = renderHook(() => useWizardStore());

      act(() => {
        // Set up some draft state
        result.current.setProjectConfig({
          ...initialProjectConfig,
          name: 'Draft Project',
        });
        result.current.setCurrentStep('review');

        // Start discarding
        result.current.setIsDiscarding(true);

        // Reset (but preserve isDiscarding)
        result.current.reset();
      });

      expect(result.current.isDiscarding).toBe(true);
      expect(result.current.projectConfig).toEqual(initialProjectConfig);
      expect(result.current.currentStep).toBe('details');
    });
  });
});
