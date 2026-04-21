'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

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

async function fetchProject(id: string): Promise<{ project: ProjectData }> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}

export function useProject() {
  const { id } = useParams();
  const router = useRouter();
  const projectId = Array.isArray(id) ? id[0] : id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const project = data?.project ?? null;

  const parsedChat = useMemo<ParsedChat | null>(() => {
    if (!project?.chat) return null;
    try {
      return JSON.parse(project.chat);
    } catch {
      return null;
    }
  }, [project?.chat]);

  const isComplete = !!(
    parsedChat?.businessInfo?.name &&
    parsedChat?.businessInfo?.description &&
    parsedChat?.businessInfo?.industry &&
    parsedChat?.clientInfo?.name &&
    parsedChat?.clientInfo?.email
  );

  const handleEdit = () => {
    if (!project) return;
    router.push(`/team/dashboard/new?id=${project.id}`);
  };

  return {
    project,
    parsedChat,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to load project'
      : null,
    isComplete,
    handleEdit,
  };
}
