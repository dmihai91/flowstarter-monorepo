'use client';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AuthButtonsProps {
  size?: 'default' | 'compact';
}

export function AuthButtons({ size = 'default' }: AuthButtonsProps) {
  const { t } = useTranslations();

  const signInClass =
    size === 'compact'
      ? '!h-9 sm:!h-11 box-border rounded-lg bg-[rgba(243,243,243,0.4)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl border border-gray-300 dark:border-white/40 text-gray-900 dark:text-white hover:bg-[rgba(243,243,243,0.5)] dark:hover:bg-[rgba(58,58,74,0.4)] hover:border-gray-400 dark:hover:border-white/30 transition-all duration-300 px-2.5 sm:px-4 text-sm sm:text-base'
      : '!h-11 box-border rounded-lg bg-[rgba(243,243,243,0.4)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl border border-gray-300 dark:border-white/40 text-gray-900 dark:text-white hover:bg-[rgba(243,243,243,0.5)] dark:hover:bg-[rgba(58,58,74,0.4)] hover:border-gray-400 dark:hover:border-white/30 transition-all px-4';

  const signUpClass =
    size === 'compact'
      ? '!h-9 sm:!h-10 box-border border border-transparent rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all px-2.5 sm:px-4 text-sm sm:text-base'
      : '!h-10 box-border border border-transparent rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all px-4';

  const arrowClass =
    size === 'compact' ? 'h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2' : 'h-4 w-4 ml-2';

  return (
    <>
      <Link className="text-base font-medium" href="/login">
        <Button size="md" variant="outline" className={signInClass}>
          {t('nav.signIn')}
        </Button>
      </Link>
      <Link className="text-base font-medium" href="/sign-up">
        <Button size="md" className={signUpClass}>
          {t('nav.signUp')}
          <ArrowRight className={arrowClass} />
        </Button>
      </Link>
    </>
  );
}
