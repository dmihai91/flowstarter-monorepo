export const inputClass =
  'npw-input w-full rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-3 py-2 text-sm text-[var(--ls-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--ls-accent)]/25';

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="ls-admin-label mb-2 block">{label}</span>
      {children}
    </label>
  );
}
