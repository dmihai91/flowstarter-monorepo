'use client';

/**
 * "What we need from you" — the open asks, pulled out of the thread, with a
 * way to answer each one.
 *
 * A client should not have to scroll a conversation to find the four photos we
 * are waiting on. An ask is open when the message that carried it is an
 * `asset_request` still in `sent` (the messaging backend flips it to
 * `answered` once the ask is satisfied), so this derives rather than stores.
 *
 * Each ask carries its own uploader, because "send me a hero photo" and "send
 * me your logo" want different files and produce different `usable_for`
 * values. The ask's stable `code` (from `lib/flowstarter/sufficiency.ts`) is
 * what maps to a slot hint; an ask with no code still gets a plain uploader,
 * since a file we cannot label is far better than no file.
 *
 * After a successful upload the server hands back the recomputed sufficiency —
 * evaluated over rights-confirmed assets only — and it is shown verbatim
 * underneath. That is the honest answer to "am I done?": not "we received
 * something", but "here is what is still missing".
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AssetUploader, type SufficiencySummary } from './AssetUploader';
import {
  askLabel,
  type ProjectAsk,
  type ProjectMessage,
} from './ProjectThread';

export interface OpenAsk {
  key: string;
  label: string;
  messageId: string;
  requestedAt: string | null;
  /**
   * Slot hint for the uploader, derived from the ask's sufficiency code.
   * Null when the ask did not carry a code we recognise.
   */
  slot: string | null;
}

/**
 * Sufficiency codes → the `usable_for` slot an answering upload should claim.
 * Only codes an upload can actually satisfy appear here: `business_text_thin`
 * wants prose, not a photograph, so it maps to nothing and the uploader for
 * that ask simply offers no hint.
 */
const SLOT_BY_CODE: Record<string, string> = {
  hero_image_missing: 'hero',
  hero_image_low_resolution: 'hero',
  section_images_missing: 'section',
  logo_missing: 'logo',
};

function slotForAsk(ask: ProjectAsk): string | null {
  const code = typeof ask.code === 'string' ? ask.code : null;
  return (code && SLOT_BY_CODE[code]) ?? null;
}

/** Open asks, oldest request first. */
export function openAsksFrom(messages: ProjectMessage[]): OpenAsk[] {
  return messages
    .filter(
      (message) => message.kind === 'asset_request' && message.status === 'sent'
    )
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .flatMap((message) => {
      const asks: ProjectAsk[] = Array.isArray(message.asks)
        ? message.asks
        : [];
      // A request with no structured asks still asked for something — its body
      // is the ask. Dropping it would hide work the client owes us.
      if (asks.length === 0) {
        return message.body
          ? [
              {
                key: message.id,
                label: message.body,
                messageId: message.id,
                requestedAt: message.sent_at ?? message.created_at ?? null,
                slot: null,
              },
            ]
          : [];
      }
      return asks.map((ask, index) => ({
        key: `${message.id}-${ask.id ?? index}`,
        label: askLabel(ask),
        messageId: message.id,
        requestedAt: message.sent_at ?? message.created_at ?? null,
        slot: slotForAsk(ask),
      }));
    });
}

export function OpenAsks({
  messages,
  workspaceId,
  className,
}: {
  messages: ProjectMessage[];
  /**
   * Enables the upload controls. Omitted on surfaces that only display asks
   * (the operator console), so a read-only view stays read-only by
   * construction rather than by remembering to pass `readOnly`.
   */
  workspaceId?: string;
  className?: string;
}) {
  const asks = openAsksFrom(messages);
  const [sufficiency, setSufficiency] = useState<SufficiencySummary | null>(
    null
  );

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h2 className="text-base font-bold text-[var(--fs-ink)]">
        What we need from you
      </h2>
      {asks.length === 0 ? (
        <p
          className="text-sm text-[var(--fs-ink)]/65"
          data-testid="open-asks-empty"
        >
          Nothing right now. If we need anything we&apos;ll ask you here and
          email you.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Open requests">
          {asks.map((ask) => (
            <li
              key={ask.key}
              data-testid="open-ask"
              className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-sm text-[var(--fs-ink)]"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden className="mt-0.5 text-amber-600">
                  •
                </span>
                <span>{ask.label}</span>
              </div>
              {workspaceId ? (
                <AssetUploader
                  workspaceId={workspaceId}
                  askKey={ask.key}
                  slot={ask.slot}
                  label={ask.slot === 'logo' ? 'Add your logo' : 'Add photos'}
                  onSufficiency={setSufficiency}
                  className="pl-6"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {sufficiency ? (
        <div
          data-testid="open-asks-remaining"
          className="rounded-xl border border-[var(--fs-ink)]/10 bg-white/60 px-4 py-3 text-sm text-[var(--fs-ink)]"
        >
          {sufficiency.missing.length === 0 ? (
            <p>That&apos;s everything we need. We&apos;ll take it from here.</p>
          ) : (
            <>
              <p className="font-semibold">Still outstanding</p>
              <ul className="mt-1 flex flex-col gap-1 text-[var(--fs-ink)]/75">
                {sufficiency.missing.map((item, index) => (
                  <li key={item.code ?? index}>
                    {item.message ?? item.code ?? 'Something else'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default OpenAsks;
