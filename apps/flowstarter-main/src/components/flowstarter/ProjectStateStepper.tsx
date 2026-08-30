/**
 * Where the project has got to, as six labelled steps.
 *
 * Server-renderable: it takes a state and renders. No enum names reach the
 * page — every string comes from `PROJECT_STAGES`.
 */
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import { cn } from '@/lib/utils';
import { PROJECT_STAGES, currentStage, stageStatus } from './project-progress';

export function ProjectStateStepper({
  state,
  className,
}: {
  state: ProjectState;
  className?: string;
}) {
  const here = currentStage(state);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div>
        <h2
          className="text-xl font-bold text-[var(--fs-ink)]"
          data-testid="project-stage-title"
        >
          {here.title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--fs-ink)]/70">
          {here.detail}
        </p>
      </div>

      <ol
        className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2"
        aria-label="Project progress"
      >
        {PROJECT_STAGES.map((stage) => {
          const status = stageStatus(stage, state);
          return (
            <li
              key={stage.state}
              data-testid="project-stage"
              data-state={stage.state}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors',
                status === 'current' &&
                  'border-[var(--fs-ink)] bg-[var(--fs-ink)] text-white',
                status === 'done' &&
                  'border-[var(--fs-ink)]/20 bg-[var(--fs-ink)]/10 text-[var(--fs-ink)]/80',
                status === 'upcoming' &&
                  'border-[var(--fs-ink)]/10 bg-white/40 text-[var(--fs-ink)]/45'
              )}
            >
              {stage.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ProjectStateStepper;
