'use client';

import Link from 'next/link';
import { Footer as DSFooter, type FooterProps, type FooterLink } from '@flowstarter/flow-design-system';
import type { ReactNode } from 'react';
import { useTranslations } from '@/lib/i18n';

export default function Footer(props: FooterProps) {
  const { t } = useTranslations();

  const translatedLinks: FooterLink[] = [
    { label: t('footer.nav.help'), href: '/help' },
    { label: t('footer.nav.privacy'), href: '/privacy' },
    { label: t('footer.nav.terms'), href: '/terms' },
    { label: t('footer.nav.contact'), href: '/contact' },
    { label: t('footer.nav.teamDashboard'), href: '/team/dashboard' },
    { label: t('footer.nav.editor'), href: 'https://editor.flowstarter.dev', external: true },
  ];

  return (
    <DSFooter
      links={translatedLinks}
      clientLoginLabel={t('footer.nav.clientLogin')}
      builtWithLabel={t('footer.buildWith')}
      byTeamLabel={t('footer.byTeam')}
      {...props}
      renderLink={(href, children, className) => (
        <Link href={href} className={className}>{children}</Link>
      )}
    />
  );
}
