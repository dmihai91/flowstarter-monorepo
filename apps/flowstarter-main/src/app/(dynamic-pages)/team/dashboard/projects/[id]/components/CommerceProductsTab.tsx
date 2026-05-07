'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COMMERCE_FULFILLMENT_TYPES,
  COMMERCE_INVENTORY_POLICIES,
  COMMERCE_PRODUCT_KIND,
  COMMERCE_PRODUCT_STATUSES,
} from '@/lib/commerce-products';
import type { Project } from './form-helpers';

type Product = {
  id: string;
  project_id: string;
  name: string;
  slug: string | null;
  product_type: string;
  status: string;
  short_description: string | null;
  price_amount: number | null;
  currency: string;
  checkout_url: string | null;
  delivery_url: string | null;
  fulfillment_type: string | null;
  inventory_policy: string;
  inventory_quantity: number | null;
  weight_grams: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type DraftProduct = {
  name: string;
  slug: string;
  product_type: string;
  status: string;
  short_description: string;
  price_amount: string;
  currency: string;
  checkout_url: string;
  delivery_url: string;
  fulfillment_type: string;
  inventory_policy: string;
  inventory_quantity: string;
};

const blankDraft = (): DraftProduct => ({
  name: '',
  slug: '',
  product_type: 'digital',
  status: 'draft',
  short_description: '',
  price_amount: '',
  currency: 'EUR',
  checkout_url: '',
  delivery_url: '',
  fulfillment_type: '',
  inventory_policy: 'not_tracked',
  inventory_quantity: '',
});

const fromProduct = (p: Product): DraftProduct => ({
  name: p.name,
  slug: p.slug ?? '',
  product_type: p.product_type,
  status: p.status,
  short_description: p.short_description ?? '',
  price_amount: p.price_amount != null ? String(p.price_amount) : '',
  currency: p.currency,
  checkout_url: p.checkout_url ?? '',
  delivery_url: p.delivery_url ?? '',
  fulfillment_type: p.fulfillment_type ?? '',
  inventory_policy: p.inventory_policy,
  inventory_quantity:
    p.inventory_quantity != null ? String(p.inventory_quantity) : '',
});

function buildPayload(d: DraftProduct) {
  return {
    name: d.name,
    slug: d.slug || undefined,
    product_type: d.product_type,
    status: d.status,
    short_description: d.short_description || undefined,
    price_amount: d.price_amount === '' ? null : Number(d.price_amount),
    currency: d.currency,
    checkout_url: d.checkout_url || undefined,
    delivery_url: d.delivery_url || undefined,
    fulfillment_type: d.fulfillment_type || '',
    inventory_policy: d.inventory_policy,
    inventory_quantity:
      d.inventory_quantity === '' ? null : Number(d.inventory_quantity),
  };
}

export function CommerceProductsTab({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<DraftProduct>(blankDraft());

  const { data, isLoading } = useQuery({
    queryKey: ['team-products', project.id],
    queryFn: async (): Promise<Product[]> => {
      const res = await fetch(`/api/team/projects/${project.id}/products`);
      if (!res.ok) throw new Error('Failed to load products');
      return (await res.json()).products ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (d: DraftProduct) => {
      const res = await fetch(`/api/team/projects/${project.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(d)),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to create product' }));
        throw new Error(err.error || 'Failed');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-products', project.id] });
      qc.invalidateQueries({ queryKey: ['team-project', project.id] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      toast.success('Product created');
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const updateProduct = useMutation({
    mutationFn: async (vars: { id: string; d: DraftProduct }) => {
      const res = await fetch(
        `/api/team/projects/${project.id}/products/${vars.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(vars.d)),
        }
      );
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to update product' }));
        throw new Error(err.error || 'Failed');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-products', project.id] });
      toast.success('Product updated');
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/team/projects/${project.id}/products/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-products', project.id] });
      qc.invalidateQueries({ queryKey: ['team-project', project.id] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      toast.success('Product deleted');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const openCreate = () => {
    setEditing(null);
    setDraft(blankDraft());
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft(fromProduct(p));
    setOpen(true);
  };
  const onSubmit = () => {
    if (!draft.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editing) {
      updateProduct.mutate({ id: editing.id, d: draft });
    } else {
      create.mutate(draft);
    }
  };

  const products = data ?? [];

  return (
    <ShellCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--fs-ink)]">
            Products · {products.length}
          </h3>
          <p className="text-xs text-[var(--fs-ink-faint)]">
            Lightweight catalog records. Use checkout_url to link to external
            provider pages (Stripe Payment Link, Lemon Squeezy, etc.).
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse bg-white/40 dark:bg-white/5"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--fs-rule)] p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-[var(--fs-ink-faint)]" />
          <p className="text-sm text-[var(--fs-ink-faint)]">No products yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--fs-rule)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/40 dark:bg-white/[0.03]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium text-[var(--fs-ink-faint)]">
                  Name
                </th>
                <th className="px-3 py-2 font-medium text-[var(--fs-ink-faint)]">
                  Type
                </th>
                <th className="px-3 py-2 font-medium text-[var(--fs-ink-faint)]">
                  Price
                </th>
                <th className="px-3 py-2 font-medium text-[var(--fs-ink-faint)]">
                  Status
                </th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[var(--fs-rule)] hover:bg-white/30 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-[var(--fs-ink)]">
                      {p.name}
                    </div>
                    {p.slug && (
                      <div className="text-[0.65rem] text-[var(--fs-ink-faint)]">
                        {p.slug}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--fs-ink-dim)] text-xs capitalize">
                    {p.product_type}
                  </td>
                  <td className="px-3 py-2 text-[var(--fs-ink-dim)] text-xs">
                    {p.price_amount != null
                      ? `${p.price_amount} ${p.currency}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[0.65rem] text-[var(--fs-ink-dim)] capitalize">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--fs-ink-dim)] hover:text-[var(--fs-ink)]"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit product' : 'Add product'}
            </DialogTitle>
            <DialogDescription>
              Catalog record for concierge handoff. Most checkout details live
              with the external provider; use this for display + links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="prod-name">Name</Label>
              <Input
                id="prod-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={draft.product_type}
                  onValueChange={(v) => setDraft({ ...draft, product_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMERCE_PRODUCT_KIND.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMERCE_PRODUCT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prod-desc">Short description</Label>
              <Textarea
                id="prod-desc"
                value={draft.short_description}
                onChange={(e) =>
                  setDraft({ ...draft, short_description: e.target.value })
                }
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prod-price">Price (smallest unit)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min={0}
                  value={draft.price_amount}
                  onChange={(e) =>
                    setDraft({ ...draft, price_amount: e.target.value })
                  }
                  className="mt-1"
                  placeholder="e.g. 4900 for €49.00"
                />
              </div>
              <div>
                <Label htmlFor="prod-currency">Currency</Label>
                <Input
                  id="prod-currency"
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value.toUpperCase().slice(0, 3),
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prod-checkout">Checkout URL</Label>
              <Input
                id="prod-checkout"
                type="url"
                value={draft.checkout_url}
                onChange={(e) =>
                  setDraft({ ...draft, checkout_url: e.target.value })
                }
                className="mt-1"
                placeholder="https://buy.stripe.com/…"
              />
            </div>

            <div>
              <Label htmlFor="prod-delivery">Delivery URL (digital)</Label>
              <Input
                id="prod-delivery"
                type="url"
                value={draft.delivery_url}
                onChange={(e) =>
                  setDraft({ ...draft, delivery_url: e.target.value })
                }
                className="mt-1"
                placeholder="https://…/download"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fulfillment</Label>
                <Select
                  value={draft.fulfillment_type || 'none'}
                  onValueChange={(v) =>
                    setDraft({
                      ...draft,
                      fulfillment_type: v === 'none' ? '' : v,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / unset</SelectItem>
                    {COMMERCE_FULFILLMENT_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Inventory policy</Label>
                <Select
                  value={draft.inventory_policy}
                  onValueChange={(v) =>
                    setDraft({ ...draft, inventory_policy: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMERCE_INVENTORY_POLICIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.inventory_policy !== 'not_tracked' && (
              <div>
                <Label htmlFor="prod-qty">Inventory quantity</Label>
                <Input
                  id="prod-qty"
                  type="number"
                  min={0}
                  value={draft.inventory_quantity}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      inventory_quantity: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={create.isPending || updateProduct.isPending}
            >
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShellCard>
  );
}
