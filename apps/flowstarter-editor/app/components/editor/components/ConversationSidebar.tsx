import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import type { Conversation } from '~/lib/hooks/useConversations';
import type { Id } from '~/convex/_generated/dataModel';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

// Custom Delete Dialog styled for dark theme
interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  hasProject?: boolean;
  projectName?: string | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteDialog({ isOpen, title, hasProject, projectName, isDeleting, onClose, onConfirm }: DeleteDialogProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={isDeleting ? undefined : onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content asChild>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                width: '420px',
                maxWidth: '90vw',
                background: isDark ? 'linear-gradient(180deg, #1e1a2e 0%, #151221 100%)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : '#e5e7eb'}`,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'auto',
              }}
            >
              {/* Warning Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Title */}
              <RadixDialog.Title
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}
              >
                {t(EDITOR_LABEL_KEYS.DELETE_TITLE)}
              </RadixDialog.Title>

              {/* Description */}
              <RadixDialog.Description asChild>
                <div
                  style={{
                    fontSize: '14px',
                    color: colors.textMuted,
                    lineHeight: 1.5,
                    marginBottom: hasProject ? '16px' : '24px',
                  }}
                >
                  Are you sure you want to delete "{title}"? This action cannot be undone.
                </div>
              </RadixDialog.Description>

              {/* Project data warning */}
              {hasProject && (
                <div
                  style={{
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#ef4444',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t(EDITOR_LABEL_KEYS.DELETE_WARNING)}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.5 }}>
                    This will permanently delete{projectName && ` "${projectName}"`} including:
                  </div>
                  <ul
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      margin: '8px 0 0 0',
                      paddingLeft: '18px',
                      lineHeight: 1.6,
                    }}
                  >
                    <li>{t(EDITOR_LABEL_KEYS.DELETE_FILES)}</li>
                    <li>{t(EDITOR_LABEL_KEYS.DELETE_CHAT)}</li>
                    <li>{t(EDITOR_LABEL_KEYS.DELETE_SNAPSHOTS)}</li>
                    <li>{t(EDITOR_LABEL_KEYS.DELETE_BUILD)}</li>
                  </ul>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f4f5',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e4e4e7'}`,
                    color: colors.textPrimary,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t(EDITOR_LABEL_KEYS.COMMON_CANCEL)}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: isDeleting
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(239, 68, 68, 0.5)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '100px',
                    justifyContent: 'center',
                  }}
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: '14px', height: '14px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </motion.div>
                      {t(EDITOR_LABEL_KEYS.COMMON_DELETING)}
                    </>
                  ) : (
                    t(EDITOR_LABEL_KEYS.COMMON_DELETE)
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface ConversationSidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId?: Id<'conversations'>;
  isLoading?: boolean;
  onClose: () => void;
  onSelectConversation: (id: Id<'conversations'>) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: Id<'conversations'>, title: string) => void;
  onProjectNameChange?: (id: Id<'conversations'>, name: string) => void;
  onDeleteConversation: (id: Id<'conversations'>) => void | Promise<void>;
}

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
  onSelect: () => void;
  onRename: (title: string) => void;
  onProjectNameChange?: (name: string) => void;
  onDelete: () => void | Promise<void>;
}

function ConversationItem({
  conversation,
  isActive,
  isDark,
  colors,
  onSelect,
  onRename,
  onProjectNameChange,
  onDelete,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Use project name if it exists, otherwise use title
  const editableValue = conversation.projectName || conversation.title;
  const [editValue, setEditValue] = useState(editableValue);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when conversation changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(conversation.projectName || conversation.title);
    }
  }, [conversation.projectName, conversation.title, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = () => {
    const trimmedValue = editValue.trim();

    if (trimmedValue && trimmedValue !== editableValue) {
      // If project name exists, update project name; otherwise update title
      if (conversation.projectName && onProjectNameChange) {
        onProjectNameChange(trimmedValue);
      } else {
        onRename(trimmedValue);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditValue(editableValue);
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Handle future timestamps (clock skew) or today
    if (diffDays <= 0) {
      return 'Today';
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => !isEditing && onSelect()}
      style={{
        padding: '10px 12px',
        marginBottom: '4px',
        borderRadius: '8px',
        cursor: isEditing ? 'default' : 'pointer',
        background: isActive ? (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)') : 'transparent',
        border: isActive
          ? `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`
          : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            color: isActive ? (isDark ? '#8b5cf6' : '#6366f1') : colors.textMuted,
            marginTop: '2px',
            flexShrink: 0,
          }}
        >
          <ChatIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${colors.borderMedium}`,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '13px',
                  color: colors.textPrimary,
                  outline: 'none',
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#8b5cf6' : '#6366f1',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <CheckIcon />
              </button>
            </div>
          ) : (
            <>
              {/* Project Name (if set) */}
              {conversation.projectName && (
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conversation.projectName}
                </div>
              )}
              {/* Title as secondary (or primary if no project name) */}
              <div
                style={{
                  fontSize: conversation.projectName ? '11px' : '13px',
                  fontWeight: conversation.projectName ? 400 : isActive ? 500 : 400,
                  color: conversation.projectName ? colors.textMuted : colors.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: conversation.projectName ? '1px' : '0',
                }}
              >
                {conversation.title}
              </div>
              {/* Date */}
              <div
                style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  marginTop: '2px',
                }}
              >
                {formatDate(conversation.updatedAt)}
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '4px' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                title={t(EDITOR_LABEL_KEYS.SIDEBAR_RENAME)}
              >
                <EditIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                title={t(EDITOR_LABEL_KEYS.SIDEBAR_DELETE)}
              >
                <TrashIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteConfirm}
        title={conversation.projectName || conversation.title}
        hasProject={!!conversation.projectId}
        projectName={conversation.projectName}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
          }
        }}
        onConfirm={async () => {
          setIsDeleting(true);

          try {
            await onDelete();
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
      />
    </motion.div>
  );
}

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

  // Group conversations by time
  const groupedConversations = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;

    const groups: { label: string; conversations: Conversation[] }[] = [
      { label: t(EDITOR_LABEL_KEYS.TIME_TODAY), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_YESTERDAY), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_PREVIOUS_7_DAYS), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_OLDER), conversations: [] },
    ];

    for (const conv of conversations) {
      if (conv.updatedAt >= today) {
        groups[0].conversations.push(conv);
      } else if (conv.updatedAt >= yesterday) {
        groups[1].conversations.push(conv);
      } else if (conv.updatedAt >= weekAgo) {
        groups[2].conversations.push(conv);
      } else {
        groups[3].conversations.push(conv);
      }
    }

    return groups.filter((g) => g.conversations.length > 0);
  }, [conversations]);

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
                ? 'linear-gradient(180deg, #1a1625 0%, #13111c 100%)'
                : 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
              borderRight: `1px solid ${colors.borderMedium}`,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${colors.borderMedium}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  margin: 0,
                }}
              >
                {t(EDITOR_LABEL_KEYS.SIDEBAR_PROJECTS)}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* New Project Button */}
            <div style={{ padding: '12px 16px' }}>
              <button
                onClick={onNewConversation}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(165, 90, 172, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(165, 90, 172, 0.15) 100%)',
                  border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.25)'}`,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <PlusIcon />
                {t(EDITOR_LABEL_KEYS.SIDEBAR_NEW_PROJECT)}
              </button>
            </div>

            {/* Projects List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 12px 12px',
              }}
            >
              {isLoading ? (
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
                  {t(EDITOR_LABEL_KEYS.COMMON_LOADING)}
                </div>
              ) : conversations.length === 0 ? (
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
                  {t(EDITOR_LABEL_KEYS.SIDEBAR_NO_PROJECTS)}
                </div>
              ) : (
                groupedConversations.map((group) => (
                  <div key={group.label} style={{ marginBottom: '16px' }}>
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
                      {group.label}
                    </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
