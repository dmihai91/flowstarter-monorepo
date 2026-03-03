'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassCard } from '@flowstarter/flow-design-system';
import { Shield, Triangle, BarChart3, Mail } from 'lucide-react';

export function TrustSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  return (
    <section ref={sectionRef} className="py-20 lg:py-28">
      <div className={`max-w-5xl mx-auto px-6 lg:px-12 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {/* Section heading */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Built on technology you can trust
          </h2>
          <p className="text-base text-gray-500 dark:text-white/40 max-w-lg mx-auto">
            Enterprise-grade infrastructure. No compromises on speed, security, or reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Tech stack */}
          <GlassCard variant="subtle" noHover className="p-8 lg:p-10">
            <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-6">
              Powered by
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { name: 'Cloudflare', desc: 'Global CDN & security', icon: Shield },
                { name: 'Next.js', desc: 'React framework', icon: Triangle },
                { name: 'Analytics', desc: 'Traffic insights', icon: BarChart3 },
                { name: 'Zoho Mail', desc: 'Professional email', icon: Mail },
              ].map(({ name, desc, icon: Icon }) => (
                <div key={name} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--purple)] dark:text-white/50" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/80">{name}</div>
                    <div className="text-xs text-gray-400 dark:text-white/30">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* First Month Free — clear callout */}
          <div className="p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-500/[0.06] dark:to-emerald-500/[0.02] border border-emerald-200/40 dark:border-emerald-500/15">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                First month free
              </h3>
            </div>
            <p className="text-base text-gray-600 dark:text-white/55 leading-relaxed mb-4">
              Your €39/month subscription starts 30 days after launch. That gives you a full month to settle in, explore the editor, and make sure everything is exactly how you want it.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/35">
              No card required until launch. Cancel anytime after.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
