'use client';

import { useTranslations } from '@/lib/i18n';
import {
  ExternalLink,
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

type DeviceView = 'mobile' | 'tablet' | 'desktop';

interface PreviewControlsProps {
  deviceView: DeviceView;
  onDeviceViewChange: (view: DeviceView) => void;
  onFullscreen: () => void;
  onOpenInTab: () => void;
  hasPreview: boolean;
}

export function PreviewControls({
  deviceView,
  onDeviceViewChange,
  onFullscreen,
  onOpenInTab,
  hasPreview,
}: PreviewControlsProps) {
  const { t } = useTranslations();

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-(--surface-2)/80 backdrop-blur-xl rounded-full px-4 py-3 shadow-2xl border border-gray-200/50 dark:border-white/10">
      {/* Device toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDeviceViewChange('mobile')}
          disabled={!hasPreview}
          className={`p-2 rounded-full transition-all backdrop-blur-md border ${
            !hasPreview
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
              : deviceView === 'mobile'
              ? 'bg-linear-to-br from-(--purple-primary) to-(--accent-primary) text-white shadow-lg border-transparent'
              : 'text-gray-600 dark:text-gray-400 hover:text-(--purple-primary) dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200/40 dark:border-white/10'
          }`}
          title="Mobile view"
        >
          <Smartphone className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDeviceViewChange('tablet')}
          disabled={!hasPreview}
          className={`p-2 rounded-full transition-all backdrop-blur-md border ${
            !hasPreview
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
              : deviceView === 'tablet'
              ? 'bg-linear-to-br from-(--purple-primary) to-(--accent-primary) text-white shadow-lg border-transparent'
              : 'text-gray-600 dark:text-gray-400 hover:text-(--purple-primary) dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200/40 dark:border-white/10'
          }`}
          title="Tablet view"
        >
          <Tablet className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDeviceViewChange('desktop')}
          disabled={!hasPreview}
          className={`p-2 rounded-full transition-all backdrop-blur-md border ${
            !hasPreview
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
              : deviceView === 'desktop'
              ? 'bg-linear-to-br from-(--purple-primary) to-(--accent-primary) text-white shadow-lg border-transparent'
              : 'text-gray-600 dark:text-gray-400 hover:text-(--purple-primary) dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200/40 dark:border-white/10'
          }`}
          title="Desktop view"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300/40 dark:bg-gray-700/40" />

      {/* Action buttons */}
      <button
        onClick={onFullscreen}
        disabled={!hasPreview}
        className={`p-2 rounded-full transition-all backdrop-blur-md border ${
          !hasPreview
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
            : 'text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200/40 dark:border-white/10'
        }`}
        title="Fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        onClick={onOpenInTab}
        disabled={!hasPreview}
        className={`p-2 rounded-full transition-all backdrop-blur-md border ${
          !hasPreview
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-transparent'
            : 'text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200/40 dark:border-white/10'
        }`}
        title={t('editor.openInNewTab')}
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
