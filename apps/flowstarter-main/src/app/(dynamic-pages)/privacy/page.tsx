'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Shield, Settings, Ban, Bot, Download, Globe } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'February 27, 2026';

  const sections = [
    {
      title: 'Who We Are',
      items: [
        {
          subtitle: 'About Flowstarter',
          text: 'Flowstarter is a premium website building service operated from Romania, European Union. We combine human expertise with AI technology to build professional websites for freelancers, small businesses, and creators.',
        },
        {
          subtitle: 'Contact Information',
          text: 'For any privacy-related questions or requests, you can reach us at hello@flowstarter.app. We typically respond within 48 hours.',
        },
      ],
    },
    {
      title: 'Information We Collect',
      items: [
        {
          subtitle: 'From Strategy Calls & Onboarding',
          text: 'When you book a strategy call, we collect: your business name, industry/niche, branding preferences (colors, fonts, tone), content you provide (text, images, logos), contact information (name, email, phone), target audience description, and competitor references.',
        },
        {
          subtitle: 'From Your Account & Dashboard',
          text: 'When using our platform, we collect: account information (email, name, authentication provider), project data (site structure, pages, components, design choices), AI editor interactions (prompts, edits, customization history), and usage analytics (features used, session data).',
        },
        {
          subtitle: 'Payment Information',
          text: 'Payments are processed securely through Stripe. We do not store your credit card details on our servers. Stripe handles all payment data in accordance with PCI-DSS standards.',
        },
        {
          subtitle: 'Automatically Collected',
          text: 'We automatically collect: IP address, browser type, device information, cookies and session data, and analytics data through privacy-focused tools.',
        },
      ],
    },
    {
      title: 'How We Use Your Information',
      items: [
        {
          subtitle: 'Service Delivery',
          text: 'We use your information to build your website, provide access to your dashboard, enable AI-powered editing features, host and maintain your site, and provide customer support.',
        },
        {
          subtitle: 'Communication',
          text: 'We may contact you about: service updates and important notices, project progress and deliverables, new features relevant to your subscription, and promotional content (you can opt out anytime).',
        },
        {
          subtitle: 'Platform Improvement',
          text: 'We analyze usage patterns to improve our platform, fix bugs, and develop new features that better serve our users.',
        },
      ],
    },
    {
      title: 'AI Technology & Data Processing',
      items: [
        {
          subtitle: 'How We Use AI',
          text: 'Flowstarter uses AI technology (including Anthropic\'s Claude) for code generation, content suggestions, and powering our AI editor. When you use these features, your prompts and relevant project context are sent to these AI providers for real-time processing.',
        },
        {
          subtitle: 'Third-Party AI Providers',
          text: 'We work with Anthropic (Claude) and may integrate additional AI providers in the future. These providers process your data according to their own privacy policies and data handling agreements. We have data processing agreements in place with these providers.',
        },
        {
          subtitle: 'What Gets Sent to AI Providers',
          text: 'When you use AI features, we send: your prompts and instructions, relevant page/component context needed to complete the task, and design preferences. We minimize data sent to only what\'s necessary for the specific task.',
        },
      ],
    },
    {
      title: 'Anonymized Data for AI Improvement',
      items: [
        {
          subtitle: 'What We May Use',
          text: 'We reserve the right to use anonymized, aggregated data to improve our AI systems and algorithms. This includes: patterns of website structure preferences per industry, common customization and editing workflows, AI prompt patterns and effectiveness (anonymized), template usage and modification patterns, and aggregated design preference data.',
        },
        {
          subtitle: 'What We Will Never Use',
          text: 'We will never use for AI training purposes: your personal or business content (text, images, logos) without explicit separate consent, your personal information, individual project data in any identifiable form, or any data that could be traced back to you or your business.',
        },
        {
          subtitle: 'Your Control',
          text: 'You can opt out of anonymized data collection for AI improvement purposes by contacting us. Note that opting out may limit certain AI-powered features that rely on aggregated learning.',
        },
        {
          subtitle: 'Future Development',
          text: 'We may develop proprietary AI models trained on aggregated, anonymized platform data. Any such development will follow the same principles: no personal content, no identifiable information, and full transparency about our practices.',
        },
      ],
    },
    {
      title: 'Data Security',
      items: [
        {
          subtitle: 'Encryption',
          text: 'All data is encrypted in transit using TLS 1.3. Data at rest is protected using industry-standard encryption. Your payment information is handled exclusively by Stripe\'s secure infrastructure.',
        },
        {
          subtitle: 'Infrastructure',
          text: 'We use trusted, secure infrastructure providers: Cloudflare Pages for hosting, AWS S3 for asset storage, Supabase for database and authentication, and Convex for real-time editor state. All providers maintain SOC 2 compliance and robust security practices.',
        },
        {
          subtitle: 'Access Controls',
          text: 'Access to user data is strictly limited to authorized personnel who need it to provide our services. We maintain audit logs and regularly review access permissions.',
        },
      ],
    },
    {
      title: 'Your Rights (GDPR)',
      items: [
        {
          subtitle: 'Right to Access',
          text: 'You can request a copy of all personal data we hold about you. We will provide this within 30 days of your request.',
        },
        {
          subtitle: 'Right to Rectification',
          text: 'You can update or correct your personal information at any time through your account settings or by contacting us.',
        },
        {
          subtitle: 'Right to Erasure',
          text: 'You can request deletion of your account and all associated data. We will complete this within 30 days, except for data we are legally required to retain.',
        },
        {
          subtitle: 'Right to Data Portability',
          text: 'You can download all your site assets, content, and data. Your website files and assets belong to you.',
        },
        {
          subtitle: 'Right to Object',
          text: 'You can object to certain processing activities, including the use of your anonymized data for AI improvement purposes.',
        },
        {
          subtitle: 'Right to Withdraw Consent',
          text: 'Where processing is based on consent, you can withdraw that consent at any time without affecting the lawfulness of prior processing.',
        },
      ],
    },
    {
      title: 'Data Retention',
      items: [
        {
          subtitle: 'Active Accounts',
          text: 'We retain your data for as long as your account is active and you maintain an active subscription with us.',
        },
        {
          subtitle: 'After Cancellation',
          text: 'If you cancel your subscription, we retain your data for 90 days in case you wish to reactivate. After this period, project data is deleted unless you request earlier deletion.',
        },
        {
          subtitle: 'Account Deletion',
          text: 'When you request account deletion, we remove your personal data within 30 days. Some data may be retained longer for legal compliance (e.g., invoices for tax purposes).',
        },
      ],
    },
    {
      title: 'Cookies & Tracking',
      items: [
        {
          subtitle: 'Essential Cookies',
          text: 'We use essential cookies to keep you logged in, remember your preferences, and ensure the platform functions correctly. These cannot be disabled.',
        },
        {
          subtitle: 'Analytics',
          text: 'We use privacy-focused analytics to understand how our platform is used. This helps us improve the service. You can opt out of analytics tracking in your browser settings.',
        },
        {
          subtitle: 'No Advertising Trackers',
          text: 'We do not use advertising cookies or sell your data to advertisers. We do not track you across other websites.',
        },
      ],
    },
    {
      title: 'Third-Party Services',
      items: [
        {
          subtitle: 'Service Providers',
          text: 'We work with: Stripe (payments), Supabase (authentication & database), Cloudflare (hosting & CDN), AWS (asset storage), Anthropic (AI processing), and Convex (real-time data). Each provider is contractually bound to protect your data.',
        },
        {
          subtitle: 'Authentication Providers',
          text: 'You can sign in using Google, GitHub, Apple, or Facebook. When you do, we receive basic profile information (name, email) from these providers. We do not receive or store your passwords from these services.',
        },
        {
          subtitle: 'No Data Sales',
          text: 'We never sell your personal information to third parties. Your data is used solely to provide and improve our service.',
        },
      ],
    },
    {
      title: 'International Transfers',
      items: [
        {
          subtitle: 'Where Data Is Processed',
          text: 'Your data may be processed in the European Union and the United States (where some of our infrastructure providers are located).',
        },
        {
          subtitle: 'Safeguards',
          text: 'For transfers outside the EU, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) with our service providers.',
        },
      ],
    },
    {
      title: 'Changes to This Policy',
      items: [
        {
          subtitle: 'Updates',
          text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through a notice on our platform.',
        },
        {
          subtitle: 'Review',
          text: 'We encourage you to review this policy periodically. Your continued use of Flowstarter after changes indicates acceptance of the updated policy.',
        },
      ],
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.06]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="privacyFlowGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#privacyFlowGradient)" strokeWidth="1">
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
              <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
              <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
              <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
              <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
            </g>
          </svg>
        </div>

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              GDPR Compliant
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              We respect your privacy and are committed to protecting your
              personal data. This policy explains how we collect, use, and
              safeguard your information, including how we use AI technology.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              {
                Icon: Shield,
                title: 'We Protect Your Data',
                desc: 'Enterprise-grade encryption and security.',
              },
              {
                Icon: Bot,
                title: 'AI Transparency',
                desc: 'Clear about how we use AI with your data.',
              },
              {
                Icon: Download,
                title: 'Your Assets, Your Data',
                desc: 'Download everything. You own it.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-3">
                  <item.Icon className="w-6 h-6 text-[var(--purple)]" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Important Notice about AI */}
          <div className="mb-12 p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  About AI & Your Data
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed">
                  Flowstarter uses AI technology to help build and edit your website. 
                  We want to be completely transparent: your prompts are processed by third-party AI providers (like Anthropic). 
                  We may use anonymized, aggregated patterns to improve our AI systems, but we will never use your 
                  personal content, images, or identifiable data for AI training without your explicit consent.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section
                key={index}
                id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-[var(--purple)]">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Questions about your privacy?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              We're here to help. Reach out anytime.
            </p>
            <a
              href="mailto:hello@flowstarter.app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 font-semibold hover:shadow-lg transition-all duration-300"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              hello@flowstarter.app
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
