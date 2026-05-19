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
 * (/api/discovery/preview/live) builds a real personalized site in a Daytona
 * sandbox; we embed its live URL and give the visitor a T3-Code-style
 * conversational editor — up to 15 plain-English prompts, applied by the
 * agent in the same sandbox (HMR updates the preview). Fail-open: if the
 * live pipeline is unavailable / budget-blocked / errors, fall back to the
 * deterministic JSON demo so the funnel never dead-ends.
 */

const LIVE_EDIT_CAP = 15;

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
interface ChatTurn {
  role: 'you' | 'agent';
  text: string;
}

export function PreviewStep({
  data,
  t,
}: {
  data: DiscoveryData;
  t: (key: string) => string;
}) {
  const [mode, setMode] = useState<Mode>('loading');
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [liveDemoId, setLiveDemoId] = useState<string | null>(null);
  const [livePhase, setLivePhase] = useState<string | null>(null);
  const [iframeNonce, setIframeNonce] = useState(0);
  const [personalizing, setPersonalizing] = useState(false);

  // Conversational editor (live mode).
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editsLeft, setEditsLeft] = useState(LIVE_EDIT_CAP);

  // JSON-fallback demo + its inline editor.
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    if (mode !== 'loading' || livePhase) return;
    const id = setInterval(
      () => setBuildStep((s) => Math.min(s + 1, BUILD_STEPS.length - 1)),
      2600
    );
    return () => clearInterval(id);
  }, [mode, livePhase]);

  useEffect(() => {
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
        setLiveDemoId(demoId);
      } catch {
        return loadJsonFallback();
      }

      const started = Date.now();
      let shownBase = false;
      while (!cancelled && Date.now() - started < 18 * 60_000) {
        await new Promise((r) => setTimeout(r, 3500));
        if (cancelled) return;
        let s: {
          status?: string;
          phase?: string;
          previewUrl?: string;
          personalized?: boolean;
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

        // First time it's ready: show the base template live immediately.
        if (s.status === 'ready' && s.previewUrl && !shownBase) {
          if (cancelled) return;
          shownBase = true;
          setLiveUrl(s.previewUrl);
          setMode('live');
          setPersonalizing(!s.personalized);
          setChat([
            {
              role: 'agent',
              text: s.personalized
                ? `Your site is live. Tell me what to change — ${LIVE_EDIT_CAP} prompts to make it yours.`
                : 'Here’s your starting point — personalizing it for your business now…',
            },
          ]);
        }
        // Personalization hot-swapped in: refresh the iframe, hand over.
        if (shownBase && s.personalized) {
          if (cancelled) return;
          setPersonalizing(false);
          setIframeNonce((n) => n + 1);
          setChat([
            {
              role: 'agent',
              text: `Your personalized site is live. Tell me what to change — you have ${LIVE_EDIT_CAP} prompts to make it yours.`,
            },
          ]);
          return;
        }
        if (s.status === 'failed') return loadJsonFallback();
        if (
          shownBase &&
          s.phase &&
          /personalization unavailable/i.test(s.phase)
        ) {
          // Fail-soft: base template stays as a real, relevant demo.
          setPersonalizing(false);
          return;
        }
      }
      if (!cancelled && !shownBase) return loadJsonFallback();
    }

    // Defer the kickoff one macrotask so React Strict Mode's
    // mount → unmount → remount cancels the throwaway first run *before*
    // it POSTs. Exactly one live job is ever created (dev and prod alike);
    // the surviving mount is the one that polls to completion.
    const startTimer = setTimeout(() => {
      if (!cancelled) runLive();
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!demo || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demo));
    } catch {
      /* best-effort */
    }
  }, [demo]);

  // ---- Live conversational editor ----
  async function sendEdit() {
    const instruction = editPrompt.trim();
    if (!instruction || !liveDemoId || editBusy || editsLeft <= 0) return;
    setEditPrompt('');
    setEditBusy(true);
    setChat((c) => [
      ...c,
      { role: 'you', text: instruction },
      { role: 'agent', text: 'Working on it…' },
    ]);
    const setLastAgent = (text: string) =>
      setChat((c) => {
        const next = [...c];
        for (let i = next.length - 1; i >= 0; i--) {
          const turn = next[i];
          if (turn && turn.role === 'agent') {
            next[i] = { role: 'agent', text };
            break;
          }
        }
        return next;
      });

    try {
      const res = await fetch('/api/discovery/preview/live/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId: liveDemoId, instruction }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        accepted?: boolean;
        limitReached?: boolean;
        editsLeft?: number;
        error?: string;
      };
      if (json.limitReached) {
        setEditsLeft(0);
        setLastAgent("That was your last prompt — let's make this real.");
        setEditBusy(false);
        return;
      }
      if (!json.accepted) {
        setLastAgent(
          json.error ?? "I couldn't start that edit. Try rephrasing."
        );
        setEditBusy(false);
        return;
      }

      // Poll edit status.
      const started = Date.now();
      while (Date.now() - started < 12 * 60_000) {
        await new Promise((r) => setTimeout(r, 3500));
        let s: {
          editStatus?: string;
          editPhase?: string;
          editError?: string;
          editsLeft?: number;
        } = {};
        try {
          const r = await fetch(
            `/api/discovery/preview/live/edit?demoId=${encodeURIComponent(
              liveDemoId
            )}`
          );
          s = (await r.json().catch(() => ({}))) as typeof s;
        } catch {
          continue;
        }
        if (s.editPhase) setLastAgent(s.editPhase);
        if (s.editStatus === 'done') {
          if (typeof s.editsLeft === 'number') setEditsLeft(s.editsLeft);
          setLastAgent('Done — updating your live preview.');
          setIframeNonce((n) => n + 1);
          break;
        }
        if (s.editStatus === 'failed') {
          setLastAgent(
            s.editError
              ? `That didn't work: ${s.editError}`
              : "That didn't work."
          );
          break;
        }
      }
    } catch {
      setLastAgent('Something went wrong applying that. Try again.');
    } finally {
      setEditBusy(false);
    }
  }

  // ---- JSON-fallback inline editor ----
  const jsonEditsLeft = demo ? MAX_DEMO_EDITS - demo.editsUsed : MAX_DEMO_EDITS;
  const canEdit = !!demo?.demoId && jsonEditsLeft > 0 && !editing;

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
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40">
            <div className="flex items-center gap-1.5 border-b border-[var(--fs-rule)] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-3 truncate text-[11px] text-[var(--fs-ink-faint)]">
                {data.businessName || 'your site'} — live preview
              </span>
              {personalizing && (
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--purple-primary)]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
                  Personalizing for {data.businessName || 'your business'}…
                </span>
              )}
            </div>
            <iframe
              key={iframeNonce}
              src={
                iframeNonce > 0
                  ? `${liveUrl}${
                      liveUrl.includes('?') ? '&' : '?'
                    }r=${iframeNonce}`
                  : liveUrl
              }
              title="Live site preview"
              className="h-[52vh] w-full bg-white"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>

          {/* T3-Code-style conversational editor */}
          <div className="rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40">
            <div className="flex items-center justify-between border-b border-[var(--fs-rule)] px-3 py-2">
              <p className="text-[12px] font-semibold text-[var(--fs-ink)]">
                Smart editor — ask for any change
              </p>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  editsLeft <= 3
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-[var(--purple-primary)]/12 text-[var(--purple-primary)]',
                ].join(' ')}
              >
                {editsLeft}/{LIVE_EDIT_CAP} prompts left
              </span>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto px-3 py-3">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === 'you' ? 'flex justify-end' : 'flex justify-start'
                  }
                >
                  <span
                    className={[
                      'max-w-[85%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug',
                      m.role === 'you'
                        ? 'bg-[var(--purple-primary)] text-white'
                        : 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink)] border border-[var(--fs-rule)]',
                    ].join(' ')}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t border-[var(--fs-rule)] p-3">
              <input
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendEdit();
                }}
                disabled={editBusy || editsLeft <= 0}
                placeholder={
                  editsLeft <= 0
                    ? 'No prompts left — ready to make it real?'
                    : 'e.g. make the hero warmer and add a pricing section'
                }
                className="w-full rounded-lg border border-[var(--fs-rule)] bg-white px-3 py-2 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/30 disabled:opacity-50 dark:bg-white/[0.03]"
              />
              <button
                type="button"
                onClick={sendEdit}
                disabled={editBusy || editsLeft <= 0 || !editPrompt.trim()}
                className="shrink-0 rounded-lg bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {editBusy ? 'Editing…' : 'Send'}
              </button>
            </div>
          </div>

          {/* Pay CTA */}
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/[0.06] p-4 text-center">
            <p className="text-sm font-semibold text-[var(--fs-ink)]">
              Love it? Let’s make it real — yours, on your domain.
            </p>
            <p className="text-[12px] text-[var(--fs-ink-faint)]">
              Continue to reserve your build.{' '}
              {editsLeft < LIVE_EDIT_CAP
                ? 'Your changes are saved to this preview.'
                : ''}
            </p>
          </div>
        </div>
      )}

      {mode === 'json' && demo && <DemoSiteFrame site={demo.site} />}

      {mode === 'json' && demo?.demoId && (
        <div className="rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-[var(--fs-ink)]">
              {t('landing.discovery.preview.editorTitle')}
            </p>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                jsonEditsLeft <= 3
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-[var(--purple-primary)]/12 text-[var(--purple-primary)]',
              ].join(' ')}
            >
              {jsonEditsLeft}/{MAX_DEMO_EDITS}{' '}
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
