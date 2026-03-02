'use client';

import { useState, useCallback } from 'react';
import { useApiMutation } from './useApiMutation';

interface FeedbackData {
  category: string;
  message: string;
  email: string;
}

/**
 * Hook for submitting feedback.
 * Single responsibility: form state + submission.
 */
export function useFeedback(onSuccess?: () => void) {
  const [formData, setFormData] = useState<FeedbackData>({
    category: '',
    message: '',
    email: '',
  });

  const { mutate, isPending, error } = useApiMutation<FeedbackData>(
    '/api/feedback',
    'POST',
    { onSuccess: () => { resetForm(); onSuccess?.(); } }
  );

  const resetForm = useCallback(() => {
    setFormData({ category: '', message: '', email: '' });
  }, []);

  const submit = useCallback(async () => {
    return mutate(formData);
  }, [mutate, formData]);

  const updateField = useCallback(<K extends keyof FeedbackData>(field: K, value: FeedbackData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    if (!formData.category) return 'Category is required';
    if (!formData.message.trim()) return 'Message is required';
    if (formData.message.trim().length < 10) return 'Message too short';
    return null;
  }, [formData]);

  return { formData, updateField, submit, validate, isPending, error, resetForm };
}
