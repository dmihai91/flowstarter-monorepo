/**
 * What the policy said, said out loud.
 *
 * When `resolveEditorPolicy` refuses, the control stays where it is and this
 * sits beside it holding the policy's own reason. Hiding the control instead
 * would leave a client guessing whether the feature exists, whether they broke
 * it, or whether they are paying for something they cannot see — and the three
 * refusals mean genuinely different things: a lapsed subscription is fixed by
 * billing, a structural change is fixed by asking us, and an operator being
 * sent to the workbench is not a problem at all.
 */
import type { PolicyDecision } from './editor-client';

const HEADLINE: Record<PolicyDecision['action'], string> = {
  inline_content_agent: 'You can edit this',
  client_media_upload: 'You can change this picture',
  operator_workbench: 'Open this in the operator workbench',
  maintenance_request: 'This one is on us',
  deny: 'Editing is paused',
};

export function PolicyNotice({
  decision,
  className,
}: {
  decision: PolicyDecision;
  className?: string;
}) {
  const blocking =
    decision.action !== 'inline_content_agent' &&
    decision.action !== 'client_media_upload';
  if (!blocking) return null;

  return (
    <div
      data-testid="editor-policy-notice"
      data-policy-action={decision.action}
      className={`rounded-xl border border-[var(--fs-ink)]/15 bg-[var(--fs-ink)]/[0.04] px-4 py-3 ${
        className ?? ''
      }`}
    >
      <p className="text-sm font-semibold text-[var(--fs-ink)]">
        {HEADLINE[decision.action]}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--fs-ink)]/70">
        {decision.reason}
      </p>
      {decision.action === 'maintenance_request' ? (
        <p className="mt-2 text-sm text-[var(--fs-ink)]/70">
          Send us a message on your project page and we will make the change.
        </p>
      ) : null}
    </div>
  );
}
