import TemplatePreview from '@/components/template-preview/TemplatePreview';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    theme?: 'light' | 'dark';
    projectName?: string;
    projectDescription?: string;
    projectUSP?: string;
    targetUsers?: string;
    enhanceWithAI?: string;
  }>;
}) {
  // Await params and searchParams in TanStack Start
  const { id } = await params;
  const {
    theme: themeParam,
    projectName,
    projectDescription,
    projectUSP,
    targetUsers,
    enhanceWithAI,
  } = await searchParams;
  const theme = themeParam === 'dark' ? 'dark' : 'light';

  const projectData = {
    name: projectName,
    description: projectDescription,
    usp: projectUSP,
    targetUsers,
  };

  return (
    <div className="w-full min-h-screen">
      <TemplatePreview
        templateId={id}
        theme={theme}
        projectData={projectData}
        enhanceWithAI={enhanceWithAI === 'true'}
      />
    </div>
  );
}
