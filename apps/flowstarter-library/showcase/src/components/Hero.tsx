import React from 'react';
import { FlowBackground, Button } from '@flowstarter/flow-design-system';
import { Zap, Palette, Type, BarChart2, Target } from 'lucide-react';

interface HeroProps {
  templateCount: number;
}

interface HeroStat {
  label: string;
  icon: React.ReactElement;
}

type LucideProps = { size?: number; className?: string };
type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;
const ZapIcon    = Zap    as unknown as (p: LucideProps) => React.ReactElement;
const PaletteIcon = Palette as unknown as (p: LucideProps) => React.ReactElement;
const TypeIcon   = Type   as unknown as (p: LucideProps) => React.ReactElement;
const ChartIcon  = BarChart2 as unknown as (p: LucideProps) => React.ReactElement;
const TargetIcon = Target as unknown as (p: LucideProps) => React.ReactElement;

export function Hero({ templateCount }: HeroProps): React.ReactElement {
  const stats: HeroStat[] = [
    { label: `${templateCount} Templates`, icon: <ZapIcon size={14} /> },
    { label: '6 Palettes each',            icon: <PaletteIcon size={14} /> },
    { label: '4 Font Pairings',            icon: <TypeIcon size={14} /> },
    { label: 'Analytics Ready',            icon: <ChartIcon size={14} /> },
    { label: 'Leads Capture',              icon: <TargetIcon size={14} /> },
  ];

  return (
    <section className="relative overflow-hidden pt-16 pb-12">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/10">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Operator Template Library
            </span>
          </div>

          <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
            {templateCount} Templates.{' '}
            <span className="text-flow">Endless possibilities.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
            Production-ready Astro templates with 6 palettes and 4 font pairings each.
            Deploy client sites in minutes, not weeks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {stats.map(({ label, icon }: HeroStat) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <span className="text-purple-500 dark:text-purple-400">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
