import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { PlusIcon } from './Icons';

const DASHBOARD_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAIN_PLATFORM_URL) || 'https://flowstarter.dev';

export function DashboardLinkButton() {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div style={{ padding: '12px 16px' }}>
      <a
        href={`${DASHBOARD_URL}/team/dashboard/new`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: colors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          textDecoration: 'none',
        }}
      >
        <PlusIcon />
        {t(EDITOR_LABEL_KEYS.SIDEBAR_NEW_PROJECT)}
        <ExternalLink size={10} style={{ opacity: 0.6 }} />
      </a>
    </div>
  );
}

export function CreateThreadButton({ onClick }: { onClick: () => void | Promise<void> }) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <button
        onClick={() => void onClick()}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
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
        New thread
      </button>
    </div>
  );
}
