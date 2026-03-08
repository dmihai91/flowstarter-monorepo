import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { getMainPlatformHomepage } from '~/lib/config/domains';
import { Logo, ScrollAwareHeader } from '@flowstarter/flow-design-system';

export function Header() {
  const chat = useStore(chatStore);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (chat.started) {
    return null;
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const mainUrl = getMainPlatformHomepage();

  return (
    <>
      <ScrollAwareHeader className="z-[100] h-14 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 text-flowstarter-elements-textPrimary cursor-pointer">
          <div className="i-ph:sidebar-simple-duotone text-xl opacity-60 hover:opacity-100 transition-opacity" />
          <a href={mainUrl} style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </a>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <SettingsButton onClick={handleSettingsClick} />
        </div>
      </ScrollAwareHeader>

      {/* Spacer to account for fixed header */}
      <div className="h-14" />

    </>
  );
}
