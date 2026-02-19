'use client';

import { projectTemplates } from '@/data/project-templates';
import { normalizeIndustryId } from '@/lib/industries';
import type { ProjectTemplate } from '@/types/project-types';
import { useEffect, useMemo, useState } from 'react';

const fetchLocalTemplates = async (): Promise<{ id: string }[]> => {
  try {
    const r = await fetch('/api/local-templates');
    const json = (await r.json()) as { templates: { id: string }[] };
    return json.templates || [];
  } catch {
    return [];
  }
};

type UseTemplateSelectorReturn = {
  activeCategory: string;
  setActiveCategory: (categoryId: string) => void;
  filteredTemplates: ProjectTemplate[];
  recommendedTemplates: ProjectTemplate[];
  otherTemplates: ProjectTemplate[];
  recommendedCategories: string[];
  clearFilters: () => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  initialized: boolean;
};

const industryToCategoryMap: Record<string, string[]> = {
  'consultants-coaches': ['personal-brand', 'services-agencies'],
  'therapists-psychologists': ['personal-brand', 'services-agencies'],
  'photographers-videographers': ['personal-brand', 'services-agencies'],
  'designers-creative-studios': ['personal-brand', 'services-agencies'],
  'personal-trainers-wellness': ['personal-brand', 'local-business'],
  'salons-barbers-spas': ['local-business', 'personal-brand'],
  'restaurants-cafes': ['local-business'],
  'content-creation': ['personal-brand', 'services-agencies'],
  'fashion-beauty': ['personal-brand', 'ecommerce-light'],
  'health-wellness': ['personal-brand', 'services-agencies'],
  other: ['personal-brand', 'services-agencies', 'local-business'],
};

// Industries where SaaS templates are allowed. For now, restrict to "other"
// so SaaS appears only when the business is explicitly not in a concrete niche.
const SAAS_ALLOWED_INDUSTRIES: string[] = ['other'];
const SAAS_CATEGORY_ID = 'saas-product';

export function useTemplateSelector(
  projectIndustry?: string,
  initialAvailableIds?: string[]
): UseTemplateSelectorReturn {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Normalize industry when provided so filtering is robust to AI / legacy values
  const normalizedIndustry = projectIndustry
    ? normalizeIndustryId(projectIndustry)
    : undefined;

  const isSaasAllowedForIndustry =
    !normalizedIndustry || SAAS_ALLOWED_INDUSTRIES.includes(normalizedIndustry);

  // Locally available templates (repo directories)
  const [availableIds, setAvailableIds] = useState<Set<string>>(
    () => new Set(initialAvailableIds || [])
  );
  const [initialized, setInitialized] = useState<boolean>(
    Boolean(initialAvailableIds && initialAvailableIds.length > 0)
  );

  // If not provided by the server, fetch client-side as a fallback
  useEffect(() => {
    if (initialized) return;
    let mounted = true;
    fetchLocalTemplates()
      .then((list) => {
        if (!mounted) return;
        setAvailableIds(new Set(list.map((t) => t.id)));
      })
      .finally(() => {
        if (mounted) setInitialized(true);
      });
    return () => {
      mounted = false;
    };
  }, [initialized]);

  const recommendedCategories = useMemo<string[]>(() => {
    if (!projectIndustry) return [];
    return industryToCategoryMap[projectIndustry] || [];
  }, [projectIndustry]);

  const filteredTemplates = useMemo<ProjectTemplate[]>(() => {
    // To avoid initial flicker, only show templates after local discovery completes
    // so we render the accurate set from the start.
    if (!initialized) return [];

    const published = projectTemplates
      .filter((t) => t.status === 'published')
      .filter((t) => availableIds.has(t.id))
      // Hide SaaS templates for industries where they don't make sense
      .filter((t) => {
        const categoryId =
          typeof t.category === 'string' ? t.category : t.category.id;
        if (!isSaasAllowedForIndustry && categoryId === SAAS_CATEGORY_ID) {
          return false;
        }
        return true;
      });

    const byCategory =
      activeCategory === 'all'
        ? published
        : published.filter((t) => {
            const categoryId =
              typeof t.category === 'string' ? t.category : t.category.id;
            return categoryId === activeCategory;
          });

    if (projectIndustry && recommendedCategories.length > 0) {
      return [...byCategory].sort((a, b) => {
        const aCategoryId =
          typeof a.category === 'string' ? a.category : a.category.id;
        const bCategoryId =
          typeof b.category === 'string' ? b.category : b.category.id;
        const aIsRecommended = recommendedCategories.includes(aCategoryId);
        const bIsRecommended = recommendedCategories.includes(bCategoryId);
        if (aIsRecommended && !bIsRecommended) return -1;
        if (!aIsRecommended && bIsRecommended) return 1;
        return 0;
      });
    }

    return byCategory;
  }, [
    activeCategory,
    projectIndustry,
    recommendedCategories,
    availableIds,
    initialized,
    isSaasAllowedForIndustry,
  ]);

  // Compute counts for each category (independent of current filter)
  const { categoryCounts, totalCount } = useMemo(() => {
    const published = projectTemplates
      .filter((t) => t.status === 'published')
      .filter((t) => (initialized ? availableIds.has(t.id) : true))
      // Keep industry-based SaaS visibility consistent in counts as well
      .filter((t) => {
        const categoryId =
          typeof t.category === 'string' ? t.category : t.category.id;
        if (!isSaasAllowedForIndustry && categoryId === SAAS_CATEGORY_ID) {
          return false;
        }
        return true;
      });

    const counts: Record<string, number> = {};
    for (const t of published) {
      const categoryId =
        typeof t.category === 'string' ? t.category : t.category.id;
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    }
    const total = published.length;
    return { categoryCounts: counts, totalCount: total };
  }, [availableIds, initialized, isSaasAllowedForIndustry]);

  const { recommendedTemplates, otherTemplates } = useMemo(() => {
    if (!projectIndustry || recommendedCategories.length === 0) {
      return {
        recommendedTemplates: [] as ProjectTemplate[],
        otherTemplates: filteredTemplates,
      };
    }
    const recommended = filteredTemplates.filter((t) => {
      const categoryId =
        typeof t.category === 'string' ? t.category : t.category.id;
      return recommendedCategories.includes(categoryId);
    });
    const others = filteredTemplates.filter((t) => {
      const categoryId =
        typeof t.category === 'string' ? t.category : t.category.id;
      return !recommendedCategories.includes(categoryId);
    });
    return { recommendedTemplates: recommended, otherTemplates: others };
  }, [filteredTemplates, projectIndustry, recommendedCategories]);

  const clearFilters = () => setActiveCategory('all');

  return {
    activeCategory,
    setActiveCategory,
    filteredTemplates,
    recommendedTemplates,
    otherTemplates,
    recommendedCategories,
    clearFilters,
    categoryCounts,
    totalCount,
    initialized,
  };
}

export type { UseTemplateSelectorReturn };
