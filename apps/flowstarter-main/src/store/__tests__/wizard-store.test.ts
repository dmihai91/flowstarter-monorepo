import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock safe-storage before importing the store
vi.mock('@/lib/safe-storage', () => {
  const store: Record<string, string> = {};
  return {
    safeSessionStorage: {
      getItem: (name: string) => store[name] ?? null,
      setItem: (name: string, value: string) => { store[name] = value; },
      removeItem: (name: string) => { delete store[name]; },
    },
  };
});

import { useWizardStore, initialProjectConfig } from '../wizard-store';

describe('useWizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useWizardStore.getState();
    expect(state.currentStep).toBe('details');
    expect(state.projectConfig).toEqual(initialProjectConfig);
    expect(state.isLoaded).toBe(false);
    expect(state.hasAIGenerated).toBe(false);
    expect(state.isDiscarding).toBe(false);
    expect(state.detailsPhase).toBe('collect');
    expect(state.showSummary).toBe(false);
    expect(state.templatePath).toBeNull();
    expect(state.showAssistantTransition).toBe(false);
    expect(state.lastGeneratedDescription).toBeNull();
    expect(state.startedWithTemplate).toBe(false);
    expect(state.skipLoadingScreen).toBe(false);
    expect(state.hasGeneratedSite).toBe(false);
    expect(state.reviewState).toBeNull();
    expect(state.prefillData).toBeNull();
    expect(state.prefillImages).toEqual([]);
    expect(state.teamWizardData).toBeNull();
    expect(state.wizardActions).toEqual({ canPublish: false });
  });

  describe('step navigation', () => {
    it('sets current step', () => {
      useWizardStore.getState().setCurrentStep('template');
      expect(useWizardStore.getState().currentStep).toBe('template');
    });

    it('navigates through all steps', () => {
      const steps = ['details', 'template', 'design', 'review'] as const;
      for (const step of steps) {
        useWizardStore.getState().setCurrentStep(step);
        expect(useWizardStore.getState().currentStep).toBe(step);
      }
    });
  });

  describe('setProjectConfig', () => {
    it('sets project config', () => {
      const config = { ...initialProjectConfig, name: 'Test Project' };
      useWizardStore.getState().setProjectConfig(config);
      expect(useWizardStore.getState().projectConfig.name).toBe('Test Project');
    });

    it('replaces entire config', () => {
      const config = { ...initialProjectConfig, name: 'First', description: 'Desc' };
      useWizardStore.getState().setProjectConfig(config);
      const updated = { ...initialProjectConfig, name: 'Second' };
      useWizardStore.getState().setProjectConfig(updated);
      expect(useWizardStore.getState().projectConfig.name).toBe('Second');
      expect(useWizardStore.getState().projectConfig.description).toBe('');
    });
  });

  describe('boolean setters', () => {
    it('setIsLoaded', () => {
      useWizardStore.getState().setIsLoaded(true);
      expect(useWizardStore.getState().isLoaded).toBe(true);
    });

    it('setHasAIGenerated', () => {
      useWizardStore.getState().setHasAIGenerated(true);
      expect(useWizardStore.getState().hasAIGenerated).toBe(true);
    });

    it('setIsDiscarding', () => {
      useWizardStore.getState().setIsDiscarding(true);
      expect(useWizardStore.getState().isDiscarding).toBe(true);
    });

    it('setShowSummary', () => {
      useWizardStore.getState().setShowSummary(true);
      expect(useWizardStore.getState().showSummary).toBe(true);
    });

    it('setShowAssistantTransition', () => {
      useWizardStore.getState().setShowAssistantTransition(true);
      expect(useWizardStore.getState().showAssistantTransition).toBe(true);
    });

    it('setStartedWithTemplate', () => {
      useWizardStore.getState().setStartedWithTemplate(true);
      expect(useWizardStore.getState().startedWithTemplate).toBe(true);
    });

    it('setSkipLoadingScreen', () => {
      useWizardStore.getState().setSkipLoadingScreen(true);
      expect(useWizardStore.getState().skipLoadingScreen).toBe(true);
    });

    it('setHasGeneratedSite', () => {
      useWizardStore.getState().setHasGeneratedSite(true);
      expect(useWizardStore.getState().hasGeneratedSite).toBe(true);
    });
  });

  describe('setDetailsPhase', () => {
    it('sets to refine', () => {
      useWizardStore.getState().setDetailsPhase('refine');
      expect(useWizardStore.getState().detailsPhase).toBe('refine');
    });

    it('sets back to collect', () => {
      useWizardStore.getState().setDetailsPhase('refine');
      useWizardStore.getState().setDetailsPhase('collect');
      expect(useWizardStore.getState().detailsPhase).toBe('collect');
    });
  });

  describe('setTemplatePath', () => {
    it('sets template path', () => {
      useWizardStore.getState().setTemplatePath('gallery');
      expect(useWizardStore.getState().templatePath).toBe('gallery');
    });

    it('sets to null', () => {
      useWizardStore.getState().setTemplatePath('recommendations');
      useWizardStore.getState().setTemplatePath(null);
      expect(useWizardStore.getState().templatePath).toBeNull();
    });

    it('accepts all valid paths', () => {
      const paths = ['recommendations', 'gallery', 'scratch'] as const;
      for (const p of paths) {
        useWizardStore.getState().setTemplatePath(p);
        expect(useWizardStore.getState().templatePath).toBe(p);
      }
    });
  });

  describe('setLastGeneratedDescription', () => {
    it('sets description', () => {
      useWizardStore.getState().setLastGeneratedDescription('Generated text');
      expect(useWizardStore.getState().lastGeneratedDescription).toBe('Generated text');
    });

    it('clears description', () => {
      useWizardStore.getState().setLastGeneratedDescription('text');
      useWizardStore.getState().setLastGeneratedDescription(null);
      expect(useWizardStore.getState().lastGeneratedDescription).toBeNull();
    });
  });

  describe('setSelectedIndustry', () => {
    it('sets industry', () => {
      useWizardStore.getState().setSelectedIndustry('Restaurant');
      expect(useWizardStore.getState().selectedIndustry).toBe('Restaurant');
    });

    it('clears industry', () => {
      useWizardStore.getState().setSelectedIndustry('Tech');
      useWizardStore.getState().setSelectedIndustry(undefined);
      expect(useWizardStore.getState().selectedIndustry).toBeUndefined();
    });
  });

  describe('setReviewState', () => {
    it('sets review state', () => {
      const review = {
        generatedCode: 'code',
        generatedFiles: [{ path: '/index.html', content: '<html/>' }],
        previewHtml: '<html/>',
        qualityMetrics: { score: 95 },
      };
      useWizardStore.getState().setReviewState(review);
      expect(useWizardStore.getState().reviewState).toEqual(review);
    });

    it('clears review state', () => {
      useWizardStore.getState().setReviewState({
        generatedCode: '',
        generatedFiles: [],
        previewHtml: '',
        qualityMetrics: null,
      });
      useWizardStore.getState().setReviewState(null);
      expect(useWizardStore.getState().reviewState).toBeNull();
    });
  });

  describe('hosted availability', () => {
    it('sets hosted availability', () => {
      const availability = {
        suggestedDomain: 'test.flowstarter.app',
        isAvailable: true,
        checking: false,
        lastCheckedName: 'test',
      };
      useWizardStore.getState().setHostedAvailability(availability);
      expect(useWizardStore.getState().hostedAvailability).toEqual(availability);
    });

    it('resets hosted availability', () => {
      useWizardStore.getState().setHostedAvailability({
        suggestedDomain: 'test.flowstarter.app',
        isAvailable: true,
        checking: false,
        lastCheckedName: 'test',
      });
      useWizardStore.getState().resetHostedAvailability();
      expect(useWizardStore.getState().hostedAvailability).toEqual({
        suggestedDomain: null,
        isAvailable: null,
        checking: false,
        lastCheckedName: null,
        error: undefined,
      });
    });
  });

  describe('prefill data', () => {
    it('sets prefill data', () => {
      const data = { name: 'Prefilled', description: 'Desc', images: ['img1.png'] };
      useWizardStore.getState().setPrefillData(data);
      expect(useWizardStore.getState().prefillData).toEqual(data);
    });

    it('clears prefill data', () => {
      useWizardStore.getState().setPrefillData({ name: 'Test' });
      useWizardStore.getState().setPrefillData(null);
      expect(useWizardStore.getState().prefillData).toBeNull();
    });

    it('sets prefill images', () => {
      const images = [{ url: 'https://img.com/1.png', name: 'logo.png' }];
      useWizardStore.getState().setPrefillImages(images);
      expect(useWizardStore.getState().prefillImages).toEqual(images);
    });
  });

  describe('team wizard data', () => {
    it('sets team wizard data', () => {
      const teamData = {
        clientName: 'John',
        clientEmail: 'john@test.com',
        clientPhone: '555-1234',
        businessName: 'Johns Cafe',
        description: 'A cafe',
        industry: 'Restaurant',
        targetAudience: 'Locals',
        uvp: 'Best coffee',
        goal: 'More customers',
        offerType: 'services',
        brandTone: 'friendly',
        businessEmail: 'info@cafe.com',
        businessPhone: '555-5678',
        businessAddress: '123 Main St',
        website: 'cafe.com',
        step: 2,
        isAIMode: true,
        projectId: 'proj-1',
      };
      useWizardStore.getState().setTeamWizardData(teamData);
      expect(useWizardStore.getState().teamWizardData).toEqual(teamData);
    });

    it('clears team wizard data', () => {
      useWizardStore.getState().setTeamWizardData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        businessName: '',
        description: '',
        industry: '',
        targetAudience: '',
        uvp: '',
        goal: '',
        offerType: '',
        brandTone: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
        website: '',
        step: 0,
        isAIMode: false,
        projectId: null,
      });
      useWizardStore.getState().setTeamWizardData(null);
      expect(useWizardStore.getState().teamWizardData).toBeNull();
    });
  });

  describe('setWizardActions', () => {
    it('merges wizard actions', () => {
      useWizardStore.getState().setWizardActions({ canPublish: true });
      expect(useWizardStore.getState().wizardActions.canPublish).toBe(true);
    });

    it('preserves existing actions when merging', () => {
      useWizardStore.getState().setWizardActions({ canPublish: true });
      useWizardStore.getState().setWizardActions({ onCancel: () => {} });
      expect(useWizardStore.getState().wizardActions.canPublish).toBe(true);
      expect(useWizardStore.getState().wizardActions.onCancel).toBeDefined();
    });
  });

  describe('reset', () => {
    it('resets to initial project config', () => {
      useWizardStore.getState().setProjectConfig({ ...initialProjectConfig, name: 'Modified' });
      useWizardStore.getState().setCurrentStep('review');
      useWizardStore.getState().setHasGeneratedSite(true);
      useWizardStore.getState().reset();

      const state = useWizardStore.getState();
      expect(state.projectConfig).toEqual(initialProjectConfig);
      expect(state.currentStep).toBe('details');
      expect(state.hasGeneratedSite).toBe(false);
    });

    it('accepts custom initial config', () => {
      const custom = { ...initialProjectConfig, name: 'Custom Start' };
      useWizardStore.getState().reset(custom);
      expect(useWizardStore.getState().projectConfig.name).toBe('Custom Start');
    });

    it('preserves isDiscarding state during reset', () => {
      useWizardStore.getState().setIsDiscarding(true);
      useWizardStore.getState().reset();
      expect(useWizardStore.getState().isDiscarding).toBe(true);
    });

    it('resets prefill and images', () => {
      useWizardStore.getState().setPrefillData({ name: 'prefill' });
      useWizardStore.getState().setPrefillImages([{ url: 'u', name: 'n' }]);
      useWizardStore.getState().reset();
      expect(useWizardStore.getState().prefillData).toBeNull();
      expect(useWizardStore.getState().prefillImages).toEqual([]);
    });

    it('resets wizard actions', () => {
      useWizardStore.getState().setWizardActions({ canPublish: true });
      useWizardStore.getState().reset();
      expect(useWizardStore.getState().wizardActions).toEqual({ canPublish: false });
    });
  });

  describe('initialProjectConfig', () => {
    it('has expected default values', () => {
      expect(initialProjectConfig.name).toBe('');
      expect(initialProjectConfig.description).toBe('');
      expect(initialProjectConfig.publishImmediately).toBe(true);
      expect(initialProjectConfig.template.category).toBe('business');
      expect(initialProjectConfig.template.complexity).toBe('simple');
      expect(initialProjectConfig.designConfig.primaryColor).toBe('#3b82f6');
      expect(initialProjectConfig.designConfig.logoOption).toBe('ai');
      expect(initialProjectConfig.domainConfig.provider).toBe('platform');
      expect(initialProjectConfig.domainConfig.domainType).toBe('hosted');
    });
  });
});
