/**
 * The shared concierge thread.
 *
 * The case that matters most is the last one: a reply carries a body and
 * nothing else. If the browser could name a direction, a client could post a
 * message that reads as if it came from us.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ProjectThread,
  askLabel,
  messagesFromPayload,
  normalizeMessage,
  senderLabel,
  type ProjectMessage,
} from '../ProjectThread';
import { openAsksFrom } from '../OpenAsks';

const WORKSPACE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

function message(overrides: Partial<ProjectMessage> = {}): ProjectMessage {
  return {
    id: 'm1',
    workspace_id: WORKSPACE,
    direction: 'outbound',
    kind: 'clarification',
    body: 'Could you confirm your opening hours?',
    asks: [],
    status: 'sent',
    sent_at: '2026-08-01T10:00:00Z',
    answered_at: null,
    created_by: 'team',
    created_at: '2026-08-01T10:00:00Z',
    ...overrides,
  };
}

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('ProjectThread rendering', () => {
  it('tells inbound and outbound apart', () => {
    render(
      <ProjectThread
        workspaceId={WORKSPACE}
        initialMessages={[
          message({ id: 'out', direction: 'outbound', body: 'From us' }),
          message({
            id: 'in',
            direction: 'inbound',
            kind: 'client_reply',
            body: 'From the client',
            created_at: '2026-08-02T10:00:00Z',
          }),
        ]}
      />
    );

    const rows = screen.getAllByTestId('project-message');
    expect(rows.map((row) => row.dataset.direction)).toEqual([
      'outbound',
      'inbound',
    ]);
    // A client sees our messages as theirs, and their own as their own.
    expect(rows.map((row) => row.dataset.own)).toEqual(['false', 'true']);
    expect(
      screen.getByText('Flowstarter', { exact: false })
    ).toBeInTheDocument();
  });

  it('flips which side is "you" for the operator console', () => {
    render(
      <ProjectThread
        workspaceId={WORKSPACE}
        viewerSide="operator"
        initialMessages={[
          message({ id: 'out', direction: 'outbound' }),
          message({
            id: 'in',
            direction: 'inbound',
            created_at: '2026-08-02T10:00:00Z',
          }),
        ]}
      />
    );

    const rows = screen.getAllByTestId('project-message');
    expect(rows.map((row) => row.dataset.own)).toEqual(['true', 'false']);
  });

  it('orders the thread oldest first regardless of input order', () => {
    render(
      <ProjectThread
        workspaceId={WORKSPACE}
        initialMessages={[
          message({
            id: 'newer',
            created_at: '2026-08-05T10:00:00Z',
            body: 'second',
          }),
          message({
            id: 'older',
            created_at: '2026-08-01T10:00:00Z',
            body: 'first',
          }),
        ]}
      />
    );

    const rows = screen.getAllByTestId('project-message');
    expect(rows[0]).toHaveTextContent('first');
    expect(rows[1]).toHaveTextContent('second');
  });

  it('renders the structured asks a message carries', () => {
    render(
      <ProjectThread
        workspaceId={WORKSPACE}
        initialMessages={[
          message({
            kind: 'asset_request',
            asks: [{ id: 'a', label: 'Your logo' }, { title: 'Three photos' }],
          }),
        ]}
      />
    );

    expect(screen.getByText('Your logo')).toBeInTheDocument();
    expect(screen.getByText('Three photos')).toBeInTheDocument();
  });

  it('hides the reply box when read-only, for the audit view', () => {
    render(
      <ProjectThread
        workspaceId={WORKSPACE}
        readOnly
        initialMessages={[message()]}
      />
    );
    expect(screen.queryByRole('button', { name: /send reply/i })).toBeNull();
  });

  it('does not fetch when the server already supplied the thread', () => {
    render(
      <ProjectThread workspaceId={WORKSPACE} initialMessages={[message()]} />
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads the thread itself when no initial messages are given', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [message({ body: 'fetched' })] }),
    });

    render(<ProjectThread workspaceId={WORKSPACE} />);

    await waitFor(() =>
      expect(screen.getByText('fetched')).toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/projects/${WORKSPACE}/messages`,
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('stays quiet when the messaging endpoint is not there yet', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    render(<ProjectThread workspaceId={WORKSPACE} />);

    await waitFor(() =>
      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
    );
  });
});

describe('ProjectThread posting', () => {
  it('posts a body and never a direction', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        message: message({
          id: 'reply',
          direction: 'inbound',
          body: 'Here it is',
        }),
      }),
    });

    render(<ProjectThread workspaceId={WORKSPACE} initialMessages={[]} />);

    await userEvent.type(
      screen.getByPlaceholderText(/Write your reply/i),
      'Here it is'
    );
    await userEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/projects/${WORKSPACE}/messages`);
    expect(init.method).toBe('POST');
    const payload = JSON.parse(init.body as string);
    // The server decides inbound vs outbound from the caller's role.
    expect(payload).toEqual({ body: 'Here it is' });
    expect(payload).not.toHaveProperty('direction');

    await waitFor(() =>
      expect(screen.getByText('Here it is')).toBeInTheDocument()
    );
  });

  it('surfaces a refused reply instead of pretending it sent', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Not your project' }),
    });

    render(<ProjectThread workspaceId={WORKSPACE} initialMessages={[]} />);

    await userEvent.type(
      screen.getByPlaceholderText(/Write your reply/i),
      'hi'
    );
    await userEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Not your project')
    );
  });

  it('will not send an empty reply', async () => {
    render(<ProjectThread workspaceId={WORKSPACE} initialMessages={[]} />);
    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
  });
});

describe('the shape the real endpoints return', () => {
  it('reads the API’s camelCase message as well as a raw row', () => {
    const fromApi = normalizeMessage({
      id: 'm1',
      workspaceId: WORKSPACE,
      direction: 'outbound',
      kind: 'asset_request',
      body: 'We need a few things',
      asks: [],
      status: 'sent',
      sentAt: '2026-08-01T10:00:00Z',
      answeredAt: null,
      createdBy: 'team',
      createdAt: '2026-08-01T10:00:00Z',
    });

    expect(fromApi).toMatchObject({
      workspace_id: WORKSPACE,
      sent_at: '2026-08-01T10:00:00Z',
      created_at: '2026-08-01T10:00:00Z',
      created_by: 'team',
    });
  });

  it('labels a sufficiency ask by its message, which is the field it carries', () => {
    expect(
      askLabel({
        code: 'missing_logo',
        severity: 'blocking',
        message: 'We still need your logo',
        affects: ['header'],
      })
    ).toBe('We still need your logo');
  });

  it('refetches after a POST that answers with only an id', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      // The real POST answers { messageId, direction, ... } — no message body.
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ messageId: 'new', direction: 'inbound' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          messages: [
            {
              id: 'new',
              workspaceId: WORKSPACE,
              direction: 'inbound',
              kind: 'client_reply',
              body: 'Here it is',
              asks: [],
              status: 'sent',
              sentAt: '2026-08-03T10:00:00Z',
              answeredAt: null,
              createdBy: 'user_client',
              createdAt: '2026-08-03T10:00:00Z',
            },
          ],
        }),
      });

    render(<ProjectThread workspaceId={WORKSPACE} initialMessages={[]} />);

    await userEvent.type(
      screen.getByPlaceholderText(/Write your reply/i),
      'Here it is'
    );
    await userEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() =>
      expect(screen.getByText('Here it is')).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('thread helpers', () => {
  it('reads an ask label from whichever field the classifier populated', () => {
    expect(askLabel({ label: 'A' })).toBe('A');
    expect(askLabel({ title: 'B' })).toBe('B');
    expect(askLabel({ description: 'C' })).toBe('C');
    expect(askLabel({})).toBe('Something we asked for');
  });

  it('accepts every envelope the messaging API might use', () => {
    const one = message();
    expect(messagesFromPayload([one])).toHaveLength(1);
    expect(messagesFromPayload({ messages: [one] })).toHaveLength(1);
    expect(messagesFromPayload({ data: [one] })).toHaveLength(1);
    expect(messagesFromPayload(null)).toHaveLength(0);
    expect(messagesFromPayload({ oops: true })).toHaveLength(0);
  });

  it('names the sender from the viewer’s point of view', () => {
    expect(senderLabel('outbound', 'client')).toBe('Flowstarter');
    expect(senderLabel('inbound', 'client')).toBe('You');
    expect(senderLabel('outbound', 'operator')).toBe('You');
    expect(senderLabel('inbound', 'operator')).toBe('Client');
  });

  it('counts only unanswered asset requests as open asks', () => {
    const asks = openAsksFrom([
      message({
        id: 'open',
        kind: 'asset_request',
        status: 'sent',
        asks: [{ label: 'Logo' }],
      }),
      message({
        id: 'done',
        kind: 'asset_request',
        status: 'answered',
        asks: [{ label: 'Hours' }],
      }),
      message({ id: 'chat', kind: 'clarification', status: 'sent' }),
      message({
        id: 'expired',
        kind: 'asset_request',
        status: 'expired',
        asks: [{ label: 'Old' }],
      }),
    ]);

    expect(asks.map((ask) => ask.label)).toEqual(['Logo']);
  });

  it('falls back to the message body when a request has no structured asks', () => {
    const asks = openAsksFrom([
      message({
        id: 'bodyonly',
        kind: 'asset_request',
        status: 'sent',
        asks: [],
        body: 'Send us your menu',
      }),
    ]);
    expect(asks.map((ask) => ask.label)).toEqual(['Send us your menu']);
  });
});
