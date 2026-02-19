import React, { useState, useEffect } from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface ProjectNameEditorProps {
  projectName: string;
  onNameChange?: (name: string) => void;
}

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export function ProjectNameEditor({ projectName, onNameChange }: ProjectNameEditorProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const [currentName, setCurrentName] = useState(projectName);
  const [isEditing, setIsEditing] = useState(false);

  // Sync local state when prop changes (e.g., when LLM generates a new name)
  useEffect(() => {
    if (!isEditing) {
      setCurrentName(projectName);
    }
  }, [projectName, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    onNameChange?.(currentName);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={currentName}
        onChange={(e) => setCurrentName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          }
        }}
        autoFocus
        style={{
          background: colors.surfaceActive,
          border: colors.borderAccent,
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: 500,
          color: colors.textPrimary,
          outline: 'none',
          width: '120px',
          maxWidth: '100%',
        }}
      />
    );
  }

  return (
    <>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: colors.textSecondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {currentName}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        style={{
          width: '24px',
          height: '24px',
          flexShrink: 0,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.surfaceMedium,
          border: 'none',
          cursor: 'pointer',
          color: colors.textSubtle,
          transition: 'all 0.15s',
        }}
        title={t(EDITOR_LABEL_KEYS.SIDEBAR_EDIT_NAME)}
      >
        <EditIcon />
      </button>
    </>
  );
}
