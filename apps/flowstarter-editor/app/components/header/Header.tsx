import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { ControlPanelDialog } from '~/components/@settings';

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] h-14 flex items-center justify-between px-4 lg:px-6 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 text-flowstarter-elements-textPrimary cursor-pointer">
          <div className="i-ph:sidebar-simple-duotone text-xl opacity-60 hover:opacity-100 transition-opacity" />
          <a href="/" className="text-2xl font-semibold text-accent flex items-center group">
            <img src="/logo-dark.png" alt="logo" className="w-[90px] inline-block dark:hidden transition-transform group-hover:scale-[1.02]" />
            <img src="/logo-light.png" alt="logo" className="w-[90px] inline-block hidden dark:block transition-transform group-hover:scale-[1.02]" />
          </a>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <a href="https://fazier.com/launches/Flowstarter" target="_blank" className="hover:opacity-80 transition-opacity">
            <img src="/rank-2-dark.svg" alt="Fazier badge" className="h-8 hidden dark:block" />
            <img src="/rank-2-light.svg" alt="Fazier badge" className="h-8 block dark:hidden" />
          </a>
          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />
          <button
            onClick={() => window.open('https://github.com/flowstarter/flowstarter/issues/new/choose', '_blank')}
            className="flex items-center justify-center font-medium shrink-0 rounded-lg focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed h-9 w-9 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 transition-all duration-200"
            type="button"
            title="Report a bug"
          >
            <div className="i-lucide:bug text-lg text-red-500" />
          </button>
          <SettingsButton onClick={handleSettingsClick} />
        </div>
      </header>

      {/* Spacer to account for fixed header */}
      <div className="h-14" />

      <ControlPanelDialog isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
}
