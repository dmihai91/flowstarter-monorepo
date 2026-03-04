import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { TabTile } from '~/components/@settings/shared/components/TabTile';
import { SearchInterface } from '~/components/@settings/shared/components/SearchInterface';
import { initializeSearchIndex } from '~/components/@settings/shared/utils/settingsSearch';
import { useUpdateCheck } from '~/lib/hooks/useUpdateCheck';
import { useNotifications } from '~/lib/hooks/useNotifications';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { useDebugStatus } from '~/lib/hooks/useDebugStatus';
import {
  tabConfigurationStore,
  developerModeStore,
  setDeveloperMode,
  resetTabConfiguration,
} from '~/lib/stores/settings';
import { profileStore } from '~/lib/stores/profile';
import type { TabType, Profile } from './types';
import { DEFAULT_TAB_CONFIG } from './constants';
import { BetaLabel } from './AnimatedSwitch';
import { ControlPanelHeader } from './ControlPanelHeader';
import { getTabComponent, getTabUpdateStatus, getStatusMessage } from './control-panel-tabs';
import {
  TAB_DESCRIPTIONS, BETA_TABS, gridLayoutVariants, itemVariants,
  type TabWithDevType, type ExtendedTabConfig, type BaseTabConfig,
} from './control-panel-constants';

interface ControlPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ControlPanel = ({ open, onClose }: ControlPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showTabManagement, setShowTabManagement] = useState(false);
  const [useSearchInterface, setUseSearchInterface] = useState(true);

  const tabConfiguration = useStore(tabConfigurationStore);
  const developerMode = useStore(developerModeStore);
  const profile = useStore(profileStore) as Profile;

  const { hasUpdate, currentVersion, acknowledgeUpdate } = useUpdateCheck();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();
  const { hasActiveWarnings, activeIssues, acknowledgeAllIssues } = useDebugStatus();

  const baseTabConfig = useMemo(() => {
    return new Map(DEFAULT_TAB_CONFIG.map((tab) => [tab.id, tab]));
  }, []);

  const visibleTabs = useMemo(() => {
    if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
      console.warn('Invalid tab configuration, resetting to defaults');
      resetTabConfiguration();
      return [];
    }

    const notificationsDisabled = profile?.preferences?.notifications === false;

    if (developerMode) {
      const seenTabs = new Set<TabType>();
      const devTabs: ExtendedTabConfig[] = [];

      const processTab = (tab: BaseTabConfig) => {
        if (!seenTabs.has(tab.id)) {
          seenTabs.add(tab.id);
          devTabs.push({ id: tab.id, visible: true, window: 'developer', order: tab.order || devTabs.length });
        }
      };

      tabConfiguration.developerTabs?.forEach((tab) => processTab(tab as BaseTabConfig));
      tabConfiguration.userTabs.forEach((tab) => processTab(tab as BaseTabConfig));
      DEFAULT_TAB_CONFIG.forEach((tab) => processTab(tab as BaseTabConfig));

      devTabs.push({ id: 'tab-management' as TabType, visible: true, window: 'developer', order: devTabs.length, isExtraDevTab: true });
      return devTabs.sort((a, b) => a.order - b.order);
    }

    return tabConfiguration.userTabs
      .filter((tab) => {
        if (!tab?.id) return false;
        if (tab.id === 'notifications' && notificationsDisabled) return false;
        return tab.visible && tab.window === 'user';
      })
      .sort((a, b) => a.order - b.order);
  }, [tabConfiguration, developerMode, profile?.preferences?.notifications, baseTabConfig]);

  useEffect(() => {
    if (!open) {
      setActiveTab(null);
      setLoadingTab(null);
      setShowTabManagement(false);
    } else {
      setActiveTab(null);
      initializeSearchIndex({
        nickname: profile.username,
        name: profile.username || '',
        email: '',
        avatar: profile.avatar,
        theme: profile.preferences?.theme || 'system',
        notifications: profile.preferences?.notifications ?? true,
        language: profile.preferences?.language || 'en',
        timezone: profile.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [open, profile]);

  const handleClose = () => { setActiveTab(null); setLoadingTab(null); setShowTabManagement(false); onClose(); };
  const handleBack = () => { showTabManagement ? setShowTabManagement(false) : activeTab && setActiveTab(null); };
  const handleDeveloperModeChange = (checked: boolean) => { console.log('Developer mode changed:', checked); setDeveloperMode(checked); };

  useEffect(() => { console.log('Current developer mode:', developerMode); }, [developerMode]);

  const statusCtx = { currentVersion, unreadCount: unreadNotifications.length, currentIssue, activeIssues };

  const handleTabClick = (tabId: TabType) => {
    setLoadingTab(tabId);
    setActiveTab(tabId);
    setShowTabManagement(false);
    switch (tabId) {
      case 'update': acknowledgeUpdate(); break;
      case 'notifications': markAllAsRead(); break;
      case 'connection': acknowledgeIssue(); break;
      case 'debug': acknowledgeAllIssues(); break;
    }
    setTimeout(() => setLoadingTab(null), 500);
  };

  return (
    <>
      <RadixDialog.Root open={open}>
        <RadixDialog.Portal>
          <div className="fixed inset-0 flex items-center justify-center z-[100] modern-scrollbar">
            <RadixDialog.Overlay asChild>
              <motion.div
                className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content
              onEscapeKeyDown={handleClose}
              onPointerDownOutside={handleClose}
              className="relative z-[101]"
            >
              <RadixDialog.Description className="sr-only">
                Application settings and configuration panel
              </RadixDialog.Description>
              <motion.div
                className={classNames(
                  'w-[1200px] h-[90vh]',
                  'bg-flowstarter-elements-background-depth-2',
                  'rounded-2xl shadow-2xl',
                  'border border-flowstarter-elements-borderColor',
                  'flex flex-col overflow-hidden',
                  'relative',
                )}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl" />
                <div className="relative z-10 flex flex-col h-full">
                  <ControlPanelHeader
                    activeTab={activeTab}
                    showTabManagement={showTabManagement}
                    useSearchInterface={useSearchInterface}
                    developerMode={developerMode}
                    onBack={handleBack}
                    onClose={handleClose}
                    onToggleSearch={() => setUseSearchInterface(!useSearchInterface)}
                    onDeveloperModeChange={handleDeveloperModeChange}
                    onTabClick={handleTabClick}
                  />

                  <div className="flex-1 overflow-y-auto scrollbar scrollbar-w-2 scrollbar-track-transparent scrollbar-thumb-[#E5E5E5] hover:scrollbar-thumb-[#CCCCCC] dark:scrollbar-thumb-[#333333] dark:hover:scrollbar-thumb-[#444444] will-change-scroll touch-auto">
                    <motion.div
                      key={activeTab || 'home'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      {activeTab ? (
                        getTabComponent(activeTab)
                      ) : useSearchInterface ? (
                        <SearchInterface
                          userProfile={{
                            nickname: profile.username,
                            name: profile.username || '',
                            email: '',
                            avatar: profile.avatar,
                            theme: profile.preferences?.theme || 'system',
                            notifications: profile.preferences?.notifications ?? true,
                            language: profile.preferences?.language || 'en',
                            timezone: profile.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                          }}
                          onSettingChange={(settingId, value) => console.log('Setting changed:', settingId, value)}
                        />
                      ) : (
                        <motion.div
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
                          variants={gridLayoutVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <AnimatePresence mode="popLayout">
                            {(visibleTabs as TabWithDevType[]).map((tab: TabWithDevType) => (
                              <motion.div key={tab.id} layout variants={itemVariants} className="aspect-[1.5/1]">
                                <TabTile
                                  tab={tab}
                                  onClick={() => handleTabClick(tab.id as TabType)}
                                  isActive={activeTab === tab.id}
                                  hasUpdate={getTabUpdateStatus(tab.id, hasUpdate, hasUnreadNotifications, hasConnectionIssues, hasActiveWarnings)}
                                  statusMessage={getStatusMessage(tab.id, statusCtx)}
                                  description={TAB_DESCRIPTIONS[tab.id]}
                                  isLoading={loadingTab === tab.id}
                                  className="h-full relative"
                                >
                                  {BETA_TABS.has(tab.id) && <BetaLabel />}
                                </TabTile>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </RadixDialog.Content>
          </div>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
};
