'use client';

import en from '@/locales/en';
import React, { createContext, useContext, useMemo, useState } from 'react';

type Messages = Record<string, string>;
type En = typeof en;
export type TranslationKeys = keyof En;

// Extract placeholder names inside {curly} braces from a template string
type ExtractParams<S extends string> =
  S extends `${string}{${infer P}}${infer R}` ? P | ExtractParams<R> : never;
type ParamsFor<K extends TranslationKeys> = ExtractParams<En[K]>;
export type VarsFor<K extends TranslationKeys> = [ParamsFor<K>] extends [never]
  ? undefined
  : Partial<Record<ParamsFor<K>, string | number>>;

// Re-export server types and functions from the server-only module
export type {
  TranslationKeys as ServerTranslationKeys,
  VarsFor as ServerVarsFor,
} from './i18n-server';

interface I18nContextValue {
  locale: string;
  messages: Messages;
  t: <K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale = 'en',
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale?: string;
  initialMessages: Record<string, Record<TranslationKeys, string>>;
}) {
  const [locale, setLocale] = useState(initialLocale);

  const t = useMemo(() => {
    const messages = (initialMessages[locale] ||
      initialMessages.en ||
      {}) as Record<TranslationKeys, string>;
    return (<K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => {
      let template = messages[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return template;
    }) as I18nContextValue['t'];
  }, [locale, initialMessages]);

  const value: I18nContextValue = {
    locale,
    // expose the resolved messages for debugging if needed
    messages: initialMessages[locale] || initialMessages.en || {},
    t,
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export const useTranslations = useI18n;
