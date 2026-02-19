import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore, initialProjectConfig } from '../wizard-store';

describe('Wizard Store - Draft Management', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWizardStore.setState({
      projectConfig: initialProjectConfig,
      currentStep: 'details',
      isLoaded: false,
      isDiscarding: false,
      detailsPhase: 'collect',
      showSummary: false,
      templatePath: null,
      showAssistantTransition: false,
      startedWithTemplate: false,
      skipLoadingScreen: false,
      prefillData: null,
      prefillImages: [],
    });
  });

  describe('Discard Draft Flow', () => {
    it('should set isDiscarding to true when discarding draft', () => {
      useWizardStore.getState().setIsDiscarding(true);
      expect(useWizardStore.getState().isDiscarding).toBe(true);
    });

    it('should set isDiscarding to false after discard completes', () => {
      useWizardStore.getState().setIsDiscarding(true);
      useWizardStore.getState().setIsDiscarding(false);
      expect(useWizardStore.getState().isDiscarding).toBe(false);
    });

    it('should preserve isDiscarding state during reset', () => {
      useWizardStore.getState().setIsDiscarding(true);
      useWizardStore.getState().reset();

      // isDiscarding should be preserved during reset to prevent flicker
      expect(useWizardStore.getState().isDiscarding).toBe(true);
    });

    it('should reset project config when discarding', () => {
      // Modify project config
      useWizardStore.setState({
        projectConfig: {
          ...initialProjectConfig,
          name: 'Draft Project',
          description: 'Draft Description',
        },
      });

      // Reset (simulating discard)
      useWizardStore.getState().reset();

      expect(useWizardStore.getState().projectConfig.name).toBe('');
      expect(useWizardStore.getState().projectConfig.description).toBe('');
    });

    it('should reset wizard UI states when discarding', () => {
      // Set some wizard states
      useWizardStore.setState({
        detailsPhase: 'refine',
        showSummary: true,
        showAssistantTransition: true,
        startedWithTemplate: true,
      });

      // Reset
      useWizardStore.getState().reset();

      expect(useWizardStore.getState().detailsPhase).toBe('collect');
      expect(useWizardStore.getState().showSummary).toBe(false);
      expect(useWizardStore.getState().showAssistantTransition).toBe(false);
      expect(useWizardStore.getState().startedWithTemplate).toBe(false);
    });
  });

  describe('Draft Restoration Flow', () => {
    it('should set isLoaded to true after draft loads', () => {
      useWizardStore.getState().setIsLoaded(true);
      expect(useWizardStore.getState().isLoaded).toBe(true);
    });

    it('should set isLoaded to false when starting new draft', () => {
      useWizardStore.getState().setIsLoaded(true);
      useWizardStore.getState().setIsLoaded(false);
      expect(useWizardStore.getState().isLoaded).toBe(false);
    });

    it('should restore project config from draft', () => {
      const draftConfig = {
        ...initialProjectConfig,
        name: 'Restored Draft',
        description: 'Restored Description',
        USP: 'Unique selling point',
      };

      useWizardStore.getState().setProjectConfig(draftConfig);

      expect(useWizardStore.getState().projectConfig.name).toBe(
        'Restored Draft'
      );
      expect(useWizardStore.getState().projectConfig.description).toBe(
        'Restored Description'
      );
      expect(useWizardStore.getState().projectConfig.USP).toBe(
        'Unique selling point'
      );
    });

    it('should restore wizard step from draft', () => {
      useWizardStore.getState().setCurrentStep('design');
      expect(useWizardStore.getState().currentStep).toBe('design');

      useWizardStore.getState().setCurrentStep('review');
      expect(useWizardStore.getState().currentStep).toBe('review');
    });

    it('should restore details phase from draft', () => {
      useWizardStore.getState().setDetailsPhase('refine');
      expect(useWizardStore.getState().detailsPhase).toBe('refine');
    });

    it('should restore UI states from draft', () => {
      useWizardStore.getState().setShowSummary(true);
      useWizardStore.getState().setShowAssistantTransition(true);
      useWizardStore.getState().setStartedWithTemplate(true);

      expect(useWizardStore.getState().showSummary).toBe(true);
      expect(useWizardStore.getState().showAssistantTransition).toBe(true);
      expect(useWizardStore.getState().startedWithTemplate).toBe(true);
    });

    it('should restore template path from draft', () => {
      useWizardStore.getState().setTemplatePath('gallery');
      expect(useWizardStore.getState().templatePath).toBe('gallery');

      useWizardStore.getState().setTemplatePath('recommendations');
      expect(useWizardStore.getState().templatePath).toBe('recommendations');

      useWizardStore.getState().setTemplatePath('scratch');
      expect(useWizardStore.getState().templatePath).toBe('scratch');
    });
  });

  describe('Draft Prefill Data', () => {
    it('should store prefill data for navigation', () => {
      const prefillData = {
        name: 'Prefilled Project',
        description: 'Prefilled description',
      };

      useWizardStore.getState().setPrefillData(prefillData);
      expect(useWizardStore.getState().prefillData).toEqual(prefillData);
    });

    it('should clear prefill data after use', () => {
      useWizardStore.getState().setPrefillData({ name: 'Test' });
      useWizardStore.getState().setPrefillData(null);
      expect(useWizardStore.getState().prefillData).toBeNull();
    });

    it('should store prefill images', () => {
      const images = [
        { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
        { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
      ];

      useWizardStore.getState().setPrefillImages(images);
      expect(useWizardStore.getState().prefillImages).toEqual(images);
    });

    it('should clear prefill images', () => {
      useWizardStore
        .getState()
        .setPrefillImages([{ url: 'test.jpg', name: 'test' }]);
      useWizardStore.getState().setPrefillImages([]);
      expect(useWizardStore.getState().prefillImages).toEqual([]);
    });
  });

  describe('Skip Loading Screen', () => {
    it('should set skipLoadingScreen flag', () => {
      useWizardStore.getState().setSkipLoadingScreen(true);
      expect(useWizardStore.getState().skipLoadingScreen).toBe(true);
    });

    it('should clear skipLoadingScreen flag', () => {
      useWizardStore.getState().setSkipLoadingScreen(true);
      useWizardStore.getState().setSkipLoadingScreen(false);
      expect(useWizardStore.getState().skipLoadingScreen).toBe(false);
    });
  });

  describe('Last Generated Description', () => {
    it('should store last generated description', () => {
      const description = 'AI generated description';
      useWizardStore.getState().setLastGeneratedDescription(description);
      expect(useWizardStore.getState().lastGeneratedDescription).toBe(
        description
      );
    });

    it('should clear last generated description', () => {
      useWizardStore.getState().setLastGeneratedDescription('test');
      useWizardStore.getState().setLastGeneratedDescription(null);
      expect(useWizardStore.getState().lastGeneratedDescription).toBeNull();
    });
  });

  describe('Wizard Actions for Navbar', () => {
    it('should set wizard actions', () => {
      const actions = {
        onCancel: () => {},
        onPublish: () => {},
        canPublish: true,
      };

      useWizardStore.getState().setWizardActions(actions);

      expect(useWizardStore.getState().wizardActions.canPublish).toBe(true);
      expect(useWizardStore.getState().wizardActions.onCancel).toBeDefined();
      expect(useWizardStore.getState().wizardActions.onPublish).toBeDefined();
    });

    it('should update wizard actions partially', () => {
      useWizardStore.getState().setWizardActions({ canPublish: false });
      expect(useWizardStore.getState().wizardActions.canPublish).toBe(false);

      useWizardStore.getState().setWizardActions({ canPublish: true });
      expect(useWizardStore.getState().wizardActions.canPublish).toBe(true);
    });

    it('should reset wizard actions on reset', () => {
      useWizardStore.getState().setWizardActions({
        canPublish: true,
        onCancel: () => {},
      });

      useWizardStore.getState().reset();

      expect(useWizardStore.getState().wizardActions.canPublish).toBe(false);
      expect(useWizardStore.getState().wizardActions.onCancel).toBeUndefined();
    });
  });
});
