'use client';
import { useTranslations } from '@/lib/i18n';

import { TeamPageLayout } from '../../components/TeamPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Mail, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailPage() {
  const { t } = useTranslations();
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

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

  return (
    <TeamPageLayout
      title="Setup Email"
      subtitle="Configure Zoho Mail for client domains"
      icon={<Mail className="w-6 h-6" />}
    >
      {/* Domain input */}
      <div className="space-y-6">
        <div className="space-y-2">
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
        </div>

        {/* MX Records */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            MX Records
          </h3>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">
                    Value
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {mxRecords.map((record, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                      {record.priority}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">
                      {record.value}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          copyToClipboard(record.value, `MX-${record.priority}`)
                        }
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        {copied === `MX-${record.priority}` ? (
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
        </div>

        {/* TXT Records */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            TXT Records (SPF & DKIM)
          </h3>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">
                    Value
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {txtRecords.map((record, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {record.purpose}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">
                      {record.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70 max-w-xs truncate">
                      {record.value}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          copyToClipboard(record.value, record.purpose)
                        }
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        {copied === record.purpose ? (
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
        </div>

        {/* External links */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" asChild>
            <a
              href="https://www.zoho.eu/mail/help/adminconsole/domain-verification.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Zoho Setup Guide
            </a>
          </Button>
        </div>
      </div>
    </TeamPageLayout>
  );
}
