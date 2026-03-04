import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui';
import { useTranslation } from '~/lib/i18n/useTranslation';

export function DiscussMode() {
  const { t } = useTranslation();
  return (
    <div>
      <IconButton
        title={t.chat.discuss.title}
        className={classNames(
          'transition-all flex items-center gap-1 bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent',
        )}
      >
        <div className={`i-ph:chats text-xl`} />
      </IconButton>
    </div>
  );
}
