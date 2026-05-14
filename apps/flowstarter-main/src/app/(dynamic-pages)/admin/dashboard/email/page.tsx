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
import { Mail, Copy, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export default function EmailPage() {
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

  const mxRecords = [
    { priority: '10', value: 'mx.zoho.eu' },
    { priority: '20', value: 'mx2.zoho.eu' },
    { priority: '50', value: 'mx3.zoho.eu' },
  ];

  const txtRecords = [
    { name: '@', value: 'v=spf1 include:zoho.eu ~all', purpose: 'SPF' },
    {
      name: 'zmail._domainkey',
      value: '[DKIM key from Zoho]',
      purpose: 'DKIM',
    },
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
      title="Setup email"
      subtitle="Configure Zoho Mail for client domains"
      icon={<Mail className="h-5 w-5" aria-hidden />}
      showBackButton
    >
      <div className="space-y-8">
        <section className="ls-card space-y-2">
          <Label htmlFor="domain">{t('team.email.clientDomain')}</Label>
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
                href="https://www.zoho.eu/mail/zohomail-pricing.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add to Zoho
              </a>
            </Button>
          </div>
        </section>

        <section className="ls-card space-y-4">
          <h3 className="font-semibold text-[var(--ls-ink)]">MX records</h3>
          <div className="overflow-hidden rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                    Value
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ls-rule)]">
                {mxRecords.map((record, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-[var(--ls-ink)]">
                      {record.priority}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--ls-ink-dim)]">
                      {record.value}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(record.value, `MX-${record.priority}`)
                        }
                        className="rounded p-1.5 transition-colors hover:bg-[var(--ls-rule)]/50"
                      >
                        {copied === `MX-${record.priority}` ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-[var(--ls-ink-faint)]" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ls-card space-y-4">
          <h3 className="font-semibold text-[var(--ls-ink)]">
            TXT records (SPF &amp; DKIM)
          </h3>
          <div className="overflow-hidden rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--ls-ink-dim)]">
                    Value
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ls-rule)]">
                {txtRecords.map((record, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-[var(--ls-ink)]">
                      {record.purpose}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--ls-ink-dim)]">
                      {record.name}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-[var(--ls-ink-dim)]">
                      {record.value}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(record.value, record.purpose)
                        }
                        className="rounded p-1.5 transition-colors hover:bg-[var(--ls-rule)]/50"
                      >
                        {copied === record.purpose ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-[var(--ls-ink-faint)]" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" asChild>
            <a
              href="https://www.zoho.eu/mail/help/adminconsole/domain-verification.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Zoho Setup Guide
            </a>
          </Button>
        </div>
      </div>
    </TeamDashboardShell>
  );
}
