'use client';

import { AssistantInput } from '@/components/AssistantInput';
import { ResponseStream } from '@/components/ui/response-stream';
import { WaitlistDialog } from '@/components/WaitlistDialog';
import { useTranslations } from '@/lib/i18n';
import { Bell, Send, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SmoothScrollLink } from './SmoothScrollLink';

function InteractivePromptInput({
  prompts,
  onSubmit,
}: {
  prompts: string[];
  onSubmit: () => void;
}) {
  const { t } = useTranslations();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [streamKey, setStreamKey] = useState(0);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // Cycle through prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % prompts.length);
      setStreamKey((prev) => prev + 1); // Force re-render of ResponseStream
    }, 6000);
    return () => clearInterval(interval);
  }, [prompts.length]);
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div
        className={`glass-3d relative rounded-[16px] backdrop-blur-xl border transition-all duration-500 ease-out bg-white/25 dark:bg-[rgba(58,58,74,0.2)] px-6 py-4 group ${
          isFocused
            ? 'border-purple-400/60 dark:border-purple-400/50 shadow-[0_20px_60px_rgba(139,92,246,0.25),0_8px_24px_rgba(139,92,246,0.15),inset_0_2px_0_rgba(255,255,255,0.8),inset_0_2px_8px_rgba(0,0,0,0.05)] -translate-y-1'
            : isHovered
            ? 'border-purple-300/40 dark:border-purple-400/30 shadow-[0_16px_48px_rgba(139,92,246,0.15),0_6px_18px_rgba(139,92,246,0.1),inset_0_2px_0_rgba(255,255,255,0.7),inset_0_2px_6px_rgba(0,0,0,0.04)] -translate-y-0.5 scale-[1.005]'
            : 'border-gray-200/80 dark:border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_0_rgba(255,255,255,0.6),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_2px_6px_rgba(0,0,0,0.15)]'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 dark:border-violet-500/20 transition-all duration-300 ${
              isHovered ? 'scale-105 rotate-6' : ''
            }`}
          >
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {t('landing.hero.aiPowered')}
          </span>
        </div>

        {/* Example prompts above input - show fewer on mobile */}
        <div className="flex flex-wrap gap-2 mb-4">
          {prompts.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              type="button"
              className={`inline-flex items-center rounded-md border border-white dark:border-white/40 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] px-2 py-1 sm:px-3 sm:py-1.5 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 hover:-translate-y-0.5 max-w-full ${
                idx >= 2 ? 'hidden sm:inline-flex' : ''
              }`}
              style={{
                maxWidth: 'calc(100% - 0.5rem)',
              }}
            >
              <span className="truncate">{example}</span>
            </button>
          ))}
        </div>

        <div className="relative" onKeyDown={handleKeyDown}>
          {/* Streaming placeholder overlay */}
          {!prompt && !isFocused && (
            <div
              className="absolute left-0 top-2 pointer-events-none px-2 z-20 max-w-full overflow-hidden"
              style={{
                maxWidth: 'calc(100% - 1rem)',
              }}
            >
              <ResponseStream
                key={streamKey}
                textStream={prompts[currentExampleIndex]}
                mode="typewriter"
                speed={15}
                as="span"
                className="text-sm sm:text-md text-gray-400 dark:text-gray-300 truncate block"
              />
            </div>
          )}

          <AssistantInput
            value={prompt}
            onChange={setPrompt}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            rows={3}
            className="mb-3"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 flex items-center gap-2 text-sm font-medium hover:scale-105 active:scale-95 hover:-translate-y-0.5"
          >
            <Send
              className={`h-4 w-4 transition-transform duration-300 ${
                isHovered && prompt.trim() ? 'translate-x-1' : ''
              }`}
            />
            {t('app.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useTranslations();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Get all available prompts
  const allPrompts = useMemo(
    () => [
      t('landing.hero.animatedPrompt1'),
      t('landing.hero.animatedPrompt2'),
      t('landing.hero.animatedPrompt3'),
      t('assistant.prompts.examples.saas'),
      t('assistant.prompts.examples.localBusiness'),
      t('assistant.prompts.examples.portfolio'),
      t('assistant.prompts.examples.ecommerce'),
      t('assistant.prompts.examples.agency'),
      t('assistant.prompts.examples.consulting'),
    ],
    [t]
  );

  // Randomly select 3 prompts on component mount (changes on page refresh)
  const animatedPrompts = useMemo(() => {
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [allPrompts]);

  return (
    <section className="full-width-section relative min-h-screen flex items-center pt-28 pb-12 md:py-24 lg:py-32 overflow-hidden">
      {/* Hero section background - distinct gradient pattern */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-background)' }}
      />
      {/* Animated gradient overlays */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="wizard-aura" />
        <div className="wizard-aura-secondary" />
        <div className="wizard-aura-accent" />
        <div className="wizard-noise" />
        {/* Additional animated orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 dark:from-purple-600/10 dark:to-blue-600/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-400/20 dark:from-pink-600/10 dark:to-purple-600/10 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s', animationDuration: '4s' }}
        />
      </div>
      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0 -z-10 backdrop-blur-[2px]"
        style={{ backgroundColor: 'rgba(243, 243, 243, 0.10)' }}
      />
      <div className="absolute inset-0 -z-10 dark:backdrop-blur-[2px] dark:bg-[rgba(58,58,74,0.10)]" />

      <div className="full-width-content">
        <div className="mt-1 flex flex-col items-center space-y-6 sm:space-y-8 text-center">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex flex-col sm:flex-row sm:items-center items-center rounded-lg px-3 py-1.5 sm:px-4 text-sm sm:text-md font-medium transition-all hover:scale-105 backdrop-blur-xl border border-white dark:border-white/40 cursor-default bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <span className="font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                {t('landing.hero.badge')}
              </span>
              <span className="mx-2 text-muted-foreground hidden sm:inline">
                •
              </span>
              <span className="inline text-sm sm:text-md">
                {t('landing.hero.badgeTagline')}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t('landing.hero.title')}
              <span className="block mt-1 bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-sm sm:text-lg text-muted-foreground md:text-xl leading-relaxed px-4 sm:px-0">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          {/* Interactive Prompt Input */}
          <div className="w-full mt-8">
            <InteractivePromptInput
              prompts={animatedPrompts}
              onSubmit={() => setWaitlistOpen(true)}
            />
          </div>

          {/* Feature bullets with divider */}
          <div className="w-full max-w-5xl mx-auto mt-8">
            <div className="border-t border-gray-300/60 dark:border-white/10 pt-8">
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-sm sm:text-base md:text-lg">
                <div className="flex items-center gap-2 transition-transform hover:scale-110">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: 'var(--green)' }}
                  />
                  <span className="text-muted-foreground">
                    {t('landing.hero.feature1')}
                  </span>
                </div>
                <div className="flex items-center gap-2 transition-transform hover:scale-110">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{
                      backgroundColor: 'var(--blue)',
                      animationDelay: '0.5s',
                    }}
                  />
                  <span className="text-muted-foreground">
                    {t('landing.hero.feature2')}
                  </span>
                </div>
                <div className="flex items-center gap-2 transition-transform hover:scale-110">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{
                      backgroundColor: 'var(--purple)',
                      animationDelay: '1s',
                    }}
                  />
                  <span className="text-muted-foreground">
                    {t('landing.hero.feature3')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-4 w-full max-w-md sm:max-w-none">
            <button
              onClick={() => setWaitlistOpen(true)}
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 active:scale-[0.98] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 group"
            >
              <Bell className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              {t('waitlist.cta.getEarlyAccess')}
            </button>
            <SmoothScrollLink
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-6 text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 text-gray-900 dark:text-white hover:border-white/50 dark:hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 focus-visible:ring-offset-2 group bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] h-13"
            >
              <svg
                className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              {t('landing.hero.exploreFeatures')}
            </SmoothScrollLink>
          </div>
        </div>
      </div>

      {/* Waitlist Dialog */}
      <WaitlistDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </section>
  );
}
