import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { getMainPlatformHomepage } from '~/lib/config/domains';
import { LogoIcon } from '@flowstarter/flow-design-system';

export function ChatHeader() {
  const chat = useStore(chatStore);

  if (!chat.started) {
    return null;
  }

  const mainUrl = getMainPlatformHomepage();

  return (
    <header className="flex shrink-0 select-none items-center pl-4 pr-3 h-10 bg-flowstarter-elements-background-depth-2 border-b border-flowstarter-elements-borderColor overflow-hidden">
      <a href={mainUrl} className="flex items-center justify-center shrink-0 rounded-md h-8 px-2 bg-transparent hover:bg-flowstarter-elements-item-backgroundActive transition-all duration-200">
        <LogoIcon size="sm" />
      </a>
      <span className="text-flowstarter-elements-textPrimary opacity-[.12] text-xl antialiased mx-1">/</span>
      <div className="flex-1 min-w-0 pl-2 pr-4 text-flowstarter-elements-textPrimary text-sm font-medium overflow-hidden">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </div>
      <ClientOnly>{() => <HeaderActionButtons />}</ClientOnly>
    </header>
  );
}
