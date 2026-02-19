import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  UVP_MAX,
  UVP_MIN,
} from '@/lib/content-limits';
import { I18nProvider } from '@/lib/i18n';
import en from '@/locales/en';
import type { ProjectConfig } from '@/types/project-config';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBasicInfoForm } from '../useBasicInfoForm';

const initialMessages = { en };

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale="en" initialMessages={initialMessages}>
      {children}
    </I18nProvider>
  );
}

const baseConfig: ProjectConfig = {
  template: {
    id: '',
    name: '',
    description: '',
    category: 'business',
    features: [],
    complexity: 'simple',
  },
  name: '',
  description: '',
  targetUsers: '',
  businessGoals: '',
  businessModel: '',
  brandTone: '',
  keyServices: '',
  USP: '',
  primaryCTA: '',
  contactPreference: '',
  additionalFeatures: '',
  designConfig: {
    selectedPalette: 0,
    primaryColor: '#3b82f6',
    generatedPalettes: [],
    logoOption: 'ai',
    logoPrompt: '',
  },
  domainConfig: { domain: '', provider: 'platform', domainType: 'hosted' },
};

describe('useBasicInfoForm validation', () => {
  it('validates description min and max using shared limits', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    // Too short - should fail
    await act(async () => {
      await result.current.formik.setFieldValue(
        'description',
        'a'.repeat(DESCRIPTION_MIN - 1)
      );
      await result.current.formik.setFieldTouched('description', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.description).toBeDefined();
    });

    // Too long - should fail
    await act(async () => {
      await result.current.formik.setFieldValue(
        'description',
        'a'.repeat(DESCRIPTION_MAX + 1)
      );
    });

    await waitFor(() => {
      expect(result.current.formik.errors.description).toBeDefined();
    });

    // Just right - should pass
    await act(async () => {
      await result.current.formik.setFieldValue(
        'description',
        'a'.repeat(DESCRIPTION_MIN)
      );
    });

    await waitFor(() => {
      expect(result.current.formik.errors.description).toBeUndefined();
    });
  });

  it('validates UVP min and max using shared limits', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    // Too short - should fail
    await act(async () => {
      await result.current.formik.setFieldValue('USP', 'a'.repeat(UVP_MIN - 1));
      await result.current.formik.setFieldTouched('USP', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.USP).toBeDefined();
    });

    // Too long - should fail
    await act(async () => {
      await result.current.formik.setFieldValue('USP', 'a'.repeat(UVP_MAX + 1));
    });

    await waitFor(() => {
      expect(result.current.formik.errors.USP).toBeDefined();
    });

    // Just right - should pass
    await act(async () => {
      await result.current.formik.setFieldValue('USP', 'a'.repeat(UVP_MIN));
    });

    await waitFor(() => {
      expect(result.current.formik.errors.USP).toBeUndefined();
    });
  });

  it('validates name format', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    // Valid name
    await act(async () => {
      await result.current.formik.setFieldValue('name', 'Valid Project Name');
    });

    await waitFor(() => {
      expect(result.current.formik.errors.name).toBeUndefined();
    });

    // Empty name is allowed (not required)
    await act(async () => {
      await result.current.formik.setFieldValue('name', '');
    });

    await waitFor(() => {
      expect(result.current.formik.errors.name).toBeUndefined();
    });
  });

  it('validates userDescription sentence count', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    // Valid: 1 sentence
    await act(async () => {
      await result.current.formik.setFieldValue(
        'userDescription',
        'This is a valid sentence.'
      );
    });

    await waitFor(() => {
      expect(result.current.formik.errors.userDescription).toBeUndefined();
    });

    // Valid: 4 sentences
    await act(async () => {
      await result.current.formik.setFieldValue(
        'userDescription',
        'First sentence. Second sentence. Third sentence. Fourth sentence.'
      );
    });

    await waitFor(() => {
      expect(result.current.formik.errors.userDescription).toBeUndefined();
    });

    // Invalid: Too many sentences (5)
    await act(async () => {
      await result.current.formik.setFieldValue(
        'userDescription',
        'One. Two. Three. Four. Five.'
      );
    });

    await waitFor(() => {
      expect(result.current.formik.errors.userDescription).toBeDefined();
    });
  });

  it('validates required fields', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    // description is required
    await act(async () => {
      await result.current.formik.setFieldValue('description', '');
      await result.current.formik.setFieldTouched('description', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.description).toBeDefined();
    });

    // targetUsers is required
    await act(async () => {
      await result.current.formik.setFieldValue('targetUsers', '');
      await result.current.formik.setFieldTouched('targetUsers', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.targetUsers).toBeDefined();
    });

    // businessGoals is required
    await act(async () => {
      await result.current.formik.setFieldValue('businessGoals', '');
      await result.current.formik.setFieldTouched('businessGoals', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.businessGoals).toBeDefined();
    });
  });

  it('initializes with provided config values', () => {
    const config = {
      ...baseConfig,
      name: 'Test Project',
      description: 'Test Description',
      USP: 'Test USP',
      targetUsers: 'Test Users',
      businessGoals: 'Test Goals',
    };

    const { result } = renderHook(() => useBasicInfoForm(config), {
      wrapper,
    });

    expect(result.current.formik.values.name).toBe('Test Project');
    expect(result.current.formik.values.description).toBe('Test Description');
    expect(result.current.formik.values.USP).toBe('Test USP');
    expect(result.current.formik.values.targetUsers).toBe('Test Users');
    expect(result.current.formik.values.businessGoals).toBe('Test Goals');
  });

  it('syncs industry from designConfig', async () => {
    const config: ProjectConfig = {
      ...baseConfig,
      designConfig: {
        ...baseConfig.designConfig,
        businessInfo: {
          industry: 'technology',
          targetAudience: '',
          brandValues: '',
          competitors: '',
          additionalNotes: '',
        },
      },
    };

    const { result } = renderHook(() => useBasicInfoForm(config), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.formik.values.industry).toBe('technology');
    });
  });

  it('validates industry is required', async () => {
    const { result } = renderHook(() => useBasicInfoForm(baseConfig), {
      wrapper,
    });

    await act(async () => {
      await result.current.formik.setFieldValue('industry', '');
      await result.current.formik.setFieldTouched('industry', true);
    });

    await waitFor(() => {
      expect(result.current.formik.errors.industry).toBeDefined();
    });
  });
});
