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
 * Step 7. Primary path: the in-sandbox autonomous Agent-SDK pipeline
 * (/api/discovery/preview/live) builds a real, personalized site in a
 * Daytona sandbox and we embed its live URL. Real streamed progress phases
 * are shown while it builds. Fail-open: if the live pipeline is
 * unavailable / budget-blocked / errors, we fall back to the deterministic
 * JSON demo so the funnel never dead-ends.
 */

interface DemoState {
  demoId: string | null;
  site: DemoSite;
  editsUsed: number;
}

const BUILD_STEPS = [
  'landing.discovery.preview.build.s1',
  'landing.discovery.preview.build.s2',
  'landing.discovery.preview.build.s3',
  'landing.discovery.preview.build.s4',
] as const;

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

type Mode = 'loading' | 'live' | 'json';

export function PreviewStep({
  data,
  t,
}: {
  data: DiscoveryData;
  t: (key: string) => string;
}) {
  const [mode, setMode] = useState<Mode>('loading');
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [livePhase, setLivePhase] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const requested = useRef(false);

  // Fallback checklist animation (only while no real phase is streaming).
  useEffect(() => {
    if (mode !== 'loading' || livePhase) return;
    const id = setInterval(
      () => setBuildStep((s) => Math.min(s + 1, BUILD_STEPS.length - 1)),
      2600
    );
    return () => clearInterval(id);
  }, [mode, livePhase]);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    let cancelled = false;

    const payload = {
      businessName: data.businessName,
      fullName: data.fullName,
      description: data.description,
      industry: data.industry,
      targetAudience: data.targetAudience,
      goal: data.goal,
      brandTone: data.brandTone,
    };

    async function loadJsonFallback() {
      // Restore an edited JSON demo if present.
      if (typeof window !== 'undefined') {
        try {
          const raw = window.sessionStorage.getItem(DEMO_STATE_KEY);
          if (raw) {
            const saved = JSON.parse(raw) as DemoState;
            if (saved?.site) {
              if (cancelled) return;
              setDemo(saved);
              setMode('json');
              return;
            }
          }
        } catch {
          /* ignore */
        }
      }
      try {
        const res = await fetch('/api/discovery/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
        if (!cancelled) setMode('json');
      }
    }

    async function runLive() {
      let demoId: string | null = null;
      try {
        const res = await fetch('/api/discovery/preview/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as {
          demoId?: string;
          skip?: boolean;
        };
        if (cancelled) return;
        if (json.skip || !json.demoId) return loadJsonFallback();
        demoId = json.demoId;
      } catch {
        return loadJsonFallback();
      }

      // Poll for streamed progress + the live URL.
      const started = Date.now();
      while (!cancelled && Date.now() - started < 18 * 60_000) {
        await new Promise((r) => setTimeout(r, 3500));
        if (cancelled) return;
        let s: {
          status?: string;
          phase?: string;
          previewUrl?: string;
          error?: string;
        } = {};
        try {
          const r = await fetch(
            `/api/discovery/preview/live?demoId=${encodeURIComponent(demoId)}`
          );
          s = (await r.json().catch(() => ({}))) as typeof s;
        } catch {
          continue;
        }
        if (s.phase) setLivePhase(s.phase);
        if (s.status === 'ready' && s.previewUrl) {
          if (cancelled) return;
          setLiveUrl(s.previewUrl);
          setMode('live');
          return;
        }
        if (s.status === 'failed') return loadJsonFallback();
      }
      if (!cancelled) return loadJsonFallback();
    }

    runLive();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist JSON demo state (fallback path only).
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
        if (json.error) setNotice(t('landing.discovery.preview.editFailed'));
        else setPrompt('');
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
          {mode === 'loading'
            ? t('landing.discovery.preview.generating')
            : t('landing.discovery.steps.preview.subtitle')}
        </p>
      </header>

      {mode === 'loading' && (
        <div className="flex h-64 flex-col justify-center gap-3 rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 px-6">
          {livePhase ? (
            <div className="flex items-center gap-3 text-sm text-[var(--fs-ink)]">
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
              <span>{livePhase}</span>
            </div>
          ) : (
            BUILD_STEPS.map((key, i) => {
              const done = i < buildStep;
              const active = i === buildStep;
              return (
                <div
                  key={key}
                  className={[
                    'flex items-center gap-3 text-sm transition-opacity',
                    done || active
                      ? 'text-[var(--fs-ink)]'
                      : 'text-[var(--fs-ink-faint)] opacity-50',
                  ].join(' ')}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {done ? (
                      <svg
                        className="h-4 w-4 text-[var(--purple-primary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : active ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--fs-ink-faint)]" />
                    )}
                  </span>
                  <span>
                    {t(key)}
                    {active && '…'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {mode === 'live' && liveUrl && (
        <div className="overflow-hidden rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40">
          <div className="flex items-center gap-1.5 border-b border-[var(--fs-rule)] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 truncate text-[11px] text-[var(--fs-ink-faint)]">
              {data.businessName || 'your site'} — live preview
            </span>
          </div>
          <iframe
            src={liveUrl}
            title="Live site preview"
            className="h-[58vh] w-full bg-white"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        </div>
      )}

      {mode === 'json' && demo && <DemoSiteFrame site={demo.site} />}

      {/* Plain-English editor — JSON-demo path (live edit loop is staged next). */}
      {mode === 'json' && demo?.demoId && (
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
        </div>
      )}

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.preview.disclaimer')}
      </p>
    </div>
  );
}
