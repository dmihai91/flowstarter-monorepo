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
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--fs-ink-dim)]">
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
                'flex-1 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors',
                // The live step carries the product's primary gradient, so the
                // stepper points at the same colour the primary buttons use.
                status === 'current' &&
                  'border-transparent bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-md shadow-[var(--purple-primary-lightest)]',
                status === 'done' &&
                  'border-[var(--purple-primary)]/25 bg-[var(--purple-primary)]/10 text-[var(--fs-ink-dim)]',
                status === 'upcoming' &&
                  'border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 text-[var(--fs-ink-faint)]'
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
