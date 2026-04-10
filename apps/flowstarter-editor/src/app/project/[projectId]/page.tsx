import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ProjectEditor } from './ProjectEditor';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ handoff?: string; mode?: string }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const session = await auth();

  if (!session?.userId) {
    redirect('/');
  }

  const { projectId } = await params;
  const { handoff, mode } = await searchParams;

  return (
    <ProjectEditor
      projectId={projectId}
      handoffToken={handoff}
      mode={(mode as 'editor' | 'client') ?? 'editor'}
      userId={session.userId}
    />
  );
}
