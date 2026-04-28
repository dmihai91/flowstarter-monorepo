export function EditorShowcase() {
  return (
    <section
      id="editor-showcase"
      className="ls-scope ls-section ls-section--pad ls-fade-top"
    >
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--tl" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">04</span>
            <span>Smart Editor</span>
          </div>
          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">Update your site yourself.</span>
            <span className="line flourish mt-2">Without learning code.</span>
          </h2>
          <p className="ls-body ls-body--lead mt-7 mx-auto">
            Request changes in plain language. We review each update before it
            goes live.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="ls-card p-5 md:p-6">
            {/* TODO: Replace with real Smart Editor chat animation capture. */}
            <p className="text-xs uppercase tracking-[0.13em] text-[var(--ls-ink-faint)]">
              Request panel
            </p>
            <div className="mt-4 rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-surface-2)] p-4">
              <p className="text-xs text-[var(--ls-ink-faint)]">You</p>
              <p className="mt-2 rounded-lg bg-[var(--ls-surface-1)] p-3 text-sm text-[var(--ls-ink)]">
                Change hero text to: Premium websites for service businesses.
                Live in 5 days.
              </p>
              <p className="mt-4 text-xs text-[var(--ls-ink-faint)]">
                Smart Editor
              </p>
              <p className="mt-2 rounded-lg border border-[var(--ls-rule)] p-3 text-sm text-[var(--ls-ink-dim)]">
                Draft prepared and sent for team review.
              </p>
            </div>
          </div>

          <div className="ls-card p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.13em] text-[var(--ls-ink-faint)]">
              Live preview
            </p>
            <div className="mt-4 rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-surface-2)] p-4">
              <div className="mb-3 h-2 w-24 rounded-full bg-[var(--ls-rule)]" />
              <div className="mb-2 h-8 rounded-lg bg-[var(--ls-surface-3)]" />
              <div className="mb-4 h-8 w-4/5 rounded-lg bg-[var(--ls-surface-3)]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-24 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-surface-1)]" />
                <div className="h-24 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-surface-1)]" />
              </div>
            </div>
            <span className="mt-4 inline-flex rounded-full border border-[var(--ls-rule-strong)] px-3 py-1 text-xs text-[var(--ls-ink-dim)]">
              Reviewed by Flowstarter team
            </span>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          <article className="ls-card p-5">
            <h3 className="text-sm font-semibold text-[var(--ls-ink)]">
              Plain language requests
            </h3>
            <p className="mt-2 text-sm text-[var(--ls-ink-dim)]">
              Ask for changes with normal words, not technical commands.
            </p>
          </article>
          <article className="ls-card p-5">
            <h3 className="text-sm font-semibold text-[var(--ls-ink)]">
              Always reviewed
            </h3>
            <p className="mt-2 text-sm text-[var(--ls-ink-dim)]">
              Our team checks updates before they go live.
            </p>
          </article>
          <article className="ls-card p-5">
            <h3 className="text-sm font-semibold text-[var(--ls-ink)]">
              Unlimited changes
            </h3>
            <p className="mt-2 text-sm text-[var(--ls-ink-dim)]">
              Keep improving your website as your business evolves.
            </p>
          </article>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--ls-ink-dim)]">
          Included with every site. No additional cost.
        </p>
      </div>
    </section>
  );
}
