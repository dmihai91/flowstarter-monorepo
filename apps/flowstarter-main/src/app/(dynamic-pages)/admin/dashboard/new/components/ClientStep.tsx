import type { BriefData } from '../new-project.logic';
import { Field, inputClass } from './Field';

export function ClientStep({
  data,
  update,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-medium tracking-[-0.005em] text-[var(--ls-ink)]">
        Client details
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *">
          <input
            value={data.clientName}
            onChange={(e) => update('clientName', e.target.value)}
            placeholder="Maria Ionescu"
            className={inputClass}
          />
        </Field>
        <Field label="Business name">
          <input
            value={data.clientBusinessName}
            onChange={(e) => update('clientBusinessName', e.target.value)}
            placeholder="Smile Dental Clinic"
            className={inputClass}
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            value={data.clientEmail}
            onChange={(e) => update('clientEmail', e.target.value)}
            placeholder="maria@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={data.clientPhone}
            onChange={(e) => update('clientPhone', e.target.value)}
            placeholder="+40 7XX XXX XXX"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}
