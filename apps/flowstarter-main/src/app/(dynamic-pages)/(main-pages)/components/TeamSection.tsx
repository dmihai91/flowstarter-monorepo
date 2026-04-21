'use client';

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
  initials: string;
}

export function TeamSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  const team: TeamMember[] = [
    {
      key: 'darius',
      nameKey: 'landing.team.darius.name' as TranslationKey,
      roleKey: 'landing.team.darius.role' as TranslationKey,
      bioKey: 'landing.team.darius.bio' as TranslationKey,
      quoteKey: 'landing.team.darius.quote' as TranslationKey,
      image: '/images/team/darius.png',
      linkedin: 'https://www.linkedin.com/in/darius-mihai-popescu-346ab680',
      initials: 'D',
    },
    {
      key: 'dorin',
      nameKey: 'landing.team.dorin.name' as TranslationKey,
      roleKey: 'landing.team.dorin.role' as TranslationKey,
      bioKey: 'landing.team.dorin.bio' as TranslationKey,
      quoteKey: 'landing.team.dorin.quote' as TranslationKey,
      image: '/images/team/dorin.jpeg',
      linkedin: 'https://www.linkedin.com/in/dorinux',
      initials: 'D',
    },
  ];

  return (
    <section id="team" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="ls-eyebrow inline-flex items-center justify-center gap-3"
            style={{ justifyContent: 'center' }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
            <span className="num">{t('landing.team.eyebrow')}</span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
          </div>
          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">{t('landing.team.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.team.headlineFlourish')}
            </span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 md:gap-8 max-w-3xl mx-auto">
          {team.map((m, i) => (
            <TeamCard key={m.key} member={m} t={t} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCard({
  member,
  t,
  delay,
}: {
  member: TeamMember;
  t: (key: string) => string;
  delay: number;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="ls-card ls-team-card"
      style={{
        animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${delay}ms both`,
      }}
    >
      <div className="ls-team-avatar">
        <div className="ls-team-avatar-inner">
          {imgError ? (
            <span>{member.initials}</span>
          ) : (
            <Image
              src={member.image}
              alt={t(member.nameKey)}
              width={76}
              height={76}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>
      <h3 className="ls-team-name">{t(member.nameKey)}</h3>
      <p className="ls-team-role">{t(member.roleKey)}</p>
      <p className="ls-team-bio">{t(member.bioKey)}</p>
      <p className="ls-team-quote">&ldquo;{t(member.quoteKey)}&rdquo;</p>
      <a
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="ls-team-link"
      >
        <Linkedin className="w-3.5 h-3.5" />
        {t('landing.team.linkedin')}
      </a>
    </div>
  );
}
