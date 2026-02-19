'use client';

import { useState, useEffect } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import {
  validateAnalyticsConfig,
  getAnalyticsSetupInstructions,
} from '@/lib/project-analytics-injection';
import type { GA4Property } from '@/lib/google-analytics-admin';

interface AnalyticsSettingsProps {
  projectId: string;
  initialConfig?: {
    gaMeasurementId?: string;
    fbPixelId?: string;
  };
  onSave?: (config: {
    gaMeasurementId?: string;
    fbPixelId?: string;
  }) => Promise<void>;
}

export function AnalyticsSettings({
  projectId,
  initialConfig,
  onSave,
}: AnalyticsSettingsProps) {
  const [gaMeasurementId, setGaMeasurementId] = useState(
    initialConfig?.gaMeasurementId || ''
  );
  const [gaPropertyId, setGaPropertyId] = useState('');
  const [fbPixelId, setFbPixelId] = useState(initialConfig?.fbPixelId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [hasGAIntegration, setHasGAIntegration] = useState(false);

  // Fetch existing config and GA4 properties
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/analytics`);
        if (response.ok) {
          const data = await response.json();
          setGaMeasurementId(data.gaMeasurementId || '');
          setGaPropertyId(data.gaPropertyId || '');
          setFbPixelId(data.fbPixelId || '');
        }
      } catch (error) {
        console.error('Failed to fetch analytics config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
    fetchGA4Properties();
  }, [projectId]);

  // Fetch GA4 properties from user's Google Analytics account
  const fetchGA4Properties = async () => {
    setLoadingProperties(true);
    try {
      const response = await fetch(
        '/api/integrations/google-analytics/properties'
      );
      if (response.ok) {
        const data = await response.json();
        setGa4Properties(data.properties || []);
        setHasGAIntegration(true);
      } else if (response.status === 403) {
        // User hasn't connected Google Analytics
        setHasGAIntegration(false);
      }
    } catch (error) {
      console.error('Failed to fetch GA4 properties:', error);
      setHasGAIntegration(false);
    } finally {
      setLoadingProperties(false);
    }
  };

  // Handle property selection from dropdown
  const handlePropertySelect = (propertyId: string) => {
    const selected = ga4Properties.find((p) => p.propertyId === propertyId);
    if (selected) {
      setGaPropertyId(selected.propertyId);
      if (selected.measurementId) {
        setGaMeasurementId(selected.measurementId);
      }
    }
  };

  const handleSave = async () => {
    const config = {
      gaMeasurementId: gaMeasurementId.trim() || undefined,
      fbPixelId: fbPixelId.trim() || undefined,
    };

    // Validate
    const validation = validateAnalyticsConfig(config);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/analytics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaMeasurementId: gaMeasurementId.trim(),
          gaPropertyId: gaPropertyId.trim(),
          fbPixelId: fbPixelId.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      setSuccessMessage('Analytics settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      onSave?.(config);
    } catch (error) {
      console.error('Failed to save analytics settings:', error);
      setErrors([
        error instanceof Error
          ? error.message
          : 'Failed to save settings. Please try again.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Analytics & Tracking</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add analytics to track visitors and conversions on your website.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </span>
        </div>
      ) : (
        <>
          {/* GA4 Property Selector (if user has connected Google Analytics) */}
          {hasGAIntegration && ga4Properties.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Select from Your GA4 Properties
                </label>
                <button
                  onClick={fetchGA4Properties}
                  disabled={loadingProperties}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${
                      loadingProperties ? 'animate-spin' : ''
                    }`}
                  />
                  Refresh
                </button>
              </div>
              <select
                value={gaPropertyId}
                onChange={(e) => handlePropertySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="">-- Select a property --</option>
                {ga4Properties.map((property) => (
                  <option key={property.propertyId} value={property.propertyId}>
                    {property.displayName} ({property.propertyId})
                    {property.measurementId
                      ? ` - ${property.measurementId}`
                      : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                ✨ Automatically fills Property ID and Measurement ID
              </p>
            </div>
          )}

          {/* Manual Entry Section */}
          {!hasGAIntegration && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                💡 <strong>Tip:</strong> Connect your Google Analytics account
                in the{' '}
                <a
                  href="/dashboard/integrations"
                  className="underline hover:no-underline"
                >
                  integrations page
                </a>{' '}
                to automatically select your GA4 properties!
              </p>
            </div>
          )}

          {/* Google Analytics Measurement ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google Analytics Measurement ID *
            </label>
            <input
              type="text"
              value={gaMeasurementId}
              onChange={(e) => setGaMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500">
              Format: G-XXXXXXXXXX (for client-side tracking)
            </p>
          </div>

          {/* Google Analytics Property ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google Analytics Property ID (optional)
            </label>
            <input
              type="text"
              value={gaPropertyId}
              onChange={(e) => setGaPropertyId(e.target.value)}
              placeholder="123456789"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500">
              Numeric ID (for fetching analytics data via API)
            </p>
          </div>
        </>
      )}

      {/* Facebook Pixel */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Facebook Pixel ID</label>
        <input
          type="text"
          value={fbPixelId}
          onChange={(e) => setFbPixelId(e.target.value)}
          placeholder="1234567890123456"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500">
          Numeric ID from Facebook Events Manager
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ {successMessage}
          </p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="border border-blue-200 dark:border-blue-800 rounded-md p-4 bg-blue-50 dark:bg-blue-900/20">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Info className="w-4 h-4" />
          {showInstructions ? 'Hide' : 'Show'} Setup Instructions
        </button>

        {showInstructions && (
          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {getAnalyticsSetupInstructions()}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Analytics Settings'}
        </button>
      </div>

      {/* Preview Notice */}
      {(gaMeasurementId || fbPixelId) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Analytics will be automatically added to your website when you
            publish or download it.
          </p>
        </div>
      )}
    </div>
  );
}
