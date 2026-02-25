'use client';

import { TeamPageLayout } from '../../components/TeamPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { BarChart3, Copy, CheckCircle2, ExternalLink, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [measurementId, setMeasurementId] = useState('');
  const [copied, setCopied] = useState(false);

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

  return (
    <TeamPageLayout
      title="Analytics Setup"
      subtitle="Configure Google Analytics for client sites"
      icon={<BarChart3 className="w-6 h-6" />}
    >
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
    </TeamPageLayout>
  );
}
