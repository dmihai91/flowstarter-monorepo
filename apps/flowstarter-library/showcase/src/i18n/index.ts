import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import en from './locales/en.json';

// Simple i18n setup - English only for now
// To add more languages: import locale files and add to locales object

const translations = en;

interface I18nContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations as Record<string, unknown>, key);
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return translation;
  }, []);

  return React.createElement(
    I18nContext.Provider,
    { value: { t } },
    children
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
