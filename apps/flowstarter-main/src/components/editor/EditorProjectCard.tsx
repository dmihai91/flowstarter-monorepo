import { formatDate } from '@/lib/format-utils';
'use client';

import { Card, StatusDot } from '@flowstarter/flow-design-system';
import Link from 'next/link';

export interface EditorProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'stopped' | 'creating' | 'error';
  previewUrl?: string;
  createdAt: string;
}

const statusColorMap = {
  active: 'success',
  stopped: 'neutral',
  creating: 'warning',
  error: 'error',
} as const;

export function EditorProjectCard({ project }: { project: EditorProject }) {
  return (
    <Link href={`/editor/${project.id}`}>
      <Card
        variant="outline"
        hoverable
        className="h-full bg-[var(--flow-bg-secondary)] border-[var(--flow-border-default)] hover:border-[var(--flow-border-strong)] transition-colors"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-medium text-[var(--flow-text-primary)] truncate pr-2">
              {project.name}
            </h3>
            <StatusDot
              color={statusColorMap[project.status]}
              label={project.status}
              size="sm"
            />
          </div>
          {project.description && (
            <p className="text-sm text-[var(--flow-text-tertiary)] line-clamp-2 mb-4">
              {project.description}
            </p>
          )}
          <p className="text-xs text-[var(--flow-text-muted)]">
            {formatDate(project.createdAt)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
