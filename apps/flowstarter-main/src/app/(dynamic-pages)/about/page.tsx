'use client';

import { Zap, Award, MessageSquare, Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import { useTranslations } from '@/lib/i18n';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  quote: string;
  image: string;
  linkedin: string;
  gradient: string;
}

function TeamCard({ member }: { member: TeamMember }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="flex flex-col items-center text-center p-8 rounded-2xl backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 border border-[var(--purple)]/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-[var(--purple)]/30"
    >
      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.gradient} p-[2.5px] mb-5 shadow-lg`}>
        {imgError ? (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{member.name[0]}</span>
          </div>
        ) : (
          <Image
            src={member.image}
            alt={member.name}
            width={96}
            height={96}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
      <p className="text-sm font-semibold text-[var(--purple)] mt-1 mb-3">{member.role}</p>
      <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed max-w-[28ch] mb-3">
        {member.bio}
      </p>
      <p className="text-xs italic text-gray-400 dark:text-white/30 mb-4">
        &ldquo;{member.quote}&rdquo;
      </p>
      <a
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/30 hover:text-[var(--purple)] transition-colors"
      >
        <Linkedin className="w-4 h-4" />
        LinkedIn
      </a>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslations();

  const team: TeamMember[] = [
    {
      name: 'Darius',
      role: t('landing.team.darius.role'),
      bio: t('landing.team.darius.bio'),
      quote: t('landing.team.darius.quote'),
      image: '/images/team/darius.png',
      linkedin: 'https://www.linkedin.com/in/darius-mihai-popescu-346ab680',
      gradient: 'from-[var(--purple)] to-blue-500',
    },
    {
      name: 'Dorin',
      role: t('landing.team.dorin.role'),
      bio: t('landing.team.dorin.bio'),
      quote: t('landing.team.dorin.quote'),
      image: '/images/team/dorin.jpeg',
      linkedin: 'https://www.linkedin.com/in/dorinux',
      gradient: 'from-pink-500 to-[var(--purple)]',
    },
  ];

  const values = [
    {
      icon: Zap,
      title: t('about.values.speed.title'),
      desc: t('about.values.speed.description'),
      accent: 'text-[var(--purple)] bg-[var(--purple)]/10',
    },
    {
      icon: Award,
      title: t('about.values.quality.title'),
      desc: t('about.values.quality.description'),
      accent: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: MessageSquare,
      title: t('about.values.honesty.title'),
      desc: t('about.values.honesty.description'),
      accent: 'text-pink-500 bg-pink-500/10',
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <SupportHeader />

      <main className="relative z-10 flex-1 w-full">

        {/* Hero */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="w-20 h-1.5 rounded-full mx-auto mb-8" style={{ background: 'linear-gradient(to right, #4338CA, #8B5CF6)' }} />
            <h1
              className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5"
              style={{ backgroundImage: 'linear-gradient(to right, #4338CA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              {t('about.title')}
            </h1>
            <p className="text-xl text-gray-500 dark:text-white/50 max-w-xl mx-auto leading-relaxed">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[var(--purple)]/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 md:p-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 rounded-full bg-[var(--purple)]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('about.story.heading')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed text-lg">
              {t('about.story.body')}
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('landing.team.title')}
              </h2>
              <p className="text-gray-500 dark:text-white/40 text-base">
                {t('landing.team.subtitle')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {team.map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('about.values.heading')}
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {values.map(({ icon: Icon, title, desc, accent }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
                >
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 px-4">
          <div className="max-w-3xl mx-auto text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[var(--purple)]/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 md:p-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('about.cta.heading')}
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-8 text-lg">
              {t('about.cta.body')}
            </p>
            <a
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg px-8 text-base font-semibold text-white shadow-lg shadow-[var(--purple)]/20 hover:brightness-110 transition-all duration-200 active:scale-[0.99]"
              style={{ background: 'var(--purple)' }}
            >
              {t('about.cta.button')}
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
