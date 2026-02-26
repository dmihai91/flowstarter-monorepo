'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { TeamHeader } from '../../../components/TeamHeader';
import FooterCompact from '@/components/FooterCompact';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  is_draft: boolean;
  created_at: string;
  chat?: string;
}

interface ParsedChat {
  clientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  businessInfo?: {
    name?: string;
    industry?: string;
    description?: string;
    targetAudience?: string;
    uvp?: string;
    goal?: string;
    offerType?: string;
    brandTone?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  generatedByAI?: boolean;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [parsedChat, setParsedChat] = useState<ParsedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Project not found');
        }
        const data = await response.json();
        setProject(data.project);

        // Parse chat JSON if exists
        if (data.project.chat) {
          try {
            const chat = JSON.parse(data.project.chat);
            setParsedChat(chat);
          } catch (e) {
            console.error('Failed to parse chat:', e);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const cardClass = [
    'rounded-2xl border border-black/[0.08] dark:border-white/[0.08]',
    'bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl',
    'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset]',
    'dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]',
  ].join(' ');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TeamHeader />
        <div className="flex-1 flex items-center justify-center">
          <GradientBackground variant="dashboard" className="fixed" />
          <div className={`${cardClass} p-8`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <p className="text-gray-600 dark:text-white/70 font-medium">
                Loading project...
              </p>
            </div>
          </div>
        </div>
        <FooterCompact />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <TeamHeader />
        <div className="flex-1 flex items-center justify-center">
          <GradientBackground variant="dashboard" className="fixed" />
          <div className={`${cardClass} p-8 max-w-md mx-auto text-center`}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Project not found
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
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

  return (
    <div className="min-h-screen flex flex-col">
      <TeamHeader />
      <div className="h-16" />

      <GradientBackground variant="dashboard" className="fixed" />

      <main className="flex-1 relative z-10 max-w-4xl mx-auto px-6 py-8 w-full">
        {/* Back button */}
        <Link
          href="/team/dashboard"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Project Header */}
        <div className={`${cardClass} p-6 mb-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.name}
                  </h1>
                  {parsedChat?.generatedByAI && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                      <Sparkles className="w-3 h-3" />
                      AI Generated
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
                  Project ID: {project.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.is_draft
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {project.is_draft ? 'Draft' : 'Active'}
              </span>
              <Button size="sm" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {project.description && (
            <p className="text-gray-600 dark:text-white/70 mt-4">
              {project.description}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Information */}
          {parsedChat?.clientInfo && (
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Client Information
                </h2>
              </div>
              <div className="space-y-3">
                {parsedChat.clientInfo.name && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-white/70">
                      {parsedChat.clientInfo.name}
                    </span>
                  </div>
                )}
                {parsedChat.clientInfo.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${parsedChat.clientInfo.email}`}
                      className="text-[var(--purple)] hover:underline"
                    >
                      {parsedChat.clientInfo.email}
                    </a>
                  </div>
                )}
                {parsedChat.clientInfo.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-white/70">
                      {parsedChat.clientInfo.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Information */}
          {parsedChat?.businessInfo && (
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[var(--purple)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Business Details
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                {parsedChat.businessInfo.industry && (
                  <div>
                    <span className="text-gray-400 dark:text-white/40">
                      Industry:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-white/70">
                      {parsedChat.businessInfo.industry}
                    </span>
                  </div>
                )}
                {parsedChat.businessInfo.targetAudience && (
                  <div>
                    <span className="text-gray-400 dark:text-white/40">
                      Target Audience:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-white/70">
                      {parsedChat.businessInfo.targetAudience}
                    </span>
                  </div>
                )}
                {parsedChat.businessInfo.uvp && (
                  <div>
                    <span className="text-gray-400 dark:text-white/40">
                      UVP:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-white/70">
                      {parsedChat.businessInfo.uvp}
                    </span>
                  </div>
                )}
                {parsedChat.businessInfo.brandTone && (
                  <div>
                    <span className="text-gray-400 dark:text-white/40">
                      Brand Tone:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-white/70 capitalize">
                      {parsedChat.businessInfo.brandTone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {parsedChat?.contactInfo &&
            (parsedChat.contactInfo.email ||
              parsedChat.contactInfo.phone ||
              parsedChat.contactInfo.address ||
              parsedChat.contactInfo.website) && (
              <div className={`${cardClass} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contact Information
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  {parsedChat.contactInfo.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${parsedChat.contactInfo.email}`}
                        className="text-[var(--purple)] hover:underline"
                      >
                        {parsedChat.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {parsedChat.contactInfo.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-white/70">
                        {parsedChat.contactInfo.phone}
                      </span>
                    </div>
                  )}
                  {parsedChat.contactInfo.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-white/70">
                        {parsedChat.contactInfo.address}
                      </span>
                    </div>
                  )}
                  {parsedChat.contactInfo.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={parsedChat.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--purple)] hover:underline inline-flex items-center gap-1"
                      >
                        {parsedChat.contactInfo.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Quick Actions */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Project Details
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Website
              </Button>
            </div>
          </div>
        </div>
      </main>

      <FooterCompact />
    </div>
  );
}
