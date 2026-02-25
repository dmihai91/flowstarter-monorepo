'use client';

import { TeamPageLayout } from '../../components/TeamPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Globe, Copy, CheckCircle2, ExternalLink, Cloud, Shield, Zap } from 'lucide-react';
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

  // Cloudflare nameservers (these are examples - actual ones vary per account)
  const nameservers = [
    'adam.ns.cloudflare.com',
    'betty.ns.cloudflare.com',
  ];

  // DNS records for Vercel deployment via Cloudflare
  const dnsRecords = [
    { type: 'A', name: '@', value: '76.76.21.21', proxy: 'DNS only', ttl: 'Auto' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', proxy: 'DNS only', ttl: 'Auto' },
  ];

  const sslSettings = [
    { setting: 'SSL/TLS Mode', value: 'Full (strict)', important: true },
    { setting: 'Always Use HTTPS', value: 'On', important: false },
    { setting: 'Minimum TLS Version', value: 'TLS 1.2', important: false },
  ];

  return (
    <TeamPageLayout
      title="Configure Domain"
      subtitle="Set up domains with Cloudflare DNS & SSL"
      icon={<Globe className="w-6 h-6" />}
    >
      <div className="space-y-8">
        {/* Domain lookup */}
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
            <Button asChild>
              <a href="https://dash.cloudflare.com/?to=/:account/add-site" target="_blank" rel="noopener noreferrer">
                <Cloud className="w-4 h-4 mr-2" />
                Add to Cloudflare
              </a>
            </Button>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-6">
          {/* Step 1: Add to Cloudflare */}
          <div className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-[var(--purple)] text-white text-sm flex items-center justify-center font-semibold">1</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Domain to Cloudflare</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
              Add the client's domain to their Cloudflare account (or our shared account for managed clients).
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Cloudflare Dashboard
              </a>
            </Button>
          </div>

          {/* Step 2: Update Nameservers */}
          <div className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-[var(--purple)] text-white text-sm flex items-center justify-center font-semibold">2</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Update Nameservers at Registrar</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
              At the domain registrar, replace existing nameservers with Cloudflare's (shown after adding domain):
            </p>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 space-y-2">
              {nameservers.map((ns, i) => (
                <div key={i} className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-900 dark:text-white">{ns}</code>
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
            <p className="text-xs text-gray-500 dark:text-white/40 mt-3">
              Note: Actual nameservers are shown in Cloudflare after adding the domain.
            </p>
          </div>

          {/* Step 3: DNS Records */}
          <div className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-[var(--purple)] text-white text-sm flex items-center justify-center font-semibold">3</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Add DNS Records for Vercel</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
              Add these DNS records in Cloudflare (set proxy to <strong>DNS only</strong> - gray cloud):
            </p>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Content</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-white/60">Proxy</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {dnsRecords.map((record, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{record.type}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">{record.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-white/70">{record.value}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60">
                          {record.proxy}
                        </span>
                      </td>
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
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Important: Keep proxy status as "DNS only" (gray cloud) for Vercel domains. The orange cloud (proxied) can cause SSL issues.
              </p>
            </div>
          </div>

          {/* Step 4: SSL Settings */}
          <div className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-[var(--purple)] text-white text-sm flex items-center justify-center font-semibold">4</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Configure SSL/TLS Settings</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
              Go to <strong>SSL/TLS</strong> in Cloudflare and verify these settings:
            </p>
            <div className="space-y-2">
              {sslSettings.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-sm text-gray-600 dark:text-white/60">{item.setting}</span>
                  <span className={`text-sm font-medium ${item.important ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
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
            { icon: Shield, title: 'DDoS Protection', desc: 'Automatic protection against attacks' },
            { icon: Zap, title: 'Fast DNS', desc: 'Global anycast network' },
            { icon: Cloud, title: 'Free SSL', desc: 'Universal SSL certificates' },
          ].map((benefit, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
              <benefit.icon className="w-5 h-5 text-[var(--purple)] mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">{benefit.title}</h4>
              <p className="text-xs text-gray-500 dark:text-white/50">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* External links */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button variant="outline" asChild>
            <a href="https://developers.cloudflare.com/dns/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Cloudflare DNS Docs
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://vercel.com/docs/projects/domains/working-with-cloudflare" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Vercel + Cloudflare Guide
            </a>
          </Button>
        </div>
      </div>
    </TeamPageLayout>
  );
}
