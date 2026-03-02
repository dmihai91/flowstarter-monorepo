'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
import { EXTERNAL_URLS } from '@/lib/constants';
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
import Link from 'next/link';


export function PricingSection() {
  const starterFeatures = [
    { icon: Users, text: 'Concierge setup with discovery call' },
    { icon: Layout, text: 'Up to 7 pages' },
    { icon: MessageSquare, text: 'Contact form included' },
    { icon: Mail, text: 'Professional mailbox' },
    { icon: Globe, text: 'Custom domain + hosting' },
    { icon: BarChart3, text: 'Analytics dashboard' },
    { icon: Sparkles, text: 'Monthly AI edit credits' },
    { icon: Headphones, text: '48h email support' },
  ];

  return (
    <section
      id="pricing"
      className="full-width-section py-16 md:py-24 lg:py-32 relative"
    >
      {/* Background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--purple)]/5 via-cyan-500/3 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--purple)]/10 to-cyan-500/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/10 to-[var(--purple)]/10 blur-3xl animate-pulse"
          style={{ animationDelay: '3s', animationDuration: '4s' }}
        />
      </div>

      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {/* Header */}
          <div className="space-y-4 max-w-[850px] mx-auto">
            <Badge className="bg-gradient-to-r from-[var(--purple)] to-cyan-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Beta Pricing
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Simple, transparent pricing
            </h2>

            <p className="text-muted-foreground tablet:text-lg md:text-xl max-w-2xl mx-auto">
              Get your professional website built by our team. Lock in beta
              rates before prices go up.
            </p>

            {/* Limited spots */}
            <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Limited beta spots available</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl pt-8 px-2 sm:px-0">
            {/* STARTER - Main Card */}
            <Card className="lg:col-span-1 relative bg-white/90 dark:bg-gray-800/90 border-2 border-[var(--purple)]/30 shadow-xl shadow-[var(--purple)]/5 overflow-hidden backdrop-blur-xl">
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[var(--purple)] to-cyan-500" />

              <CardContent className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-[var(--purple)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Starter
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Perfect for launch
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20 text-xs">
                    Available
                  </Badge>
                </div>

                {/* Setup Fee */}
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    One-time setup
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl text-gray-400 line-through">
                      €599
                    </span>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      €399
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--purple)] mt-1">
                    Beta pricing
                  </p>
                </div>

                {/* Monthly */}
                <div className="mb-6 p-3 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-cyan-500/5 border border-[var(--purple)]/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Monthly subscription
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      €39
                    </span>
                    <span className="text-gray-500 text-sm">/mo</span>
                  </div>
                  <p className="text-[10px] text-[var(--purple)] mt-1">
                    Locked for 1 year, then €59/mo
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {starterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  }}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Book Discovery Call
                </a>
              </CardContent>
            </Card>

            {/* Coming Soon Cards */}
            <Card className="relative bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-white/5 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Star className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400">Pro</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Soon
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Multi-site, blog, booking, newsletter, multi-language
                </p>
                <Button
                  disabled
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Coming Q2 2026
                </Button>
              </CardContent>
            </Card>

            <Card className="relative bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-white/5 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400">
                      Business
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Soon
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  E-commerce, Stripe payments, advanced SEO, WhatsApp
                </p>
                <Button
                  disabled
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Coming Q3 2026
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* View full pricing link */}
          <Link
            href="/pricing"
            className="text-sm text-[var(--purple)] hover:underline font-medium mt-4"
          >
            View full pricing details →
          </Link>
        </div>
      </div>
    </section>
  );
}
