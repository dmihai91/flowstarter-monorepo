import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock the AI sdk + client BEFORE importing site-copy.
const generateTextMock = vi.fn();
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateTextMock(args),
  generateObject: vi.fn(),
  streamText: vi.fn(),
}));
vi.mock('@/lib/ai/client', () => ({
  models: { projectDetails: { id: 'mock-model' } },
  getModel: (id?: string) => ({ modelId: id ?? 'mock-model' }),
  isOpenRouterConfigured: () => true,
}));
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
  }),
}));

// Now import the module under test.
import { generateSiteCopy, type SiteCopy } from '../site-copy';

beforeEach(() => {
  generateTextMock.mockReset();
});

afterEach(() => {
  generateTextMock.mockReset();
});

const validCopy: SiteCopy = {
  hero: {
    headline: 'Find calm again',
    subhead: 'Therapy that actually fits a busy schedule.',
    primaryCta: 'Book a session',
  },
  services: {
    sectionTitle: 'How I help',
    items: [
      {
        title: 'Anxiety support',
        description: 'Calm thoughts. Practical tools.',
      },
      {
        title: 'Burnout recovery',
        description: 'Step out of survival mode.',
      },
    ],
  },
  about: {
    sectionTitle: 'About me',
    paragraph: 'Licensed psychotherapist with 12 years experience.',
  },
  finalCta: {
    headline: 'Ready when you are.',
    subhead: 'Free 15-minute intro call.',
    button: 'Book intro call',
  },
};

describe('generateSiteCopy', () => {
  it('throws on missing businessName', async () => {
    await expect(
      generateSiteCopy({ businessName: '', description: 'x' })
    ).rejects.toThrow();
  });

  it('throws on missing description', async () => {
    await expect(
      generateSiteCopy({ businessName: 'Acme', description: '' })
    ).rejects.toThrow();
  });

  it('parses valid JSON output', async () => {
    generateTextMock.mockResolvedValueOnce({ text: JSON.stringify(validCopy) });
    const out = await generateSiteCopy({
      businessName: 'Calm Space Therapy',
      description: 'Online therapy for busy professionals',
      brandTone: 'professional',
    });
    expect(out).toEqual(validCopy);
  });

  it('strips markdown fences from model output', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: '```json\n' + JSON.stringify(validCopy) + '\n```',
    });
    const out = await generateSiteCopy({
      businessName: 'X',
      description: 'Y',
    });
    expect(out.hero.headline).toBe('Find calm again');
  });

  it('throws on invalid JSON', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'not json' });
    await expect(
      generateSiteCopy({ businessName: 'X', description: 'Y' })
    ).rejects.toThrow(/invalid JSON/);
  });

  it('throws when output is missing required fields', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({ hero: { headline: 'x' } }),
    });
    await expect(
      generateSiteCopy({ businessName: 'X', description: 'Y' })
    ).rejects.toThrow(/required fields/);
  });

  it('passes locale + tone through to the prompt', async () => {
    generateTextMock.mockResolvedValueOnce({ text: JSON.stringify(validCopy) });
    await generateSiteCopy({
      businessName: 'Acme',
      description: 'Therapy practice',
      locale: 'ro',
      brandTone: 'friendly',
      goal: 'bookings',
    });
    expect(generateTextMock).toHaveBeenCalledOnce();
    const args = generateTextMock.mock.calls[0]?.[0] as { prompt: string };
    expect(args.prompt).toContain('Romanian');
    expect(args.prompt).toContain('friendly');
    expect(args.prompt).toContain('bookings');
  });
});
