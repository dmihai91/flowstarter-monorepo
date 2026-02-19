export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

export async function moderateContent(description: string) {
  const res = await fetch('/api/ai/moderate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessInfo: {
        description: description.trim(),
        industry: 'general',
      },
    }),
  });

  if (res.status === 400) {
    const err = await res.json();
    throw err;
  }

  return res;
}

export async function evaluateDescription(description: string) {
  const res = await fetch('/api/ai/evaluate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessInfo: {
        description: description.trim(),
        industry: 'general',
        businessType: 'business',
      },
    }),
  });

  if (res.ok) {
    const json = await res.json();
    return json?.result;
  }

  return null;
}

// Track variation index per prompt to ensure different outputs
const promptVariationMap = new Map<string, number>();

export async function generateProjectDetails(prompt: string, industry: string) {
  // Ensure we have valid inputs
  const trimmedPrompt = prompt?.trim() || '';
  const validIndustry = industry?.trim() || 'other';

  if (!trimmedPrompt) {
    throw new Error('Prompt is required');
  }

  if (!validIndustry || validIndustry === '') {
    throw new Error('Industry is required');
  }

  // Track how many times this exact prompt has been used
  const promptKey = `${trimmedPrompt}:${validIndustry}`;
  const currentVariation = promptVariationMap.get(promptKey) || 0;
  promptVariationMap.set(promptKey, currentVariation + 1);

  const res = await fetch('/api/ai/generate-project-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: trimmedPrompt,
      businessInfo: {
        description: trimmedPrompt,
        industry: validIndustry,
      },
      variationIndex: currentVariation,
    }),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    const errorMessage =
      errorData.details || errorData.error || 'Generation failed';
    throw new Error(errorMessage);
  }

  const result = await res.json();

  // Validate that we got meaningful results
  if (
    !result.names ||
    result.names.length === 0 ||
    !result.description ||
    result.description.trim().length === 0
  ) {
    throw new Error(
      'Generated project details are empty. Please try again with more details about your business.'
    );
  }

  return result;
}
