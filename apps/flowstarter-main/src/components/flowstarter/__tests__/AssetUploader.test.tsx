/**
 * The upload control, and the gate in front of it.
 *
 * The interesting behaviour is not "a file picker exists". It is that sending
 * a file and claiming the rights to it are two separate acts: the thumbnails
 * come back marked unusable, the confirm button stays disabled until the
 * client ticks a box next to a sentence they can read, and only the assets
 * that are still unconfirmed are named in the request that follows.
 *
 * The other half is the operator case: `OpenAsks` without a `workspaceId`
 * renders no uploader at all, so a read-only surface cannot accidentally
 * offer a write.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetUploader } from '../AssetUploader';
import { OpenAsks } from '../OpenAsks';
import { CURRENT_RIGHTS_STATEMENT_VERSION } from '../rights-statement';
import type { ProjectMessage } from '../ProjectThread';

const WORKSPACE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const ASSET_ONE = '11111111-1111-4111-8111-111111111111';

/**
 * A stand-in for XMLHttpRequest. The component uses XHR rather than `fetch`
 * because only XHR reports upload progress, so the double has to carry an
 * `upload` event target too.
 */
class FakeXhr {
  static status = 201;
  static body = '{}';
  static sent: FormData | null = null;

  private handlers: Record<string, () => void> = {};
  private progress: ((event: ProgressEvent) => void) | null = null;

  status = 0;
  responseText = '';

  upload = {
    addEventListener: (
      _type: string,
      callback: (event: ProgressEvent) => void
    ) => {
      this.progress = callback;
    },
  };

  open() {}

  addEventListener(type: string, callback: () => void) {
    this.handlers[type] = callback;
  }

  send(body: FormData) {
    FakeXhr.sent = body;
    this.progress?.({
      lengthComputable: true,
      loaded: 10,
      total: 10,
    } as ProgressEvent);
    this.status = FakeXhr.status;
    this.responseText = FakeXhr.body;
    this.handlers['load']?.();
  }
}

const originalXhr = global.XMLHttpRequest;
const originalFetch = global.fetch;

function uploadResponse(usable: boolean) {
  return JSON.stringify({
    uploaded: [{ id: ASSET_ONE, deduplicated: false }],
    assets: [
      {
        id: ASSET_ONE,
        kind: null,
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable,
        url: 'https://storage.test/signed.png',
      },
    ],
    sufficiency: {
      ready: false,
      missing: [{ code: 'logo_missing', message: 'Send your logo' }],
    },
  });
}

async function pickAFile() {
  const input = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  await userEvent.upload(
    input,
    new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' })
  );
}

beforeEach(() => {
  FakeXhr.status = 201;
  FakeXhr.body = uploadResponse(false);
  FakeXhr.sent = null;
  global.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  global.fetch = vi.fn();
});

afterEach(() => {
  global.XMLHttpRequest = originalXhr;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('AssetUploader', () => {
  it('shows what was sent, and marks it unusable until rights are confirmed', async () => {
    render(<AssetUploader workspaceId={WORKSPACE} slot="hero" />);
    await pickAFile();

    const thumbnail = await screen.findByTestId('asset-thumbnail');
    expect(thumbnail).toHaveAttribute('data-usable', 'false');
    // The statement is shown before anything is agreed to, not after.
    expect(
      screen.getByText(/I own these files, or I have permission/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('confirm-rights')).toBeDisabled();
  });

  it('sends the slot hint the ask was about', async () => {
    render(
      <AssetUploader workspaceId={WORKSPACE} slot="hero" askKey="ask-1" />
    );
    await pickAFile();

    await waitFor(() => expect(FakeXhr.sent).not.toBeNull());
    expect(FakeXhr.sent?.get('slot')).toBe('hero');
    expect(FakeXhr.sent?.get('askKey')).toBe('ask-1');
  });

  it('confirms rights over exactly the assets that still need them', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        confirmedAssetIds: [ASSET_ONE],
        sufficiency: { ready: true, missing: [] },
      }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSufficiency = vi.fn();
    render(
      <AssetUploader workspaceId={WORKSPACE} onSufficiency={onSufficiency} />
    );
    await pickAFile();
    await screen.findByTestId('asset-thumbnail');

    await userEvent.click(screen.getByTestId('rights-checkbox'));
    await userEvent.click(screen.getByTestId('confirm-rights'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string }
    ];
    expect(url).toBe(`/api/client/assets/${WORKSPACE}/rights`);
    expect(JSON.parse(init.body)).toEqual({
      assetIds: [ASSET_ONE],
      statementVersion: CURRENT_RIGHTS_STATEMENT_VERSION,
    });

    // The thumbnail flips to usable, and the parent hears the new readiness.
    await waitFor(() =>
      expect(screen.getByTestId('asset-thumbnail')).toHaveAttribute(
        'data-usable',
        'true'
      )
    );
    expect(onSufficiency).toHaveBeenLastCalledWith({
      ready: true,
      missing: [],
    });
  });

  it('surfaces the server’s refusal rather than pretending it worked', async () => {
    FakeXhr.status = 413;
    FakeXhr.body = JSON.stringify({ error: 'That file is larger than 8MB.' });

    render(<AssetUploader workspaceId={WORKSPACE} />);
    await pickAFile();

    expect(await screen.findByTestId('asset-uploader-error')).toHaveTextContent(
      'larger than 8MB'
    );
    expect(screen.queryByTestId('asset-thumbnail')).not.toBeInTheDocument();
  });
});

function assetRequest(asks: Array<Record<string, unknown>>): ProjectMessage {
  return {
    id: 'm1',
    workspace_id: WORKSPACE,
    direction: 'outbound',
    kind: 'asset_request',
    body: 'We need a few things',
    asks,
    status: 'sent',
    sent_at: '2026-08-01T10:00:00Z',
    answered_at: null,
    created_by: 'team',
    created_at: '2026-08-01T10:00:00Z',
  };
}

describe('OpenAsks', () => {
  it('offers an uploader per open ask when the viewer owns the workspace', () => {
    render(
      <OpenAsks
        workspaceId={WORKSPACE}
        messages={[
          assetRequest([
            { code: 'hero_image_missing', message: 'A wide photo' },
            { code: 'logo_missing', message: 'Your logo' },
          ]),
        ]}
      />
    );
    expect(screen.getAllByTestId('asset-uploader')).toHaveLength(2);
    // The label follows the ask, so a client is not told to "add photos" when
    // what we want is a logo.
    expect(screen.getByText('Add your logo')).toBeInTheDocument();
    expect(screen.getByText('Add photos')).toBeInTheDocument();
  });

  it('renders no uploader at all without a workspace id', () => {
    render(
      <OpenAsks
        messages={[
          assetRequest([{ code: 'logo_missing', message: 'Your logo' }]),
        ]}
      />
    );
    expect(screen.queryByTestId('asset-uploader')).not.toBeInTheDocument();
    expect(screen.getByTestId('open-ask')).toBeInTheDocument();
  });
});
