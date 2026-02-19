'use client';

import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function GetStarted() {
  const { isSignedIn } = useAuth();
  const { t } = useTranslations();

  return (
    <Link
      href={isSignedIn ? '/dashboard' : '/sign-up'}
      className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 active:scale-[0.98] bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 focus-visible:ring-offset-2 group"
    >
      {isSignedIn
        ? t('landing.cta.goToDashboard')
        : t('landing.cta.getStarted')}
      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
