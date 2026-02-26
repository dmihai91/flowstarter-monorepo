'use client';

import { useWizardStore } from '@/store/wizard-store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  is_draft: boolean;
  created_at: string;
  chat?: string;
}

export interface ParsedChat {
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

export function useProject() {
  const { id } = useParams();
  const router = useRouter();
  const setTeamWizardData = useWizardStore((state) => state.setTeamWizardData);
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [parsedChat, setParsedChat] = useState<ParsedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project data
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

        if (data.project.chat) {
          try {
            setParsedChat(JSON.parse(data.project.chat));
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

  // Check if project is complete
  const isComplete = !!(
    parsedChat?.businessInfo?.name &&
    parsedChat?.businessInfo?.description &&
    parsedChat?.businessInfo?.industry &&
    parsedChat?.clientInfo?.name &&
    parsedChat?.clientInfo?.email
  );

  // Build wizard data from project
  const buildWizardData = () => ({
    clientName: parsedChat?.clientInfo?.name || '',
    clientEmail: parsedChat?.clientInfo?.email || '',
    clientPhone: parsedChat?.clientInfo?.phone || '',
    businessName: parsedChat?.businessInfo?.name || project?.name || '',
    description: parsedChat?.businessInfo?.description || project?.description || '',
    industry: parsedChat?.businessInfo?.industry || '',
    targetAudience: parsedChat?.businessInfo?.targetAudience || '',
    uvp: parsedChat?.businessInfo?.uvp || '',
    goal: parsedChat?.businessInfo?.goal || '',
    offerType: parsedChat?.businessInfo?.offerType || '',
    brandTone: parsedChat?.businessInfo?.brandTone || '',
    businessEmail: parsedChat?.contactInfo?.email || '',
    businessPhone: parsedChat?.contactInfo?.phone || '',
    businessAddress: parsedChat?.contactInfo?.address || '',
    website: parsedChat?.contactInfo?.website || '',
    step: 1,
    isAIMode: parsedChat?.generatedByAI || false,
    projectId: project?.id || '',
  });

  // Auto-redirect incomplete drafts to wizard
  useEffect(() => {
    if (isLoading || !project) return;
    
    if (!isComplete && project.is_draft) {
      setTeamWizardData(buildWizardData());
      router.push(`/team/dashboard/new?id=${project.id}`);
    }
  }, [isLoading, project, isComplete]);

  // Edit project handler
  const handleEdit = () => {
    if (!project) return;
    setTeamWizardData(buildWizardData());
    router.push(`/team/dashboard/new?id=${project.id}`);
  };

  return {
    project,
    parsedChat,
    isLoading,
    error,
    isComplete,
    handleEdit,
  };
}
