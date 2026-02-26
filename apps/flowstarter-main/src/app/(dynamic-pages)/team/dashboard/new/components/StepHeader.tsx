'use client';

import { LucideIcon } from 'lucide-react';

interface StepHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function StepHeader({ icon: Icon, title, subtitle }: StepHeaderProps) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[var(--purple)]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-white/50">{subtitle}</p>
    </div>
  );
}
