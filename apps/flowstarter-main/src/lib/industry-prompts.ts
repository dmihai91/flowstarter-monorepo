import type { TranslationKeys, VarsFor } from './i18n';

type TranslationFunction = <K extends TranslationKeys>(
  key: K,
  vars?: VarsFor<K>
) => string;

/**
 * Gets industry-specific prompt examples
 * @param industry - The industry key (normalized without dashes)
 * @param t - Translation function
 * @returns Array of 3 industry-specific prompt examples, or generic examples if no industry is provided
 */
export function getIndustryPrompts(
  industry: string | undefined | null,
  t: TranslationFunction
): string[] {
  // If no industry is selected, return generic examples
  if (!industry) {
    return [
      t('assistant.prompts.examples.saas'),
      t('assistant.prompts.examples.localBusiness'),
      t('assistant.prompts.examples.portfolio'),
      t('assistant.prompts.examples.ecommerce'),
      t('assistant.prompts.examples.agency'),
      t('assistant.prompts.examples.consulting'),
    ];
  }

  // Normalize industry key (remove dashes, lowercase)
  const normalizedIndustry = industry.toLowerCase().replace(/-/g, '');

  // Map of industry keys to their translation keys
  const industryPromptMap: Record<string, TranslationKeys[]> = {
    consultantscoaches: [
      'assistant.prompts.industry.consultantscoaches.1',
      'assistant.prompts.industry.consultantscoaches.2',
      'assistant.prompts.industry.consultantscoaches.3',
    ],
    therapistspsychologists: [
      'assistant.prompts.industry.therapistspsychologists.1',
      'assistant.prompts.industry.therapistspsychologists.2',
      'assistant.prompts.industry.therapistspsychologists.3',
    ],
    photographersvideographers: [
      'assistant.prompts.industry.photographersvideographers.1',
      'assistant.prompts.industry.photographersvideographers.2',
      'assistant.prompts.industry.photographersvideographers.3',
    ],
    designerscreativestudios: [
      'assistant.prompts.industry.designerscreativestudios.1',
      'assistant.prompts.industry.designerscreativestudios.2',
      'assistant.prompts.industry.designerscreativestudios.3',
    ],
    personaltrainerswellness: [
      'assistant.prompts.industry.personaltrainerswellness.1',
      'assistant.prompts.industry.personaltrainerswellness.2',
      'assistant.prompts.industry.personaltrainerswellness.3',
    ],
    salonsbarbersspas: [
      'assistant.prompts.industry.salonsbarbersspas.1',
      'assistant.prompts.industry.salonsbarbersspas.2',
      'assistant.prompts.industry.salonsbarbersspas.3',
    ],
    restaurantscafes: [
      'assistant.prompts.industry.restaurantscafes.1',
      'assistant.prompts.industry.restaurantscafes.2',
      'assistant.prompts.industry.restaurantscafes.3',
    ],
    contentcreation: [
      'assistant.prompts.industry.contentcreation.1',
      'assistant.prompts.industry.contentcreation.2',
      'assistant.prompts.industry.contentcreation.3',
    ],
    fashionbeauty: [
      'assistant.prompts.industry.fashionbeauty.1',
      'assistant.prompts.industry.fashionbeauty.2',
      'assistant.prompts.industry.fashionbeauty.3',
    ],
    healthwellness: [
      'assistant.prompts.industry.healthwellness.1',
      'assistant.prompts.industry.healthwellness.2',
      'assistant.prompts.industry.healthwellness.3',
    ],
    other: [
      'assistant.prompts.industry.other.1',
      'assistant.prompts.industry.other.2',
      'assistant.prompts.industry.other.3',
    ],
  };

  // Get the prompts for this industry, or fall back to generic ones
  const promptKeys = industryPromptMap[normalizedIndustry];

  if (!promptKeys) {
    // Fallback to generic examples if industry not found
    return [
      t('assistant.prompts.examples.saas'),
      t('assistant.prompts.examples.localBusiness'),
      t('assistant.prompts.examples.portfolio'),
    ];
  }

  // Return translated prompts
  return promptKeys.map((key) => t(key));
}
