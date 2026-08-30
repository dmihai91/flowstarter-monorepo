import { useAuth, useClerk } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  claimIntakeChatPayload,
  describeWithIntakeAnswers,
} from '../intake-chat.shared';
import { usePreviewProgress } from '../usePreviewProgress';
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

/**
 * Render a friendly fake hostname for the iframe chrome bar
 * (e.g. "acmebakery.preview"). Makes the demo feel like a real site
 * the visitor owns, hides the raw daytonaproxy01.net host.
 */
function previewHostLabel(businessName: string | undefined): string {
  const slug = (businessName || 'yoursite')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return `${slug || 'yoursite'}.preview`;
}

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

/**
 * Shared by both the JSON-fallback and the live-preview POST: the info-agent
 * step's answers ride in on `description`, the only free-prose field the
 * generator takes. Without this the conversation would only reach the
 * generator after a claim, and the preview shown right now would ignore
 * what the visitor just told us.
 */
function previewPayload(data: DiscoveryData) {
  return {
    businessName: data.businessName,
    fullName: data.fullName,
    description: describeWithIntakeAnswers(data),
    industry: data.industry,
    targetAudience: data.targetAudience,
    goal: data.goal,
    brandTone: data.brandTone,
    // Collected two steps earlier and previously dropped here, which left
    // every generated site with placeholder social links.
    instagramUrl: data.instagramUrl,
    linkedinUrl: data.linkedinUrl,
  };
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
  const [iframeNonce, setIframeNonce] = useState(0);
  const [personalizing, setPersonalizing] = useState(false);

  // Real-time build progress over SSE (falls back to polling only if the
  // stream errors or is unavailable — see usePreviewProgress).
  const progress = usePreviewProgress(liveDemoId);
  const livePhase = progress.phase;

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

  // Shared by the mount effect below (on a failed/skip POST) and by the
  // progress-driven effect further down (on a failed build): whichever path
  // a preview takes, this is the one place that decides what "no live
  // preview" falls back to.
  const loadJsonFallback = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(DEMO_STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as DemoState;
          if (saved?.site) {
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
        body: JSON.stringify(previewPayload(data)),
      });
      const json = (await res.json().catch(() => ({}))) as {
        site?: DemoSite;
        demoId?: string | null;
        skip?: boolean;
      };
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
      setDemo({ demoId: null, site: fallbackSite(data), editsUsed: 0 });
      setNotice(t('landing.discovery.preview.editorUnavailable'));
    } finally {
      setMode('json');
    }
  }, [data, t]);

  useEffect(() => {
    let cancelled = false;

    async function runLive() {
      try {
        const res = await fetch('/api/discovery/preview/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(previewPayload(data)),
        });
        const json = (await res.json().catch(() => ({}))) as {
          demoId?: string;
          skip?: boolean;
        };
        if (cancelled) return;
        if (json.skip || !json.demoId) {
          void loadJsonFallback();
          return;
        }
        setLiveDemoId(json.demoId);
      } catch {
        if (!cancelled) void loadJsonFallback();
      }
    }

    // Defer the kickoff one macrotask so React Strict Mode's
    // mount → unmount → remount cancels the throwaway first run *before*
    // it POSTs. Exactly one live job is ever created (dev and prod alike);
    // the surviving mount is the one whose demoId feeds usePreviewProgress,
    // which takes it from there over SSE.
    const startTimer = setTimeout(() => {
      if (!cancelled) runLive();
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drives the live-preview state machine off the SSE-backed progress hook
  // instead of a manual poll loop: show the base template the moment the
  // build reports ready, hand over once personalization lands, or fall back
  // to the JSON demo if the build fails. shownBaseRef/resolvedRef make each
  // transition fire exactly once, same as the old loop's early `return`s.
  const shownBaseRef = useRef(false);
  const resolvedRef = useRef(false);
  useEffect(() => {
    if (!liveDemoId) return;

    // First time it's ready: show the base template live immediately.
    if (
      progress.status === 'ready' &&
      progress.previewUrl &&
      !shownBaseRef.current
    ) {
      shownBaseRef.current = true;
      setLiveUrl(progress.previewUrl);
      setMode('live');
      setPersonalizing(!progress.personalized);
      setChat([
        {
          role: 'agent',
          text: progress.personalized
            ? `Your site is live. Tell me what to change — ${LIVE_EDIT_CAP} prompts to make it yours.`
            : 'Here’s your starting point — personalizing it for your business now…',
        },
      ]);
    }

    // Personalization hot-swapped in: refresh the iframe, hand over.
    if (
      shownBaseRef.current &&
      progress.personalized &&
      !resolvedRef.current
    ) {
      resolvedRef.current = true;
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

    if (progress.status === 'failed' && !resolvedRef.current) {
      resolvedRef.current = true;
      void loadJsonFallback();
      return;
    }

    if (
      shownBaseRef.current &&
      progress.phase &&
      /personalization unavailable/i.test(progress.phase) &&
      !resolvedRef.current
    ) {
      // Fail-soft: base template stays as a real, relevant demo.
      resolvedRef.current = true;
      setPersonalizing(false);
    }
  }, [progress, liveDemoId, loadJsonFallback]);

  useEffect(() => {
    if (!demo || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demo));
    } catch {
      /* best-effort */
    }
  }, [demo]);

  // ---- Claim: the preview becomes a workspace this visitor owns ----
  //
  // Until this runs the preview is entirely ephemeral (a demo id, a sandbox,
  // nothing persisted), and the deposit flow can never see it. Claiming
  // creates the workspace, saves the generated manifest as its build
  // artifacts, and makes the signed-in visitor a member of it, which is
  // exactly what /unlock/[workspaceId] and the deposit Checkout check for.
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  // Set when a signed-out visitor asks to claim; the effect below finishes the
  // job once Clerk's modal reports them signed in, so the preview they were
  // looking at is still on screen and still theirs.
  const [claimPending, setClaimPending] = useState(false);

  const previewId = liveDemoId ?? demo?.demoId ?? null;

  const submitClaim = useCallback(async () => {
    if (!previewId) return;
    setClaimBusy(true);
    setClaimError(null);
    try {
      const res = await fetch('/api/flowstarter/projects/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewId,
          // The tier is a name, not a price: the server maps it to the
          // published setup fee so the browser cannot quote itself.
          ...(data.selectedTier ? { tier: data.selectedTier } : {}),
          businessName: data.businessName,
          fullName: data.fullName,
          email: data.email,
          description: data.description,
          industry: data.industry,
          targetAudience: data.targetAudience,
          goal: data.goal,
          brandTone: data.brandTone,
          // Scope answers, so the server can re-run the standard-vs-custom
          // routing classifier on the answers themselves. The wizard's own
          // copy of the verdict is deliberately not sent.
          ...(data.pageCount ? { pageCount: data.pageCount } : {}),
          ...(data.timeline ? { timeline: data.timeline } : {}),
          ...(data.commerceMode ? { commerceMode: data.commerceMode } : {}),
          catalogSize: data.catalogSize,
          customIntegrations: data.customIntegrations,
          // The intake conversation: the highest-value evidence we hold. The
          // server files it as corpus documents against the new workspace so
          // the generator may cite the client's own words.
          ...(claimIntakeChatPayload(data)
            ? { intakeChat: claimIntakeChatPayload(data) }
            : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        unlockUrl?: string;
        error?: string;
      };
      if (!res.ok || !json.unlockUrl) {
        setClaimError(json.error ?? 'We could not save your site. Try again.');
        return;
      }
      window.location.assign(json.unlockUrl);
    } catch {
      setClaimError('We could not save your site. Try again.');
    } finally {
      setClaimBusy(false);
    }
  }, [previewId, data]);

  function claimSite() {
    // Clerk not settled yet: acting now would POST without a session and take
    // a 401 for it. The button is disabled in that window anyway.
    if (claimBusy || !previewId || !authLoaded) return;
    if (!isSignedIn) {
      setClaimPending(true);
      // Modal rather than a page redirect: a full navigation would tear down
      // the wizard and lose the preview this visitor just spent minutes
      // editing. The fallback is pinned to this page for the same reason —
      // the provider's default sends people to /admin/dashboard.
      openSignIn({ fallbackRedirectUrl: window.location.href });
      return;
    }
    void submitClaim();
  }

  useEffect(() => {
    if (!claimPending || !authLoaded || !isSignedIn) return;
    setClaimPending(false);
    void submitClaim();
  }, [claimPending, authLoaded, isSignedIn, submitClaim]);

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

  // One CTA, shared by the live preview and the JSON fallback: whichever demo
  // the visitor ended up with, this is the step that makes it theirs.
  const claimCta = previewId ? (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/[0.06] p-4 text-center">
      <p className="text-sm font-semibold text-[var(--fs-ink)]">
        Love it? Let&rsquo;s make it real &mdash; yours, on your domain.
      </p>
      <p className="text-[12px] text-[var(--fs-ink-faint)]">
        Claiming saves this exact preview to your own project, then takes you to
        reserve your build.
      </p>
      <button
        type="button"
        onClick={claimSite}
        disabled={claimBusy || !authLoaded}
        className="mt-1 rounded-lg bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {claimBusy
          ? 'Saving your site…'
          : authLoaded && !isSignedIn
          ? 'Sign in and claim my site'
          : 'Claim my site'}
      </button>
      {claimError && (
        <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
          {claimError}
        </p>
      )}
    </div>
  ) : null;

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
          {progress.phases.length > 0 ? (
            // Real progress, appended live as each phase starts (streamed
            // over SSE, falling back to a poll only if the stream drops) —
            // a running log rather than a lone spinner, since the build
            // takes minutes and the visitor should see it actually moving.
            <div className="max-h-56 space-y-2 overflow-y-auto" role="log">
              {progress.phases.map((entry, i) => {
                const isCurrent = i === progress.phases.length - 1;
                return (
                  <div
                    key={entry.index}
                    className={[
                      'flex items-center gap-3 text-sm',
                      isCurrent
                        ? 'text-[var(--fs-ink)]'
                        : 'text-[var(--fs-ink-faint)]',
                    ].join(' ')}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isCurrent ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
                      ) : (
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
                      )}
                    </span>
                    <span className="flex-1">
                      {entry.phase}
                      {isCurrent && '…'}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--fs-ink-faint)]">
                      {entry.at}s
                    </span>
                  </div>
                );
              })}
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
              <span className="ml-3 truncate rounded bg-black/5 px-2 py-0.5 text-[11px] text-[var(--fs-ink-faint)] dark:bg-white/10">
                {previewHostLabel(data.businessName)}
              </span>
              {personalizing ? (
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--purple-primary)]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
                  Personalizing for {data.businessName || 'your business'}…
                </span>
              ) : (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[var(--purple-primary)] hover:bg-[var(--purple-primary)]/10 transition-colors"
                >
                  Open in new tab
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
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
          {claimCta}
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

      {mode === 'json' && claimCta}

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.preview.disclaimer')}
      </p>
    </div>
  );
}
