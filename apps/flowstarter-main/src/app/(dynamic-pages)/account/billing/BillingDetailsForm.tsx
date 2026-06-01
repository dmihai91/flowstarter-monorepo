'use client';

import { useEffect, useState, type FormEvent } from 'react';

/**
 * Optional company billing details — so the invoice can be issued to a company
 * (company name + VAT/CUI for reverse-charge). Loads from and saves to
 * /api/account/billing-profile (which also mirrors to the Stripe customer where
 * one exists). Self-contained: fetches on mount, no external state.
 */

interface Profile {
  bill_to_company: boolean;
  company_name: string;
  vat_id: string;
  registration_no: string;
  billing_address: string;
  country: string;
}

const EMPTY: Profile = {
  bill_to_company: false,
  company_name: '',
  vat_id: '',
  registration_no: '',
  billing_address: '',
  country: '',
};

function fromApi(p: Record<string, unknown> | null): Profile {
  if (!p) return EMPTY;
  return {
    bill_to_company: Boolean(p.bill_to_company),
    company_name: (p.company_name as string) ?? '',
    vat_id: (p.vat_id as string) ?? '',
    registration_no: (p.registration_no as string) ?? '',
    billing_address: (p.billing_address as string) ?? '',
    country: (p.country as string) ?? '',
  };
}

const fieldCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-blue-500/60 dark:focus:ring-blue-500/20';
const labelCls =
  'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300';

export function BillingDetailsForm() {
  const [p, setP] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch('/api/account/billing-profile', {
          cache: 'no-store',
        });
        if (r.ok && active) {
          const d = await r.json();
          setP(fromApi(d.profile));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
    setMsg(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch('/api/account/billing-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setMsg({
          ok: true,
          text: d.stripeSynced ? 'Saved — billing details updated.' : 'Saved.',
        });
      } else {
        setMsg({
          ok: false,
          text: 'Could not save your details. Please try again.',
        });
      }
    } catch {
      setMsg({ ok: false, text: 'Network error — please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-700/60 dark:bg-slate-900/40 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Company billing details
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Optional — add these if you need the invoice issued to your company
        (company name on the invoice, VAT / CUI for reverse-charge).
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={p.bill_to_company}
            onChange={(e) => set('bill_to_company', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
          />
          Bill to my company
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="company_name">
              Company name
            </label>
            <input
              id="company_name"
              className={fieldCls}
              value={p.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Acme SRL"
              autoComplete="organization"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="vat_id">
              VAT / CUI
            </label>
            <input
              id="vat_id"
              className={fieldCls}
              value={p.vat_id}
              onChange={(e) => set('vat_id', e.target.value)}
              placeholder="RO12345678"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="registration_no">
              Registration no.
            </label>
            <input
              id="registration_no"
              className={fieldCls}
              value={p.registration_no}
              onChange={(e) => set('registration_no', e.target.value)}
              placeholder="J40/1234/2020"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="country">
              Country
            </label>
            <input
              id="country"
              className={fieldCls}
              value={p.country}
              maxLength={2}
              onChange={(e) => set('country', e.target.value.toUpperCase())}
              placeholder="RO"
              autoComplete="country"
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="billing_address">
            Billing address
          </label>
          <textarea
            id="billing_address"
            className={fieldCls}
            rows={2}
            value={p.billing_address}
            onChange={(e) => set('billing_address', e.target.value)}
            placeholder="Street, city, postal code"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save details'}
          </button>
          {msg && (
            <span
              className={`text-sm ${
                msg.ok
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
