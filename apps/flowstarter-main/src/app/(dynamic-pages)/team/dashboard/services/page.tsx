'use client';

import { PageContainer } from '@/components/PageContainer';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft,
  Settings,
  Shield,
  LogOut,
  Loader2,
  ExternalLink,
  CreditCard,
  Calendar,
  MessageSquare,
  ShoppingCart,
  FileText,
  Zap,
} from 'lucide-react';

const integrations = [
  {
    name: 'Stripe',
    description: 'Payment processing for e-commerce',
    icon: CreditCard,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    docs: 'https://stripe.com/docs',
    status: 'available',
  },
  {
    name: 'Calendly',
    description: 'Appointment scheduling',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    docs: 'https://developer.calendly.com/',
    status: 'available',
  },
  {
    name: 'Intercom',
    description: 'Customer messaging platform',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    docs: 'https://developers.intercom.com/',
    status: 'available',
  },
  {
    name: 'Shopify',
    description: 'E-commerce integration',
    icon: ShoppingCart,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    docs: 'https://shopify.dev/docs',
    status: 'coming_soon',
  },
  {
    name: 'Notion',
    description: 'Content management',
    icon: FileText,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    docs: 'https://developers.notion.com/',
    status: 'coming_soon',
  },
  {
    name: 'Zapier',
    description: 'Workflow automation',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    docs: 'https://zapier.com/apps',
    status: 'coming_soon',
  },
];

export default function ServicesPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Services & Integrations
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Third-party services available for client sites
              </p>
            </div>
          </div>

          {/* Integrations grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className={`relative p-5 rounded-xl border transition-all ${
                  integration.status === 'available'
                    ? 'bg-white dark:bg-white/[0.03] border-gray-200/50 dark:border-white/10 hover:border-[var(--purple)]/30'
                    : 'bg-gray-50 dark:bg-white/[0.01] border-gray-200/30 dark:border-white/5 opacity-60'
                }`}
              >
                {integration.status === 'coming_soon' && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50">
                    Coming Soon
                  </span>
                )}
                
                <div className={`w-10 h-10 rounded-lg ${integration.bgColor} flex items-center justify-center mb-3`}>
                  <integration.icon className={`w-5 h-5 ${integration.color}`} />
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {integration.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
                  {integration.description}
                </p>
                
                {integration.status === 'available' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={integration.docs} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Documentation
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Request integration */}
          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10">
            <p className="text-sm text-gray-600 dark:text-white/60">
              Need a different integration? <a href="mailto:team@flowstarter.app" className="text-[var(--purple)] hover:underline">Let us know</a> and we'll add it to the roadmap.
            </p>
          </div>
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
