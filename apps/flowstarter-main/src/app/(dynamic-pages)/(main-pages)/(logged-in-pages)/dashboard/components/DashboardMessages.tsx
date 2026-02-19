'use client';

import { useTranslations } from '@/lib/i18n';
import { useState } from 'react';

export function DashboardMessages() {
  const { t } = useTranslations();
  const [message, setMessage] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    desc: string;
  } | null>(null);

  if (!message) return null;

  const getMessageStyles = () => {
    switch (message.type) {
      case 'success':
        return 'border-green-300/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/10 dark:text-green-200';
      case 'info':
        return 'border-blue-300/50 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-900/10 dark:text-blue-200';
      case 'warning':
        return 'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-200';
      default:
        return 'border-gray-300/50 bg-gray-50 text-gray-900 dark:border-gray-500/30 dark:bg-gray-900/10 dark:text-gray-200';
    }
  };

  return (
    <div className="mb-6">
      <div
        className={`flex flex-col mx-auto w-full max-w-4xl rounded-xl border p-4 justify-center items-center ${getMessageStyles()}`}
      >
        <div className="font-medium mb-1">{message.title}</div>
        <div className="text-sm opacity-90 text-center">{message.desc}</div>
        <button
          onClick={() => setMessage(null)}
          className="mt-2 text-xs opacity-60 hover:opacity-80 underline"
        >
          {t('common.dismiss')}
        </button>
      </div>
    </div>
  );
}
