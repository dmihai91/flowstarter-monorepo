import { classNames } from '~/utils/classNames';
import { DialogTitle } from '~/components/ui/Dialog';
import { AvatarDropdown } from './AvatarDropdown';
import { AnimatedSwitch } from './AnimatedSwitch';
import { TAB_LABELS } from './constants';
import type { TabType } from './types';

interface ControlPanelHeaderProps {
  activeTab: TabType | null;
  showTabManagement: boolean;
  useSearchInterface: boolean;
  developerMode: boolean;
  onBack: () => void;
  onClose: () => void;
  onToggleSearch: () => void;
  onDeveloperModeChange: (checked: boolean) => void;
  onTabClick: (tabId: TabType) => void;
}

export function ControlPanelHeader({
  activeTab,
  showTabManagement,
  useSearchInterface,
  developerMode,
  onBack,
  onClose,
  onToggleSearch,
  onDeveloperModeChange,
  onTabClick,
}: ControlPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {(activeTab || showTabManagement) && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-blue-500/10 dark:hover:bg-blue-500/20 group transition-all duration-200"
          >
            <div className="i-ph:arrow-left w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
        )}
        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          {showTabManagement ? 'Tab Management' : activeTab ? TAB_LABELS[activeTab] : 'Control Panel'}
        </DialogTitle>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 min-w-[120px] border-r border-gray-200 dark:border-gray-800 pr-6">
          <button
            onClick={onToggleSearch}
            className={classNames(
              'px-3 py-1.5 text-sm rounded-lg transition-all duration-200',
              'border border-gray-200 dark:border-gray-700',
              useSearchInterface
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            )}
          >
            {useSearchInterface ? '🔍 Search' : '📋 Tabs'}
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-[140px] border-r border-gray-200 dark:border-gray-800 pr-6">
          <AnimatedSwitch
            id="developer-mode"
            checked={developerMode}
            onCheckedChange={onDeveloperModeChange}
            label={developerMode ? 'Developer Mode' : 'User Mode'}
          />
        </div>

        <div className="border-l border-gray-200 dark:border-gray-800 pl-6">
          <AvatarDropdown onSelectTab={onTabClick} />
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-blue-500/10 dark:hover:bg-blue-500/20 group transition-all duration-200"
        >
          <div className="i-ph:x w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
        </button>
      </div>
    </div>
  );
}
