'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Calendar,
  Check,
  Clock,
  Crown,
  Globe,
  Headphones,
  Layout,
  Lock,
  Mail,
  MessageSquare,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

export default function PricingPage() {
  const starterFeatures = [
    { icon: Users, text: 'Concierge setup: discovery call + AI-generated site' },
    { icon: Layout, text: 'Up to 7 pages' },
    { icon: MessageSquare, text: '1 contact form' },
    { icon: Mail, text: '1 professional mailbox' },
    { icon: Globe, text: 'Cloudflare Pages hosting' },
    { icon: Shield, text: 'Custom domain setup' },
    { icon: BarChart3, text: 'GA4 integration' },
    { icon: Zap, text: 'Dashboard analytics: leads + page views' },
    { icon: Sparkles, text: 'Moderate AI credits for monthly edits' },
    { icon: Headphones, text: 'Email support (48h response)' },
  ];

  const proFeatures = [
    'Up to 3 sites, single subscription',
    'Blog integration',
    'Booking system integration',
    'Newsletter/email marketing',
    'Multi-language support',
    'Enhanced dashboard with revenue tracking',
  ];

  const businessFeatures = [
    'E-commerce integration (Shopify/Gumroad/Lemon Squeezy)',
    'Product catalog & Stripe payments',
    'Advanced SEO tools',
    'WhatsApp Business integration',
    'Real revenue tracking in dashboard',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--purple)]/10 to-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/10 to-[var(--purple)]/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Beta Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-[var(--purple)] to-cyan-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Beta Pricing — 50% Off Everything
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-[var(--purple)] to-cyan-500 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Get your professional website built by our team. 
              50% off setup + 50% off subscription for your first year.
            </p>

            {/* Limited spots indicator */}
            <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Limited beta spots available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* STARTER - Main Card (Active) */}
            <Card className="lg:col-span-1 relative bg-white dark:bg-gray-800 border-2 border-[var(--purple)]/30 shadow-xl shadow-[var(--purple)]/5 overflow-hidden">
              {/* Popular badge */}
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[var(--purple)] to-cyan-500" />
              
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-[var(--purple)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Perfect for launch</p>
                    </div>
                  </div>
                  <Badge className="bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20">
                    Available Now
                  </Badge>
                </div>

                {/* Setup Fee */}
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">One-time setup fee</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl text-gray-400 line-through">€299</span>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">€150</span>
                  </div>
                  <p className="text-xs text-[var(--purple)] mt-1">Includes discovery call + AI site generation</p>
                </div>

                {/* Monthly Subscription */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-cyan-500/5 border border-[var(--purple)]/10">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly subscription</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl text-gray-400 line-through">€29</span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">€15</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-xs text-[var(--purple)] mt-1">50% off for your first year</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {starterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  }}
                >
                  Book Your Discovery Call
                </a>
                
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                  No commitment required • Free consultation
                </p>
              </CardContent>
            </Card>

            {/* Coming Soon Cards Container */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* PRO - Coming Soon */}
              <Card className="relative bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/50 pointer-events-none" />
                
                <CardContent className="p-6 relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                        <Star className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">Pro</h3>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-gray-400 border-gray-300 dark:border-gray-600">
                      <Lock className="w-3 h-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    For growing businesses that need more features
                  </p>

                  {/* Features Preview */}
                  <div className="space-y-2">
                    {proFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    disabled
                    className="w-full mt-6 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  >
                    Coming Q2 2026
                  </Button>
                </CardContent>
              </Card>

              {/* BUSINESS - Coming Soon */}
              <Card className="relative bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/50 pointer-events-none" />
                
                <CardContent className="p-6 relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">Business</h3>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-gray-400 border-gray-300 dark:border-gray-600">
                      <Lock className="w-3 h-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    E-commerce ready with advanced integrations
                  </p>

                  {/* Features Preview */}
                  <div className="space-y-2">
                    {businessFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    disabled
                    className="w-full mt-6 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  >
                    Coming Q3 2026
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Terms */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-[var(--purple)]/5 to-cyan-500/5 border-[var(--purple)]/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--purple)]" />
                Beta Pricing Details
              </h3>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--purple)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--purple)]">1</span>
                  </div>
                  <p><strong>50% off setup fee</strong> — Pay €150 instead of €299 during beta</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--purple)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--purple)]">2</span>
                  </div>
                  <p><strong>50% off subscription</strong> — Pay €15/month instead of €29/month for your first year</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--purple)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--purple)]">3</span>
                  </div>
                  <p><strong>Lock in your rate</strong> — Beta pricing is locked for 1 year from your signup date</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--purple)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--purple)]">4</span>
                  </div>
                  <p><strong>Early access benefits</strong> — Priority support and input on new features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What's included in your website
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to launch and grow your online presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                  <Users className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Concierge Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We build your site for you. Start with a discovery call, and we'll handle the rest using AI-powered generation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track leads, page views, and traffic sources. See who's visiting and how they're engaging with your site.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Ongoing Updates
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Monthly AI credits to make edits and improvements. Keep your site fresh without hiring a developer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--purple)]/10 via-cyan-500/10 to-[var(--purple)]/10 border-[var(--purple)]/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to launch your website?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                Book a free discovery call. No commitment, no pressure. 
                Let's talk about your business and see if Flowstarter is right for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  }}
                >
                  <Calendar className="w-5 h-5" />
                  Book Free Discovery Call
                </a>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500 dark:text-gray-400">
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
