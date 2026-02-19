import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui';

export function DiscussMode() {
  return (
    <div>
      <IconButton
        title="Chat"
        className={classNames(
          'transition-all flex items-center gap-1 bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent',
        )}
      >
        <div className={`i-ph:chats text-xl`} />
      </IconButton>
    </div>
  );
}
