import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { ChatIcon, EditIcon, TrashIcon, CheckIcon } from './Icons';
import { DeleteDialog } from './DeleteDialog';
import type { ConversationItemProps } from './types';

export function ConversationItem({
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

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => {
        // On touch, toggle actions visibility instead of immediately selecting
        if (!isEditing) setShowActions(prev => !prev);
      }}
      onClick={(e) => {
        if (isEditing) return;
        // On touch devices, first tap shows actions, second tap selects
        if ('ontouchstart' in window && !showActions) {
          e.preventDefault();
          setShowActions(true);
          return;
        }
        onSelect();
      }}
      style={{
        padding: '10px 12px',
        marginBottom: '4px',
        borderRadius: '8px',
        cursor: isEditing ? 'default' : 'pointer',
        background: isActive ? (isDark ? 'rgba(77, 93, 217, 0.1)' : 'rgba(77, 93, 217, 0.08)') : 'transparent',
        border: isActive
          ? `1px solid ${isDark ? 'rgba(77, 93, 217, 0.15)' : 'rgba(77, 93, 217, 0.12)'}`
          : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            color: isActive ? (isDark ? 'rgba(77, 93, 217, 0.8)' : 'rgba(77, 93, 217, 0.7)') : colors.textMuted,
            marginTop: '2px',
            flexShrink: 0,
          }}
        >
          <ChatIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <EditInput
              inputRef={inputRef}
              editValue={editValue}
              setEditValue={setEditValue}
              isDark={isDark}
              colors={colors}
              onSave={handleSaveRename}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <ConversationDetails
              conversation={conversation}
              isActive={isActive}
              colors={colors}
              formatDate={formatDate}
            />
          )}
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {showActions && !isEditing && (
            <ActionButtons
              colors={colors}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setShowDeleteConfirm(true)}
            />
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

interface EditInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  editValue: string;
  setEditValue: (value: string) => void;
  isDark: boolean;
  colors: ReturnType<typeof import('~/components/editor/hooks').getColors>;
  onSave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function EditInput({ inputRef, editValue, setEditValue, isDark, colors, onSave, onKeyDown }: EditInputProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={onSave}
        onKeyDown={onKeyDown}
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
          onSave();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: isDark ? 'rgba(77, 93, 217, 0.8)' : 'rgba(77, 93, 217, 0.7)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
        }}
      >
        <CheckIcon />
      </button>
    </div>
  );
}

interface ConversationDetailsProps {
  conversation: ConversationItemProps['conversation'];
  isActive: boolean;
  colors: ReturnType<typeof import('~/components/editor/hooks').getColors>;
  formatDate: (timestamp: number) => string;
}

function ConversationDetails({ conversation, isActive, colors, formatDate }: ConversationDetailsProps) {
  return (
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
  );
}

interface ActionButtonsProps {
  colors: ReturnType<typeof import('~/components/editor/hooks').getColors>;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionButtons({ colors, onEdit, onDelete }: ActionButtonsProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: '4px' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.textMuted,
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.background = colors.surfaceMedium || 'rgba(0,0,0,0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.background = 'transparent'; }}
        title={t(EDITOR_LABEL_KEYS.SIDEBAR_RENAME)}
      >
        <EditIcon />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title={t(EDITOR_LABEL_KEYS.SIDEBAR_DELETE)}
      >
        <TrashIcon />
      </button>
    </motion.div>
  );
}
