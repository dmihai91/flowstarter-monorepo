export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-28">
      <h1 className="text-3xl font-semibold text-[var(--fs-ink)]">
        Privacy Policy
      </h1>
      <p className="mt-4 text-base text-[var(--fs-ink-dim)]">
        {/* TODO: Replace this placeholder with final legal privacy text reviewed by counsel. */}
        This page is a temporary placeholder while our full legal privacy policy
        is being finalized.
      </p>
      <div className="mt-8 rounded-xl border border-[var(--fs-rule)] bg-white/60 p-6 dark:bg-white/[0.03]">
        <p className="text-sm text-[var(--fs-ink-dim)]">
          {/* TODO: Add final sections, data processing details, legal basis, retention periods, and user rights. */}
          For privacy questions in the meantime, contact{' '}
          <a className="underline" href="mailto:hello@flowstarter.net">
            hello@flowstarter.net
          </a>
          .
        </p>
      </div>
    </main>
  );
}
