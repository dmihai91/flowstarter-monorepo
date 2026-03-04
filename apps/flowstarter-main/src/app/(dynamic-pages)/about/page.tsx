'use client';

import { Rocket, Sparkles, Target } from 'lucide-react';
import Image from 'next/image';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import { useTranslations } from '@/lib/i18n';

export default function AboutPage() {
  const { t } = useTranslations();
  return (
    <div className="relative flex min-h-screen flex-col page-gradient">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <SupportHeader />

      <main className="relative z-10 flex-1 w-full mx-auto">
        {/* Hero Section */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-24 text-center">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-2 bg-[--purple-primary] rounded-full mb-6" />
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-4 text-foreground">
                {t('about.title')}
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                {t('about.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section as Card */}
        <section className="py-16 flex justify-center px-4">
          <div className="w-full max-w-5xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[--purple-primary]/30 shadow-xl p-8 md:p-14 grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-[--purple-primary] rounded-full" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('about.mission.heading')}
                </h2>
              </div>
              <p className="text-muted-foreground md:text-lg">
                {t('about.mission.description')}
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--purple)]/10 dark:bg-[var(--purple)]/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-(--purple-primary)" />
                  </span>
                  <span className="text-muted-foreground">
                    {t('about.mission.simplify')}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Sparkles
                      className="w-6 h-6"
                      style={{ color: 'var(--blue)' }}
                    />
                  </span>
                  <span className="text-muted-foreground">
                    {t('about.mission.leverage')}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--purple)]/10 dark:bg-[var(--purple)]/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-pink-500" />
                  </span>
                  <span className="text-muted-foreground">
                    {t('about.mission.grow')}
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative flex justify-center">
              <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop"
                  alt={t('about.mission.imageAlt')}
                  className="object-cover w-full h-full"
                  width={500}
                  height={350}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section with Elevated Cards */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-10">
              <div className="w-2 h-8 bg-[--purple-primary] rounded-full mb-2" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                {t('about.values.heading')}
              </h2>
              <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                {t('about.values.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-[--purple-primary]/30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-lg [@media(hover:hover)]:hover:shadow-xl transition-shadow duration-300">
                <Sparkles className="w-10 h-10 text-(--purple-primary) mb-2" />
                <h3 className="text-xl font-bold">{t('about.values.innovation.title')}</h3>
                <p className="text-muted-foreground text-center">
                  {t('about.values.innovation.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-blue-500/30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-lg [@media(hover:hover)]:hover:shadow-xl transition-shadow duration-300">
                <Target
                  className="w-10 h-10 mb-2"
                  style={{ color: 'var(--blue)' }}
                />
                <h3 className="text-xl font-bold">{t('about.values.accessibility.title')}</h3>
                <p className="text-muted-foreground text-center">
                  {t('about.values.accessibility.description')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-pink-500/30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-lg [@media(hover:hover)]:hover:shadow-xl transition-shadow duration-300">
                <Rocket className="w-10 h-10 text-pink-500 mb-2" />
                <h3 className="text-xl font-bold">{t('about.values.customerSuccess.title')}</h3>
                <p className="text-muted-foreground text-center">
                  {t('about.values.customerSuccess.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Our Team Section as Card */}
        <section className="py-16 flex justify-center px-4">
          <div className="w-full max-w-5xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[--purple-primary]/30 shadow-xl p-10 md:p-16 text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="w-2 h-8 bg-[--purple-primary] rounded-full mb-2" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                {t('about.joinTeam.heading')}
              </h2>
            </div>
            <p className="text-muted-foreground md:text-lg mb-8 max-w-2xl mx-auto">
              {t('about.joinTeam.description')}
            </p>
            <a
              href="/careers"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[--purple-primary] px-8 text-base font-semibold text-white shadow transition-colors duration-200 [@media(hover:hover)]:hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--purple-primary) focus-visible:ring-offset-2"
            >
              {t('about.joinTeam.button')}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
