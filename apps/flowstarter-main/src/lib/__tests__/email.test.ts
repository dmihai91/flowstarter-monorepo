import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// server-only is already mocked globally in test/setup.ts

vi.mock('@flowstarter/platform-config', () => ({
  getMainUrl: () => 'https://flowstarter.dev',
}));

vi.mock('../email-templates/welcome', () => ({
  welcomeEmail: vi.fn(
    ({
      userName,
      dashboardUrl,
    }: {
      userName?: string;
      dashboardUrl: string;
    }) => ({
      subject: `Welcome ${userName ?? 'there'}`,
      html: `<p>Welcome! Dashboard: ${dashboardUrl}</p>`,
    })
  ),
}));

vi.mock('../email-templates/invitation', () => ({
  invitationEmail: vi.fn(() => ({
    subject: 'You are invited',
    html: '<p>Invitation</p>',
  })),
}));

let sendEmail: typeof import('../email')['sendEmail'];
let sendWelcomeEmail: typeof import('../email')['sendWelcomeEmail'];

beforeAll(async () => {
  const emailModule = await import('../email');
  sendEmail = emailModule.sendEmail;
  sendWelcomeEmail = emailModule.sendWelcomeEmail;
});

describe('sendEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns { success: false } when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });
    expect(result).toEqual({
      success: false,
      error: 'Email service not configured',
    });
  });

  it('calls fetch with correct Resend API URL, auth header, and body', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg_123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Body</p>',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-api-key');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.to).toEqual(['user@example.com']);
    expect(body.subject).toBe('Hello');
    expect(body.html).toBe('<p>Body</p>');
    expect(body.from).toBe('Flowstarter <hello@flowstarter.app>');
    expect(body.reply_to).toBe('hello@flowstarter.app');
  });

  it('returns { success: true } on 200 response', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg_456' }),
      })
    );

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result).toEqual({ success: true, id: 'msg_456' });
  });

  it('returns error on non-ok response', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Invalid email' }),
      })
    );

    const result = await sendEmail({
      to: 'bad',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email');
  });

  it('returns error on fetch exception', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure'))
    );

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });
});

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg_welcome' }),
      })
    );
  });

  it('calls sendEmail with the welcome template', async () => {
    const result = await sendWelcomeEmail('user@example.com', 'Alice');

    expect(result.success).toBe(true);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.subject).toBe('Welcome Alice');
    expect(body.html).toContain('https://flowstarter.dev/dashboard');
    expect(body.to).toEqual(['user@example.com']);
  });
});
