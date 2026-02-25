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
  BarChart3,
  Shield,
  LogOut,
  Loader2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [measurementId, setMeasurementId] = useState('');
  const [copied, setCopied] = useState(false);

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

  const gaSnippet = `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId || 'G-XXXXXXXXXX'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId || 'G-XXXXXXXXXX'}');
</script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(gaSnippet);
    setCopied(true);
    toast.success('Snippet copied!');
    setTimeout(() => setCopied(false), 2000);
  };

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
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Setup
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Configure Google Analytics for client sites
              </p>
            </div>
          </div>

          {/* Setup steps */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--purple)] text-white text-xs flex items-center justify-center">1</span>
                Create GA4 Property
              </h3>
              <div className="pl-8">
                <p className="text-sm text-gray-600 dark:text-white/60 mb-3">
                  Create a new property in Google Analytics for the client's website.
                </p>
                <Button variant="outline" asChild>
                  <a href="https://analytics.google.com/analytics/web/#/a/p/admin/property/create" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Google Analytics
                  </a>
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--purple)] text-white text-xs flex items-center justify-center">2</span>
                Get Measurement ID
              </h3>
              <div className="pl-8 space-y-3">
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Copy the Measurement ID from GA4 (starts with G-)
                </p>
                <div className="max-w-sm">
                  <Label htmlFor="measurementId">Measurement ID</Label>
                  <Input
                    id="measurementId"
                    placeholder="G-XXXXXXXXXX"
                    value={measurementId}
                    onChange={(e) => setMeasurementId(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--purple)] text-white text-xs flex items-center justify-center">3</span>
                Add Tracking Code
              </h3>
              <div className="pl-8 space-y-3">
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Add this snippet to the site's <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">&lt;head&gt;</code> section:
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm overflow-x-auto">
                    <code>{gaSnippet}</code>
                  </pre>
                  <button
                    onClick={copySnippet}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-start gap-3">
                <Code className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">For Next.js sites</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Use the <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">@next/third-parties</code> package for better performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
