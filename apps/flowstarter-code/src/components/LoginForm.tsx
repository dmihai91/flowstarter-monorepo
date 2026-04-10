'use client';

import { Shield, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { getTeamLoginUrl } from '@flowstarter/platform-config';

export function LoginForm() {
  const t = useTranslations();
  const currentUrl =
    typeof window === 'undefined' ? undefined : window.location.origin;
  const teamLoginUrl = getTeamLoginUrl(currentUrl);

  return (
    <div className="w-full">
      <div
        className="mb-5 rounded-xl border px-4 py-3 text-sm"
        style={{
          background: 'rgba(77,93,217,0.10)',
          border: '1px solid rgba(77,93,217,0.25)',
          color: 'var(--ui-text-secondary)',
        }}
      >
        {t('code.login.notice')}
      </div>

      <a
        href={teamLoginUrl}
        data-testid="sso-button"
        className="group w-full h-11 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        style={{
          backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 16px rgba(77,93,217,0.30)',
        }}
      >
        <Shield className="h-4 w-4" aria-hidden />
        {t('code.login.cta')}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </a>
    </div>
  );
}
