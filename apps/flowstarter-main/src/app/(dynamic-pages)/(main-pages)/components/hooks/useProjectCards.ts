import { useMemo } from 'react';
import { useTranslations } from '@/lib/i18n';
import type { Table as TableType } from '@/types';

export interface ProjectCard {
  id: string;
  name: string;
  description: string;
  templateLabel: string;
  createdAt?: string | null;
  generatedAt?: string | null;
  status: string;
  link: string;
  isDraft?: boolean;
}

function getTemplateLabel(raw: unknown): string {
  try {
    if (typeof raw === 'string') {
      switch (raw) {
        case 'personal-brand':
          return 'Personal Brand';
        case 'course-launch':
          return 'Course Launch';
        case 'local-business':
          return 'Local Business';
        case 'product-launch':
          return 'Product Launch';
        case 'mini-ecommerce':
          return 'Mini E-commerce';
        default:
          return raw.trim() || 'Custom';
      }
    }

    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;

      if ('name' in obj && typeof obj.name === 'string' && obj.name.trim()) {
        return obj.name.trim();
      }

      if ('id' in obj && typeof obj.id === 'string' && obj.id.trim()) {
        return obj.id
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  } catch (error) {
    console.debug('Error parsing template label:', error);
  }
  return 'Custom';
}

/**
 * Transforms raw project data into card view models.
 */
export function useProjectCards(projects: Array<TableType<'projects'>>): ProjectCard[] {
  const { t } = useTranslations();

  return useMemo(() => {
    const result: ProjectCard[] = [];

    for (const p of projects) {
      const isDraft = (p as unknown as { is_draft?: boolean }).is_draft === true;
      const name =
        typeof p.name === 'string'
          ? p.name
          : t('dashboard.projects.draftPlaceholderName');
      const description = typeof p.description === 'string' ? p.description : '';
      const link = isDraft ? `/wizard/project/${p.id}` : `/projects/${p.id}`;

      result.push({
        id: p.id,
        name,
        description,
        templateLabel: getTemplateLabel(
          (p as unknown as { template_id?: unknown }).template_id
        ),
        createdAt: p.updated_at || p.created_at,
        generatedAt: p.generated_at || null,
        status: typeof p.status === 'string' ? p.status : 'draft',
        link,
        isDraft,
      });
    }
    return result;
  }, [projects, t]);
}
