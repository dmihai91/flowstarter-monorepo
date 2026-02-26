import React from 'react';
import { motion } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { WarningIcon, SpinnerIcon } from './Icons';
import type { DeleteDialogProps } from './types';

export function DeleteDialog({
  isOpen,
  title,
  hasProject,
  projectName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
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
                <WarningIcon size={24} />
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
                <ProjectDataWarning isDark={isDark} colors={colors} projectName={projectName} />
              )}

              {/* Buttons */}
              <DialogButtons
                isDark={isDark}
                colors={colors}
                isDeleting={isDeleting}
                onClose={onClose}
                onConfirm={onConfirm}
              />
            </motion.div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface ProjectDataWarningProps {
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
  projectName?: string | null;
}

function ProjectDataWarning({ isDark, colors, projectName }: ProjectDataWarningProps) {
  return (
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
        <WarningIcon size={14} />
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
  );
}

interface DialogButtonsProps {
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DialogButtons({ isDark, colors, isDeleting, onClose, onConfirm }: DialogButtonsProps) {
  return (
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
              <SpinnerIcon />
            </motion.div>
            {t(EDITOR_LABEL_KEYS.COMMON_DELETING)}
          </>
        ) : (
          t(EDITOR_LABEL_KEYS.COMMON_DELETE)
        )}
      </button>
    </div>
  );
}
