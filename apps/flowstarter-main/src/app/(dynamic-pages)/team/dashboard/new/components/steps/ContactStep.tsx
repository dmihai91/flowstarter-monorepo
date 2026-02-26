'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { cardClass, ProjectData } from '../../constants';

interface ContactStepProps {
  projectData: ProjectData;
  updateField: (field: keyof ProjectData, value: string) => void;
}

export function ContactStep({ projectData, updateField }: ContactStepProps) {
  return (
    <div className="space-y-8">
      <StepHeader icon={Globe} title="Contact Information" subtitle="Business contact details for the website" />

      <div className={`${cardClass} p-6 space-y-5`}>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Business Email
            </Label>
            <Input
              type="email"
              placeholder="contact@business.com"
              value={projectData.businessEmail}
              onChange={(e) => updateField('businessEmail', e.target.value)}
              className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              Business Phone
            </Label>
            <Input
              type="tel"
              placeholder="+1 234 567 8900"
              value={projectData.businessPhone}
              onChange={(e) => updateField('businessPhone', e.target.value)}
              className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Business Address
          </Label>
          <Input
            placeholder="123 Main St, City, Country"
            value={projectData.businessAddress}
            onChange={(e) => updateField('businessAddress', e.target.value)}
            className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            Website
          </Label>
          <Input
            type="url"
            placeholder="https://www.business.com"
            value={projectData.website}
            onChange={(e) => updateField('website', e.target.value)}
            className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        <p className="text-sm text-gray-400 dark:text-white/40 italic">
          All contact information is optional - you can add it later
        </p>
      </div>
    </div>
  );
}
