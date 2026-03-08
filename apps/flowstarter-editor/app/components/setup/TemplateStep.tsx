/**
 * Template Step
 *
 * Template picker grid for selecting a starter template.
 */

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { SetupData } from './SetupWizard';

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
}

interface TemplateStepProps {
  projectId: string;
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TemplateStep({ data, onUpdate, onNext, onPrev }: TemplateStepProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const result = await response.json() as { templates?: Template[] };
          setTemplates(result.templates || []);
        }
      } catch {
        // Fallback templates
        setTemplates([
          { slug: 'starter', name: 'Starter', description: 'Clean, minimal starter template', category: 'general' },
          { slug: 'business', name: 'Business', description: 'Professional business site', category: 'services' },
          { slug: 'portfolio', name: 'Portfolio', description: 'Creative portfolio showcase', category: 'creative' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const canProceed = !!data.templateSlug;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          Choose a template
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          Pick a starting point for your website. We'll customize it to match your brand.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const isSelected = data.templateSlug === template.slug;
            return (
              <button
                key={template.slug}
                onClick={() =>
                  onUpdate({
                    templateSlug: template.slug,
                    templateName: template.name,
                  })
                }
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-3xl text-gray-300 dark:text-zinc-600">
                    {template.name[0]}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">
                  {template.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  {template.description}
                </p>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
