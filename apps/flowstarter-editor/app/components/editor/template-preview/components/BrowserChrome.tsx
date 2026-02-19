import { getColors } from '~/components/editor/hooks/useThemeStyles';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface BrowserChromeProps {
  templateId: string;
  onRefresh: () => void;
  isDark: boolean;
}

export function BrowserChrome({ templateId, onRefresh, isDark }: BrowserChromeProps) {
  const colors = getColors(isDark);

  return (
    <div
      className="flex items-center gap-4 px-5 py-2.5 border-b"
      style={{ borderColor: colors.surfaceLight, background: colors.surfaceMedium, flexShrink: 0 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
      </div>

      <div
        className="flex-1 max-w-lg mx-auto flex items-center gap-2 px-4 py-1.5 rounded-lg"
        style={{ background: colors.surfaceActive, border: colors.borderSubtle }}
      >
        <svg
          className="w-3.5 h-3.5 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {templateId}.flowstarter.app
        </span>
      </div>

      <button
        onClick={onRefresh}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{ background: colors.surfaceLight }}
        title={t(EDITOR_LABEL_KEYS.PREVIEW_REFRESH)}
      >
        <svg
          className="w-4 h-4"
          style={{ color: colors.textMuted }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
