import { useEffect, useRef, useState } from 'react';
import {
  type DiscoveryData,
  type DemoSite,
  type GeneratedSiteCopy,
  type ToneId,
  DEMO_STATE_KEY,
  MAX_DEMO_EDITS,
  buildDemoSite,
  previewCtaLabel,
} from '../discovery.logic';
import { DemoSiteFrame } from './DemoSiteFrame';

/**
 * Playable demo. We generate a real multi-section site from the wizard
 * answers (server LLM via /api/discovery/preview) and let the prospect edit
 * it in plain English — capped at MAX_DEMO_EDITS, enforced server-side. The
 * generated site + edit count are mirrored to sessionStorage so a refresh
 * keeps the work (and doesn't burn an LLM call or an edit). Cleared on
 * submit by the wizard.
 */

interface DemoState {
  demoId: string | null;
  site: DemoSite;
  editsUsed: number;
}

/** Deterministic fallback when the AI editor is unavailable — still rich. */
function fallbackSite(data: DiscoveryData): DemoSite {
  const firstSentence =
    data.description.trim().split(/[.!?]/)[0]?.trim() ||
    'Work worth showing off, online at last';
  const copy: GeneratedSiteCopy = {
    hero: {
      headline: firstSentence.slice(0, 60),
      subhead: data.targetAudience.trim()
        ? `Made for ${data.targetAudience.trim()}.`
        : data.description.trim().slice(0, 140),
      primaryCta: previewCtaLabel(data.goal),
    },
    services: {
      sectionTitle: 'What we do',
      items: [
        { title: 'Tailored to you', description: 'Built around your offer.' },
        {
          title: 'Yours to edit',
          description: 'Change anything in plain words.',
        },
        { title: 'Live fast', description: 'Online in weeks, not months.' },
      ],
    },
    about: {
      sectionTitle: 'About',
      paragraph:
        data.description.trim() ||
        'A short, honest description of the business goes here.',
    },
    finalCta: {
      headline: 'Ready when you are',
      subhead: 'Let’s build something you’ll be proud of.',
      button: previewCtaLabel(data.goal),
    },
  };
  return buildDemoSite(
    {
      businessName: data.businessName,
      fullName: data.fullName,
      industry: data.industry,
      targetAudience: data.targetAudience,
      brandTone: (data.brandTone || '') as ToneId | '',
    },
    copy
  );
}

export function PreviewStep({
  data,
  t,
}: {
  data: DiscoveryData;
  t: (key: string) => string;
}) {
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const requested = useRef(false);

  // Restore an edited demo from sessionStorage; otherwise generate one.
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    let cancelled = false;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(DEMO_STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as DemoState;
          if (saved?.site) {
            setDemo(saved);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }
    }

    (async () => {
      try {
        const res = await fetch('/api/discovery/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: data.businessName,
            fullName: data.fullName,
            description: data.description,
            industry: data.industry,
            targetAudience: data.targetAudience,
            goal: data.goal,
            brandTone: data.brandTone,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          site?: DemoSite;
          demoId?: string | null;
          skip?: boolean;
        };
        if (cancelled) return;
        if (res.ok && json.site) {
          setDemo({
            demoId: json.demoId ?? null,
            site: json.site,
            editsUsed: 0,
          });
        } else {
          setDemo({ demoId: null, site: fallbackSite(data), editsUsed: 0 });
          setNotice(t('landing.discovery.preview.editorUnavailable'));
        }
      } catch {
        if (!cancelled) {
          setDemo({ demoId: null, site: fallbackSite(data), editsUsed: 0 });
          setNotice(t('landing.discovery.preview.editorUnavailable'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist demo state so a refresh keeps edits + count.
  useEffect(() => {
    if (!demo || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demo));
    } catch {
      /* best-effort */
    }
  }, [demo]);

  const editsLeft = demo ? MAX_DEMO_EDITS - demo.editsUsed : MAX_DEMO_EDITS;
  const canEdit = !!demo?.demoId && editsLeft > 0 && !editing;

  async function runEdit() {
    if (!demo || !prompt.trim() || !canEdit) return;
    const instruction = prompt.trim();
    setEditing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/discovery/preview/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoId: demo.demoId,
          instruction,
          site: demo.site,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        site?: DemoSite;
        editsUsed?: number;
        limitReached?: boolean;
        error?: string;
      };
      if (json.limitReached) {
        setDemo((d) => (d ? { ...d, editsUsed: MAX_DEMO_EDITS } : d));
        setNotice(t('landing.discovery.preview.limitReached'));
      } else if (json.site) {
        setDemo((d) =>
          d
            ? {
                ...d,
                site: json.site as DemoSite,
                editsUsed:
                  typeof json.editsUsed === 'number'
                    ? json.editsUsed
                    : d.editsUsed + (json.error ? 0 : 1),
              }
            : d
        );
        if (json.error) {
          setNotice(t('landing.discovery.preview.editFailed'));
        } else {
          setPrompt('');
        }
      } else {
        setNotice(t('landing.discovery.preview.editFailed'));
      }
    } catch {
      setNotice(t('landing.discovery.preview.editFailed'));
    } finally {
      setEditing(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.preview.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {loading
            ? t('landing.discovery.preview.generating')
            : t('landing.discovery.steps.preview.subtitle')}
        </p>
      </header>

      {loading || !demo ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
        </div>
      ) : (
        <DemoSiteFrame site={demo.site} />
      )}

      {/* Playable editor */}
      {demo?.demoId && (
        <div className="rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-[var(--fs-ink)]">
              {t('landing.discovery.preview.editorTitle')}
            </p>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                editsLeft <= 3
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-[var(--purple-primary)]/12 text-[var(--purple-primary)]',
              ].join(' ')}
            >
              {editsLeft}/{MAX_DEMO_EDITS}{' '}
              {t('landing.discovery.preview.editsLeft')}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runEdit();
              }}
              disabled={!canEdit}
              placeholder={t('landing.discovery.preview.editorPlaceholder')}
              className="w-full rounded-lg border border-[var(--fs-rule)] bg-white px-3 py-2 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/30 disabled:opacity-50 dark:bg-white/[0.03]"
            />
            <button
              type="button"
              onClick={runEdit}
              disabled={!canEdit || !prompt.trim()}
              className="shrink-0 rounded-lg bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editing
                ? t('landing.discovery.preview.applying')
                : t('landing.discovery.preview.apply')}
            </button>
          </div>
          {notice && (
            <p className="mt-2 text-[12px] text-[var(--fs-ink-faint)]">
              {notice}
            </p>
          )}
          {editsLeft <= 0 && !notice && (
            <p className="mt-2 text-[12px] text-[var(--fs-ink-faint)]">
              {t('landing.discovery.preview.limitReached')}
            </p>
          )}
        </div>
      )}

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.preview.disclaimer')}
      </p>
    </div>
  );
}
