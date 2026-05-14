import type { BriefData } from '../new-project.logic';
import { Field, inputClass } from './Field';

export function BriefStep({
  data,
  update,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-medium tracking-[-0.005em] text-[var(--ls-ink)]">
        Business brief
      </h2>

      <Field label="Business description *">
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What the business does, in 1 to 2 sentences."
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Industry">
          <input
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder="dental, fitness, restaurant…"
            className={inputClass}
          />
        </Field>
        <Field label="Target audience">
          <input
            value={data.targetAudience}
            onChange={(e) => update('targetAudience', e.target.value)}
            placeholder="Who their ideal clients are"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Unique value proposition">
        <textarea
          rows={2}
          value={data.uvp}
          onChange={(e) => update('uvp', e.target.value)}
          placeholder="What makes them stand out"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand tone">
          <select
            value={data.brandTone}
            onChange={(e) =>
              update('brandTone', e.target.value as BriefData['brandTone'])
            }
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="professional">Professional</option>
            <option value="bold">Bold</option>
            <option value="friendly">Friendly</option>
          </select>
        </Field>
        <Field label="Primary goal">
          <select
            value={data.goal}
            onChange={(e) =>
              update('goal', e.target.value as BriefData['goal'])
            }
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="leads">Leads</option>
            <option value="sales">Sales</option>
            <option value="bookings">Bookings</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
