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
    <div className="grid grid-cols-2 gap-3 mb-6 w-full">
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={onGoogleClick}
        disabled={isGoogleLoading || isAppleLoading}
        className="w-full"
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">
          {isGoogleLoading ? t('auth.signIn.connecting') : t('auth.google')}
        </span>
        <span className="sm:hidden">
          {isGoogleLoading ? t('auth.signIn.connecting') : 'Google'}
        </span>
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
        <span className="hidden sm:inline">
          {isAppleLoading ? t('auth.signIn.connecting') : t('auth.apple')}
        </span>
        <span className="sm:hidden">
          {isAppleLoading ? t('auth.signIn.connecting') : 'Apple'}
        </span>
      </Button>
    </div>
  );
}
