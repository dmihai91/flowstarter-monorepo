import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { Check, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { PREDEFINED_PALETTES, type ColorPalette } from '~/lib/config/palettes';
import { PREDEFINED_FONT_PAIRINGS, type FontPairing } from '~/lib/config/fonts';

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category?: string;
}

interface TemplateOnboardingWizardProps {
  templateSlug: string;
}

interface ClientDetails {
  projectName: string;
  clientName: string;
  businessDescription: string;
  email: string;
  phone: string;
  website: string;
}

const STEPS = ['palette', 'font', 'details'] as const;
type WizardStep = (typeof STEPS)[number];

const INITIAL_DETAILS: ClientDetails = {
  projectName: '',
  clientName: '',
  businessDescription: '',
  email: '',
  phone: '',
  website: '',
};

function parseTemplatesResponse(payload: unknown): TemplateSummary[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as {
    success?: boolean;
    data?: {
      templates?: TemplateSummary[];
      content?: Array<{ text?: string }>;
    };
  };

  if (!root.success || !root.data) {
    return [];
  }

  if (Array.isArray(root.data.templates)) {
    return root.data.templates;
  }

  const rawText = root.data.content?.[0]?.text;
  if (!rawText) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawText) as { templates?: TemplateSummary[] };
    return Array.isArray(parsed.templates) ? parsed.templates : [];
  } catch {
    return [];
  }
}

function toTemplateSummary(template: any): TemplateSummary {
  return {
    id: template.slug || template.id,
    name: template.displayName || template.name || template.slug || template.id,
    description: template.description || 'Template',
    thumbnail: template.thumbnailUrl || template.thumbnail || '',
    category: template.category,
  };
}

export function TemplateOnboardingWizard({ templateSlug }: TemplateOnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('palette');
  const [template, setTemplate] = useState<TemplateSummary | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(PREDEFINED_PALETTES[0]);
  const [selectedFont, setSelectedFont] = useState<FontPairing>(PREDEFINED_FONT_PAIRINGS[0]);
  const [details, setDetails] = useState<ClientDetails>(INITIAL_DETAILS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplate() {
      setIsTemplateLoading(true);
      setTemplateError(null);

      try {
        const response = await fetch('/api/templates');
        const payload = await response.json().catch(() => null);
        const templates = parseTemplatesResponse(payload).map(toTemplateSummary);
        const match = templates.find((entry) => entry.id === templateSlug);

        if (!isMounted) {
          return;
        }

        if (match) {
          setTemplate(match);
          setDetails((prev) =>
            prev.projectName
              ? prev
              : {
                  ...prev,
                  projectName: match.name,
                },
          );
          return;
        }

        setTemplateError('We could not find that template.');
      } catch {
        if (isMounted) {
          setTemplateError('Templates are unavailable right now.');
        }
      } finally {
        if (isMounted) {
          setIsTemplateLoading(false);
        }
      }
    }

    void loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [templateSlug]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const canContinue = useMemo(() => {
    if (currentStep === 'details') {
      return (
        details.projectName.trim().length > 1 &&
        details.businessDescription.trim().length > 10 &&
        details.email.trim().length > 3
      );
    }

    return true;
  }, [currentStep, details]);

  const handleNext = () => {
    if (!canContinue) {
      return;
    }

    const nextStep = STEPS[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep);
      return;
    }

    void handleSubmit();
  };

  const handleBack = () => {
    const previousStep = STEPS[currentStepIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/project/create-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_slug: templateSlug,
          template_name: template?.name,
          palette_id: selectedPalette.id,
          font_pairing_id: selectedFont.id,
          project_name: details.projectName.trim(),
          client_name: details.clientName.trim() || undefined,
          business_description: details.businessDescription.trim(),
          email: details.email.trim(),
          phone: details.phone.trim() || undefined,
          website: details.website.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        conversationId?: string;
        error?: string;
      };

      if (!response.ok || !payload.conversationId) {
        throw new Error(payload.error || 'Failed to create the project.');
      }

      navigate(`/project/${payload.conversationId}`, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create the project.');
      setIsSubmitting(false);
    }
  };

  if (isTemplateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-50">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading template setup
        </div>
      </div>
    );
  }

  if (templateError || !template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-stone-50">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Use Template</p>
          <h1 className="mt-3 text-3xl font-semibold">Template unavailable</h1>
          <p className="mt-4 text-sm text-stone-300">
            {templateError || 'The requested template could not be loaded.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Back to new project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_35%),linear-gradient(160deg,#050816_0%,#111827_45%,#0b1120_100%)] text-stone-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-start lg:gap-14 lg:px-10">
        <aside className="w-full lg:sticky lg:top-8 lg:max-w-sm">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="aspect-[4/3] bg-stone-900">
              {template.thumbnail ? (
                <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                  <Sparkles className="h-12 w-12 text-emerald-200" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{template.category || 'Template'}</p>
                <h1 className="mt-2 text-3xl font-semibold">{template.name}</h1>
                <p className="mt-3 text-sm leading-6 text-stone-300">{template.description}</p>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400">Palette</span>
                  <span className="font-medium text-white">{selectedPalette.name}</span>
                </div>
                <div className="flex gap-2">
                  {Object.values(selectedPalette.colors)
                    .slice(0, 5)
                    .map((color) => (
                      <span
                        key={color}
                        className="h-7 w-7 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400">Font pairing</span>
                  <span className="font-medium text-white">{selectedFont.name}</span>
                </div>
                <p className="text-sm text-stone-300">
                  {selectedFont.heading.family} + {selectedFont.body.family}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="w-full flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-stone-400">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className={index <= currentStepIndex ? 'text-emerald-300' : undefined}>{index + 1}</span>
                {index < STEPS.length - 1 && <span className="text-stone-700">/</span>}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-stone-950/60 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
            {currentStep === 'palette' && (
              <section>
                <h2 className="text-3xl font-semibold">Pick a palette</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
                  Choose the color system that should be applied before the first build starts.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {PREDEFINED_PALETTES.map((palette) => {
                    const isSelected = selectedPalette.id === palette.id;

                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setSelectedPalette(palette)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{palette.name}</p>
                            <p className="mt-1 text-sm text-stone-400">{palette.description}</p>
                          </div>
                          {isSelected && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-stone-950">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          {Object.values(palette.colors)
                            .slice(0, 5)
                            .map((color) => (
                              <span
                                key={color}
                                className="h-10 flex-1 rounded-xl border border-black/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {currentStep === 'font' && (
              <section>
                <h2 className="text-3xl font-semibold">Choose a font pairing</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
                  This pairing is pre-seeded into the editor so the first generated build starts from the right tone.
                </p>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  {PREDEFINED_FONT_PAIRINGS.map((font) => {
                    const isSelected = selectedFont.id === font.id;

                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font)}
                        className={`rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{font.name}</p>
                            <p className="mt-1 text-sm text-stone-400">{font.description}</p>
                          </div>
                          {isSelected && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-stone-950">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="mt-6 space-y-2">
                          <p className="text-3xl text-white" style={{ fontFamily: font.heading.family }}>
                            {font.heading.family}
                          </p>
                          <p className="text-sm text-stone-300" style={{ fontFamily: font.body.family }}>
                            {font.body.family} for supporting copy and conversion sections.
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {currentStep === 'details' && (
              <section>
                <h2 className="text-3xl font-semibold">Add client details</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
                  These details seed the new project, then the editor will open and start the build automatically.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-stone-300">Project name</span>
                    <input
                      value={details.projectName}
                      onChange={(event) => setDetails((prev) => ({ ...prev, projectName: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="North Studio"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-stone-300">Client name</span>
                    <input
                      value={details.clientName}
                      onChange={(event) => setDetails((prev) => ({ ...prev, clientName: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="Daria Ionescu"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-stone-300">Business description</span>
                    <textarea
                      value={details.businessDescription}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          businessDescription: event.target.value,
                        }))
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="Describe what the client offers, who they serve, and what the website should help them achieve."
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-stone-300">Email</span>
                    <input
                      type="email"
                      value={details.email}
                      onChange={(event) => setDetails((prev) => ({ ...prev, email: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="hello@example.com"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-stone-300">Phone</span>
                    <input
                      value={details.phone}
                      onChange={(event) => setDetails((prev) => ({ ...prev, phone: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="+40 723 000 000"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-stone-300">Website</span>
                    <input
                      value={details.website}
                      onChange={(event) => setDetails((prev) => ({ ...prev, website: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="https://example.com"
                    />
                  </label>
                </div>

                {submitError && (
                  <p className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {submitError}
                  </p>
                )}
              </section>
            )}

            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStepIndex === 0 || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating project
                  </>
                ) : currentStep === 'details' ? (
                  'Create project and build'
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
