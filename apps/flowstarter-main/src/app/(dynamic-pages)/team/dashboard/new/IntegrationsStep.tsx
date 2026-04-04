'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, BarChart3, Check } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import type { IntegrationsConfig } from '../components/scaffold/useScaffoldForm';

export function IntegrationsStep({
  onComplete,
  onBack,
}: {
  onComplete: (integrations: IntegrationsConfig) => void;
  onBack: () => void;
}) {
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [gaId, setGaId] = useState('');

  const calendlyValid = !calendlyUrl || /^https?:\/\/.+calendly\.com\/.+/i.test(calendlyUrl);
  const gaValid = !gaId || /^G-[A-Z0-9]+$/i.test(gaId);

  const handleContinue = () => {
    const config: IntegrationsConfig = {};
    if (calendlyUrl.trim()) {
      config.calendly = { enabled: true, url: calendlyUrl.trim() };
    }
    if (gaId.trim()) {
      config.googleAnalytics = { enabled: true, measurementId: gaId.trim() };
    }
    onComplete(config);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Integrations
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Optional — add Calendly or Google Analytics before the build.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calendly */}
        <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Calendly</p>
              <p className="text-xs text-zinc-400">Booking widget</p>
            </div>
            {calendlyUrl.trim() && calendlyValid && (
              <Check className="ml-auto w-4 h-4 text-green-500" />
            )}
          </div>
          <input
            type="url"
            placeholder="https://calendly.com/your-name"
            value={calendlyUrl}
            onChange={(e) => setCalendlyUrl(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-blue-400"
          />
          {calendlyUrl && !calendlyValid && (
            <p className="text-xs text-red-500">Enter a valid Calendly URL</p>
          )}
        </div>

        {/* Google Analytics */}
        <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Google Analytics</p>
              <p className="text-xs text-zinc-400">Visitor tracking</p>
            </div>
            {gaId.trim() && gaValid && (
              <Check className="ml-auto w-4 h-4 text-green-500" />
            )}
          </div>
          <input
            type="text"
            placeholder="G-XXXXXXXXXX"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-amber-400"
          />
          {gaId && !gaValid && (
            <p className="text-xs text-red-500">Format: G-XXXXXXXXXX</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!calendlyValid || !gaValid}
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
