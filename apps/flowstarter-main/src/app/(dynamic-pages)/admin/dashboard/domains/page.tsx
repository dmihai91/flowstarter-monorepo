'use client';
import { useTranslations } from '@/lib/i18n';

import { TeamDashboardShell } from '../components/TeamDashboardShell';
import { AdminShellLoadingChrome } from '../components/AdminSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Globe,
  Copy,
  CheckCircle2,
  ExternalLink,
  Cloud,
  Shield,
  Zap,
  Loader2,
} from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export default function DomainsPage() {
  const { t } = useTranslations();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [domain, setDomain] = useState('');
  const { copied, copyToClipboard } = useCopyToClipboard();

  useEffect(() => {
    if (!userLoaded) return;
    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const role = metadata?.role?.toLowerCase();
    const isTeam = role === 'team' || role === 'admin';
    if (!user) router.push('/admin/login');
    else if (!isTeam) router.push('/');
    else setAuthReady(true);
  }, [user, userLoaded, router]);

  // Cloudflare nameservers (these are examples - actual ones vary per account)
  const nameservers = ['adam.ns.cloudflare.com', 'betty.ns.cloudflare.com'];

  // DNS records for Vercel deployment via Cloudflare
  const dnsRecords = [
    {
      type: 'A',
      name: '@',
      value: '76.76.21.21',
      proxy: 'DNS only',
      ttl: 'Auto',
    },
    {
      type: 'CNAME',
      name: 'www',
      value: 'cname.vercel-dns.com',
      proxy: 'DNS only',
      ttl: 'Auto',
    },
  ];

  const sslSettings = [
    { setting: 'SSL/TLS Mode', value: 'Full (strict)', important: true },
    { setting: 'Always Use HTTPS', value: 'On', important: false },
    { setting: 'Minimum TLS Version', value: 'TLS 1.2', important: false },
  ];

  if (!userLoaded || !authReady) {
    return (
      <AdminShellLoadingChrome>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-[var(--ls-accent)]"
            aria-hidden
          />
        </div>
      </AdminShellLoadingChrome>
    );
  }

  return (
    <TeamDashboardShell
      title="Configure domain"
      subtitle="Set up domains with Cloudflare DNS & SSL"
      icon={<Globe className="h-5 w-5" aria-hidden />}
      showBackButton
    >
      <div className="space-y-8">
        {/* Domain lookup */}
        <section className="ls-card space-y-2">
          <Label htmlFor="domain">{t('team.domains.clientDomain')}</Label>
          <div className="flex gap-3">
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button asChild>
              <a
                href="https://dash.cloudflare.com/?to=/:account/add-site"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Cloud className="w-4 h-4 mr-2" />
                Add to Cloudflare
              </a>
            </Button>
          </div>
        </section>

        {/* Setup Steps */}
        <div className="space-y-6">
          {/* Step 1: Add to Cloudflare */}
          <div className="ls-card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ls-accent)] text-sm font-semibold text-white">
                1
              </span>
              <h3 className="font-semibold text-[var(--ls-ink)]">
                Add Domain to Cloudflare
              </h3>
            </div>
            <p className="mb-4 text-sm text-[var(--ls-ink-dim)]">
              Add the client's domain to their Cloudflare account (or our shared
              account for managed clients).
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://dash.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Cloudflare Dashboard
              </a>
            </Button>
          </div>

          {/* Step 2: Update Nameservers */}
          <div className="ls-card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ls-accent)] text-sm font-semibold text-white">
                2
              </span>
              <h3 className="font-semibold text-[var(--ls-ink)]">
                Update Nameservers at Registrar
              </h3>
            </div>
            <p className="mb-4 text-sm text-[var(--ls-ink-dim)]">
              At the domain registrar, replace existing nameservers with
              Cloudflare's (shown after adding domain):
            </p>
            <div className="space-y-2 rounded-lg bg-[var(--ls-glass-bg)] p-4">
              {nameservers.map((ns, i) => (
                <div key={i} className="flex items-center justify-between">
                  <code className="font-mono text-sm text-[var(--ls-ink)]">
                    {ns}
                  </code>
                  <button
                    onClick={() => copyToClipboard(ns, `NS${i + 1}`)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    {copied === `NS${i + 1}` ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--ls-ink-faint)]">
              Note: Actual nameservers are shown in Cloudflare after adding the
              domain.
            </p>
          </div>

          {/* Step 3: DNS Records */}
          <div className="ls-card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ls-accent)] text-sm font-semibold text-white">
                3
              </span>
              <h3 className="font-semibold text-[var(--ls-ink)]">
                Add DNS Records for Vercel
              </h3>
            </div>
            <p className="mb-4 text-sm text-[var(--ls-ink-dim)]">
              Add these DNS records in Cloudflare (set proxy to{' '}
              <strong>DNS only</strong> - gray cloud):
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                      Content
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                      Proxy
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ls-rule)]">
                  {dnsRecords.map((record, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-mono text-[var(--ls-ink)]">
                        {record.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--ls-ink-dim)]">
                        {record.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--ls-ink-dim)]">
                        {record.value}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-[var(--ls-rule)]/40 px-2 py-0.5 text-xs text-[var(--ls-ink-dim)]">
                          {record.proxy}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            copyToClipboard(record.value, record.type)
                          }
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                          {copied === record.type ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Important: Keep proxy status as "DNS only" (gray cloud) for
                Vercel domains. The orange cloud (proxied) can cause SSL issues.
              </p>
            </div>
          </div>

          {/* Step 4: SSL Settings */}
          <div className="ls-card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ls-accent)] text-sm font-semibold text-white">
                4
              </span>
              <h3 className="font-semibold text-[var(--ls-ink)]">
                Configure SSL/TLS Settings
              </h3>
            </div>
            <p className="mb-4 text-sm text-[var(--ls-ink-dim)]">
              Go to <strong>SSL/TLS</strong> in Cloudflare and verify these
              settings:
            </p>
            <div className="space-y-2">
              {sslSettings.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-[var(--ls-glass-bg)] p-3"
                >
                  <span className="text-sm text-[var(--ls-ink-dim)]">
                    {item.setting}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      item.important
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[var(--ls-ink)]'
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cloudflare benefits */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              title: 'DDoS Protection',
              desc: 'Automatic protection against attacks',
            },
            { icon: Zap, title: 'Fast DNS', desc: 'Global anycast network' },
            {
              icon: Cloud,
              title: 'Free SSL',
              desc: 'Universal SSL certificates',
            },
          ].map((benefit, i) => (
            <div key={i} className="ls-card !p-4">
              <benefit.icon className="mb-2 h-5 w-5 text-[var(--ls-accent)]" />
              <h4 className="text-sm font-medium text-[var(--ls-ink)]">
                {benefit.title}
              </h4>
              <p className="text-xs text-[var(--ls-ink-faint)]">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>

        {/* External links */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button variant="outline" asChild>
            <a
              href="https://developers.cloudflare.com/dns/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Cloudflare DNS Docs
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://vercel.com/docs/projects/domains/working-with-cloudflare"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Vercel + Cloudflare Guide
            </a>
          </Button>
        </div>
      </div>
    </TeamDashboardShell>
  );
}
