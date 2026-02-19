import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nProvider, useI18n, useTranslations } from '../i18n';
import { act } from 'react';

type TestMessages = {
  [locale: string]: Record<string, string>;
};

const testMessages: TestMessages = {
  en: {
    'test.simple': 'Hello World',
    'test.withVar': 'Hello {name}',
    'test.multipleVars': '{greeting} {name}, you have {count} messages',
  },
  es: {
    'test.simple': 'Hola Mundo',
    'test.withVar': 'Hola {name}',
    'test.multipleVars': '{greeting} {name}, tienes {count} mensajes',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestKey = any;

function TestComponent() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <div data-testid="simple">{t('test.simple' as TestKey)}</div>
      <div data-testid="withVar">
        {t('test.withVar' as TestKey, { name: 'John' })}
      </div>
      <div data-testid="multipleVars">
        {t('test.multipleVars' as TestKey, {
          greeting: 'Hi',
          name: 'Jane',
          count: 5,
        })}
      </div>
      <div data-testid="locale">{locale}</div>
      <button onClick={() => setLocale('es')}>Change Locale</button>
    </div>
  );
}

describe('I18n', () => {
  describe('I18nProvider', () => {
    it('should provide translations in default locale', () => {
      render(
        <I18nProvider initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('simple')).toHaveTextContent('Hello World');
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });

    it('should provide translations in specified initial locale', () => {
      render(
        <I18nProvider initialLocale="es" initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('simple')).toHaveTextContent('Hola Mundo');
      expect(screen.getByTestId('locale')).toHaveTextContent('es');
    });

    it('should replace single variable in translation', () => {
      render(
        <I18nProvider initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('withVar')).toHaveTextContent('Hello John');
    });

    it('should replace multiple variables in translation', () => {
      render(
        <I18nProvider initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('multipleVars')).toHaveTextContent(
        'Hi Jane, you have 5 messages'
      );
    });

    it('should change locale dynamically', () => {
      render(
        <I18nProvider initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('simple')).toHaveTextContent('Hello World');

      act(() => {
        screen.getByText('Change Locale').click();
      });

      expect(screen.getByTestId('simple')).toHaveTextContent('Hola Mundo');
      expect(screen.getByTestId('locale')).toHaveTextContent('es');
    });

    it('should fallback to English if locale not found', () => {
      render(
        <I18nProvider initialLocale="fr" initialMessages={testMessages}>
          <TestComponent />
        </I18nProvider>
      );

      // Should fallback to English
      expect(screen.getByTestId('simple')).toHaveTextContent('Hello World');
    });

    it('should return key as fallback if message not found', () => {
      function TestMissingKey() {
        const { t } = useI18n();
        return <div data-testid="missing">{t('missing.key' as TestKey)}</div>;
      }

      render(
        <I18nProvider initialMessages={testMessages}>
          <TestMissingKey />
        </I18nProvider>
      );

      expect(screen.getByTestId('missing')).toHaveTextContent('missing.key');
    });

    it('should handle empty variables object', () => {
      function TestNoVars() {
        const { t } = useI18n();
        return <div data-testid="simple">{t('test.simple' as TestKey)}</div>;
      }

      render(
        <I18nProvider initialMessages={testMessages}>
          <TestNoVars />
        </I18nProvider>
      );

      expect(screen.getByTestId('simple')).toHaveTextContent('Hello World');
    });

    it('should handle numeric variable values', () => {
      function TestNumeric() {
        const { t } = useI18n();
        return (
          <div data-testid="count">
            {t('test.multipleVars' as TestKey, {
              greeting: 'Hello',
              name: 'User',
              count: 42,
            })}
          </div>
        );
      }

      render(
        <I18nProvider initialMessages={testMessages}>
          <TestNumeric />
        </I18nProvider>
      );

      expect(screen.getByTestId('count')).toHaveTextContent(
        'Hello User, you have 42 messages'
      );
    });
  });

  describe('useI18n', () => {
    it('should throw error when used outside provider', () => {
      function ComponentWithoutProvider() {
        useI18n();
        return null;
      }

      // Suppress console error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<ComponentWithoutProvider />);
      }).toThrow('useI18n must be used within I18nProvider');

      consoleSpy.mockRestore();
    });

    it('should expose messages object', () => {
      function TestMessages() {
        const { messages } = useI18n();
        return <div data-testid="messages">{JSON.stringify(messages)}</div>;
      }

      render(
        <I18nProvider initialMessages={testMessages}>
          <TestMessages />
        </I18nProvider>
      );

      const messagesText = screen.getByTestId('messages').textContent;
      expect(messagesText).toContain('test.simple');
      expect(messagesText).toContain('Hello World');
    });
  });

  describe('useTranslations', () => {
    it('should be an alias for useI18n', () => {
      expect(useTranslations).toBe(useI18n);
    });

    it('should work the same as useI18n', () => {
      function TestWithUseTranslations() {
        const { t } = useTranslations();
        return <div data-testid="text">{t('test.simple' as TestKey)}</div>;
      }

      render(
        <I18nProvider initialMessages={testMessages}>
          <TestWithUseTranslations />
        </I18nProvider>
      );

      expect(screen.getByTestId('text')).toHaveTextContent('Hello World');
    });
  });
});
