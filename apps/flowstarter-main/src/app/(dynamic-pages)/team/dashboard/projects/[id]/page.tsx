'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { TeamHeader } from '../../../components/TeamHeader';
import FooterCompact from '@/components/FooterCompact';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  Target,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader2,
  Edit,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useProject } from './hooks/useProject';

const cardClass = [
  'rounded-2xl border border-black/[0.08] dark:border-white/[0.08]',
  'bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl',
  'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset]',
  'dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]',
].join(' ');

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col">
      <TeamHeader />
      <div className="h-16" />
      <GradientBackground variant="dashboard" className="fixed" />
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`${cardClass} p-8`}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
            <p className="text-gray-600 dark:text-white/70 font-medium">Loading project...</p>
          </div>
        </div>
      </div>
      <FooterCompact />
    </div>
  );
}

// Error state component
function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TeamHeader />
      <div className="h-16" />
      <GradientBackground variant="dashboard" className="fixed" />
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`${cardClass} p-8 max-w-md mx-auto text-center`}>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Project not found</h2>
          <p className="text-gray-500 dark:text-white/50 mb-6">
            {error || "The project you're looking for doesn't exist."}
          </p>
          <Link href="/team/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <FooterCompact />
    </div>
  );
}

export default function ProjectDetailPage() {
  const { project, parsedChat, isLoading, error, isComplete, handleEdit } = useProject();

  if (isLoading) return <LoadingState />;
  if (error || !project) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen flex flex-col">
      <TeamHeader />
      <div className="h-16" />
      <GradientBackground variant="dashboard" className="fixed" />

      <main className="flex-1 relative z-10 max-w-5xl mx-auto px-6 py-8 w-full">
        {/* Back button */}
        <Link
          href="/team/dashboard"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Project Header */}
        <div className={`${cardClass} p-6 mb-8`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[var(--purple)]/20">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                  {parsedChat?.generatedByAI && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                      <Sparkles className="w-3 h-3" />
                      AI Generated
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.is_draft
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {project.is_draft ? 'Draft' : 'Active'}
                  </span>
                </div>
                <p className="text-gray-400 dark:text-white/40 text-sm mt-1 font-mono">{project.id}</p>
              </div>
            </div>
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          {project.description && (
            <p className="text-gray-600 dark:text-white/70 mt-4 leading-relaxed">{project.description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Information */}
          <InfoCard
            icon={<Users className="w-5 h-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            title="Client Information"
          >
            {parsedChat?.clientInfo ? (
              <div className="space-y-4">
                {parsedChat.clientInfo.name && (
                  <InfoRow icon={<Users />} value={parsedChat.clientInfo.name} />
                )}
                {parsedChat.clientInfo.email && (
                  <InfoRow icon={<Mail />} value={parsedChat.clientInfo.email} isLink={`mailto:${parsedChat.clientInfo.email}`} />
                )}
                {parsedChat.clientInfo.phone && (
                  <InfoRow icon={<Phone />} value={parsedChat.clientInfo.phone} />
                )}
              </div>
            ) : (
              <EmptyState text="No client information available" />
            )}
          </InfoCard>

          {/* Business Information */}
          <InfoCard
            icon={<Building2 className="w-5 h-5 text-[var(--purple)]" />}
            iconBg="bg-[var(--purple)]/10"
            title="Business Details"
          >
            {parsedChat?.businessInfo ? (
              <div className="space-y-3">
                {parsedChat.businessInfo.industry && (
                  <DetailRow label="Industry" value={parsedChat.businessInfo.industry} />
                )}
                {parsedChat.businessInfo.targetAudience && (
                  <DetailRow label="Target Audience" value={parsedChat.businessInfo.targetAudience} />
                )}
                {parsedChat.businessInfo.brandTone && (
                  <DetailRow label="Brand Tone" value={parsedChat.businessInfo.brandTone} capitalize />
                )}
                {parsedChat.businessInfo.uvp && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 mt-3">
                    <span className="text-gray-400 dark:text-white/40 text-sm block mb-1">Unique Value Proposition</span>
                    <span className="text-gray-700 dark:text-white/80 text-sm">{parsedChat.businessInfo.uvp}</span>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState text="No business information available" />
            )}
          </InfoCard>

          {/* Contact Information */}
          <InfoCard
            icon={<Globe className="w-5 h-5 text-green-500" />}
            iconBg="bg-green-500/10"
            title="Contact Information"
          >
            {parsedChat?.contactInfo && (parsedChat.contactInfo.email || parsedChat.contactInfo.phone || parsedChat.contactInfo.address || parsedChat.contactInfo.website) ? (
              <div className="space-y-4">
                {parsedChat.contactInfo.email && (
                  <InfoRow icon={<Mail />} value={parsedChat.contactInfo.email} isLink={`mailto:${parsedChat.contactInfo.email}`} />
                )}
                {parsedChat.contactInfo.phone && (
                  <InfoRow icon={<Phone />} value={parsedChat.contactInfo.phone} />
                )}
                {parsedChat.contactInfo.address && (
                  <InfoRow icon={<MapPin />} value={parsedChat.contactInfo.address} />
                )}
                {parsedChat.contactInfo.website && (
                  <InfoRow icon={<Globe />} value={parsedChat.contactInfo.website} isLink={parsedChat.contactInfo.website} external />
                )}
              </div>
            ) : (
              <EmptyState text="No contact information available" />
            )}
          </InfoCard>

          {/* Quick Actions */}
          <InfoCard
            icon={<Target className="w-5 h-5 text-orange-500" />}
            iconBg="bg-orange-500/10"
            title="Quick Actions"
          >
            <div className="space-y-3">
              <Button onClick={handleEdit} className="w-full justify-start h-12" variant="outline">
                <Edit className="w-4 h-4 mr-3" />
                Edit Project Details
              </Button>
              <Button
                className="w-full justify-start h-12 bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white hover:opacity-90"
                disabled={!isComplete}
              >
                <Sparkles className="w-4 h-4 mr-3" />
                Generate Website
              </Button>
            </div>
          </InfoCard>
        </div>
      </main>

      <FooterCompact />
    </div>
  );
}

// Helper components
function InfoCard({ icon, iconBg, title, children }: { icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <div className={cardClass + ' p-6'}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, value, isLink, external }: { icon: React.ReactNode; value: string; isLink?: string; external?: boolean }) {
  const iconEl = <span className="w-4 h-4 text-gray-400 flex-shrink-0">{icon}</span>;
  
  return (
    <div className="flex items-center gap-3">
      {iconEl}
      {isLink ? (
        <a
          href={isLink}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-[var(--purple)] hover:underline inline-flex items-center gap-1"
        >
          {value}
          {external && <ExternalLink className="w-3 h-3" />}
        </a>
      ) : (
        <span className="text-gray-700 dark:text-white/80">{value}</span>
      )}
    </div>
  );
}

function DetailRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400 dark:text-white/40 text-sm">{label}</span>
      <span className={`text-gray-700 dark:text-white/80 text-sm font-medium text-right max-w-[60%] ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-gray-400 dark:text-white/40 text-sm">{text}</p>;
}
