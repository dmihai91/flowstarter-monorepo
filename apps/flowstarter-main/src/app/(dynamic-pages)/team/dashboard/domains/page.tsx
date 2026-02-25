'use client';

import { TeamPageLayout } from '../../components/TeamPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Globe, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function DomainsPage() {
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const dnsRecords = [
    { type: 'A', name: '@', value: '76.76.21.21', ttl: '3600' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', ttl: '3600' },
  ];

  return (
    <TeamPageLayout
      title="Configure Domain"
      subtitle="Set up DNS records and SSL certificates for client domains"
      icon={<Globe className="w-6 h-6" />}
    >
      {/* Domain lookup */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="domain">Client Domain</Label>
          <div className="flex gap-3">
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button>Lookup</Button>
          </div>
        </div>

        {/* DNS Records */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Required DNS Records</h3>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">TTL</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {dnsRecords.map((record, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{record.type}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">{record.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">{record.value}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">{record.ttl}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyToClipboard(record.value, record.type)}
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
        </div>

        {/* SSL Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">SSL Certificate</h3>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-300">SSL will be auto-provisioned</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Vercel automatically provisions SSL certificates once DNS is configured</p>
              </div>
            </div>
          </div>
        </div>

        {/* External links */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" asChild>
            <a href="https://vercel.com/docs/projects/domains" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Vercel Docs
            </a>
          </Button>
        </div>
      </div>
    </TeamPageLayout>
  );
}
