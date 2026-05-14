import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import {
  MIN_DISCOVERY_NOTE_WORDS,
  discoveryNotesMeetMinimum,
} from '../new-project.logic';

export function DiscoveryStep({
  notes,
  setNotes,
  onExtract,
  loading,
  error,
  questions,
}: {
  notes: string;
  setNotes: (v: string) => void;
  onExtract: () => void;
  loading: boolean;
  error: string | null;
  questions: string[] | null;
}) {
  const { t } = useTranslations();
  const notesTrimmed = notes.trim();
  const enhanceBlocked = !discoveryNotesMeetMinimum(notesTrimmed);

  return (
    <div>
      <h2 className="text-[15px] font-medium tracking-[-0.005em] text-[var(--ls-ink)]">
        {t('admin.dashboard.newProject.discovery.title')}
      </h2>
      <p className="npw-body-muted mb-4 mt-1 text-[13px] leading-snug">
        {t('admin.dashboard.newProject.discovery.description', {
          minWords: MIN_DISCOVERY_NOTE_WORDS,
        })}
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={9}
        placeholder={t('admin.dashboard.newProject.discovery.notesPlaceholder')}
        className="npw-input w-full rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-4 py-3 text-sm text-[var(--ls-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--ls-accent)]/25"
      />

      {questions && questions.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-50/90 p-3.5 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-4 w-4" /> Need a bit more context
          </div>
          <ul className="ml-5 list-disc space-y-0.5 text-xs">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={
            loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
            )
          }
          onClick={onExtract}
          disabled={loading || enhanceBlocked}
          title={
            enhanceBlocked
              ? t('admin.dashboard.newProject.discovery.notesMinLengthHint', {
                  minWords: MIN_DISCOVERY_NOTE_WORDS,
                })
              : undefined
          }
          className={cn(
            'npw-ai-link hover:bg-[var(--purple)]/10',
            loading && 'npw-ai-link--busy',
            enhanceBlocked && !loading && '[&_svg]:opacity-[0.55]'
          )}
        >
          {loading
            ? t('admin.dashboard.newProject.discovery.enhancing')
            : t('admin.dashboard.newProject.discovery.enhanceWithAi')}
        </Button>
      </div>
    </div>
  );
}
