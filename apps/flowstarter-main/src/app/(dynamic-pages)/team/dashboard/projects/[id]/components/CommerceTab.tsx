'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Info } from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeamUpdateProject } from '@/hooks/useTeamProjects';
import {
  COMMERCE_MODES,
  COMMERCE_PRODUCT_TYPES,
  COMMERCE_PROVIDERS,
  COMMERCE_STATUSES,
  describeCommerceProvider,
  type CommerceProvider,
} from '@/lib/commerce';
import type { Project } from './form-helpers';
import { fieldsDirty, nonNegativeIntOrZero } from './form-helpers';

const MODE_LABELS: Record<string, string> = {
  none: 'None',
  payment_link: 'Payment link / buy button',
  embedded_checkout: 'Embedded checkout',
  digital_delivery: 'Digital delivery',
  external_storefront: 'External storefront',
  managed_storefront: 'Managed storefront',
  custom: 'Custom build',
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  none: 'None',
  digital: 'Digital',
  physical: 'Physical',
  mixed: 'Mixed (digital + physical)',
  service: 'Service',
};

const PROVIDER_LABELS: Record<string, string> = {
  none: 'None',
  stripe: 'Stripe',
  gumroad: 'Gumroad',
  lemon_squeezy: 'Lemon Squeezy',
  paddle: 'Paddle',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  custom: 'Custom',
};

const STATUS_LABELS: Record<string, string> = {
  not_needed: 'Not needed',
  discovery: 'Discovery — gathering requirements',
  configured: 'Configured — provider set up, not live',
  live: 'Live — selling',
  needs_custom_build: 'Needs custom build (escalate)',
};

type CommerceState = {
  commerce_mode: string;
  commerce_product_type: string;
  commerce_provider: string;
  commerce_status: string;
  commerce_product_count: string;
  commerce_notes: string;
};

function fromProject(p: Project): CommerceState {
  return {
    commerce_mode: (p.commerce_mode as string) || 'none',
    commerce_product_type: (p.commerce_product_type as string) || 'none',
    commerce_provider: (p.commerce_provider as string) || 'none',
    commerce_status: (p.commerce_status as string) || 'not_needed',
    commerce_product_count: String(
      (p.commerce_product_count as number) ?? 0
    ),
    commerce_notes: (p.commerce_notes as string) || '',
  };
}

export function CommerceTab({ project }: { project: Project }) {
  const initial = fromProject(project);
  const [state, setState] = useState<CommerceState>(initial);
  const update = useTeamUpdateProject(project.id);

  useEffect(() => {
    setState(fromProject(project));
  }, [project]);

  const dirty = fieldsDirty(initial, state);

  const onSave = async () => {
    try {
      await update.mutateAsync({
        commerce_mode: state.commerce_mode,
        commerce_product_type: state.commerce_product_type,
        commerce_provider: state.commerce_provider,
        commerce_status: state.commerce_status,
        commerce_product_count: nonNegativeIntOrZero(
          state.commerce_product_count
        ),
        commerce_notes: state.commerce_notes.trim() || null,
      });
      toast.success('Commerce settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const providerHint = describeCommerceProvider(
    state.commerce_provider as CommerceProvider
  );

  return (
    <ShellCard>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Mode</Label>
            <Select
              value={state.commerce_mode}
              onValueChange={(v) =>
                setState({ ...state, commerce_mode: v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMERCE_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODE_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Product type</Label>
            <Select
              value={state.commerce_product_type}
              onValueChange={(v) =>
                setState({ ...state, commerce_product_type: v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMERCE_PRODUCT_TYPES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PRODUCT_TYPE_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Provider</Label>
            <Select
              value={state.commerce_provider}
              onValueChange={(v) =>
                setState({ ...state, commerce_provider: v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMERCE_PROVIDERS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PROVIDER_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={state.commerce_status}
              onValueChange={(v) =>
                setState({ ...state, commerce_status: v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMERCE_STATUSES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {STATUS_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-3 flex gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--fs-ink-faint)]" />
          <p className="text-xs text-[var(--fs-ink-dim)] leading-relaxed">
            {providerHint}
          </p>
        </div>

        <div>
          <Label htmlFor="product-count">Product count (estimate)</Label>
          <p className="text-xs text-[var(--fs-ink-faint)] mb-2">
            Used in client list aggregations. Auto-synced when products are
            added on the Products tab.
          </p>
          <Input
            id="product-count"
            type="number"
            min={0}
            value={state.commerce_product_count}
            onChange={(e) =>
              setState({ ...state, commerce_product_count: e.target.value })
            }
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="commerce-notes">Notes</Label>
          <p className="text-xs text-[var(--fs-ink-faint)] mb-2">
            Tax, shipping, fulfillment, license delivery — anything that
            shapes commerce setup.
          </p>
          <Textarea
            id="commerce-notes"
            value={state.commerce_notes}
            onChange={(e) =>
              setState({ ...state, commerce_notes: e.target.value })
            }
            rows={4}
          />
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[var(--fs-rule)]">
          <Button
            onClick={onSave}
            disabled={!dirty || update.isPending}
            size="sm"
          >
            <Save className="w-4 h-4" />
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </ShellCard>
  );
}
