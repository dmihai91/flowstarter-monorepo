'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EXTERNAL_URLS } from '@/lib/constants';
import {
  Calendar,
  Check,
  Clock,
  Crown,
  Lock,
  Rocket,
  Sparkles,
  Star,
} from 'lucide-react';


export default function PricingPage() {
  // Quick features for the main card
  const quickFeatures = [
    'Discovery call + done-for-you site build',
    'Up to 7 professionally designed pages',
    'Hosting on global CDN',
    'Professional email (1 mailbox)',
    'Analytics dashboard (leads + page views)',
    'AI-powered site customization',
    'First month free',
  ];

  // Setup features (one-time) - everything we build
  const setupFeatures = [
    'Personal discovery call with our team',
    'AI-generated website from premium templates',
    'Up to 7 professionally designed pages',
    'Mobile-responsive design (looks great on any device)',
    'Custom domain setup and configuration',
    'Professional email setup (1 mailbox)',
    'SSL certificate (HTTPS security)',
    'Contact form with lead capture',
    'Google Analytics integration',
    'Basic SEO setup (meta tags, sitemap, robots.txt)',
    'Open Graph tags for social sharing',
    'Performance optimization (90+ Lighthouse score)',
    'Image optimization and lazy loading',
    'Cloudflare CDN configuration',
    'DNS setup and domain verification',
    'Cookie consent banner (GDPR compliant)',
    'Privacy policy and terms pages (templates)',
    'Favicon and brand assets setup',
    'Your site, live and ready',
  ];

  // Monthly features (subscription)
  const monthlyFeatures = [
    'Website hosting (global CDN, automatic SSL)',
    'Professional email (1 mailbox)',
    '1 GB cloud storage for your files and assets',
    'Analytics dashboard (leads + page views)',
    'AI-powered edits - content, pages, branding, SEO',
    'Platform updates and improvements',
    'Email support (48h response)',
  ];

  // Pro features
  const proFeatures = [
    'Up to 3 sites, 1 subscription',
    'Blog, booking & newsletter integrations',
    'Multi-language support',
    'Enhanced dashboard with potential revenue tracking',
  ];

  // Business features
  const businessFeatures = [
    'E-commerce integrations (Shopify, Gumroad)',
    'Product catalog & Stripe payments',
    'Advanced SEO & WhatsApp Business',
    'Full revenue tracking in dashboard',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--purple)]/10 to-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/10 to-[var(--purple)]/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-[var(--purple)] to-cyan-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Beta Pricing - 50% Off Everything
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-[var(--purple)] to-cyan-500 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Get your professional website built by our team. 50% off setup +
              50% off subscription for your first year.
            </p>

            <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Limited beta spots available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Plan Card */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto">
            <Card className="relative bg-white dark:bg-gray-800 border-2 border-[var(--purple)]/30 shadow-xl shadow-[var(--purple)]/5 overflow-hidden">
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[var(--purple)] to-cyan-500" />

              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-[var(--purple)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Starter
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Everything you need
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[var(--purple)] text-white border-0">
                    50% off during beta
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    {/* Setup */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                        One-time setup
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-gray-400 line-through">
                          €299
                        </span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          €150
                        </span>
                      </div>
                    </div>

                    {/* Monthly */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                        Monthly
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-gray-400 line-through">
                          €29
                        </span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          €15
                        </span>
                        <span className="text-gray-500">/mo</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--purple)] mt-3">
                    Starts after your free first month
                  </p>
                </div>

                {/* Quick Features */}
                <div className="space-y-2.5 mb-6">
                  {quickFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3.5 px-6 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  }}
                >
                  Book Free Discovery Call
                  <span className="ml-2">→</span>
                </a>

                <p className="text-center text-xs text-gray-400 dark:text-white/40 mt-4">
                  No lock-in. Cancel anytime. 50% setup fee refund if you share
                  feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="py-16 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Clear breakdown of what's included in setup vs. your monthly
              subscription
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Setup Column */}
            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-[var(--purple)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Setup (one-time)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      What we build for you
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <span className="text-lg text-gray-400 line-through">
                    €299
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    €150
                  </span>
                  <span className="text-sm text-[var(--purple)]">
                    beta price
                  </span>
                </div>

                <div className="space-y-3">
                  {setupFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Column */}
            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Monthly subscription
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      What stays active
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <span className="text-lg text-gray-400 line-through">
                    €29
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    €15
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                  <span className="text-sm text-[var(--purple)]">
                    beta price
                  </span>
                </div>

                <div className="space-y-3">
                  {monthlyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 dark:text-white/30 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                  First month free - billing starts 30 days after launch
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              More plans coming soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Growing? We'll grow with you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro */}
            <Card className="relative bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/30 pointer-events-none" />

              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Star className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      Pro
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Starting at €499 setup + €49/month
                </p>

                <div className="space-y-2">
                  {proFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  disabled
                  className="w-full mt-5 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Coming Q2 2026
                </Button>
              </CardContent>
            </Card>

            {/* Business */}
            <Card className="relative bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/30 pointer-events-none" />

              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      Business
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Starting at €699 setup + €79/month
                </p>

                <div className="space-y-2">
                  {businessFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  disabled
                  className="w-full mt-5 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Coming Q3 2026
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early Access Banner */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--purple)]/10 via-cyan-500/10 to-[var(--purple)]/10 border-[var(--purple)]/20">
            <CardContent className="p-8 sm:p-12 text-center">
              <Badge className="mb-4 bg-[var(--purple)]/10 text-[var(--purple)] border-[var(--purple)]/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Early Access
              </Badge>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Launching beta - early adopters get 50% off
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
                Lock in beta pricing (€150 setup + €15/month) until v1.0.
                Regular pricing will be €299 setup + €29/month.
              </p>

              <a
                href={EXTERNAL_URLS.calendly.discovery}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }}
              >
                <Calendar className="w-5 h-5" />
                Book Free Discovery Call
              </a>

              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  30-min consultation
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  Cancel anytime
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
