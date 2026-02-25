'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Shield, Settings, Ban } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'February 25, 2026';

  const sections = [
    {
      title: 'Information We Collect',
      items: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account, we collect your name, email address, and billing information. This helps us provide you with personalized service and process payments securely.',
        },
        {
          subtitle: 'Website Data',
          text: 'We store the websites you create, including content, images, and design preferences. This data is essential for providing our service and is only accessible to you and authorized Flowstarter personnel.',
        },
        {
          subtitle: 'Usage Analytics',
          text: 'We collect anonymous usage data to understand how our platform is used and to improve our services. This includes page views, feature usage, and performance metrics.',
        },
      ],
    },
    {
      title: 'How We Use Your Information',
      items: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide, maintain, and improve our website building platform, including hosting your websites and providing customer support.',
        },
        {
          subtitle: 'Communication',
          text: 'We may send you service-related notifications, updates about new features, and promotional content (which you can opt out of at any time).',
        },
        {
          subtitle: 'Security and Compliance',
          text: 'We use your information to detect fraud, ensure platform security, and comply with legal obligations.',
        },
      ],
    },
    {
      title: 'Data Security',
      items: [
        {
          subtitle: 'Encryption',
          text: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your payment information is processed securely through certified payment processors.',
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls and regularly review who has access to user data. Our employees undergo security training and background checks.',
        },
        {
          subtitle: 'Infrastructure Security',
          text: 'Our infrastructure is hosted on secure, SOC 2 compliant platforms with regular security audits and monitoring.',
        },
      ],
    },
    {
      title: 'Your Rights',
      items: [
        {
          subtitle: 'Data Access',
          text: 'You can access and download all your personal data at any time through your account settings or by contacting our support team.',
        },
        {
          subtitle: 'Data Correction',
          text: 'You can update or correct your personal information directly in your account settings or by contacting us.',
        },
        {
          subtitle: 'Data Deletion',
          text: 'You can delete your account and all associated data at any time. Some data may be retained for legal or security purposes as outlined in our retention policy.',
        },
      ],
    },
    {
      title: 'Data Retention',
      items: [
        {
          subtitle: 'Active Accounts',
          text: 'We retain your data as long as your account is active or as needed to provide you services.',
        },
        {
          subtitle: 'Deleted Accounts',
          text: 'When you delete your account, we remove your personal data within 30 days, except for data we are required to retain for legal purposes.',
        },
        {
          subtitle: 'Legal Requirements',
          text: 'Certain data may be retained longer to comply with legal obligations, resolve disputes, and enforce our agreements.',
        },
      ],
    },
    {
      title: 'Third-Party Services',
      items: [
        {
          subtitle: 'Service Providers',
          text: 'We work with trusted third-party services for hosting (Cloudflare), email (Zoho), analytics (Google Analytics), and payments (Stripe). These providers are contractually obligated to protect your data.',
        },
        {
          subtitle: 'No Data Sales',
          text: 'We never sell your personal information to third parties. Your data is yours.',
        },
      ],
    },
    {
      title: 'Cookies',
      items: [
        {
          subtitle: 'Essential Cookies',
          text: 'We use essential cookies to keep you logged in and remember your preferences.',
        },
        {
          subtitle: 'Analytics Cookies',
          text: 'We use analytics cookies to understand how our service is used. You can opt out of these in your browser settings.',
        },
      ],
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
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
              <linearGradient id="privacyFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Your Privacy Matters
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              { Icon: Shield, title: 'We Protect Your Data', desc: 'Enterprise-grade encryption and security.' },
              { Icon: Settings, title: 'You Control Your Data', desc: 'Access, update, or delete anytime.' },
              { Icon: Ban, title: 'No Data Sales', desc: 'We never sell your information.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-3">
                  <item.Icon className="w-6 h-6 text-[var(--purple)]" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section key={index} className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
