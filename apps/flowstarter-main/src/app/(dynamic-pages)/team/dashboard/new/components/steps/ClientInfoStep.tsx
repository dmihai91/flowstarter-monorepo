'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { cardClass, ProjectData } from '../../constants';

interface ClientInfoStepProps {
  projectData: ProjectData;
  updateField: (field: keyof ProjectData, value: string) => void;
}

export function ClientInfoStep({ projectData, updateField }: ClientInfoStepProps) {
  return (
    <div className="space-y-8">
      <StepHeader icon={Users} title="Client Information" subtitle="Who is this website for?" />

      <div className={`${cardClass} p-6 space-y-5`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Name *</Label>
          <Input
            placeholder="John Smith"
            value={projectData.clientName}
            onChange={(e) => updateField('clientName', e.target.value)}
            className="h-12 bg-white/55 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Email *</Label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={projectData.clientEmail}
            onChange={(e) => updateField('clientEmail', e.target.value)}
            className="h-12 bg-white/55 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Phone</Label>
          <Input
            type="tel"
            placeholder="+49 123 456 7890"
            value={projectData.clientPhone}
            onChange={(e) => updateField('clientPhone', e.target.value)}
            className="h-12 bg-white/55 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>
      </div>
    </div>
  );
}
