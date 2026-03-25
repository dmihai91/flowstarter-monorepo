'use client';

import { TypewriterText } from '@/components/ui/typewriter';
import { RefreshCw, Rocket, ChevronRight, X } from 'lucide-react';
import type { ProjectBriefDraft } from './useScaffoldForm';

interface FieldRow {
  label: string;
  value: string | string[];
  missing?: boolean;
}

function getRows(brief: ProjectBriefDraft): FieldRow[] {
  return [
    { label: 'Project name',   value: brief.projectName,      missing: !brief.projectName },
    { label: 'Industry',       value: brief.industry,         missing: !brief.industry },
    { label: 'Audience',       value: brief.targetAudience,   missing: !brief.targetAudience },
    { label: 'Value prop',     value: brief.valueProposition, missing: !brief.valueProposition },
    { label: 'Goals',          value: brief.goals,            missing: brief.goals.length === 0 },
    { label: 'Brand tone',     value: brief.brandTone,        missing: !brief.brandTone },
    { label: 'Contact email',  value: brief.contactEmail,     missing: !brief.contactEmail },
  ];
}

interface ScaffoldQuickReviewProps {
  brief:        ProjectBriefDraft;
  onUpdateBrief: <K extends keyof ProjectBriefDraft>(key: K, value: ProjectBriefDraft[K]) => void;
  onLaunch:     () => void;
  onRegenerate: () => void;
  onReset:      () => void;
}

export function ScaffoldQuickReview({
  brief,
  onUpdateBrief,
  onLaunch,
  onRegenerate,
  onReset,
}: ScaffoldQuickReviewProps) {
  const rows = getRows(brief);
  const missingCount = rows.filter(r => r.missing).length;

  return (
    <div className="rounded-[28px] border border-gray-200/80 bg-white/95 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI brief ready</h3>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
            {missingCount === 0
              ? 'Everything inferred — ready to launch'
              : `${missingCount} field${missingCount > 1 ? 's' : ''} couldn't be inferred — fill in or skip`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
            title="Re-run AI"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fields grid */}
      <div className="space-y-1.5 mb-4">
        {rows.map(({ label, value, missing }) => {
          const displayValue = Array.isArray(value) ? value.join(', ') : value;
          return (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                missing
                  ? 'bg-amber-50 dark:bg-amber-500/[0.07] border border-amber-200 dark:border-amber-500/20'
                  : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]'
              }`}
            >
              <span className={`w-24 shrink-0 font-medium ${missing ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-white/40'}`}>
                {label}
              </span>
              {missing ? (
                <input
                  type="text"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder:text-amber-400/60 dark:placeholder:text-amber-500/40 text-xs"
                  onBlur={(e) => {
                    if (!e.target.value.trim()) return;
                    const keyMap: Record<string, keyof ProjectBriefDraft> = {
                      'Project name':  'projectName',
                      'Industry':      'industry',
                      'Audience':      'targetAudience',
                      'Value prop':    'valueProposition',
                      'Brand tone':    'brandTone',
                      'Contact email': 'contactEmail',
                    };
                    const k = keyMap[label];
                    if (k) onUpdateBrief(k, e.target.value as never);
                  }}
                />
              ) : (
                <TypewriterText
                  value={displayValue}
                  className="flex-1 text-gray-800 dark:text-white/80 truncate"
                />
              )}
              {!missing && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
        >
          Start over
        </button>
        <button
          onClick={onLaunch}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-xs font-semibold hover:bg-[var(--purple)]/90 transition-all"
        >
          <Rocket className="w-3.5 h-3.5" />
          Launch in editor
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>
    </div>
  );
}
