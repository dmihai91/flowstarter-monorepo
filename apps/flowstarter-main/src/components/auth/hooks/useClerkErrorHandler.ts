import { useTranslations } from '@/lib/i18n';
import { useCallback } from 'react';

interface ClerkError {
  status?: number;
  code?: number | string;
  message?: string;
  errors?: Array<{
    code?: string;
    message?: string;
    meta?: {
      param_name?: string;
      [key: string]: unknown;
    };
  }>;
}

type ErrorContext = 'signIn' | 'signUp' | 'reset';

/**
 * Hook to handle Clerk authentication errors with consistent error messages.
 */
export function useClerkErrorHandler() {
  const { t } = useTranslations();

  const handleError = useCallback(
    (err: unknown, context: ErrorContext = 'signIn'): string => {
      // Default error message
      let message = t('auth.errors.somethingWentWrong');

      // Handle string errors
      if (typeof err === 'string') {
        return err;
      }

      // Handle non-object errors
      if (!err || typeof err !== 'object') {
        return message;
      }

      const clerkError = err as ClerkError;

      // Check for session_exists error (should redirect to dashboard)
      if (
        clerkError.code === 'session_exists' ||
        clerkError.message === 'Session already exists' ||
        (Array.isArray(clerkError.errors) &&
          clerkError.errors.some((e) => e?.code === 'session_exists'))
      ) {
        // Return special marker for session exists
        return '__SESSION_EXISTS__';
      }

      // Handle 422 validation errors
      if (clerkError.status === 422 || clerkError.code === 422) {
        if (clerkError.errors && Array.isArray(clerkError.errors)) {
          const firstError = clerkError.errors[0];
          if (firstError?.code) {
            message = getErrorMessageForCode(
              firstError.code,
              firstError.meta?.param_name,
              firstError.message,
              context,
              t
            );
          }
        } else {
          message =
            context === 'signIn'
              ? t('auth.errors.checkCredentials')
              : t('auth.errors.checkInformation');
        }
      } else if (clerkError.errors && Array.isArray(clerkError.errors)) {
        // Handle other Clerk errors with errors array
        message =
          clerkError.errors[0]?.message || t('auth.errors.somethingWentWrong');
      } else if (clerkError.message) {
        message = clerkError.message;
      }

      return message;
    },
    [t]
  );

  return { handleError };
}

function getErrorMessageForCode(
  code: string,
  paramName: string | undefined,
  fallbackMessage: string | undefined,
  context: ErrorContext,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  // Sign-in specific errors
  if (context === 'signIn') {
    switch (code) {
      case 'form_identifier_not_found':
        return t('auth.errors.formIdentifierNotFound');
      case 'form_password_incorrect':
        return t('auth.errors.formPasswordIncorrect');
      case 'verification_failed':
        return t('auth.errors.verificationFailed');
    }
  }

  // Sign-up specific errors
  if (context === 'signUp') {
    switch (code) {
      case 'form_identifier_exists':
      case 'identifier_already_exists':
        return t('auth.errors.formIdentifierExists');
      case 'form_password_pwned':
        return t('auth.errors.formPasswordPwned');
      case 'form_password_not_strong_enough':
        return t('auth.errors.formPasswordNotStrongEnough');
      case 'form_password_too_common':
        return t('auth.errors.formPasswordTooCommon');
    }
  }

  // Common errors
  switch (code) {
    case 'form_param_format_invalid':
      if (paramName === 'identifier') {
        return t('auth.errors.formParamFormatInvalidIdentifier');
      }
      if (paramName === 'email_address') {
        return t('auth.errors.formParamFormatInvalidEmail');
      }
      return fallbackMessage || t('auth.errors.formParamFormatInvalid');
    default:
      return (
        fallbackMessage ||
        (context === 'signIn'
          ? t('auth.errors.checkCredentials')
          : t('auth.errors.checkInformation'))
      );
  }
}
