import { useTranslations } from '@/lib/i18n';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface SocialAuthClient {
  authenticateWithRedirect: (options: {
    strategy: 'oauth_google' | 'oauth_apple';
    redirectUrl: string;
    redirectUrlComplete: string;
  }) => Promise<void>;
}

interface UseSocialAuthOptions {
  redirectUrl?: string;
  redirectUrlComplete?: string;
}

/**
 * Hook for handling Google and Apple OAuth authentication.
 */
export function useSocialAuth(
  client: SocialAuthClient | undefined,
  options: UseSocialAuthOptions = {}
) {
  const { t } = useTranslations();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const { redirectUrl = '/sso-callback', redirectUrlComplete = '/team/dashboard' } =
    options;

  const handleGoogleAuth = useCallback(async () => {
    if (!client) return;
    setIsGoogleLoading(true);

    try {
      await client.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (err) {
      console.error('Google auth error:', err);
      toast.error(t('auth.googleError'), {
        description: t('auth.googleErrorDescription'),
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [client, redirectUrl, redirectUrlComplete, t]);

  const handleAppleAuth = useCallback(async () => {
    if (!client) return;
    setIsAppleLoading(true);

    try {
      await client.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (err) {
      console.error('Apple auth error:', err);
      toast.error(t('auth.appleError'), {
        description: t('auth.appleErrorDescription'),
      });
    } finally {
      setIsAppleLoading(false);
    }
  }, [client, redirectUrl, redirectUrlComplete, t]);

  return {
    isGoogleLoading,
    isAppleLoading,
    handleGoogleAuth,
    handleAppleAuth,
  };
}
