import { WizardPageWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/WizardPageWrapper';
import ProjectWizard from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/ProjectWizard';
import { getAvailableTemplates } from '@/lib/local-template-service';

export default async function WizardProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialAvailableIds = await getAvailableTemplates();

  return (
    <WizardPageWrapper>
      <ProjectWizard initialAvailableIds={initialAvailableIds} draftId={id} />
    </WizardPageWrapper>
  );
}
