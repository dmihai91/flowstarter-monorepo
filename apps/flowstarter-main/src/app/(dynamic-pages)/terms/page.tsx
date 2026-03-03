'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Sparkles, Package, DoorOpen, FileText, Mail } from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
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
          text: 'Flowstarter provides website design, development, and hosting services. Our team builds your website based on a discovery call, and after launch you can customize it using our AI editor.',
        },
        {
          subtitle: 'Hosting and Email',
          text: 'Your subscription includes website hosting, SSL certificate, and professional email. These are provided as part of your monthly plan.',
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
          text: 'A one-time setup fee is charged for the initial website build. 50% is due upfront to start the project (non-refundable deposit), and 50% is due upon your approval of the final site. This covers the discovery call, design, development, and domain/email setup.',
        },
        {
          subtitle: 'Monthly Subscription',
          text: 'Your first month is free. After that, your subscription is billed monthly. You can cancel anytime, and your site will remain active until the end of your billing period.',
        },
        {
          subtitle: 'AI Credits',
          text: 'Your plan includes monthly AI credits for site customization. Additional credits can be purchased as needed. Unused credits do not roll over to the next month.',
        },
        {
          subtitle: 'Price Changes',
          text: 'We may change our prices with 30 days notice. Early adopter pricing is locked for the duration of your subscription, as long as it remains active.',
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
          text: "You may not use our service to host illegal content, malware, spam, or content that infringes on others' intellectual property rights.",
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
          text: 'Upon termination, you can download your site assets for 90 days. After that, your data will be deleted.',
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
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display page-gradient">
        <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Legal Agreement
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              By using Flowstarter, you agree to these terms. Please read them
              carefully.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              {
                Icon: Sparkles,
                title: 'Simple Pricing',
                desc: 'Setup fee + monthly subscription.',
              },
              {
                Icon: Package,
                title: 'Your Content',
                desc: 'You own what you create.',
              },
              {
                Icon: DoorOpen,
                title: 'Cancel Anytime',
                desc: 'No lock-in contracts.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center"
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

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section
                key={index}
                className="p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
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
              Questions about our terms?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              We're happy to clarify anything.
            </p>
            <a
              href="mailto:hello@flowstarter.app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              hello@flowstarter.app
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
