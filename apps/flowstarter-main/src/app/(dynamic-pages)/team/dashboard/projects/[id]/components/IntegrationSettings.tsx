'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar, BarChart3, Shield, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, ExternalLink, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationStatus {
  analytics: { connected: boolean; propertyId: string | null; connectedAt: string | null };
  calendly: { url: string | null; hasApiKey: boolean };
  domain: { publishedUrl: string | null; customDomain: string | null; status: string };
}

export function IntegrationSettings({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Calendly fields
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [calendlyApiKey, setCalendlyApiKey] = useState('');
  const [showCalendlyKey, setShowCalendlyKey] = useState(false);

  // Analytics fields
  const [gaPropertyId, setGaPropertyId] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`);
      const data = (await res.json()) as IntegrationStatus;
      setStatus(data);
      if (data.calendly.url) setCalendlyUrl(data.calendly.url);
      if (data.analytics.propertyId) setGaPropertyId(data.analytics.propertyId);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const saveIntegration = async (integration: string, body: Record<string, unknown>) => {
    setSaving(integration);
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration, ...body }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (data.success) {
        toast.success(data.message || 'Saved');
        await fetchStatus();
        setCalendlyApiKey(''); // Clear sensitive field after save
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Network error');
    }
    setSaving(null);
  };

  const cardClass = 'rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-6';

  if (loading) return <div className="animate-pulse h-48 rounded-2xl bg-gray-100 dark:bg-white/5" />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-[var(--purple)]" />
        Integrations
      </h2>
      <p className="text-sm text-gray-500 dark:text-white/50">
        API keys are encrypted at rest via Supabase Vault. We never store plaintext secrets.
      </p>

      {/* Calendly */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Calendly</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Online booking for your clients</p>
            </div>
          </div>
          {status?.calendly.url ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <XCircle className="w-3.5 h-3.5" /> Not configured
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="calendlyUrl">Calendly URL</Label>
            <Input
              id="calendlyUrl"
              placeholder="https://calendly.com/your-business"
              value={calendlyUrl}
              onChange={(e) => setCalendlyUrl(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Your public Calendly scheduling page</p>
          </div>

          <div>
            <Label htmlFor="calendlyApiKey">
              API Key <span className="text-gray-400">(optional, for service-specific buttons)</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="calendlyApiKey"
                type={showCalendlyKey ? 'text' : 'password'}
                placeholder={status?.calendly.hasApiKey ? '••••••••••••• (saved in vault)' : 'cal_live_xxxxx'}
                value={calendlyApiKey}
                onChange={(e) => setCalendlyApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCalendlyKey(!showCalendlyKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCalendlyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Get it from{' '}
              <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="text-[var(--purple)] hover:underline">
                Calendly Settings <ExternalLink className="w-3 h-3 inline" />
              </a>
              . Enables per-service booking buttons on the site.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => saveIntegration('calendly', { calendlyUrl, calendlyApiKey: calendlyApiKey || undefined })}
              disabled={!calendlyUrl || saving === 'calendly'}
              size="sm"
            >
              {saving === 'calendly' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save
            </Button>
            {status?.calendly.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveIntegration('calendly', { action: 'disconnect' })}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Google Analytics */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Google Analytics</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Track visitors and performance</p>
            </div>
          </div>
          {status?.analytics.connected ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <XCircle className="w-3.5 h-3.5" /> Not connected
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="gaPropertyId">GA4 Property ID</Label>
            <Input
              id="gaPropertyId"
              placeholder="123456789"
              value={gaPropertyId}
              onChange={(e) => setGaPropertyId(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Numeric property ID from Google Analytics admin</p>
          </div>

          <div className="flex gap-2 pt-2">
            {!status?.analytics.connected ? (
              <Button
                onClick={() => {
                  if (gaPropertyId) saveIntegration('analytics', { gaPropertyId });
                  window.open(`/api/analytics/connect?projectId=${projectId}`, '_blank');
                }}
                size="sm"
              >
                Connect Google Analytics
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => saveIntegration('analytics', { gaPropertyId })}
                  disabled={saving === 'analytics'}
                  size="sm"
                >
                  {saving === 'analytics' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Update Property ID
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveIntegration('analytics', { action: 'disconnect' })}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Disconnect
                </Button>
              </>
            )}
          </div>

          {status?.analytics.connected && status.analytics.connectedAt && (
            <p className="text-xs text-gray-400">
              Connected {new Date(status.analytics.connectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Vault notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-700/20">
        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          All API keys and tokens are encrypted at rest using Supabase Vault (pgsodium). Only encrypted references are stored in the database.
        </p>
      </div>
    </div>
  );
}
