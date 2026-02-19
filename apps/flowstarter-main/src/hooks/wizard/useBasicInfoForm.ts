import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  UVP_MAX,
  UVP_MIN,
} from '@/lib/content-limits';
import { useTranslations } from '@/lib/i18n';
import { NameValidator } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project-config';
import { useFormik } from 'formik';
import { useEffect } from 'react';
import * as Yup from 'yup';

export interface BasicInfoFormValues {
  name: string;
  description: string;
  userDescription: string;
  targetUsers: string;
  businessGoals: string;
  USP: string;
  industry: string;
}

export function useBasicInfoForm(projectConfig: ProjectConfig) {
  const { t } = useTranslations();

  const schema = Yup.object({
    name: Yup.string()
      .transform((val) => {
        const normalized = val ? NameValidator.normalize(val) : '';
        // Treat empty/whitespace as undefined so optional rules don't fire
        return normalized.trim() === '' ? undefined : normalized;
      })
      .notRequired()
      .test('name-format', t('basic.name.invalid'), (value) => {
        // Skip validation when name is empty/undefined
        if (typeof value !== 'string') return true;
        const result = NameValidator.isValid(value);
        return !!result.valid;
      }),
    description: Yup.string()
      .required(t('basic.userDescription.required'))
      .min(
        DESCRIPTION_MIN,
        t('basic.description.minLength', { characters: DESCRIPTION_MIN })
      )
      .max(
        DESCRIPTION_MAX,
        t('basic.description.maxLength', { characters: DESCRIPTION_MAX })
      ),
    userDescription: Yup.string()
      .transform((val) => (val || '').trim())
      .required(t('basic.userDescription.required'))
      .test(
        'sentence-count-1-4',
        t('basic.description.sentenceCount', { min: 1, max: 4 }),
        (value) => {
          const v = (value || '').trim();
          if (!v) return false;
          const normalized = v.replace(/\s+/g, ' ').trim();
          // Match sentences that end with proper punctuation (., !, or ?)
          const sentenceMatches = normalized.match(/[^.!?]+[.!?]+/g);
          const count = Array.isArray(sentenceMatches)
            ? sentenceMatches.length
            : 1; // treat a single non-punctuated phrase as one
          return count >= 1 && count <= 4;
        }
      )
      .max(
        DESCRIPTION_MAX,
        t('basic.description.maxLength', { characters: DESCRIPTION_MAX })
      ),
    targetUsers: Yup.string()
      .transform((val) => val || '')
      .required(t('basic.audience.required')),
    USP: Yup.string()
      .transform((val) => (val || '').trim())
      .required(t('basic.uvp.required'))
      .min(UVP_MIN, t('basic.uvp.minLength', { characters: UVP_MIN }))
      .max(UVP_MAX, t('basic.uvp.maxLength', { characters: UVP_MAX })),
    businessGoals: Yup.string()
      .transform((val) => (val || '').trim())
      .required(t('basic.audience.required')),
    industry: Yup.string()
      .transform((val) => val || '')
      .required(t('basic.audience.required')),
  });

  const formik = useFormik<BasicInfoFormValues>({
    initialValues: {
      name: projectConfig.name || '',
      description: projectConfig.description || '',
      userDescription: projectConfig.userDescription || '',
      targetUsers: projectConfig.targetUsers || '',
      businessGoals: projectConfig.businessGoals || '',
      USP: projectConfig.USP || '',
      industry: projectConfig?.designConfig?.businessInfo?.industry || '',
    },
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
    validationSchema: schema,
  });

  // Manually sync Formik values when projectConfig changes (for draft loading)
  // but only for specific fields that come from nested config
  useEffect(() => {
    const industry = projectConfig?.designConfig?.businessInfo?.industry || '';
    if (industry && industry !== formik.values.industry) {
      console.log('[useBasicInfoForm] Syncing industry to formik:', industry);
      formik.setFieldValue('industry', industry, false);
    }
  }, [projectConfig?.designConfig?.businessInfo?.industry, formik]);

  return {
    formik,
  };
}
