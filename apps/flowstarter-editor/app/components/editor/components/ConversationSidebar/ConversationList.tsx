import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { ConversationItem } from './ConversationItem';
import { useGroupedConversations } from './useGroupedConversations';
import type { Conversation } from '~/lib/hooks/useConversations';
import type { Id } from '~/convex/_generated/dataModel';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: Id<'conversations'>;
  isLoading?: boolean;
  onSelectConversation: (id: Id<'conversations'>) => void;
  onRenameConversation: (id: Id<'conversations'>, title: string) => void;
  onProjectNameChange?: (id: Id<'conversations'>, name: string) => void;
  onDeleteConversation: (id: Id<'conversations'>) => void | Promise<void>;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  onSelectConversation,
  onRenameConversation,
  onProjectNameChange,
  onDeleteConversation,
}: ConversationListProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const groupedConversations = useGroupedConversations(conversations);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 12px 12px',
      }}
    >
      {isLoading ? (
        <EmptyState message={t(EDITOR_LABEL_KEYS.COMMON_LOADING)} colors={colors} />
      ) : conversations.length === 0 ? (
        <EmptyState message={t(EDITOR_LABEL_KEYS.SIDEBAR_NO_PROJECTS)} colors={colors} />
      ) : (
        groupedConversations.map((group) => (
          <div key={group.label} style={{ marginBottom: '16px' }}>
            <GroupHeader label={group.label} colors={colors} />
            <AnimatePresence>
              {group.conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  isDark={isDark}
                  colors={colors}
                  onSelect={() => onSelectConversation(conv.id)}
                  onRename={(title) => onRenameConversation(conv.id, title)}
                  onProjectNameChange={
                    onProjectNameChange ? (name) => onProjectNameChange(conv.id, name) : undefined
                  }
                  onDelete={() => onDeleteConversation(conv.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ))
      )}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  colors: ReturnType<typeof getColors>;
}

function EmptyState({ message, colors }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
        color: colors.textMuted,
        fontSize: '13px',
      }}
    >
      {message}
    </div>
  );
}

interface GroupHeaderProps {
  label: string;
  colors: ReturnType<typeof getColors>;
}

function GroupHeader({ label, colors }: GroupHeaderProps) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '8px 12px 4px',
      }}
    >
      {label}
    </div>
  );
}
