import type { TabType } from './types';
import { TabManagement } from '~/components/@settings/shared/components/TabManagement';
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import SettingsTab from '~/components/@settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/components/@settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import DebugTab from '~/components/@settings/tabs/debug/DebugTab';
import ApiKeysTab from '~/components/@settings/tabs/api-keys/APIKeysTab';

export function getTabComponent(tabId: TabType | 'tab-management') {
  if (tabId === 'tab-management') {
    return <TabManagement />;
  }

  switch (tabId) {
    case 'profile':
      return <ProfileTab />;
    case 'settings':
      return <SettingsTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'features':
      return <FeaturesTab />;
    case 'api-keys':
      return <ApiKeysTab />;
    case 'debug':
      return <DebugTab />;
    default:
      return null;
  }
}

export function getTabUpdateStatus(
  tabId: TabType,
  hasUpdate: boolean,
  hasUnreadNotifications: boolean,
  hasConnectionIssues: boolean,
  hasActiveWarnings: boolean,
): boolean {
  switch (tabId) {
    case 'update':
      return hasUpdate;
    case 'notifications':
      return hasUnreadNotifications;
    case 'connection':
      return hasConnectionIssues;
    case 'debug':
      return hasActiveWarnings;
    default:
      return false;
  }
}

interface StatusContext {
  currentVersion: string;
  unreadCount: number;
  currentIssue: string | null;
  activeIssues: Array<{ type: string }>;
}

export function getStatusMessage(tabId: TabType, ctx: StatusContext): string {
  switch (tabId) {
    case 'update':
      return `New update available (v${ctx.currentVersion})`;
    case 'notifications':
      return `${ctx.unreadCount} unread notification${ctx.unreadCount === 1 ? '' : 's'}`;
    case 'connection':
      return ctx.currentIssue === 'disconnected'
        ? 'Connection lost'
        : ctx.currentIssue === 'high-latency'
          ? 'High latency detected'
          : 'Connection issues detected';
    case 'debug': {
      const warnings = ctx.activeIssues.filter((i) => i.type === 'warning').length;
      const errors = ctx.activeIssues.filter((i) => i.type === 'error').length;

      return `${warnings} warning${warnings === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}`;
    }
    default:
      return '';
  }
}
