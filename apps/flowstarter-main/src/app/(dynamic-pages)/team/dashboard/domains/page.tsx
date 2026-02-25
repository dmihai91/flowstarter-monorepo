'use client';

import { PageContainer } from '@/components/PageContainer';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft,
  Globe,
  Shield,
  LogOut,
  Loader2,
  Copy,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DomainsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';
      
      if (!user) {
        router.push('/team/login');
      } else if (!isTeam) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/team/login');
  };

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

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <DashboardWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/team/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                Team
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-white/50">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
            <Link
              href="/team/dashboard/security"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              Security
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <PageContainer gradientVariant="dashboard">
        <GlassCard className="p-6 sm:p-8">
          {/* Back button */}
          <Link 
            href="/team/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Page header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configure Domain
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Set up DNS records and SSL certificates for client domains
              </p>
            </div>
          </div>

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
                <Button>
                  Lookup
                </Button>
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
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
