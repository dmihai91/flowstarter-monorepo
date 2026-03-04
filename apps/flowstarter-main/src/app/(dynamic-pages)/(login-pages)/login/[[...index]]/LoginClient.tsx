'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import AuthTabs from '@/components/auth/AuthTabs';
import { AuthRedirectWrapper } from '@/components/AuthRedirectWrapper';
import { useTranslations } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function LoginClient() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get('reason');
  const message = searchParams.get('message');
  const verified = searchParams.get('verified');

  const getNoticeContent = () => {
    if (reason === 'unauthorized') {
      return {
        title: t('auth.notice.unauthorized.title'),
        desc: t('auth.notice.unauthorized.desc'),
        style:
          'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-200',
      };
    }
    if (reason === 'unauthenticated') {
      return {
        title: t('auth.notice.unauthenticated.title'),
        desc: t('auth.notice.unauthenticated.desc'),
        style:
          'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-200',
      };
    }
    if (verified === 'true') {
      return {
        title: t('auth.notice.verificationSent.title'),
        desc: t('auth.notice.verificationSent.desc'),
        style:
          'border-green-300/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/10 dark:text-green-200',
      };
    }

    if (message === 'verification_sent') {
      return {
        title: t('auth.notice.verificationSent.title'),
        desc: t('auth.notice.verificationSent.desc'),
        style:
          'border-green-300/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/10 dark:text-green-200',
        showHelp: true,
      };
    }

    if (message === 'account_created') {
      return {
        title: t('auth.notice.accountCreated.title'),
        desc: t('auth.notice.accountCreated.desc'),
        style:
          'border-green-300/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/10 dark:text-green-200',
      };
    }

    if (message === 'account_created_verified') {
      return {
        title: t('auth.notice.accountCreatedVerified.title'),
        desc: t('auth.notice.accountCreatedVerified.desc'),
        style:
          'border-green-300/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/10 dark:text-green-200',
      };
    }

    if (message === 'account_created_verify_needed') {
      return {
        title: t('auth.notice.accountCreatedVerifyNeeded.title'),
        desc: t('auth.notice.accountCreatedVerifyNeeded.desc'),
        style:
          'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-200',
      };
    }

    return null;
  };

  const noticeContent = getNoticeContent();

  useEffect(() => {
    // Prefetch dashboard to avoid blank frame on redirect after sign-in
    router.prefetch('/team/dashboard');
  }, [router]);

  return (
    <AuthRedirectWrapper>
      <AuthLayout title="Client Login" subtitle="Sign in to manage your website and access Flowstarter Editor." showStats={true}>
        {noticeContent ? (
          <div
            className={`flex flex-col mb-4 mx-auto w-full max-w-[530px] rounded-xl border p-3 justify-center items-center backdrop-blur-sm ${noticeContent.style}`}
          >
            <div className="font-medium mb-1">{noticeContent.title}</div>
            {noticeContent.desc ? (
              <div className="text-sm opacity-90 text-center">
                {noticeContent.desc}
              </div>
            ) : null}
            {noticeContent.showHelp ? (
              <div className="text-xs mt-2 opacity-75">
                <div className="mb-1">
                  💡 <strong>{t('auth.notice.verificationSent.help')}</strong>
                </div>
                <div>• {t('auth.notice.verificationSent.help.checkSpam')}</div>
                <div>
                  • {t('auth.notice.verificationSent.help.waitMinutes')}
                </div>
                <div>
                  • {t('auth.notice.verificationSent.help.tryNewAccount')}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <AuthTabs />
      </AuthLayout>
    </AuthRedirectWrapper>
  );
}
