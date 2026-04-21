'use client';

import { UnifiedButton } from '@/components/ui/unified-button';
import { useContactForm } from '@/hooks/useContactForm';
import { useState } from 'react';
import {
  MessageCircle,
  Check,
  Loader2,
  Send,
  Calendar,
  Mail,
  Twitter,
  Linkedin,
  Clock,
  Bot,
  Headphones,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { PublicPageLayout } from '@/components/PublicPageLayout';
import { PreQualModal } from '@/app/(dynamic-pages)/(main-pages)/components/PreQualModal';

export default function ContactPage() {
  const { t } = useTranslations();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMode, setSupportMode] = useState<'ai' | 'operator'>('ai');
  const [supportInput, setSupportInput] = useState('');
  const [supportMessages, setSupportMessages] = useState<
    { role: 'assistant' | 'user'; text: string }[]
  >([
    {
      role: 'assistant',
      text: "Hi, I'm Flowstarter AI support. I can answer quick questions or route you to a human operator.",
    },
  ]);
  const contactMutation = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(
      {
        name: formData.name,
        email: formData.email,
        message: `[${formData.subject}] ${formData.message}`,
      },
      {
        onSuccess: () => {
          setFormData({ name: '', email: '', subject: '', message: '' });
        },
      }
    );
  };

  const status = contactMutation.isPending
    ? 'loading'
    : contactMutation.isSuccess
    ? 'success'
    : contactMutation.isError
    ? 'error'
    : 'idle';

  const errorMessage =
    contactMutation.error?.message || t('contact.form.defaultError');

  const aiReplyFor = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('price') || lower.includes('cost')) {
      return 'Pricing depends on scope and timeline. I can help you pick a plan quickly, or switch you to an operator for a direct recommendation.';
    }
    if (lower.includes('time') || lower.includes('how long')) {
      return 'Typical turnaround is fast for focused projects. If you share your goal, I can suggest the best path right now.';
    }
    if (lower.includes('operator') || lower.includes('human')) {
      return 'Switch to Operator mode and leave your question. Our team usually replies within 1 business day.';
    }
    return 'Got it. I can help with pricing, timeline, integrations, and setup. If you prefer human support, switch to Operator mode.';
  };

  const submitSupportMessage = () => {
    const message = supportInput.trim();
    if (!message) return;
    setSupportMessages((prev) => [...prev, { role: 'user', text: message }]);
    setSupportInput('');
    const response =
      supportMode === 'ai'
        ? aiReplyFor(message)
        : 'Operator request received. We will follow up on hello@flowstarter.app. For urgent questions, include your project URL and deadline.';
    window.setTimeout(() => {
      setSupportMessages((prev) => [
        ...prev,
        { role: 'assistant', text: response },
      ]);
    }, 320);
  };

  return (
    <PublicPageLayout>
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="text-center mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-5">
            <MessageCircle className="w-4 h-4" />
            {t('contact.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--fs-ink)] mb-3">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-[var(--fs-ink-faint)] max-w-2xl mx-auto">
            {t('contact.description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.12fr_0.88fr] gap-6 sm:gap-8 items-start">
          <section className="p-5 sm:p-7 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-[var(--fs-rule)]">
            <h2 className="text-2xl font-bold text-[var(--fs-ink)] mb-6">
              {t('contact.form.title')}
            </h2>

            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--fs-ink)] mb-2">
                  {t('contact.form.successTitle')}
                </h3>
                <p className="text-[var(--fs-ink-faint)] mb-6">
                  {t('contact.form.successDesc')}
                </p>
                <UnifiedButton
                  tone="secondary"
                  onClick={() => contactMutation.reset()}
                >
                  {t('contact.form.sendAnother')}
                </UnifiedButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    {t('contact.form.nameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('contact.form.namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-[var(--fs-rule)] text-[var(--fs-ink)] placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    {t('contact.form.emailLabel')}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t('contact.form.emailPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-[var(--fs-rule)] text-[var(--fs-ink)] placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    {t('contact.form.subjectLabel')}
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-[var(--fs-rule)] text-[var(--fs-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                  >
                    <option value="">{t('contact.form.subjectDefault')}</option>
                    <option value="general">
                      {t('contact.form.subjectGeneral')}
                    </option>
                    <option value="project">
                      {t('contact.form.subjectProject')}
                    </option>
                    <option value="support">
                      {t('contact.form.subjectSupport')}
                    </option>
                    <option value="billing">
                      {t('contact.form.subjectBilling')}
                    </option>
                    <option value="feedback">
                      {t('contact.form.subjectFeedback')}
                    </option>
                    <option value="other">
                      {t('contact.form.subjectOther')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    {t('contact.form.messageLabel')}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder={t('contact.form.messagePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-[var(--fs-rule)] text-[var(--fs-ink)] placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <UnifiedButton
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('contact.form.sending')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('contact.form.sendButton')}
                      <Send className="w-4 h-4" />
                    </span>
                  )}
                </UnifiedButton>
              </form>
            )}
          </section>

          <div className="space-y-6">
            <section className="p-5 sm:p-6 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-[var(--fs-rule)]">
              <h2 className="text-xl font-bold text-[var(--fs-ink)] mb-6">
                {t('contact.talk.title')}
              </h2>
              <p className="text-[var(--fs-ink-faint)] mb-6">
                {t('contact.talk.description')}
              </p>
              <UnifiedButton
                className="w-full"
                onClick={() => setDiscoveryModalOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t('contact.talk.button')}
              </UnifiedButton>
            </section>

            <section className="p-5 sm:p-6 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-[var(--fs-rule)]">
              <h2 className="text-xl font-bold text-[var(--fs-ink)] mb-6">
                {t('contact.other.title')}
              </h2>
              <div className="mb-5">
                {!supportOpen ? (
                  <div className="flex justify-end">
                    <UnifiedButton
                      type="button"
                      onClick={() => setSupportOpen(true)}
                      className="h-10 px-3 py-2 text-xs"
                    >
                      <Headphones className="h-4 w-4" />
                      Open support chat
                    </UnifiedButton>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--fs-rule)] bg-white/70 dark:bg-white/[0.03] p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--fs-ink)]">
                        Support chat
                      </p>
                      <button
                        type="button"
                        onClick={() => setSupportOpen(false)}
                        className="rounded-md px-2 py-1 text-xs text-[var(--fs-ink-faint)] hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mb-3 inline-flex rounded-lg border border-[var(--fs-rule)] bg-white/70 dark:bg-white/[0.04] p-0.5">
                      <button
                        type="button"
                        onClick={() => setSupportMode('ai')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          supportMode === 'ai'
                            ? 'bg-[var(--purple)] text-white'
                            : 'text-[var(--fs-ink-faint)]'
                        }`}
                      >
                        <Bot className="h-3.5 w-3.5" />
                        AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupportMode('operator')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          supportMode === 'operator'
                            ? 'bg-[var(--purple)] text-white'
                            : 'text-[var(--fs-ink-faint)]'
                        }`}
                      >
                        <Headphones className="h-3.5 w-3.5" />
                        Operator
                      </button>
                    </div>
                    <div className="mb-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-[var(--fs-rule)] bg-white/75 dark:bg-black/10 p-2.5">
                      {supportMessages.slice(-5).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`max-w-[92%] rounded-lg px-2.5 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'ml-auto bg-[var(--purple)] text-white'
                              : 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)]'
                          }`}
                        >
                          {msg.text}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={supportInput}
                        onChange={(e) => setSupportInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitSupportMessage();
                        }}
                        placeholder={
                          supportMode === 'ai'
                            ? 'Ask the AI support assistant...'
                            : 'Leave a message for an operator...'
                        }
                        className="h-9 w-full rounded-lg border border-[var(--fs-rule)] bg-white dark:bg-white/[0.03] px-3 text-xs text-[var(--fs-ink)] outline-none focus:ring-2 focus:ring-[var(--purple)]/20"
                      />
                      <UnifiedButton
                        type="button"
                        onClick={submitSupportMessage}
                        className="h-9 px-3 py-2 text-xs"
                      >
                        Send
                      </UnifiedButton>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <a
                  href="mailto:hello@flowstarter.app"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[var(--purple)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--fs-ink)] group-hover:text-[var(--purple)] transition-colors">
                      {t('contact.other.emailLabel')}
                    </p>
                    <p className="text-sm text-[var(--fs-ink-faint)]">
                      {t('contact.other.emailValue')}
                    </p>
                  </div>
                </a>
                <a
                  href="https://twitter.com/flowstarter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-[var(--purple)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--fs-ink)] group-hover:text-[var(--purple)] transition-colors">
                      {t('contact.other.twitterLabel')}
                    </p>
                    <p className="text-sm text-[var(--fs-ink-faint)]">
                      {t('contact.other.twitterValue')}
                    </p>
                  </div>
                </a>
                <a
                  href="https://linkedin.com/company/flowstarter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-[var(--purple)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--fs-ink)] group-hover:text-[var(--purple)] transition-colors">
                      {t('contact.other.linkedinLabel')}
                    </p>
                    <p className="text-sm text-[var(--fs-ink-faint)]">
                      {t('contact.other.linkedinValue')}
                    </p>
                  </div>
                </a>
              </div>
            </section>

            <section className="p-5 sm:p-6 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-[var(--fs-rule)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-[var(--fs-ink)]">
                  {t('contact.response.title')}
                </p>
                <p className="text-sm text-[var(--fs-ink-faint)]">
                  {t('contact.response.description')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PreQualModal
        open={discoveryModalOpen}
        onClose={() => setDiscoveryModalOpen(false)}
        source="contact"
      />
    </PublicPageLayout>
  );
}
