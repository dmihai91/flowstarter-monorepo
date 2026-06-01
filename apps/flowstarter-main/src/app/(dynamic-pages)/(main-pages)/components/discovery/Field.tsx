/**
 * Form primitives for the public discovery wizard.
 * Styled with the landing modal tokens (--fs-ink, --purple-primary, --fs-rule)
 * to stay coherent with PreQualModal, not the admin (--ls-*) shell.
 */

export const fieldInputClass =
  'w-full rounded-lg border border-[var(--fs-rule)] bg-white dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink-faint)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-[box-shadow,border-color] duration-150 hover:border-[var(--purple-primary)]/30 focus:border-[var(--purple-primary)]/40 focus:shadow-[0_0_0_4px_var(--purple-primary-lightest)]';

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--fs-ink-faint)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--purple-primary)]">*</span>
        )}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[12px] leading-snug text-[var(--fs-ink-faint)]">
          {hint}
        </span>
      )}
    </label>
  );
}

export function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T | '';
  onChange: (v: T) => void;
  options: ReadonlyArray<{ v: T; label: string; sub?: string }>;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 4
      ? 'sm:grid-cols-4'
      : columns === 3
      ? 'sm:grid-cols-3'
      : 'sm:grid-cols-2';
  return (
    <div className={`grid grid-cols-1 gap-2 ${colClass}`}>
      {options.map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={[
              'rounded-lg border px-3 py-2.5 text-left transition-all',
              active
                ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/8 ring-1 ring-[var(--purple-primary)]'
                : 'border-[var(--fs-rule)] bg-transparent hover:border-[var(--purple-primary)]/40',
            ].join(' ')}
          >
            <div className="text-sm font-semibold text-[var(--fs-ink)]">
              {opt.label}
            </div>
            {opt.sub && (
              <div className="mt-0.5 text-[12px] leading-snug text-[var(--fs-ink-faint)]">
                {opt.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
