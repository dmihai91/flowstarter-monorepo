'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassCard } from '@flowstarter/flow-design-system';
import { Globe, Mail, BarChart3, CreditCard, ShieldCheck, Wrench } from 'lucide-react';

export function TrustSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  const items = [
    { icon: Globe, label: 'Fast & secure hosting', desc: 'Global CDN, lightning-fast pages' },
    { icon: Mail, label: 'Professional email', desc: '@yourdomain.com included' },
    { icon: BarChart3, label: 'Visitor analytics', desc: 'See who visits and when' },
    { icon: CreditCard, label: 'Secure payments', desc: 'Accept bookings and payments' },
    { icon: ShieldCheck, label: 'SSL & daily backups', desc: 'Protected and always recoverable' },
    { icon: Wrench, label: 'No maintenance headaches', desc: 'We handle updates and security' },
  ];

  return (
    <section ref={sectionRef} className="py-20 lg:py-28">
      <div className={`max-w-5xl mx-auto px-6 lg:px-12 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0'
      }`}>
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Everything&apos;s included. No hidden extras.
          </h2>
          <p className="text-base text-gray-500 dark:text-white/40 max-w-lg mx-auto">
            Every website comes with everything you need to look professional and get found.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {items.map(({ icon: Icon, label, desc }, i) => (
            <GlassCard
              key={label}
              variant="subtle"
              noHover
              className={`p-5 lg:p-6 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isVisible ? `${i * 80}ms` : '0ms',
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--purple)]/[0.07] dark:bg-[var(--purple)]/10 flex items-center justify-center mb-3">
                <Icon className="w-4.5 h-4.5 text-[var(--purple)] dark:text-[var(--purple)]/80" strokeWidth={1.5} />
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/80 mb-1">
                {label}
              </div>
              <div className="text-xs text-gray-400 dark:text-white/35 leading-relaxed">
                {desc}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
