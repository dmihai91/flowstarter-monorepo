import { memo } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { useTranslation } from '~/lib/i18n/useTranslation';
interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = memo(({ onClick }: SettingsButtonProps) => {
  const { t } = useTranslation();
  return (
    <IconButton
      onClick={onClick}
      icon="i-ph:gear"
      size="xl"
      title={t.ui.settingsButton.title}
      data-testid="settings-button"
      className="h-9 w-9 text-gray-600 dark:text-gray-400 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-white/5 dark:hover:bg-white/10 transition-colors border border-white/10 dark:border-white/20"
    />
  );
});
