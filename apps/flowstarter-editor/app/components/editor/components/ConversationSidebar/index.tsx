import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { SidebarHeader } from './SidebarHeader';
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
                ? 'linear-gradient(180deg, rgba(26, 26, 31, 0.92) 0%, rgba(20, 20, 24, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(250, 250, 252, 0.92) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRight: isDark
                ? '1px solid rgba(0, 0, 0, 0.4)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              borderLeft: isDark
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: isDark
                ? '4px 0 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.06) inset, -1px 0 0 rgba(0, 0, 0, 0.3) inset'
                : '4px 0 24px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 1) inset, -1px 0 0 rgba(0, 0, 0, 0.04) inset',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <SidebarHeader onClose={onClose} />
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
