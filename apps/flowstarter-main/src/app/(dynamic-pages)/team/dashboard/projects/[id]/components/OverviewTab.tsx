'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeamUpdateProject } from '@/hooks/useTeamProjects';
import type { Project } from './form-helpers';
import { fieldsDirty } from './form-helpers';

type OverviewState = {
  name: string;
  setup_fee: string;
  monthly_fee: string;
  is_founding: boolean;
};

function fromProject(p: Project): OverviewState {
  return {
    name: p.name ?? '',
    setup_fee: String(p.setup_fee ?? 0),
    monthly_fee: String(p.monthly_fee ?? 0),
    is_founding: Boolean(p.is_founding),
  };
}

export function OverviewTab({ project }: { project: Project }) {
  const initial = fromProject(project);
  const [state, setState] = useState<OverviewState>(initial);
  const update = useTeamUpdateProject(project.id);

  useEffect(() => {
    setState(fromProject(project));
  }, [project]);

  const dirty = fieldsDirty(
    initial as unknown as Record<string, unknown>,
    state as unknown as Record<string, unknown>
  );

  const onSave = async () => {
    if (!state.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await update.mutateAsync({
        name: state.name.trim(),
        setup_fee: Number(state.setup_fee) || 0,
        monthly_fee: Number(state.monthly_fee) || 0,
        is_founding: state.is_founding,
      });
      toast.success('Saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const setupPaid =
    project.deposit_status === 'paid' && project.final_status === 'paid';

  return (
    <ShellCard>
      <div className="space-y-5">
        <div>
          <Label htmlFor="proj-name">Project name</Label>
          <Input
            id="proj-name"
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="setup-fee">Setup fee (€)</Label>
            <Input
              id="setup-fee"
              type="number"
              min={0}
              value={state.setup_fee}
              onChange={(e) =>
                setState({ ...state, setup_fee: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="monthly-fee">Monthly fee (€/mo)</Label>
            <Input
              id="monthly-fee"
              type="number"
              min={0}
              value={state.monthly_fee}
              onChange={(e) =>
                setState({ ...state, monthly_fee: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={state.is_founding}
            onChange={(e) =>
              setState({ ...state, is_founding: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          <span className="text-[var(--fs-ink-dim)]">Founding pricing</span>
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--fs-rule)]">
          <p className="text-xs text-[var(--fs-ink-faint)]">
            Setup status:{' '}
            <span className="font-medium text-[var(--fs-ink-dim)]">
              {setupPaid ? 'Paid in full' : 'Outstanding'}
            </span>
            {project.client_email ? ` · ${project.client_email}` : ''}
          </p>
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
