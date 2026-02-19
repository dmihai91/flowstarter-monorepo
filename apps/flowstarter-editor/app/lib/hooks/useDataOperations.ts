/**
 * useDataOperations Hook
 *
 * Simplified hook for managing settings data operations.
 * Note: Chat data is now stored in Convex, not IndexedDB.
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ImportExportService } from '~/lib/services/importExportService';

interface UseDataOperationsProps {
  onReloadSettings?: () => void;
  onResetSettings?: () => void;
}

/**
 * Hook for managing settings data operations
 */
export function useDataOperations({ onReloadSettings, onResetSettings }: UseDataOperationsProps = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const showProgress = useCallback((message: string, percent: number) => {
    setProgressMessage(message);
    setProgressPercent(percent);

    toast.dismiss('progress-toast');
    toast.loading(`${message} (${percent}%)`, {
      position: 'bottom-right',
      autoClose: 3000,
      toastId: 'progress-toast',
    });
  }, []);

  const handleExportSettings = useCallback(async () => {
    setIsExporting(true);

    try {
      showProgress('Exporting settings', 25);

      const settingsData = await ImportExportService.exportSettings();

      showProgress('Creating file', 50);

      const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
        type: 'application/json',
      });

      showProgress('Downloading file', 75);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Flowstarter-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showProgress('Completing export', 100);
      toast.dismiss('progress-toast');
      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.dismiss('progress-toast');
      toast.error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [showProgress]);

  const handleImportSettings = useCallback(
    async (file: File) => {
      setIsImporting(true);

      try {
        showProgress('Reading file', 25);

        const text = await file.text();
        const data = JSON.parse(text);

        showProgress('Importing settings', 50);
        await ImportExportService.importSettings(data);

        showProgress('Completing import', 100);
        toast.dismiss('progress-toast');
        toast.success('Settings imported successfully');
        onReloadSettings?.();
      } catch (error) {
        console.error('Error importing settings:', error);
        toast.dismiss('progress-toast');
        toast.error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsImporting(false);
      }
    },
    [showProgress, onReloadSettings],
  );

  const handleImportAPIKeys = useCallback(
    async (file: File) => {
      setIsImporting(true);

      try {
        showProgress('Reading file', 25);

        const text = await file.text();
        const data = JSON.parse(text);

        showProgress('Importing API keys', 50);
        ImportExportService.importAPIKeys(data);

        showProgress('Completing import', 100);
        toast.dismiss('progress-toast');
        toast.success('API keys imported successfully');
        onReloadSettings?.();
      } catch (error) {
        console.error('Error importing API keys:', error);
        toast.dismiss('progress-toast');
        toast.error(`Failed to import API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsImporting(false);
      }
    },
    [showProgress, onReloadSettings],
  );

  const handleResetSettings = useCallback(async () => {
    setIsResetting(true);

    try {
      showProgress('Resetting settings', 50);

      // Clear localStorage settings
      const keysToPreserve = ['debug_mode'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach((key) => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      showProgress('Completing reset', 100);
      toast.dismiss('progress-toast');
      toast.success('Settings reset successfully');
      onResetSettings?.();
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.dismiss('progress-toast');
      toast.error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  }, [showProgress, onResetSettings]);

  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloadingTemplate(true);

    try {
      showProgress('Creating template', 50);

      const templateData = ImportExportService.createAPIKeysTemplate();

      showProgress('Downloading template', 75);

      const blob = new Blob([JSON.stringify(templateData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Flowstarter-api-keys-template.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showProgress('Completing download', 100);
      toast.dismiss('progress-toast');
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.dismiss('progress-toast');
      toast.error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, [showProgress]);

  const handleExportAPIKeys = useCallback(async () => {
    setIsExporting(true);

    try {
      showProgress('Retrieving API keys', 25);

      const response = await fetch('/api/export-api-keys');

      if (!response.ok) {
        throw new Error('Failed to retrieve API keys from server');
      }

      const apiKeys = await response.json();

      showProgress('Creating file', 50);

      const blob = new Blob([JSON.stringify(apiKeys, null, 2)], {
        type: 'application/json',
      });

      showProgress('Downloading file', 75);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Flowstarter-api-keys.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showProgress('Completing export', 100);
      toast.dismiss('progress-toast');
      toast.success('API keys exported successfully');
    } catch (error) {
      console.error('Error exporting API keys:', error);
      toast.dismiss('progress-toast');
      toast.error(`Failed to export API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [showProgress]);

  return {
    isExporting,
    isImporting,
    isResetting,
    isDownloadingTemplate,
    progressMessage,
    progressPercent,
    lastOperation: null,
    handleExportSettings,
    handleExportSelectedSettings: handleExportSettings,
    handleExportAllChats: async () => toast.info('Chat export is now handled through Convex'),
    handleExportSelectedChats: async () => toast.info('Chat export is now handled through Convex'),
    handleExportAPIKeys,
    handleImportSettings,
    handleImportChats: async () => toast.info('Chat import is now handled through Convex'),
    handleImportAPIKeys,
    handleResetSettings,
    handleResetChats: async () => toast.info('Chat reset is now handled through Convex'),
    handleDownloadTemplate,
    handleUndo: async () => toast.info('Undo is not available'),
  };
}

