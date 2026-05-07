import { describe, expect, it, vi, beforeEach } from 'vitest';

const generateTextMock = vi.fn();
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateTextMock(args),
}));
vi.mock('@/lib/ai/openrouter-client', () => ({
  models: { projectDetails: { id: 'mock-model' } },
}));

import { classifyClientRequest } from '../classify-client-request';

beforeEach(() => {
  generateTextMock.mockReset();
});

describe('classifyClientRequest', () => {
  it('throws on empty requestText', async () => {
    await expect(
      classifyClientRequest({ requestText: '   ' })
    ).rejects.toThrow();
  });

  it('parses a valid classification', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'text_edit',
        urgency: 'normal',
        summary: 'Update phone number on contact section',
        suggestedAction: 'Open project, edit contact section text, redeploy',
        estimatedMinutes: 8,
      }),
    });
    const out = await classifyClientRequest({
      requestText: 'Hey can you change my phone to 555-1234?',
    });
    expect(out.category).toBe('text_edit');
    expect(out.urgency).toBe('normal');
    expect(out.estimatedMinutes).toBe(8);
  });

  it('falls back to "clarify" + "normal" on unknown enum values', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'magic',
        urgency: 'apocalyptic',
        summary: 'something',
        suggestedAction: 'something',
        estimatedMinutes: 30,
      }),
    });
    const out = await classifyClientRequest({ requestText: 'do magic' });
    expect(out.category).toBe('clarify');
    expect(out.urgency).toBe('normal');
  });

  it('clamps estimatedMinutes to [5, 480]', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'escalate',
        urgency: 'high',
        summary: 'rebuild from scratch',
        suggestedAction: 'scope + quote',
        estimatedMinutes: 99999,
      }),
    });
    const a = await classifyClientRequest({ requestText: 'rebuild it all' });
    expect(a.estimatedMinutes).toBe(480);

    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'text_edit',
        urgency: 'low',
        summary: 'fix typo',
        suggestedAction: 'edit + redeploy',
        estimatedMinutes: -10,
      }),
    });
    const b = await classifyClientRequest({ requestText: 'fix typo' });
    expect(b.estimatedMinutes).toBe(5);
  });

  it('strips markdown fences from model output', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: '```json\n{"category":"image_swap","urgency":"low","summary":"swap hero image","suggestedAction":"upload + redeploy","estimatedMinutes":10}\n```',
    });
    const out = await classifyClientRequest({
      requestText: 'replace the hero photo',
    });
    expect(out.category).toBe('image_swap');
  });

  it('throws on invalid JSON', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'nope' });
    await expect(classifyClientRequest({ requestText: 'x' })).rejects.toThrow(
      /invalid JSON/
    );
  });
});
