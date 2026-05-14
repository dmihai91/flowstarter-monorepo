export function LandingMinimalFooter() {
  return (
    <footer className="ls-scope border-t border-[var(--ls-rule)]">
      <div className="ls-container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.17em] text-[var(--ls-ink-faint)]">
              Flowstarter
            </p>
            <p className="mt-2 max-w-xl text-sm text-[var(--ls-ink-dim)]">
              Premium websites for service businesses. Hand-crafted, every site.
            </p>
          </div>
          <nav
            aria-label="Footer links"
            className="flex flex-wrap gap-4 text-sm"
          >
            <a href="#pricing" className="ls-link">
              Pricing
            </a>
            <a href="#add-ons" className="ls-link">
              Add-ons
            </a>
            <a href="#faq" className="ls-link">
              FAQ
            </a>
            <a href="/privacy" className="ls-link">
              Privacy
            </a>
            <a href="/terms" className="ls-link">
              Terms
            </a>
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--ls-ink-faint)]">
          © {new Date().getFullYear()} Flowstarter. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
