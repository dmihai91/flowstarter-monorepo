'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeamUpdateProject } from '@/hooks/useTeamProjects';
import type { Project } from './form-helpers';
import { fieldsDirty } from './form-helpers';

const STAGES = [
  { value: 'intake', label: 'Intake — discovery call booked / completed' },
  { value: 'brief', label: 'Brief — requirements captured, ready to build' },
  { value: 'build', label: 'Building — site under construction' },
  { value: 'internal_review', label: 'Internal review — team QA' },
  { value: 'client_review', label: 'Client review — client approving' },
  { value: 'launched', label: 'Launched — live on production' },
  { value: 'care', label: 'Care — ongoing maintenance / changes' },
] as const;

type ConciergeState = { concierge_stage: string };

export function ConciergeTab({ project }: { project: Project }) {
  const initial: ConciergeState = {
    concierge_stage: (project.concierge_stage as string) || 'intake',
  };
  const [state, setState] = useState<ConciergeState>(initial);
  const update = useTeamUpdateProject(project.id);

  useEffect(() => {
    setState({
      concierge_stage: (project.concierge_stage as string) || 'intake',
    });
  }, [project]);

  const dirty = fieldsDirty(initial, state);

  const onSave = async () => {
    try {
      await update.mutateAsync({ concierge_stage: state.concierge_stage });
      toast.success('Stage updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <ShellCard>
      <div className="space-y-5">
        <div>
          <Label>Delivery stage</Label>
          <p className="text-xs text-[var(--fs-ink-faint)] mb-2">
            Where this project is in the delivery workflow.
          </p>
          <Select
            value={state.concierge_stage}
            onValueChange={(v) => setState({ ...state, concierge_stage: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-4 text-xs text-[var(--fs-ink-dim)] leading-relaxed">
          <p>
            <strong>Intake → Brief:</strong> after discovery call, requirements
            captured.
          </p>
          <p>
            <strong>Brief → Build:</strong> team kicks off site generation.
          </p>
          <p>
            <strong>Build → Internal review:</strong> first draft ready.
          </p>
          <p>
            <strong>Internal review → Client review:</strong> sent to client for
            approval (also triggers payment-on-approval flow once enabled).
          </p>
          <p>
            <strong>Client review → Launched:</strong> client approves, site
            published to custom domain.
          </p>
          <p>
            <strong>Launched → Care:</strong> ongoing changes, monthly
            subscription active.
          </p>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[var(--fs-rule)]">
          <Button
            onClick={onSave}
            disabled={!dirty || update.isPending}
            size="sm"
          >
            <Save className="w-4 h-4" />
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </ShellCard>
  );
}
