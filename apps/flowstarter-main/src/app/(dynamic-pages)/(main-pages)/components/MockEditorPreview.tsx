'use client';

import { useI18n } from '@/lib/i18n';

interface MockSite {
  hasContactForm: boolean;
  hasTestimonials: boolean;
  hasPricingSection: boolean;
  primaryColor: string;
  hasAboutPage: boolean;
  headerStyle: string;
}

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
  mockSite: MockSite;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (msg?: string) => void;
}

/**
 * Interactive mock editor preview for the landing page hero.
 * Shows a fake website builder with chat input and live preview.
 */
export function MockEditorPreview({
  isLoaded, inputValue, setInputValue, messages, isTyping, mockSite, messagesEndRef, handleSend,
}: MockEditorPreviewProps) {
  const { t } = useI18n();

  return (
    <>
              {/* Right: Interactive Editor */}
              <div
                className={`relative transition-all duration-500 delay-200 mb-6 ${
                  isLoaded
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                {/* Title above editor */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('landing.editor.title')}
                  </h3>
                  <p className="text-base text-gray-500 dark:text-white/50">
                    {t('landing.editor.subtitle')}
                  </p>
                </div>

                {/* Glow effect behind editor */}


                {/* Editor window */}
                <div className="relative bg-white/90 dark:bg-[#141418]/90 backdrop-blur-xl rounded-3xl border border-gray-200/30 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_25px_70px_rgba(0,0,0,0.5)] hover:scale-[1.01]">
                  {/* Browser chrome */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm border-b border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur text-[10px] text-gray-400 dark:text-white/30">
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
                      yoursite.com
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Split: Chat + Preview */}
                  <div className="flex flex-col sm:flex-row sm:divide-x divide-gray-200/30 dark:divide-white/5 min-h-[280px] sm:min-h-[320px]">
                    {/* Chat Panel */}
                    <div className="w-full sm:w-1/2 p-3 sm:p-4 flex flex-col border-b sm:border-b-0 border-gray-200/30 dark:border-white/5">
                      <div className="text-[11px] tracking-[0.12em] uppercase font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                        ✨ Smart AI Editor
                      </div>

                      {/* Messages - grows to fill space */}
                      <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-y-auto mb-2 sm:mb-3 pr-1 max-h-[100px] sm:max-h-none">
                        {messages.map((msg, i) =>
                          msg.role === 'user' ? (
                            <div key={i} className="flex justify-end">
                              <div className="max-w-[95%] px-3 py-2 rounded-xl rounded-tr-sm bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white text-[13px] shadow-sm">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            <div key={i} className="flex gap-2.5 items-start">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-2">
                                <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 5.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-2.5z" /></svg>
                              </div>
                              <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-white/55 dark:bg-white/[0.05] border border-white/50 dark:border-white/10">
                                <div className="text-[9px] font-bold text-[var(--purple)] uppercase tracking-wider mb-1">Flowstarter Assistant</div>
                                <div className="text-[13px] text-gray-600 dark:text-white/70">{msg.text}</div>
                              </div>
                            </div>
                          )
                        )}
                        {isTyping && (
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--purple)] to-blue-500 inline-flex items-center justify-center flex-shrink-0 shadow-sm">
                              <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 5.5 16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-2.5z" /></svg>
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
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input area - stays at bottom */}
                      <div className="mt-auto">
                        {/* Input */}
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-300">
                          <input
                            type="text"
                            placeholder="Try: Add form..."
                            className="flex-1 bg-transparent text-[13px] outline-none border-none focus:outline-none focus:ring-0 px-2 placeholder:text-gray-400 dark:placeholder:text-white/30 text-gray-900 dark:text-white"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          />
                          <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg hover:scale-105 active:scale-95"
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

                        {/* Quick prompts */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {['Add pricing', 'Contact form', 'Change colors'].map(
                            (prompt) => (
                              <button
                                key={prompt}
                                onClick={() => handleSend(prompt)}
                                disabled={isTyping}
                                className="px-3 py-1.5 text-[11px] rounded-full bg-white/55 dark:bg-white/[0.04] backdrop-blur-sm hover:bg-white/70 dark:hover:bg-white/[0.08] border border-gray-200/30 dark:border-white/10 text-gray-600 dark:text-white/50 transition-all disabled:opacity-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                              >
                                {prompt}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mock Site Preview */}
                    <div className="w-full sm:w-1/2 bg-white dark:bg-[#0f0f12] min-h-[200px] sm:min-h-[260px] overflow-hidden relative">
                      {/* Right edge mask */}
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-[#0f0f12] to-transparent pointer-events-none z-10" />
                      {/* Realistic site header */}
                      <div
                        className={`flex items-center justify-between px-4 py-2.5 border-b transition-all duration-500 ${
                          mockSite.headerStyle === 'minimal'
                            ? 'bg-transparent border-transparent'
                            : 'bg-gray-50/80 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white transition-colors duration-500 ${
                              mockSite.primaryColor === 'violet'
                                ? 'bg-[var(--purple)]/50'
                                : 'bg-emerald-500'
                            }`}
                          >
                            C
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-white">
                            CoffeeRoast
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="hover:text-gray-900 dark:hover:text-white cursor-default">
                            Home
                          </span>
                          {mockSite.hasAboutPage && (
                            <span
                              className={`font-medium transition-all duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'text-[var(--purple)]'
                                  : 'text-emerald-500'
                              }`}
                            >
                              About
                            </span>
                          )}
                          <span>Shop</span>
                          <span>Contact</span>
                        </div>
                      </div>

                      {/* Hero section with image placeholder */}
                      <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="h-2.5 w-24 bg-gray-800 dark:bg-white rounded mb-1.5" />
                            <div
                              className={`h-3 w-20 rounded mb-2 transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/50'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <div className="h-1.5 w-28 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                            <div className="h-1.5 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                            <div
                              className={`h-5 w-16 rounded-full text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/50'
                                  : 'bg-emerald-500'
                              }`}
                            >
                              Shop Now
                            </div>
                          </div>
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center">
                            <span className="text-2xl">☕</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact form - animated in */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          mockSite.hasContactForm
                            ? 'opacity-100 max-h-[500px]'
                            : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                      >
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Get in Touch
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">
                                Name
                              </span>
                            </div>
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">
                                Email
                              </span>
                            </div>
                          </div>
                          <div className="h-7 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-2 px-2 flex items-start pt-1">
                            <span className="text-[9px] text-gray-400">
                              Message...
                            </span>
                          </div>
                          <div
                            className={`h-5 w-14 rounded text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${
                              mockSite.primaryColor === 'violet'
                                ? 'bg-[var(--purple)]/50'
                                : 'bg-emerald-500'
                            }`}
                          >
                            Send
                          </div>
                        </div>
                      </div>

                      {/* Products/Features section */}
                      <div className="px-4 py-3">
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Our Blends
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['☕', '🫘', '✨'].map((emoji, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center"
                            >
                              <div className="text-base mb-1">{emoji}</div>
                              <div className="h-1.5 w-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                              <div
                                className={`h-1.5 w-6 mx-auto rounded transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'bg-[var(--purple)]/40'
                                    : 'bg-emerald-400'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Testimonials - animated in */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          mockSite.hasTestimonials
                            ? 'opacity-100 max-h-[500px]'
                            : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                      >
                        <div className="px-4 py-3">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            What Customers Say
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
                                      className={`text-[8px] ${
                                        mockSite.primaryColor === 'violet'
                                          ? 'text-[var(--purple)]'
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
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Pricing
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                Basic
                              </div>
                              <div
                                className={`text-sm font-bold transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'text-[var(--purple)]'
                                    : 'text-emerald-600'
                                }`}
                              >
                                $9/mo
                              </div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                            <div
                              className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/5 dark:bg-[var(--purple)]/20 border-[var(--purple)]/30 dark:border-[var(--purple)]'
                                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                  Pro
                                </div>
                                <div
                                  className={`text-[7px] px-1 py-0.5 rounded-full text-white transition-colors duration-500 ${
                                    mockSite.primaryColor === 'violet'
                                      ? 'bg-[var(--purple)]/50'
                                      : 'bg-emerald-500'
                                  }`}
                                >
                                  POPULAR
                                </div>
                              </div>
                              <div
                                className={`text-sm font-bold transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'text-[var(--purple)]'
                                    : 'text-emerald-600'
                                }`}
                              >
                                $29/mo
                              </div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="text-[9px] text-gray-400">
                            © {new Date().getFullYear()} CoffeeRoast
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

                {/* Floating elements - hidden on small mobile */}
                <div
                  className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 shadow-xl hidden xs:flex flex-col items-center justify-center animate-float text-white"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold">
                    Draft
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/70">
                    ~2 weeks
                  </div>
                </div>

                <div
                  className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 lg:-top-6 lg:-left-6 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/55 dark:bg-white/[0.08] backdrop-blur-xl border border-white/50 dark:border-white/10 hidden xs:flex items-center justify-center animate-float shadow-xl"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    98
                  </div>
                </div>
              </div>
    </>
  );
}
