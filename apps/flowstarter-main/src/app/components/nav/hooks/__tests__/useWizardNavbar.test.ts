import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWizardNavbar } from '../useWizardNavbar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock wizard store
vi.mock('@/store/wizard-store', () => ({
  useWizardStore: vi.fn(),
}));

// Mock project templates
vi.mock('@/data/project-templates', () => ({
  projectTemplates: [
    { id: 'saas-product-pro', name: 'SaaS Product Pro' },
    { id: 'local-business-pro', name: 'Local Business Pro' },
    { id: 'personal-brand-pro', name: 'Personal Brand Pro' },
  ],
}));

import { usePathname } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';

describe('useWizardNavbar', () => {
  const mockSetIsDiscarding = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnPublish = vi.fn();

  const defaultStoreState = {
    projectConfig: {
      name: '',
      template: { id: '' },
    },
    currentStep: 'details' as const,
    wizardActions: { canPublish: false },
    setIsDiscarding: mockSetIsDiscarding,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: not on wizard page
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

    // Setup default store mock
    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector(defaultStoreState)
    );
  });

  describe('isOnWizard detection', () => {
    it('should return isOnWizard=false when not on wizard page', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(false);
    });

    it('should return isOnWizard=true when on /dashboard/new', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(true);
    });

    it('should return isOnWizard=true when on /dashboard/new with query params', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new?mode=scratch'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(true);
    });

    it('should return isOnWizard=true when on /wizard/project', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/wizard/project'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(true);
    });

    it('should return isOnWizard=true when on /wizard/project/some-id', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/wizard/project/abc-123'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(true);
    });

    it('should return isOnWizard=false for similar but non-wizard paths', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/settings'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(false);
    });
  });

  describe('project name', () => {
    it('should return empty string when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: 'My Project', template: null },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.projectName).toBe('');
    });

    it('should return project name when on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: 'My Awesome Project', template: null },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.projectName).toBe('My Awesome Project');
    });
  });

  describe('template handling', () => {
    it('should return empty templateId when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: '', template: { id: 'saas-product-pro' } },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      // Returns empty because isOnWizard is false (conditional applied after read)
      expect(result.current.templateId).toBe('');
    });

    it('should return templateId when on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: '', template: { id: 'saas-product-pro' } },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.templateId).toBe('saas-product-pro');
    });

    it('should resolve templateName from templateId', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: '', template: { id: 'local-business-pro' } },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.templateName).toBe('Local Business Pro');
    });

    it('should return undefined templateName for unknown templateId', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        projectConfig: { name: '', template: { id: 'unknown-template' } },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.templateName).toBeUndefined();
    });
  });

  describe('currentStep', () => {
    it('should return null when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const storeState = {
        ...defaultStoreState,
        currentStep: 'review',
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.currentStep).toBeNull();
    });

    it('should return currentStep when on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        currentStep: 'basics',
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.currentStep).toBe('basics');
    });
  });

  describe('showTemplateName', () => {
    it('should return false when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const storeState = {
        ...defaultStoreState,
        currentStep: 'review',
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.showTemplateName).toBe(false);
    });

    it('should return false when on wizard but not on review step', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        currentStep: 'basics',
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.showTemplateName).toBe(false);
    });

    it('should return true when on wizard and on review step', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const storeState = {
        ...defaultStoreState,
        currentStep: 'review',
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.showTemplateName).toBe(true);
    });
  });

  describe('wizardActions', () => {
    it('should return null when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const storeState = {
        ...defaultStoreState,
        wizardActions: {
          onCancel: mockOnCancel,
          onPublish: mockOnPublish,
          canPublish: true,
        },
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.wizardActions).toBeNull();
    });

    it('should return wizardActions when on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const wizardActions = {
        onCancel: mockOnCancel,
        onPublish: mockOnPublish,
        canPublish: true,
      };
      const storeState = {
        ...defaultStoreState,
        wizardActions,
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.wizardActions).toEqual(wizardActions);
    });
  });

  describe('setIsDiscarding', () => {
    it('should always return setIsDiscarding function', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.setIsDiscarding).toBe(mockSetIsDiscarding);
    });

    it('should return same setIsDiscarding when on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.setIsDiscarding).toBe(mockSetIsDiscarding);
    });
  });

  describe('full state integration', () => {
    it('should return complete state when on wizard with all data', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        '/dashboard/new'
      );

      const wizardActions = {
        onCancel: mockOnCancel,
        onPublish: mockOnPublish,
        canPublish: true,
      };
      const storeState = {
        projectConfig: {
          name: 'My SaaS Product',
          template: { id: 'saas-product-pro' },
        },
        currentStep: 'review',
        wizardActions,
        setIsDiscarding: mockSetIsDiscarding,
      };
      (
        useWizardStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((selector: (state: typeof storeState) => unknown) =>
        selector(storeState)
      );

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current).toEqual({
        isOnWizard: true,
        projectName: 'My SaaS Product',
        templateId: 'saas-product-pro',
        templateName: 'SaaS Product Pro',
        currentStep: 'review',
        showTemplateName: true,
        wizardActions,
        setIsDiscarding: mockSetIsDiscarding,
      });
    });

    it('should return minimal state when not on wizard', () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');

      const { result } = renderHook(() => useWizardNavbar());

      expect(result.current.isOnWizard).toBe(false);
      expect(result.current.projectName).toBe('');
      expect(result.current.templateId).toBe('');
      expect(result.current.currentStep).toBeNull();
      expect(result.current.showTemplateName).toBe(false);
      expect(result.current.wizardActions).toBeNull();
    });
  });
});
