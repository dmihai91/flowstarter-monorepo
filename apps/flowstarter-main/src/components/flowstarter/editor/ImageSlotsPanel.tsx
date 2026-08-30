'use client';

/**
 * The pictures the site renders, and the client's own files that may replace
 * one.
 *
 * A file the client uploaded but has not confirmed rights over is shown, and
 * shown as unusable, with the reason. Filtering it out silently would leave
 * someone staring at an empty picker wondering where the photograph they just
 * sent went — and would hide the one action that fixes it.
 */
import { useCallback, useEffect, useState } from 'react';
import { PolicyNotice } from './PolicyNotice';
import {
  EditorRequestError,
  requestEditor,
  type EditorAsset,
  type ImageSlot,
  type PolicyDecision,
} from './editor-client';

export function ImageSlotsPanel({
  base,
  policy,
  onChanged,
}: {
  base: string;
  policy: PolicyDecision;
  onChanged: () => Promise<void> | void;
}) {
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const allowed = policy.action === 'client_media_upload';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestEditor<{
        slots: ImageSlot[];
        assets: EditorAsset[];
      }>(`${base}/images`);
      setSlots(data.slots);
      setAssets(data.assets);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'Your pictures could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void load();
  }, [allowed, load]);

  async function swap(slotId: string, assetId: string) {
    setBusySlot(slotId);
    setError(null);
    try {
      await requestEditor(`${base}/images`, {
        method: 'POST',
        body: JSON.stringify({ slotId, assetId }),
      });
      await load();
      await onChanged();
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'That picture could not be placed.'
      );
    } finally {
      setBusySlot(null);
    }
  }

  const usable = assets.filter((asset) => asset.usable);
  const unusable = assets.filter((asset) => !asset.usable);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/70 px-4 py-4">
      <PolicyNotice decision={policy} />
      {!allowed ? null : loading ? (
        <p className="text-sm text-[var(--fs-ink)]/60">Loading your pictures…</p>
      ) : (
        <>
          {slots.length === 0 ? (
            <p className="text-sm text-[var(--fs-ink)]/60">
              This site does not have any swappable pictures yet.
            </p>
          ) : null}

          {slots.map((slot) => (
            <div
              key={slot.id}
              data-testid="image-slot"
              className="flex flex-col gap-2 rounded-xl border border-[var(--fs-ink)]/10 px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--fs-ink)]/45">
                {slot.section} · {slot.key}
              </p>
              <p className="truncate text-xs text-[var(--fs-ink)]/55">
                {slot.currentPath}
              </p>
              {usable.length === 0 ? (
                <p className="text-sm text-[var(--fs-ink)]/60">
                  None of your files are cleared for use yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {usable.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      data-testid="image-asset-choice"
                      disabled={busySlot !== null}
                      onClick={() => swap(slot.id, asset.id)}
                      className="h-16 w-20 overflow-hidden rounded-lg border border-[var(--fs-ink)]/15 bg-[var(--fs-ink)]/5 disabled:opacity-50"
                      title="Put this picture here"
                    >
                      {asset.url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL from a private bucket
                        <img
                          src={asset.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px]">{asset.kind ?? 'file'}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {unusable.length > 0 ? (
            <p
              data-testid="image-unusable-note"
              className="rounded-xl bg-[var(--fs-ink)]/[0.04] px-3 py-2 text-sm text-[var(--fs-ink)]/70"
            >
              {unusable.length}{' '}
              {unusable.length === 1 ? 'file is' : 'files are'} waiting on you
              confirming you own {unusable.length === 1 ? 'it' : 'them'}. Until
              then {unusable.length === 1 ? 'it cannot' : 'they cannot'} go on
              your site.
            </p>
          ) : null}

          {error ? (
            <p
              data-testid="images-error"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
