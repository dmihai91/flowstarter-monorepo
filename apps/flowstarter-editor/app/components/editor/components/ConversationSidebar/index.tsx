import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { SidebarHeader } from './SidebarHeader';
import { NewProjectButton } from './NewProjectButton';
import { ConversationList } from './ConversationList';
import type { ConversationSidebarProps } from './types';

export type { ConversationSidebarProps } from './types';

export function ConversationSidebar({
  isOpen,
  conversations,
  activeConversationId,
  isLoading,
  onClose,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onProjectNameChange,
  onDeleteConversation,
}: ConversationSidebarProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
            }}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              background: isDark
                ? 'rgba(16, 16, 18, 0.92)'
                : 'rgba(244, 244, 245, 0.95)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderRight: `1px solid ${colors.borderMedium}`,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <SidebarHeader onClose={onClose} />
            <NewProjectButton onClick={onNewConversation} />
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              isLoading={isLoading}
              onSelectConversation={onSelectConversation}
              onRenameConversation={onRenameConversation}
              onProjectNameChange={onProjectNameChange}
              onDeleteConversation={onDeleteConversation}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
