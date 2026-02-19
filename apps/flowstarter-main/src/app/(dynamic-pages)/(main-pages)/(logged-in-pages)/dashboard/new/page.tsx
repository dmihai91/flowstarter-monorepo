import { getAvailableTemplates } from '@/lib/local-template-service';
import { WizardPageWrapper } from './components/WizardPageWrapper';
import ProjectWizard from './ProjectWizard';

export default async function NewProjectPage() {
  const initialAvailableIds = await getAvailableTemplates();
  return (
    <WizardPageWrapper>
      <ProjectWizard initialAvailableIds={initialAvailableIds} />
    </WizardPageWrapper>
  );
}
