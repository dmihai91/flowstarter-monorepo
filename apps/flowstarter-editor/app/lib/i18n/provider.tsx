import React, { createContext, useContext, useMemo } from 'react';
import { en, type Translations } from './locales/en';

type Locale = 'en';

interface I18nContextValue {
  locale: Locale;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
});

const locales: Record<Locale, Translations> = {
  en,
};

interface I18nProviderProps {
  locale?: Locale;
  children: React.ReactNode;
}

export function I18nProvider({ locale = 'en', children }: I18nProviderProps) {
  const value = useMemo(() => ({
    locale,
    t: locales[locale] || en,
  }), [locale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext() {
  return useContext(I18nContext);
}
