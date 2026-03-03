'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Button } from '@/components/ui/button';
import { useContactForm } from '@/hooks/useContactForm';
import Link from 'next/link';
import { useState } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';
import { FlowBackground, GlassCard, GlassPanel } from '@flowstarter/flow-design-system';
import { MessageCircle, Check, Loader2, Send, Calendar, Mail, Twitter, Linkedin, Clock } from 'lucide-react';


export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

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

  const errorMessage = contactMutation.error?.message || 'Something went wrong';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display page-gradient">
        <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Get in Touch
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              We'd love to hear from you
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
              Whether you have a question about our service or want to discuss your project, we're here to help.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <GlassPanel padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send us a message
              </h2>

              {status === 'success' ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Message sent!
                  </h3>
                  <p className="text-gray-500 dark:text-white/50 mb-6">
                    We'll get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => contactMutation.reset()}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                      Your name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                      Subject
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General inquiry</option>
                      <option value="project">I want a website built</option>
                      <option value="support">Support with my site</option>
                      <option value="billing">Billing question</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Tell us about your project or question..."
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)] transition-all resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white hover:from-[var(--landing-btn-hover-from)] hover:via-[var(--landing-btn-hover-via)] hover:to-[var(--landing-btn-hover-from)] rounded-xl h-12 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message
                        <Send className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </GlassPanel>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-[var(--purple)]/10 to-blue-500/10 border border-[var(--purple)]/20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Prefer to talk?
                </h2>
                <p className="text-gray-500 dark:text-white/50 mb-6">
                  Book a free 45-minute discovery call. We'll learn about your business and figure out the best approach together.
                </p>
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white rounded-xl h-12 text-base font-semibold shadow-lg transition-all duration-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Free Discovery Call
                  </Button>
                </a>
              </div>

              {/* Contact Methods */}
              <GlassPanel padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Other ways to reach us
                </h2>
                <div className="space-y-4">
                  <a
                    href="mailto:hello@flowstarter.app"
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[var(--purple)]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-[var(--purple)] transition-colors">
                        Email
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        hello@flowstarter.app
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
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-[var(--purple)] transition-colors">
                        Twitter
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        @flowstarter
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
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-[var(--purple)] transition-colors">
                        LinkedIn
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        Flowstarter
                      </p>
                    </div>
                  </a>
                </div>
              </GlassPanel>

              {/* Response Time */}
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Response within 24 hours
                  </p>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    Usually much faster!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
