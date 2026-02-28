import React from 'react';
import { useStore } from '@nanostores/react';
import useViewport from '~/lib/hooks';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const isSmallViewport = useViewport(1024);
  const canHideChat = showWorkbench || !showChat;

  return (
    <div className={classNames('flex gap-2 items-center', { 'gap-1': showChat })}>
      <div className="flex items-center gap-1">
        <Button
          active={showChat}
          disabled={!canHideChat || isSmallViewport} // expand button is disabled on mobile as it's not needed
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-lucide:message-circle text-sm" />
        </Button>
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-lucide:code" />
        </Button>
      </div>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: VoidFunction;
  className?: string;
}

function Button({ active = false, disabled = false, children, onClick, className }: ButtonProps) {
  const { showChat } = useStore(chatStore);

  return (
    <button
      className={classNames(
        'flex items-center justify-center transition-all duration-200 ease-in-out',
        'rounded-lg border',
        {
          'p-2 h-9 w-9': !showChat,
          'p-1.5 h-8 w-8': showChat,
          'border-transparent bg-transparent hover:bg-flowstarter-elements-item-backgroundHover text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary':
            !active,
          'border-flowstarter-elements-borderColor bg-flowstarter-elements-item-backgroundAccent/10 text-flowstarter-elements-item-contentAccent':
            active && !disabled,
          'opacity-50 cursor-not-allowed': disabled,
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}