import { useEffect, useState } from "react";
import { ArrowRightIcon, SparklesIcon, LayoutGridIcon } from "lucide-react";

import { SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { useTheme } from "../hooks/useTheme";
import {
  loadLibraryTemplates,
  CATEGORY_LABELS,
  type LibraryTemplate,
} from "../lib/libraryTemplates";

/**
 * EmptyState — admin landing screen shown when no project is bound to
 * the current workspace. Two paths:
 *   1. "Start from scratch" — bootstraps a blank Astro shell + chat.
 *   2. "Pick a template" — expands the library gallery (mocked from
 *      `loadLibraryTemplates()` today; will hit the editor server's
 *      `/api/library/templates` route that proxies the MCP server's
 *      `list_templates` tool in Phase 2).
 *
 * Voice + layout match `NoActiveThreadState` (editorial concierge —
 * mono eyebrow, sans display headline with `fs-flourish` indigo
 * flourish, lead body) so the editor still feels like one product.
 */
export function EmptyState() {
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none bg-background text-foreground">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
        <header className="border-b border-border px-3 py-2 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-7 shrink-0" aria-label="Toggle thread sidebar" />
            <span className="fs-chat-header-kicker">No project yet</span>
          </div>
        </header>

        <div className="fs-empty-state-scroll min-h-0 flex-1 overflow-y-auto px-6 py-12 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-[1080px]">
            <EmptyStateMasthead />
            <ChoiceRow />
            <TemplateGallery />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

function EmptyStateMasthead() {
  return (
    <section className="mb-12 max-w-3xl text-balance">
      <p
        aria-hidden
        className="fs-empty-state-eyebrow"
      >
        New workspace
      </p>
      <h1
        className="fs-empty-state-headline mt-4 text-balance"
        style={{
          fontFamily: "var(--fs-font-sans)",
          fontWeight: 400,
          letterSpacing: "-0.025em",
          lineHeight: 1.04,
          color: "var(--fs-ink)",
          fontSize: "clamp(2.1rem, 4.1vw, 3.1rem)",
        }}
      >
        Start with a blank canvas <span className="fs-flourish">or a template.</span>
      </h1>
      <p
        className="mt-6 text-balance"
        style={{
          fontFamily: "var(--fs-font-sans)",
          fontSize: "clamp(1rem, 1.1vw, 1.1rem)",
          lineHeight: 1.6,
          color: "var(--fs-ink-dim)",
          maxWidth: "56ch",
        }}
      >
        Spin up a fresh Astro workspace and brief the agent, or pick a
        battle-tested template from the Flowstarter library and ship in
        an afternoon.
      </p>
    </section>
  );
}

function ChoiceRow() {
  const handleStartFromScratch = () => {
    // Phase 2 hook — until the editor server's `/api/site/scaffold-blank`
    // route lands, dispatch an event the agent can pick up via chat.
    window.dispatchEvent(
      new CustomEvent("flowstarter:scaffold-blank", { detail: { source: "empty-state" } }),
    );
  };

  return (
    <section className="mb-12 grid gap-4 md:grid-cols-2 md:gap-5">
      <ChoiceCard
        eyebrow="Path A"
        title="Start from scratch"
        body="Empty Astro workspace, your design vision, the agent at your side. Best when you have a clear direction already."
        icon={<SparklesIcon className="size-4" strokeWidth={1.75} />}
        ctaLabel="New blank workspace"
        onClick={handleStartFromScratch}
      />
      <ChoiceCard
        eyebrow="Path B"
        title="Pick a template"
        body="Production-grade starters from the Flowstarter library — booking, content, multi-page, dark mode all wired."
        icon={<LayoutGridIcon className="size-4" strokeWidth={1.75} />}
        ctaLabel="Browse the library"
        accent
        onClick={() => {
          // Scrolls to the gallery on the same page.
          document
            .getElementById("fs-empty-state-gallery")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </section>
  );
}

interface ChoiceCardProps {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  ctaLabel: string;
  onClick: () => void;
  accent?: boolean;
}

function ChoiceCard({
  eyebrow,
  title,
  body,
  icon,
  ctaLabel,
  onClick,
  accent = false,
}: ChoiceCardProps) {
  return (
    <article
      className="fs-empty-state-card group/card relative flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5"
      data-accent={accent || undefined}
    >
      <header className="flex items-center justify-between">
        <span className="fs-empty-state-eyebrow">{eyebrow}</span>
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-full"
          style={{
            background: "var(--fs-accent-bg)",
            color: "var(--fs-accent-hot)",
          }}
        >
          {icon}
        </span>
      </header>
      <div>
        <h2
          className="text-xl font-medium leading-tight tracking-tight"
          style={{ color: "var(--fs-ink)" }}
        >
          {title}
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--fs-ink-dim)", maxWidth: "44ch" }}
        >
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="fs-empty-state-cta mt-auto inline-flex items-center gap-1.5 self-start text-sm font-medium transition-colors"
      >
        {ctaLabel}
        <ArrowRightIcon className="size-3.5 transition-transform group-hover/card:translate-x-0.5" strokeWidth={1.75} />
      </button>
    </article>
  );
}

function TemplateGallery() {
  const { resolvedTheme } = useTheme();
  const [templates, setTemplates] = useState<ReadonlyArray<LibraryTemplate> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLibraryTemplates()
      .then((next) => {
        if (cancelled) return;
        setTemplates(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load templates.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="fs-empty-state-gallery" className="scroll-mt-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p aria-hidden className="fs-empty-state-eyebrow">
            Template library
          </p>
          <h2
            className="mt-1 text-2xl font-medium tracking-tight"
            style={{ color: "var(--fs-ink)" }}
          >
            Curated starters
          </h2>
        </div>
        <p
          className="max-w-md text-sm"
          style={{ color: "var(--fs-ink-faint)" }}
        >
          Powered by the Flowstarter Library MCP. Pick one to scaffold a
          new workspace; the agent will personalize it once you're in.
        </p>
      </header>

      {error ? (
        <div
          className="rounded-xl border p-6 text-sm"
          style={{
            borderColor: "var(--fs-rule)",
            background: "var(--fs-bg-paper)",
            color: "var(--fs-ink-dim)",
          }}
        >
          {error}
        </div>
      ) : templates === null ? (
        <TemplateGallerySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.slug}
              template={template}
              resolvedTheme={resolvedTheme}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TemplateGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-2xl border bg-(--fs-bg-paper) p-3"
          style={{ borderColor: "var(--fs-rule)" }}
        >
          <div
            className="mb-3 aspect-[16/10] w-full animate-pulse rounded-lg"
            style={{ background: "var(--fs-rule)" }}
          />
          <div
            className="mb-2 h-4 w-2/3 animate-pulse rounded"
            style={{ background: "var(--fs-rule)" }}
          />
          <div
            className="h-3 w-full animate-pulse rounded"
            style={{ background: "var(--fs-rule)" }}
          />
        </div>
      ))}
    </div>
  );
}

interface TemplateCardProps {
  template: LibraryTemplate;
  resolvedTheme: "light" | "dark" | undefined;
}

function TemplateCard({ template, resolvedTheme }: TemplateCardProps) {
  const isDark = resolvedTheme === "dark";
  const thumbnailSrc = isDark
    ? template.thumbnailPaths.dark
    : template.thumbnailPaths.light;

  const handleUseTemplate = () => {
    window.dispatchEvent(
      new CustomEvent("flowstarter:scaffold-template", {
        detail: { slug: template.slug, name: template.name },
      }),
    );
  };

  return (
    <article className="fs-template-card group/template relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5">
      <div className="fs-template-card-thumb relative aspect-[16/10] w-full overflow-hidden">
        {/* Image with placeholder background — if the asset 404s the
            radial fallback stays visible. */}
        <img
          src={thumbnailSrc}
          alt={`${template.name} preview`}
          className="size-full object-cover transition-transform duration-300 group-hover/template:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <header className="flex items-start justify-between gap-3">
          <h3
            className="text-base font-semibold leading-tight tracking-tight"
            style={{ color: "var(--fs-ink)" }}
          >
            {template.name}
          </h3>
          <span className="fs-template-category">
            {CATEGORY_LABELS[template.category]}
          </span>
        </header>
        <p
          className="line-clamp-3 text-sm leading-relaxed"
          style={{ color: "var(--fs-ink-dim)" }}
        >
          {template.description}
        </p>
        <button
          type="button"
          onClick={handleUseTemplate}
          className="fs-template-cta mt-auto inline-flex items-center justify-between gap-2 self-stretch rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          Use this template
          <ArrowRightIcon
            className="size-3.5 transition-transform group-hover/template:translate-x-0.5"
            strokeWidth={1.75}
          />
        </button>
      </div>
    </article>
  );
}
