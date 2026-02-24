'use client';

import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TermsPage() {
  const lastUpdated = 'February 25, 2026';

  const sections = [
    {
      title: 'Agreement to Terms',
      items: [
        {
          subtitle: 'Acceptance',
          text: 'By accessing or using Flowstarter, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.',
        },
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 18 years old to use our services. By using Flowstarter, you represent that you meet this requirement.',
        },
        {
          subtitle: 'Account Responsibility',
          text: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.',
        },
      ],
    },
    {
      title: 'Our Services',
      items: [
        {
          subtitle: 'Website Building',
          text: 'Flowstarter provides AI-powered website building and hosting services. We build your initial website based on your discovery call, and you can customize it using our AI editor.',
        },
        {
          subtitle: 'Hosting and Email',
          text: 'Your subscription includes website hosting on our global CDN and professional email services. These are provided as part of your monthly plan.',
        },
        {
          subtitle: 'Service Availability',
          text: 'We strive for 99.9% uptime but cannot guarantee uninterrupted service. We will notify you of planned maintenance when possible.',
        },
      ],
    },
    {
      title: 'Payments and Billing',
      items: [
        {
          subtitle: 'Setup Fee',
          text: 'A one-time setup fee is charged for the initial website build. This covers the discovery call, site creation, and domain/email setup. The setup fee is partially refundable (50%) if you provide feedback within 30 days.',
        },
        {
          subtitle: 'Monthly Subscription',
          text: 'Your subscription is billed monthly after the first free month. You can cancel anytime, and your site will remain active until the end of your billing period.',
        },
        {
          subtitle: 'AI Credits',
          text: 'Your plan includes monthly AI credits for site customization. Additional credits can be purchased as needed. Unused credits do not roll over to the next month.',
        },
        {
          subtitle: 'Price Changes',
          text: 'We may change our prices with 30 days notice. Beta pricing is locked for 1 year from your signup date.',
        },
      ],
    },
    {
      title: 'Your Content',
      items: [
        {
          subtitle: 'Ownership',
          text: 'You retain all rights to the content you create and upload to your website. You can download your site assets at any time.',
        },
        {
          subtitle: 'License to Us',
          text: 'You grant us a license to host, display, and transmit your content as necessary to provide our services. This license ends when you delete your content or close your account.',
        },
        {
          subtitle: 'Prohibited Content',
          text: 'You may not use our service to host illegal content, malware, spam, or content that infringes on others\' intellectual property rights.',
        },
      ],
    },
    {
      title: 'Intellectual Property',
      items: [
        {
          subtitle: 'Our Platform',
          text: 'Flowstarter, our logo, and our platform are protected by intellectual property laws. You may not copy, modify, or distribute our software or branding.',
        },
        {
          subtitle: 'Templates',
          text: 'Our website templates are licensed for use within Flowstarter. You may not extract, resell, or redistribute template code.',
        },
      ],
    },
    {
      title: 'Termination',
      items: [
        {
          subtitle: 'By You',
          text: 'You can cancel your subscription at any time from your account settings. Your site will remain active until the end of your current billing period.',
        },
        {
          subtitle: 'By Us',
          text: 'We may suspend or terminate your account if you violate these terms, engage in fraudulent activity, or fail to pay for services.',
        },
        {
          subtitle: 'Effect of Termination',
          text: 'Upon termination, you can download your site assets for 30 days. After that, your data will be deleted.',
        },
      ],
    },
    {
      title: 'Limitation of Liability',
      items: [
        {
          subtitle: 'No Warranty',
          text: 'Our services are provided "as is" without warranties of any kind. We do not guarantee that our service will meet your specific requirements.',
        },
        {
          subtitle: 'Liability Cap',
          text: 'Our total liability to you for any claims arising from our services is limited to the amount you paid us in the 12 months before the claim.',
        },
      ],
    },
    {
      title: 'Changes to Terms',
      items: [
        {
          subtitle: 'Updates',
          text: 'We may update these terms from time to time. We will notify you of significant changes via email or through our platform.',
        },
        {
          subtitle: 'Continued Use',
          text: 'Your continued use of Flowstarter after changes to the terms constitutes acceptance of the new terms.',
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
              <linearGradient id="termsFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#termsFlowGradient)" strokeWidth="1">
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

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0a0a0c]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20 group-hover:shadow-[var(--purple)]/30 transition-shadow">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
            </Link>
            <Link 
              href="/"
              className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Legal Agreement
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              By using Flowstarter, you agree to these terms. Please read them carefully.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              { icon: '✨', title: 'Simple Pricing', desc: 'Setup fee + monthly subscription.' },
              { icon: '📦', title: 'Your Content', desc: 'You own what you create.' },
              { icon: '🚪', title: 'Cancel Anytime', desc: 'No lock-in contracts.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
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
              Questions about our terms?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              We're happy to clarify anything.
            </p>
            <a 
              href="mailto:hello@flowstarter.dev"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 font-semibold hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              hello@flowstarter.dev
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
