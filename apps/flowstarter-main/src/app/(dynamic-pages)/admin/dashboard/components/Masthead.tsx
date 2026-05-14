import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

function timeOfDayWord(greeting: string): string {
  const match = greeting.toLowerCase().match(/morning|afternoon|evening|night/);
  return match?.[0] ?? 'day';
}

export function Masthead({
  greeting,
  firstName,
  projectCount,
  loading,
}: {
  greeting: string;
  firstName: string;
  projectCount: number;
  loading: boolean;
}) {
  const { t } = useTranslations();
  const inFlightBody =
    projectCount === 1
      ? t('admin.dashboard.masthead.projectsInFlight', {
          count: projectCount,
        })
      : t('admin.dashboard.masthead.projectsInFlightPlural', {
          count: projectCount,
        });

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="ls-display ls-display--sm shrink-0">
          Good {timeOfDayWord(greeting)},{' '}
          <span className="flourish">{firstName}.</span>
        </h1>
        <p className="ls-body min-w-0 max-w-full">
          {loading
            ? t('admin.dashboard.masthead.loading')
            : projectCount === 0
            ? t('admin.dashboard.masthead.noProjects')
            : inFlightBody}
        </p>
      </div>
      <Link
        href="/admin/dashboard/new"
        className="ls-cta ls-cta--sm shrink-0 self-start sm:self-auto"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('admin.dashboard.cta.newProject')}
      </Link>
    </header>
  );
}
