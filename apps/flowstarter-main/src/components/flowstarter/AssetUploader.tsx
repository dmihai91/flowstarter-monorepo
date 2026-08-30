'use client';

/**
 * The other half of an ask: a way to answer it.
 *
 * Sits under one open request and does two separate things, in this order,
 * because they are two separate statements:
 *
 *  1. Send the files. `POST /api/client/assets/[workspaceId]` verifies the
 *     bytes and stores them. Nothing is usable yet.
 *  2. Confirm the rights. `POST /api/client/assets/[workspaceId]/rights`
 *     records who said what, about which files, when, and from where.
 *
 * Collapsing those into one step — a tick-box beside the file picker, or worse,
 * implied consent on upload — would make the record worthless: it would prove
 * the client clicked "upload", not that they read a sentence about ownership
 * and applied it to specific pictures. So the checkbox appears *after* the
 * thumbnails, next to the images it is about, and the files stay marked "not
 * usable yet" until it is ticked.
 *
 * Progress is real (XHR upload events), not a spinner pretending: a client on
 * a phone sending four photographs over a slow connection deserves to know
 * whether anything is happening.
 */
import { useCallback, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CURRENT_RIGHTS_STATEMENT_VERSION,
  rightsStatementText,
} from './rights-statement';

/** One asset as the client API reports it. */
export interface ClientAssetView {
  id: string;
  kind: string | null;
  mime: string | null;
  width: number | null;
  height: number | null;
  usable: boolean;
  url: string | null;
}

export interface SufficiencySummary {
  ready: boolean;
  missing: Array<{ code?: string; message?: string; severity?: string }>;
}

export interface AssetUploaderProps {
  workspaceId: string;
  /** The ask this uploader answers; recorded on the project event. */
  askKey?: string;
  /** Slot hint (`hero`, `logo`, `section`) so `usable_for` can be set. */
  slot?: string | null;
  /** Human label for the control, e.g. "Add photos". */
  label?: string;
  /** Fired with the server's recomputed readiness after any successful write. */
  onSufficiency?: (sufficiency: SufficiencySummary | null) => void;
  className?: string;
}

type Phase = 'idle' | 'uploading' | 'uploaded' | 'confirming' | 'confirmed';

interface UploadResponse {
  uploaded?: Array<{ id: string }>;
  assets?: ClientAssetView[];
  sufficiency?: SufficiencySummary | null;
  error?: string;
}

/**
 * `fetch` cannot report upload progress, so this uses XHR. Resolves with the
 * parsed body and the status; never rejects for an HTTP error, only for a
 * transport failure.
 */
function postWithProgress(
  url: string,
  body: FormData,
  onProgress: (percent: number) => void
): Promise<{ status: number; payload: UploadResponse }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      let payload: UploadResponse = {};
      try {
        payload = JSON.parse(request.responseText) as UploadResponse;
      } catch {
        /* A body we cannot parse is a body we ignore; status still decides. */
      }
      resolve({ status: request.status, payload });
    });
    request.addEventListener('error', () => reject(new Error('Upload failed')));
    request.addEventListener('abort', () =>
      reject(new Error('Upload cancelled'))
    );
    request.send(body);
  });
}

export function AssetUploader({
  workspaceId,
  askKey,
  slot = null,
  label = 'Add photos',
  onSufficiency,
  className,
}: AssetUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<ClientAssetView[]>([]);
  const [agreed, setAgreed] = useState(false);

  const endpoint = `/api/client/assets/${workspaceId}`;
  const statement = rightsStatementText();

  const send = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return;
      setPhase('uploading');
      setPercent(0);
      setError(null);

      const form = new FormData();
      for (let index = 0; index < files.length; index += 1) {
        const file = files.item(index);
        if (file) form.append('files', file);
      }
      if (slot) form.append('slot', slot);
      if (askKey) form.append('askKey', askKey);

      try {
        const { status, payload } = await postWithProgress(
          endpoint,
          form,
          setPercent
        );
        if (status < 200 || status >= 300) {
          setError(payload.error ?? 'That upload did not go through.');
          setPhase('idle');
          return;
        }
        const ids = new Set((payload.uploaded ?? []).map((item) => item.id));
        const justSent = (payload.assets ?? []).filter((asset) =>
          ids.has(asset.id)
        );
        setUploaded(justSent);
        setPhase(
          justSent.every((asset) => asset.usable) ? 'confirmed' : 'uploaded'
        );
        onSufficiency?.(payload.sufficiency ?? null);
      } catch {
        setError('That upload did not go through. Please try again.');
        setPhase('idle');
      } finally {
        // Let the same file be chosen again after a failure.
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [askKey, endpoint, onSufficiency, slot]
  );

  const confirmRights = useCallback(async () => {
    const pending = uploaded.filter((asset) => !asset.usable);
    if (!agreed || pending.length === 0) return;
    setPhase('confirming');
    setError(null);
    try {
      const response = await fetch(`${endpoint}/rights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: pending.map((asset) => asset.id),
          statementVersion: CURRENT_RIGHTS_STATEMENT_VERSION,
        }),
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as UploadResponse & {
        confirmedAssetIds?: string[];
      };
      if (!response.ok) {
        setError(payload.error ?? 'We could not record that confirmation.');
        setPhase('uploaded');
        return;
      }
      const confirmed = new Set(payload.confirmedAssetIds ?? []);
      setUploaded((current) =>
        current.map((asset) =>
          confirmed.has(asset.id) ? { ...asset, usable: true } : asset
        )
      );
      setPhase('confirmed');
      onSufficiency?.(payload.sufficiency ?? null);
    } catch {
      setError('We could not record that confirmation. Please try again.');
      setPhase('uploaded');
    }
  }, [agreed, endpoint, onSufficiency, uploaded]);

  const busy = phase === 'uploading' || phase === 'confirming';
  const needsRights = uploaded.some((asset) => !asset.usable);

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      data-testid="asset-uploader"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className={cn(
            'inline-flex cursor-pointer items-center rounded-full border border-[var(--fs-ink)]/20 bg-white px-4 py-2 text-xs font-semibold text-[var(--fs-ink)] transition-opacity hover:opacity-80',
            busy && 'pointer-events-none opacity-60'
          )}
        >
          {phase === 'uploading' ? 'Sending…' : label}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp"
          disabled={busy}
          onChange={(event) => {
            const files = event.target.files;
            if (files) void send(files);
          }}
        />
        <span className="text-xs text-[var(--fs-ink)]/55">
          JPEG, PNG, GIF or WebP · up to 8MB each
        </span>
      </div>

      {phase === 'uploading' ? (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--fs-ink)]/10"
        >
          <div
            className="h-full rounded-full bg-[var(--fs-ink)] transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          data-testid="asset-uploader-error"
          className="text-xs font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}

      {uploaded.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Files you sent">
          {uploaded.map((asset) => (
            <li key={asset.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived URL on a private bucket cannot be optimised by next/image */}
              <img
                src={asset.url ?? ''}
                alt="Uploaded file"
                data-testid="asset-thumbnail"
                data-usable={asset.usable ? 'true' : 'false'}
                className={cn(
                  'h-16 w-16 rounded-lg border border-[var(--fs-ink)]/15 object-cover',
                  !asset.usable && 'opacity-60'
                )}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {needsRights ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--fs-ink)]/15 bg-white/70 px-3 py-3">
          <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--fs-ink)]">
            <input
              type="checkbox"
              checked={agreed}
              disabled={busy}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-[var(--fs-ink)]/30"
              data-testid="rights-checkbox"
            />
            <span>{statement}</span>
          </label>
          <button
            type="button"
            disabled={!agreed || busy}
            onClick={() => void confirmRights()}
            data-testid="confirm-rights"
            className="w-fit rounded-full bg-[var(--fs-ink)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {phase === 'confirming' ? 'Saving…' : 'Confirm and use these'}
          </button>
          <p className="text-[11px] text-[var(--fs-ink)]/55">
            We won&apos;t put anything on your site until you confirm this.
          </p>
        </div>
      ) : null}

      {phase === 'confirmed' && uploaded.length > 0 ? (
        <p
          data-testid="asset-uploader-done"
          className="text-xs font-medium text-emerald-700"
        >
          Thanks — {uploaded.length === 1 ? 'that file is' : 'those files are'}{' '}
          with us and cleared for use.
        </p>
      ) : null}
    </div>
  );
}

export default AssetUploader;
