'use client';

import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';

export const PLANS = [
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

export function PaymentStep({
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
  const selectedPlan = PLANS.find((p) => p.id === planName) ?? PLANS[0];
  const deposit = Math.round(setupFee * 0.5);
  const final = setupFee - deposit;
  const monthlyPrice = parseInt(selectedPlan.price);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
          Subscription Plan
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                setPlanName(plan.id);
                if (
                  setupFee === 0 ||
                  setupFee ===
                    (PLANS.find((p) => p.id === planName)?.suggestedFee ?? 0)
                ) {
                  setSetupFee(plan.suggestedFee);
                }
              }}
              className={`
                relative p-4 rounded-[20px] border text-left transition-all duration-200
                ${
                  planName === plan.id
                    ? 'border-[var(--purple)]/50 bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                    : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                }
              `}
            >
              {planName === plan.id && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--purple)] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {plan.name}
              </p>
              <p className="text-[0.6rem] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {plan.desc}
              </p>
              <p className="text-xs font-bold text-[var(--purple)] mt-1.5">
                €{plan.price}/mo
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
          Setup Fee (EUR)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">
            €
          </span>
          <input
            type="number"
            min={0}
            step={50}
            value={setupFee || ''}
            onChange={(e) => setSetupFee(parseInt(e.target.value) || 0)}
            placeholder={selectedPlan.suggestedFee.toString()}
            className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-zinc-900 dark:text-white text-lg font-semibold placeholder:text-zinc-300 dark:placeholder:text-zinc-40 focus:outline-none focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20 transition-all"
          />
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
          Suggested for {selectedPlan.name}: €{selectedPlan.suggestedFee}
        </p>
      </div>

      {setupFee > 0 && (
        <div className="space-y-4 rounded-[var(--fs-radius-2xl)] border p-5 backdrop-blur-2xl backdrop-saturate-150" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Payment breakdown
          </p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Deposit invoice
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sent immediately, due in 10 days — non-refundable
              </p>
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">
              €{deposit}
            </p>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                Final invoice
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sent on delivery, 30-day refund window
              </p>
            </div>
            <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
              €{final}
            </p>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                Subscription
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Starts after delivery, 30-day free trial
              </p>
            </div>
            <p className="text-sm font-bold text-[var(--purple)]">
              €{monthlyPrice}/mo
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <Button
          onClick={onLaunch}
          disabled={setupFee <= 0 || isLaunching}
          variant="accent"
          size="md"
          className="flex-1"
          icon={
            isLaunching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )
          }
        >
          {isLaunching
            ? 'Creating project...'
            : 'Create project & send invoice'}
        </Button>
      </div>
    </div>
  );
}
