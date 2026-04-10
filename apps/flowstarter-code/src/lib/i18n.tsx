'use client';

import en from '@/locales/en';
import React, { createContext, useContext, useMemo } from 'react';

type En = typeof en;
export type TranslationKeys = keyof En;

type ExtractParams<S extends string> =
  S extends `${string}{${infer P}}${infer R}` ? P | ExtractParams<R> : never;
type ParamsFor<K extends TranslationKeys> = ExtractParams<En[K]>;
export type VarsFor<K extends TranslationKeys> = [ParamsFor<K>] extends [never]
  ? undefined
  : Partial<Record<ParamsFor<K>, string | number>>;

interface I18nContextValue {
  t: <K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = useMemo(() => {
    const messages = en as Record<TranslationKeys, string>;
    return (<K extends TranslationKeys>(key: K, vars?: VarsFor<K>) => {
      let template = messages[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return template;
    }) as I18nContextValue['t'];
  }, []);

  return <I18nContext.Provider value={{ t }}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslations must be used within I18nProvider');
  return ctx.t;
}
