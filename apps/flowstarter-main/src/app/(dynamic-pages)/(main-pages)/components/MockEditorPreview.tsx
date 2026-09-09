'use client';

import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import type {
  GuidedPriceAmount,
  GuidedPriceCadence,
  GuidedRewriteDirection,
  GuidedRewriteTarget,
  GuidedTone,
  GuidedToneTarget,
  GuidedTranslationLanguage,
  GuidedTranslationTarget,
  MockSiteState,
} from './useMockEditor';
import { MockEditorControls } from './MockEditorControls';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface MockEditorPreviewProps {
  isLoaded: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  messages: Message[];
  isTyping: boolean;
  typingText: string;
  isTypewriting: boolean;
  mockSite: MockSiteState;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (msg?: string) => void;
  handleGuidedRewrite: (
    target: GuidedRewriteTarget,
    direction: GuidedRewriteDirection
  ) => void;
  handleGuidedPrice: (
    amount: GuidedPriceAmount,
    cadence: GuidedPriceCadence,
    deliveryIncluded: boolean
  ) => void;
  handleGuidedTone: (target: GuidedToneTarget, tone: GuidedTone) => void;
  handleGuidedTranslation: (
    target: GuidedTranslationTarget,
    language: GuidedTranslationLanguage
  ) => void;
}

/**
 * Interactive mock editor preview for the landing page hero.
 * Shows a fake website builder with chat input and live preview.
 */
export function MockEditorPreview({
  isLoaded,
  inputValue,
  setInputValue,
  messages,
  isTyping,
  typingText,
  isTypewriting,
  mockSite,
  messagesEndRef,
  handleSend,
  handleGuidedRewrite,
  handleGuidedPrice,
  handleGuidedTone,
  handleGuidedTranslation,
}: MockEditorPreviewProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Right: Interactive Editor */}
      <div
        className={`relative transition-all duration-500 delay-200 mb-6 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Title above editor */}
        <div className="text-center mb-6">
          <h3 className="text-3xl sm:text-4xl font-bold text-[var(--fs-ink)] mb-5">
            {t('landing.editor.title')}
          </h3>
          <p className="text-lg text-[var(--fs-ink-faint)]">
            {t('landing.editor.subtitle')}
          </p>
        </div>

        {/* Glow effect behind editor */}

        {/* Editor window */}
        <div
          className="relative backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-300 shadow-[var(--glass-shadow)] hover:scale-[1.01]"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--glass-surface) 90%, transparent)',
            borderTop: '1px solid var(--glass-border-highlight)',
            borderLeft: '1px solid var(--glass-border-highlight)',
            borderBottom: '1px solid var(--glass-border-shadow)',
            borderRight: '1px solid var(--glass-border-shadow)',
          }}
        >
          {/* Browser chrome */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur text-[0.6875rem] text-gray-400 dark:text-white/30">
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {t('mockEditor.browserUrl')}
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[0.625rem] font-medium text-emerald-600 dark:text-emerald-400">
                {t('mockEditor.liveIndicator')}
              </span>
            </div>
          </div>

          {/* Split: Chat + Preview.
              Stack until lg — Fold cover/inner portrait sit in the sm–md band
              (~360–800px) where a half-width chat pane crushes the prompt box. */}
          <div className="flex flex-col lg:flex-row lg:divide-x divide-gray-200/30 dark:divide-white/5 h-[900px] lg:h-[760px] xl:h-[860px]">
            {/* Chat Panel */}
            <div className="w-full lg:w-1/2 p-3 sm:p-4 flex flex-col border-b lg:border-b-0 h-[420px] lg:h-auto border-gray-200/30 dark:border-white/5">
              <div className="text-xs tracking-[0.12em] uppercase font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[var(--fs-accent)] to-blue-500 bg-clip-text text-transparent">
                {t('mockEditor.chatTitle')}
              </div>

              {/* Messages - grows to fill space */}
              <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-y-auto mb-2 sm:mb-3 pr-1 max-h-[240px] lg:max-h-none">
                {messages.map((msg, i) =>
                  msg.role === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[95%] px-3 py-2 rounded-xl rounded-tr-sm bg-gradient-to-r from-[var(--fs-accent)] to-blue-500 text-white text-sm shadow-sm">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--fs-accent)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-2">
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 0L9.5 5.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-2.5z" />
                        </svg>
                      </div>
                      <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-white/55 dark:bg-white/[0.05] border border-white/50 dark:border-white/10">
                        <div className="text-[0.625rem] font-bold text-[var(--fs-accent)] uppercase tracking-wider mb-1">
                          {t('mockEditor.assistantName')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-white/70">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )
                )}
                {isTypewriting && typingText ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 px-3.5 py-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 max-w-[85%]">
                      <div className="text-sm text-gray-600 dark:text-white/70">
                        {typingText}
                        <span className="inline-block w-0.5 h-3.5 bg-[var(--fs-accent)] ml-0.5 animate-pulse align-middle" />
                      </div>
                    </div>
                  </div>
                ) : (
                  isTyping && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--fs-accent)] to-blue-500 inline-flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 0L9.5 5.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-2.5z" />
                        </svg>
                      </div>
                      <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-white/55 dark:bg-white/[0.05] border border-white/50 dark:border-white/10">
                        <div className="flex gap-1.5">
                          <span
                            className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area - stays at bottom */}
              <div className="mt-auto">
                {/* Input */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-300">
                  <input
                    type="text"
                    placeholder={t('mockEditor.inputPlaceholder')}
                    className="flex-1 bg-transparent text-sm outline-none border-none focus:outline-none focus:ring-0 px-2 placeholder:text-gray-400 dark:placeholder:text-white/30 text-[var(--fs-ink)]"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    // Suppress browser-extension attribute injection (Grammarly etc.)
                    // that causes a hydration warning on this client-only mock input.
                    suppressHydrationWarning
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isTyping}
                    aria-label="Send message"
                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--fs-accent)] to-blue-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14m-7-7l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                <MockEditorControls
                  isTyping={isTyping}
                  handleGuidedRewrite={handleGuidedRewrite}
                  handleGuidedPrice={handleGuidedPrice}
                  handleGuidedTone={handleGuidedTone}
                  handleGuidedTranslation={handleGuidedTranslation}
                />
              </div>
            </div>

            {/* Mock Site Preview */}
            <div className="relative flex w-full flex-col overflow-hidden overflow-y-auto bg-[#f3f3eb] text-[#12352c] lg:w-1/2">
              {/* Realistic site header */}
              <header
                className={`sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-[#12352c]/10 bg-[#f3f3eb]/95 px-5 backdrop-blur-sm transition-colors duration-200 ${
                  mockSite.headerStyle === 'minimal' ? 'border-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#12352c] text-[0.6875rem] font-bold text-[#f3f3eb]">
                    {t('mockEditor.site.brandInitial')}
                  </div>
                  <span className="text-[0.875rem] font-bold tracking-[-0.02em]">
                    {t('mockEditor.site.brand')}
                  </span>
                </div>
                <nav className="flex items-center gap-3 text-[0.6875rem] font-medium text-[#12352c]/65">
                  <span className="text-[#12352c]">
                    {t('mockEditor.site.nav.home')}
                  </span>
                  {mockSite.hasAboutPage && (
                    <span>{t('mockEditor.site.nav.about')}</span>
                  )}
                  <span>{t('mockEditor.site.nav.shop')}</span>
                  <span>{t('mockEditor.site.nav.contact')}</span>
                </nav>
              </header>

              {/* Live hero copy */}
              <section className="grid min-h-[19rem] grid-cols-[1.08fr_0.92fr] border-b border-[#12352c]/10">
                <div className="flex flex-col justify-center px-5 py-8">
                  <div className="mb-4 flex items-center gap-2 text-[0.625rem] font-semibold text-[#12352c]/65">
                    <span>Roasted weekly</span>
                    <span className="h-px w-5 bg-[#ef5b45]" aria-hidden />
                    <span>Cluj</span>
                  </div>
                  <h4
                    data-preview-field="headline"
                    className={`-ml-1 max-w-[17rem] rounded-[4px] px-1 py-0.5 text-[1.65rem] font-bold leading-[0.98] tracking-[-0.055em] transition-colors duration-500 ${
                      mockSite.updatedField === 'headline'
                        ? 'bg-[#ef5b45]/20'
                        : 'bg-transparent'
                    }`}
                  >
                    {mockSite.headline}
                  </h4>
                  <p
                    data-preview-field="introduction"
                    className={`-ml-1 mt-4 max-w-[15rem] rounded-[4px] px-1 py-0.5 text-[0.75rem] leading-[1.5] text-[#12352c]/70 transition-colors duration-500 ${
                      mockSite.updatedField === 'introduction'
                        ? 'bg-[#ef5b45]/20'
                        : 'bg-transparent'
                    }`}
                  >
                    {mockSite.introduction}
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      data-preview-field="cta"
                      className={`flex min-h-9 w-fit max-w-[9.5rem] items-center justify-center rounded-[7px] bg-[#ef5b45] px-4 text-[0.6875rem] font-bold text-white transition-[box-shadow,background-color] duration-200 ${
                        mockSite.updatedField === 'cta'
                          ? 'ring-2 ring-[#ef5b45]/30 ring-offset-2 ring-offset-[#f3f3eb]'
                          : ''
                      }`}
                    >
                      {mockSite.ctaLabel}
                    </div>
                    <span className="text-[0.625rem] font-semibold text-[#12352c] underline decoration-[#12352c]/25 underline-offset-4">
                      How we roast
                    </span>
                  </div>
                </div>
                <div className="relative min-h-[19rem] overflow-hidden bg-[#12352c]">
                  <Image
                    src="/images/demo/coffeeroast-hero-v2.png"
                    alt="Forest-green coffee bag beside a ceramic cup"
                    fill
                    sizes="(min-width: 640px) 25vw, 46vw"
                    className="object-cover object-[54%_55%]"
                  />
                </div>
              </section>

              <section
                data-demo-section="trust"
                className="grid grid-cols-3 border-b border-[#12352c]/10 px-5 py-4"
              >
                {[
                  ['48 hours', 'Roast to dispatch'],
                  ['4.9 / 5', '320 coffee lovers'],
                  ['Over €35', 'Free delivery'],
                ].map(([value, label], index) => (
                  <div
                    key={label}
                    className={
                      index === 0 ? 'pr-3' : 'border-l border-[#12352c]/10 px-3'
                    }
                  >
                    <div className="text-[0.75rem] font-bold tracking-[-0.02em]">
                      {value}
                    </div>
                    <div className="mt-1 text-[0.5625rem] leading-tight text-[#12352c]/55">
                      {label}
                    </div>
                  </div>
                ))}
              </section>

              {/* Contact form - animated in */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  mockSite.hasContactForm
                    ? 'opacity-100 max-h-[500px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                  <div className="text-xs font-semibold text-[var(--fs-ink-dim)] mb-2">
                    {t('mockEditor.site.getInTouch')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                      <span className="text-[0.625rem] text-gray-400">
                        {t('mockEditor.site.form.name')}
                      </span>
                    </div>
                    <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                      <span className="text-[0.625rem] text-gray-400">
                        {t('mockEditor.site.form.email')}
                      </span>
                    </div>
                  </div>
                  <div className="h-7 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-2 px-2 flex items-start pt-1">
                    <span className="text-[0.625rem] text-gray-400">
                      {t('mockEditor.site.form.message')}
                    </span>
                  </div>
                  <div
                    className={`h-5 w-14 rounded text-[0.5625rem] text-white flex items-center justify-center transition-colors duration-500 ${
                      mockSite.primaryColor === 'violet'
                        ? 'bg-[var(--fs-accent)]/50'
                        : 'bg-emerald-500'
                    }`}
                  >
                    {t('mockEditor.site.form.send')}
                  </div>
                </div>
              </div>

              {/* Products section */}
              <section data-demo-section="products" className="px-5 py-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h5 className="text-[1.25rem] font-bold tracking-[-0.04em]">
                      Coffee worth waking up for.
                    </h5>
                    <p
                      data-preview-field="service"
                      lang={mockSite.language}
                      className={`-ml-1 mt-2 rounded-[4px] px-1 py-0.5 text-[0.6875rem] leading-relaxed text-[#12352c]/65 transition-colors duration-500 ${
                        mockSite.updatedField === 'service'
                          ? 'bg-[#ef5b45]/20'
                          : 'bg-transparent'
                      }`}
                    >
                      {mockSite.serviceDescription}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.625rem] font-bold text-[#ef5b45]">
                    Shop all
                  </span>
                </div>
                <div className="mt-5 border-y border-[#12352c]/15">
                  {[
                    ['01', 'House Blend', 'Cocoa, caramel', '€14'],
                    ['02', 'Transylvania', 'Plum, hazelnut', '€16'],
                    ['03', 'Golden Hour', 'Honey, citrus', '€18'],
                  ].map(([number, name, notes, price], index) => (
                    <div
                      key={name}
                      className={`grid grid-cols-[1.7rem_1fr_auto] items-center gap-3 py-3.5 ${
                        index > 0 ? 'border-t border-[#12352c]/10' : ''
                      }`}
                    >
                      <span className="text-[0.5625rem] font-bold text-[#ef5b45]">
                        {number}
                      </span>
                      <div>
                        <div className="text-[0.75rem] font-bold">{name}</div>
                        <div className="mt-0.5 text-[0.5625rem] text-[#12352c]/55">
                          {notes}
                        </div>
                      </div>
                      <span className="text-[0.6875rem] font-bold">
                        {price}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section
                data-demo-section="brand-story"
                className="grid grid-cols-[1fr_7.5rem] gap-5 border-y border-[#12352c]/10 bg-[#e4eadf] px-5 py-7"
              >
                <div>
                  <h5 className="max-w-[15rem] text-[1.25rem] font-bold leading-[1.05] tracking-[-0.04em]">
                    Small batches. Serious attention.
                  </h5>
                  <p className="mt-3 max-w-[17rem] text-[0.6875rem] leading-relaxed text-[#12352c]/70">
                    We source with care, roast in Cluj, and print the roast date
                    on every bag.
                  </p>
                  <div className="mt-4 text-[0.625rem] font-bold text-[#ef5b45]">
                    Meet the roastery
                  </div>
                </div>
                <div className="border-l border-[#12352c]/15 pl-4">
                  <div className="text-[2.25rem] font-bold leading-none tracking-[-0.06em]">
                    12
                  </div>
                  <div className="mt-2 text-[0.625rem] leading-relaxed text-[#12352c]/65">
                    farms we buy from directly
                  </div>
                </div>
              </section>

              <section data-demo-section="customer-proof" className="px-5 py-7">
                <div className="text-[0.6875rem] tracking-[0.14em] text-[#ef5b45]">
                  ★★★★★
                </div>
                <blockquote className="mt-3 max-w-[25rem] text-[1.05rem] font-bold leading-[1.25] tracking-[-0.025em]">
                  “The first coffee subscription I actually look forward to.”
                </blockquote>
                <div className="mt-3 text-[0.625rem] text-[#12352c]/55">
                  Ana M., subscriber since 2024
                </div>
              </section>

              <section
                data-demo-section="subscription"
                className="mx-5 mb-7 grid grid-cols-[1fr_auto] items-end gap-4 rounded-[8px] bg-[#12352c] px-5 py-5 text-[#f3f3eb]"
              >
                <div>
                  <div className="text-[0.875rem] font-bold">
                    Never run out of good coffee.
                  </div>
                  <div className="mt-1 text-[0.625rem] text-[#f3f3eb]/65">
                    Save 10%. Pause whenever you like.
                  </div>
                  <div
                    data-preview-field="price"
                    className={`-ml-1 mt-2 w-fit rounded-[4px] px-1 py-0.5 text-[0.6875rem] font-bold transition-colors duration-500 ${
                      mockSite.updatedField === 'price'
                        ? 'bg-[#ef5b45]/45'
                        : 'bg-transparent'
                    }`}
                  >
                    {mockSite.subscriptionPrice}
                  </div>
                </div>
                <div className="shrink-0 rounded-[7px] bg-[#ef5b45] px-3 py-2.5 text-[0.625rem] font-bold text-white">
                  Build a subscription
                </div>
              </section>

              {/* Testimonials - animated in */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  mockSite.hasTestimonials
                    ? 'opacity-100 max-h-[500px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold text-[var(--fs-ink-dim)] mb-2">
                    {t('mockEditor.site.testimonials')}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                          <div className="h-1.5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mb-1" />
                        <div className="h-1 w-4/5 bg-gray-100 dark:bg-gray-700 rounded" />
                        <div className="flex gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`text-[0.5625rem] ${
                                mockSite.primaryColor === 'violet'
                                  ? 'text-[var(--fs-accent)]'
                                  : 'text-emerald-400'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing section - animated in */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  mockSite.hasPricingSection
                    ? 'opacity-100 max-h-[500px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                  <div className="text-xs font-semibold text-[var(--fs-ink-dim)] mb-2">
                    {t('mockEditor.site.pricing')}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="text-[0.6875rem] font-medium text-[var(--fs-ink-dim)]">
                        {t('mockEditor.site.basicPlan')}
                      </div>
                      <div
                        className={`text-sm font-bold transition-colors duration-500 ${
                          mockSite.primaryColor === 'violet'
                            ? 'text-[var(--fs-accent)]'
                            : 'text-emerald-600'
                        }`}
                      >
                        {t('mockEditor.site.basicPrice')}
                      </div>
                      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                      <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                    </div>
                    <div
                      className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-500 ${
                        mockSite.primaryColor === 'violet'
                          ? 'bg-[var(--fs-accent)]/5 dark:bg-[var(--fs-accent)]/20 border-[var(--fs-accent)]/30 dark:border-[var(--fs-accent)]'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <div className="text-[0.6875rem] font-medium text-[var(--fs-ink-dim)]">
                          {t('mockEditor.site.proPlan')}
                        </div>
                        <div
                          className={`text-[0.5rem] px-1 py-0.5 rounded-full text-white transition-colors duration-500 ${
                            mockSite.primaryColor === 'violet'
                              ? 'bg-[var(--fs-accent)]/50'
                              : 'bg-emerald-500'
                          }`}
                        >
                          {t('mockEditor.site.popular')}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold transition-colors duration-500 ${
                          mockSite.primaryColor === 'violet'
                            ? 'text-[var(--fs-accent)]'
                            : 'text-emerald-600'
                        }`}
                      >
                        {t('mockEditor.site.proPrice')}
                      </div>
                      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                      <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ section - animated in */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  mockSite.hasFAQ
                    ? 'opacity-100 max-h-[500px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                  <div className="text-xs font-semibold text-[var(--fs-ink-dim)] mb-2">
                    Frequently Asked Questions
                  </div>
                  <div className="space-y-1.5">
                    {[
                      'How does delivery work?',
                      'Can I edit it myself?',
                      'What if I need changes?',
                    ].map((q, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-[0.625rem] text-[var(--fs-ink-dim)]">
                          {q}
                        </span>
                        <svg
                          className="w-3 h-3 text-gray-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter section - animated in */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  mockSite.hasNewsletter
                    ? 'opacity-100 max-h-[500px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="px-4 py-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="text-[0.6875rem] font-semibold text-[var(--fs-ink-dim)] mb-0.5">
                      Stay in the loop ✉️
                    </div>
                    <div className="text-[0.5625rem] text-gray-400 mb-2">
                      Get tips & updates straight to your inbox.
                    </div>
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 px-2 flex items-center">
                        <span className="text-[0.5625rem] text-gray-400">
                          Your email address
                        </span>
                      </div>
                      <div
                        className={`h-5 px-2 rounded text-[0.5625rem] text-white flex items-center transition-colors duration-500 ${
                          mockSite.primaryColor === 'violet'
                            ? 'bg-[var(--fs-accent)]/50'
                            : 'bg-emerald-500'
                        }`}
                      >
                        Subscribe
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-[0.625rem] text-gray-400">
                    © {new Date().getFullYear()} {t('mockEditor.site.brand')}
                  </div>
                  <div className="flex gap-2">
                    {['📘', '📷', '✉️'].map((icon, i) => (
                      <span key={i} className="text-xs opacity-50">
                        {icon}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
