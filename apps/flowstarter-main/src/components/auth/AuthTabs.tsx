'use client';

import { useTranslations } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomSignIn } from './CustomSignIn';
import { CustomSignUp } from './CustomSignUp';

export default function AuthTabs() {
  const pathname = usePathname();
  const router = useRouter();

  // Default selected tab based on route
  const initialTab = pathname?.startsWith('/sign-up') ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useTranslations();

  // Keep tab in sync when user navigates with back/forward
  useEffect(() => {
    const syncFromLocation = () => {
      const path = window.location.pathname;
      setActiveTab(path.startsWith('/sign-up') ? 'signup' : 'login');
    };
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  return (
    <div className="w-full max-w-[520px] mx-auto rounded-2xl bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 shadow-lg dark:shadow-2xl my-2 sm:my-4 md:my-6 border border-gray-200/50 dark:border-white/10">
      {/* Segmented Tabs */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-white/5 backdrop-blur-sm p-1 mb-6">
        <button
          onClick={() => {
            setActiveTab('signup');
            if (!pathname?.startsWith('/sign-up')) {
              // Update URL immediately for instant feedback
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/sign-up');
              }
              router.replace('/sign-up');
            }
          }}
          className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'signup'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md backdrop-blur-sm'
              : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('common.signUp')}
        </button>
        <button
          onClick={() => {
            setActiveTab('login');
            if (!pathname?.startsWith('/login')) {
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/login');
              }
              router.replace('/login');
            }
          }}
          className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'login'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md backdrop-blur-sm'
              : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('common.login')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'signup' ? <CustomSignUp /> : <CustomSignIn />}
    </div>
  );
}
