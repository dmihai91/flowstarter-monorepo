import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { AppleBrandIcon, GoogleIcon } from './BrandIcons';

interface SocialAuthProps {
  onGoogleClick: () => void;
  onAppleClick: () => void;
  isGoogleLoading: boolean;
  isAppleLoading: boolean;
}

export function SocialAuth({
  onGoogleClick,
  onAppleClick,
  isGoogleLoading,
  isAppleLoading,
}: SocialAuthProps) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 mb-6 w-full">
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={onGoogleClick}
        disabled={isGoogleLoading || isAppleLoading}
        className="w-full"
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {isGoogleLoading ? t('auth.signIn.connecting') : t('auth.google')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={onAppleClick}
        disabled={isGoogleLoading || isAppleLoading}
        className="w-full"
      >
        <AppleBrandIcon className="w-5 h-5 mr-2" />
        {isAppleLoading ? t('auth.signIn.connecting') : t('auth.apple')}
      </Button>
    </div>
  );
}
