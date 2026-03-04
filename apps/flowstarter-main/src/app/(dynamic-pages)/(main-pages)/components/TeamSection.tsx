'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useI18n } from '@/lib/i18n';
import { Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type TranslationKey = Parameters<ReturnType<typeof useI18n>['t']>[0];

interface TeamMember {
  key: string;
  nameKey: TranslationKey;
  roleKey: TranslationKey;
  bioKey: TranslationKey;
  quoteKey: TranslationKey;
  image: string;
  linkedin: string;
  gradient: string;
  initials: string;
}

export function TeamSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const { t } = useI18n();

  const team: TeamMember[] = [
    {
      key: 'darius',
      nameKey: 'landing.team.darius.name',
      roleKey: 'landing.team.darius.role',
      bioKey: 'landing.team.darius.bio',
      quoteKey: 'landing.team.darius.quote',
      image: '/images/team/darius.png',
      linkedin: 'https://www.linkedin.com/in/darius-mihai-popescu-346ab680',
      gradient: 'from-[var(--purple)] to-blue-500',
      initials: 'D',
    },
    {
      key: 'dorin',
      nameKey: 'landing.team.dorin.name',
      roleKey: 'landing.team.dorin.role',
      bioKey: 'landing.team.dorin.bio',
      quoteKey: 'landing.team.dorin.quote',
      image: '/images/team/dorin.jpeg',
      linkedin: 'https://www.linkedin.com/in/dorinux',
      gradient: 'from-pink-500 to-[var(--purple)]',
      initials: 'D',
    },
  ];

  return (
    <section ref={sectionRef} className="py-12 lg:py-18" id="team">
      <div className={`max-w-3xl mx-auto px-6 sm:px-8 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="text-center mb-10 lg:mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
            {t('landing.team.title')}
          </h2>
          <p className="text-base text-gray-500 dark:text-white/40">
            {t('landing.team.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {team.map((member) => (
            <TeamCard key={member.key} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const { nameKey, roleKey, bioKey, quoteKey, image, linkedin, gradient, initials } = member;
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl backdrop-blur-sm shadow-[var(--glass-shadow)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--glass-surface) 80%, transparent)',
        borderTop: '1px solid var(--glass-border-highlight)',
        borderLeft: '1px solid var(--glass-border-highlight)',
        borderBottom: '1px solid var(--glass-border-shadow)',
        borderRight: '1px solid var(--glass-border-shadow)',
      }}>
      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} p-[2px] mb-4 shadow-lg`}>
        {imgError ? (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
        ) : (
          <Image
            src={image}
            alt={t(nameKey)}
            width={80}
            height={80}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t(nameKey)}</h3>
      <p className="text-sm font-medium text-[var(--purple)] mb-3">{t(roleKey)}</p>
      <p className="text-sm text-gray-500 dark:text-white/45 leading-relaxed max-w-[30ch]">
        {t(bioKey)}
      </p>
      <p className="text-xs italic text-gray-400 dark:text-white/30 mt-2">
        &ldquo;{t(quoteKey)}&rdquo;
      </p>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/30 hover:text-[var(--purple)] dark:hover:text-[var(--purple)] transition-colors"
      >
        <Linkedin className="w-4 h-4" />
        {t('landing.team.linkedin')}
      </a>
    </div>
  );
}
