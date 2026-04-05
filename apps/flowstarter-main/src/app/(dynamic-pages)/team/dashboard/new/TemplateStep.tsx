'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import { TemplatePicker, type WizardTemplate } from './TemplateGallery';
import type { useScaffoldForm } from '../components/scaffold/useScaffoldForm';

type ScaffoldForm = ReturnType<typeof useScaffoldForm>;

export function TemplateStep({
  form,
  templates,
  templatesLoading,
  selectedTemplate,
  onOpenGallery,
}: {
  form: ScaffoldForm;
  templates: WizardTemplate[];
  templatesLoading: boolean;
  selectedTemplate: WizardTemplate | null;
  onOpenGallery: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Choose a template, palette, and font
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {form.templateRecommendations.length > 0
            ? 'AI picked these based on your brief. Confirm the template and brand direction before launch.'
            : 'Browse and select a template, then choose the palette and font for this project.'}
        </p>
      </div>
      <TemplatePicker
        templates={templates}
        selectedId={form.selectedTemplateId}
        recommendedIds={form.templateRecommendations}
        recommendedReasons={form.templateReasons}
        onSelect={(templateId) => {
          form.setSelectedTemplateId(templateId);
          form.setSelectedPalette(null);
          form.setSelectedFont(null);
        }}
        onBrowseAll={onOpenGallery}
      />
      {templatesLoading ? (
        <div className="rounded-2xl border border-gray-200/70 bg-gray-50/70 px-4 py-3 text-sm text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-400">
          Loading templates...
        </div>
      ) : null}
      {selectedTemplate ? (
        <div className="grid gap-4 rounded-[28px] border border-gray-200/70 bg-white/80 p-5 dark:border-white/[0.06] dark:bg-white/[0.04] md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Palette variants
              </h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Show these during the onboarding call and lock the preferred
                direction before handoff.
              </p>
            </div>
            <div className="space-y-2">
              {selectedTemplate.palettes.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => form.setSelectedPalette(palette)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all ${
                    form.selectedPalette?.id === palette.id
                      ? 'border-[var(--purple)]/50 bg-[var(--purple)]/8'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {palette.name}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
                      {palette.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Object.values(palette.colors).map((color, index) => (
                      <span
                        key={`${palette.id}-${index}`}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: String(color) }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Font variants
              </h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Pick the font pairing that matches the client's tone and
                positioning.
              </p>
            </div>
            <div className="space-y-2">
              {selectedTemplate.fonts.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => form.setSelectedFont(font)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                    form.selectedFont?.id === font.id
                      ? 'border-[var(--purple)]/50 bg-[var(--purple)]/8'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {font.name}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-zinc-500 dark:text-zinc-400">
                    Heading: {font.heading.family}
                  </p>
                  <p className="text-[0.75rem] text-zinc-500 dark:text-zinc-400">
                    Body: {font.body.family}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => form.setPhase('review')}
          variant="outline"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <Button
          onClick={form.proceedToPayment}
          disabled={
            !form.selectedTemplateId ||
            !form.selectedPalette ||
            !form.selectedFont
          }
          variant="accent"
          size="md"
          className="flex-1"
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
