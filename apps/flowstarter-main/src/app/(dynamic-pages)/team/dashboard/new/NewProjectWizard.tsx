'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { useScaffoldForm } from '../components/scaffold/useScaffoldForm';
import { ScaffoldClientInfo } from '../components/scaffold/ScaffoldClientInfo';
import { ScaffoldInput } from '../components/scaffold/ScaffoldInput';
import { ScaffoldProgress } from '../components/scaffold/ScaffoldProgress';
import { ScaffoldClarify } from '../components/scaffold/ScaffoldClarify';
import { ScaffoldReview } from '../components/scaffold/ScaffoldReview';
import { TemplatePicker, TemplateGallery } from './TemplateGallery';

// ── Plan config ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '39',
    desc: 'Solid site, fast delivery',
    suggestedFee: 499,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'RELAUNCH_39',
    name: 'Relaunch',
    price: '39',
    desc: 'Existing site refresh',
    suggestedFee: 699,
    color: 'from-[var(--purple)] to-blue-600',
  },
  {
    id: 'RELAUNCH_59',
    name: 'Relaunch+',
    price: '59',
    desc: 'Full redesign + extras',
    suggestedFee: 999,
    color: 'from-[var(--purple)] to-indigo-600',
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: '59',
    desc: 'Full setup + editor access',
    suggestedFee: 1299,
    color: 'from-violet-500 to-[var(--purple)]',
  },
] as const;

type PlanId = typeof PLANS[number]['id'];

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Client', 'Brief', 'Template', 'Payment', 'Launch'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${i < current
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                : i === current
                ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-lg shadow-[var(--purple)]/40 ring-4 ring-[var(--purple)]/20'
                : 'bg-white/[0.05] border border-white/10 text-white/30'}
            `}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[0.625rem] font-semibold mt-1.5 uppercase tracking-wider whitespace-nowrap ${
              i === current ? 'text-[var(--purple)]' : i < current ? 'text-emerald-400' : 'text-white/30'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-[2px] mx-2 mb-5 rounded-full transition-all duration-500 ${
              i < current ? 'bg-gradient-to-r from-emerald-500 to-[var(--purple)]' : 'bg-white/[0.06]'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Payment step ───────────────────────────────────────────────────────────────

function PaymentStep({
  planName,
  setPlanName,
  setupFee,
  setSetupFee,
  onBack,
  onLaunch,
  isLaunching,
}: {
  planName: string;
  setPlanName: (p: string) => void;
  setupFee: number;
  setSetupFee: (n: number) => void;
  onBack: () => void;
  onLaunch: () => void;
  isLaunching: boolean;
}) {
  const selectedPlan = PLANS.find(p => p.id === planName) ?? PLANS[0];
  const deposit = Math.round(setupFee * 0.5);
  const final = setupFee - deposit;
  const monthlyPrice = parseInt(selectedPlan.price);

  return (
    <div className="space-y-6">
      {/* Plan selector */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider text-xs">
          Subscription Plan
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLANS.map(plan => (
            <button
              key={plan.id}
              onClick={() => {
                setPlanName(plan.id);
                if (setupFee === 0 || setupFee === (PLANS.find(p => p.id === planName)?.suggestedFee ?? 0)) {
                  setSetupFee(plan.suggestedFee);
                }
              }}
              className={`
                relative p-3 rounded-xl border text-left transition-all duration-200
                ${planName === plan.id
                  ? 'border-[var(--purple)]/50 bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                  : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'}
              `}
            >
              {planName === plan.id && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--purple)] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <p className="text-sm font-semibold text-white">{plan.name}</p>
              <p className="text-[0.6rem] text-white/40 mt-0.5">{plan.desc}</p>
              <p className="text-xs font-bold text-[var(--purple)] mt-1.5">€{plan.price}/mo</p>
            </button>
          ))}
        </div>
      </div>

      {/* Setup fee */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider text-xs">
          Setup Fee (EUR)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-semibold">€</span>
          <input
            type="number"
            min={0}
            step={50}
            value={setupFee || ''}
            onChange={e => setSetupFee(parseInt(e.target.value) || 0)}
            placeholder={selectedPlan.suggestedFee.toString()}
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-lg font-semibold placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/50 focus:ring-1 focus:ring-[var(--purple)]/30 transition-all"
          />
        </div>
        <p className="text-xs text-white/30 mt-1.5">Suggested for {selectedPlan.name}: €{selectedPlan.suggestedFee}</p>
      </div>

      {/* Payment summary */}
      {setupFee > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Payment breakdown</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white">Deposit invoice</p>
              <p className="text-xs text-white/40">Sent immediately, due in 10 days — non-refundable</p>
            </div>
            <p className="text-lg font-bold text-white">€{deposit}</p>
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white/70">Final invoice</p>
              <p className="text-xs text-white/40">Sent on delivery, 30-day refund window</p>
            </div>
            <p className="text-lg font-bold text-white/60">€{final}</p>
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white/70">Subscription</p>
              <p className="text-xs text-white/40">Starts after delivery, 30-day free trial</p>
            </div>
            <p className="text-sm font-bold text-[var(--purple)]">€{monthlyPrice}/mo</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.08] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onLaunch}
          disabled={setupFee <= 0 || isLaunching}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--purple)] to-blue-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLaunching ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating project...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Create project & send invoice</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function NewProjectWizard() {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const form = useScaffoldForm();

  // Map scaffold phase to step indicator index
  const stepIndex = (() => {
    switch (form.phase) {
      case 'client':   return 0;
      case 'input':
      case 'progress':
      case 'clarify':
      case 'review':   return 1;
      case 'template': return 2;
      case 'payment':  return 3;
      default: return 0;
    }
  })();

  const handleLaunch = useCallback(async () => {
    setIsLaunching(true);
    setLaunchError(null);

    try {
      // 1. Create project via handoff
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            name: form.brief.projectName,
            projectName: form.brief.projectName,
            description: form.brief.summary,
            industry: form.brief.industry,
            clientName: form.clientInfo.name,
            clientEmail: form.clientInfo.email,
            clientPhone: form.clientInfo.phone,
            templateId: form.selectedTemplateId ?? undefined,
            planName: form.planName,
            totalFee: form.setupFee,
            depositAmount: Math.round(form.setupFee * 0.5),
            finalAmount: form.setupFee - Math.round(form.setupFee * 0.5),
            businessInfo: {
              summary:          form.brief.summary,
              valueProposition: form.brief.valueProposition,
              targetAudience:   form.brief.targetAudience,
              industry:         form.brief.industry,
              goals:            form.brief.goals,
              offerType:        form.brief.offerType,
              brandTone:        form.brief.brandTone,
              offerings:        form.brief.offerings,
            },
            contactInfo: {
              email: form.brief.contactEmail,
              phone: form.brief.contactPhone,
              address: form.brief.contactAddress,
            },
          },
          mode: 'interactive',
        }),
      });

      if (!res.ok) throw new Error('Failed to create project');
      const { token, projectId, editorUrl } = await res.json() as {
        token: string; projectId: string; editorUrl: string;
      };

      // 2. Send deposit invoice (non-blocking — don't fail launch if invoice fails)
      if (form.setupFee > 0) {
        fetch('/api/projects/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, type: 'deposit' }),
        }).catch((invoiceErr) => {
          console.warn('[handleLaunch] Deposit invoice failed (non-fatal):', invoiceErr);
        });
      }

      // 3. Open editor + redirect to dashboard
      const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL ?? 'https://editor.flowstarter.dev';
      window.open(editorUrl || `${EDITOR_URL}?handoff=${token}`, '_blank');
      router.push('/team/dashboard');
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLaunching(false);
    }
  }, [form, router]);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/team/dashboard')}
            className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">New Project</h1>
            <p className="text-sm text-white/40">Set up a new client website</p>
          </div>
        </div>

        {/* Step indicator — hide during progress/clarify */}
        {!['progress', 'clarify'].includes(form.phase) && (
          <StepIndicator current={stepIndex} />
        )}

        {/* Phase content */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          {form.phase === 'client' && (
            <ScaffoldClientInfo
              clientInfo={form.clientInfo}
              onUpdate={form.updateClientInfo}
              onSubmit={form.submitClientInfo}
              onCollapse={() => {}}
            />
          )}

          {form.phase === 'input' && (
            <ScaffoldInput
              onSubmit={form.submitDescription}
              onCollapse={() => form.reset()}
              isEnriching={form.isEnriching}
            />
          )}

          {form.phase === 'progress' && (
            <ScaffoldProgress steps={form.aiSteps} />
          )}

          {form.phase === 'clarify' && (
            <ScaffoldClarify
              questions={form.followUpQuestions}
              answers={form.clarifyAnswers}
              onUpdateAnswer={form.updateClarifyAnswer}
              onSubmit={form.submitClarification}
              onReset={form.reset}
            />
          )}

          {form.phase === 'review' && (
            <ScaffoldReview
              brief={form.brief}
              reviewStep={form.reviewStep}
              reviewStepCount={form.reviewStepCount}
              isFirstStep={form.isFirstStep}
              isLastStep={form.isLastStep}
              onUpdateBrief={form.updateBrief}
              onToggleGoal={form.toggleGoal}
              onToggleIntegration={form.toggleIntegration}
              onNext={form.isLastStep ? form.proceedToTemplate : form.nextStep}
              onPrev={form.prevStep}
              onRegenerate={form.regenerate}
              onReset={form.reset}
            />
          )}

          {form.phase === 'template' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white">Choose a template</h3>
                <p className="text-sm text-white/40 mt-0.5">
                  {form.templateRecommendations.length > 0
                    ? 'AI picked these based on your brief — or browse all'
                    : 'Browse and select a template for this project'}
                </p>
              </div>
              <TemplatePicker
                selectedId={form.selectedTemplateId}
                recommendedIds={form.templateRecommendations}
                recommendedReasons={form.templateReasons}
                onSelect={form.setSelectedTemplateId}
                onBrowseAll={() => setGalleryOpen(true)}
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => form.setPhase('review')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.08] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={form.proceedToPayment}
                  disabled={!form.selectedTemplateId}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--purple)]/90 transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {form.phase === 'payment' && (
            <PaymentStep
              planName={form.planName}
              setPlanName={form.setPlanName}
              setupFee={form.setupFee}
              setSetupFee={form.setSetupFee}
              onBack={() => form.prevStep()}
              onLaunch={handleLaunch}
              isLaunching={isLaunching}
            />
          )}

          {launchError && (
            <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {launchError}
            </p>
          )}
        </div>
      </div>

      {/* Template gallery overlay */}
      {galleryOpen && (
        <TemplateGallery
          selectedId={form.selectedTemplateId}
          recommendedIds={form.templateRecommendations}
          recommendedReasons={form.templateReasons}
          onSelect={form.setSelectedTemplateId}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
