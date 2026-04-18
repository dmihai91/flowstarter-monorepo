import { describe, it, expect } from 'vitest';
import {
  handoffBodySchema,
  paletteSchema,
  fontSchema,
  brandProfileSchema,
} from '../schemas';

describe('paletteSchema', () => {
  it('accepts a valid palette', () => {
    const valid = {
      id: 'p1',
      name: 'Ocean',
      colors: {
        primary: '#0000FF',
        secondary: '#00FF00',
        accent: '#FF0000',
        background: '#FFFFFF',
        text: '#000000',
      },
    };
    expect(paletteSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a palette missing required color fields', () => {
    const invalid = {
      id: 'p1',
      name: 'Bad',
      colors: { primary: '#000' },
    };
    expect(() => paletteSchema.parse(invalid)).toThrow();
  });

  it('rejects a palette missing id', () => {
    expect(() =>
      paletteSchema.parse({
        name: 'No ID',
        colors: {
          primary: '#0000FF',
          secondary: '#00FF00',
          accent: '#FF0000',
          background: '#FFFFFF',
          text: '#000000',
        },
      })
    ).toThrow();
  });
});

describe('fontSchema', () => {
  it('accepts a valid font with optional weights', () => {
    const valid = {
      id: 'f1',
      name: 'Modern',
      heading: { family: 'Inter', weight: 700 },
      body: { family: 'Roboto' },
    };
    const result = fontSchema.parse(valid);
    expect(result.heading.weight).toBe(700);
    expect(result.body.weight).toBeUndefined();
  });

  it('rejects a font missing heading family', () => {
    expect(() =>
      fontSchema.parse({
        id: 'f1',
        name: 'Bad',
        heading: {},
        body: { family: 'Roboto' },
      })
    ).toThrow();
  });
});

describe('brandProfileSchema', () => {
  it('accepts a minimal brand profile', () => {
    const minimal = {
      brandTone: { primary: 'professional' },
    };
    expect(brandProfileSchema.parse(minimal)).toEqual(minimal);
  });

  it('accepts a fully populated brand profile', () => {
    const full = {
      brandTone: {
        primary: 'warm',
        secondary: ['playful', 'bold'],
        notes: 'Some notes',
      },
      valueProposition: 'Best in class',
      primaryGoal: 'leads',
      desiredCustomerAction: 'Sign up',
      differentiators: ['Fast', 'Reliable'],
      trustSignals: ['5-star reviews'],
      contentStylePreference: 'concise',
      operatorNotes: 'Internal note',
    };
    expect(brandProfileSchema.parse(full)).toEqual(full);
  });

  it('rejects when brandTone.primary is missing', () => {
    expect(() => brandProfileSchema.parse({ brandTone: {} })).toThrow();
  });
});

describe('handoffBodySchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts a payload with only projectId', () => {
    const result = handoffBodySchema.parse({ projectId: validUuid });
    expect(result.projectId).toBe(validUuid);
    expect(result.mode).toBe('concierge'); // default
  });

  it('accepts a payload with only projectConfig', () => {
    const result = handoffBodySchema.parse({
      projectConfig: { name: 'My Project' },
    });
    expect(result.projectConfig?.name).toBe('My Project');
  });

  it('rejects when neither projectId nor projectConfig is provided', () => {
    expect(() => handoffBodySchema.parse({})).toThrow(
      'Either projectId or projectConfig is required'
    );
  });

  it('rejects an invalid uuid for projectId', () => {
    expect(() =>
      handoffBodySchema.parse({ projectId: 'not-a-uuid' })
    ).toThrow();
  });

  it('accepts all valid mode values', () => {
    for (const mode of ['interactive', 'generate', 'concierge'] as const) {
      const result = handoffBodySchema.parse({
        projectId: validUuid,
        mode,
      });
      expect(result.mode).toBe(mode);
    }
  });

  it('defaults mode to concierge when omitted', () => {
    const result = handoffBodySchema.parse({ projectId: validUuid });
    expect(result.mode).toBe('concierge');
  });

  it('rejects an invalid mode value', () => {
    expect(() =>
      handoffBodySchema.parse({ projectId: validUuid, mode: 'invalid' })
    ).toThrow();
  });

  it('accepts projectConfig with nested businessInfo', () => {
    const result = handoffBodySchema.parse({
      projectConfig: {
        name: 'Test',
        businessInfo: {
          description: 'A business',
          industry: 'tech',
          goal: 'leads',
          brandTone: 'professional',
        },
      },
    });
    expect(result.projectConfig?.businessInfo?.industry).toBe('tech');
  });

  it('accepts projectConfig with palette and font', () => {
    const result = handoffBodySchema.parse({
      projectConfig: {
        palette: {
          id: 'p1',
          name: 'Dark',
          colors: {
            primary: '#000',
            secondary: '#111',
            accent: '#222',
            background: '#333',
            text: '#FFF',
          },
        },
        font: {
          id: 'f1',
          name: 'Sans',
          heading: { family: 'Inter' },
          body: { family: 'Roboto' },
        },
      },
    });
    expect(result.projectConfig?.palette?.id).toBe('p1');
    expect(result.projectConfig?.font?.id).toBe('f1');
  });

  it('rejects invalid clientEmail in projectConfig', () => {
    expect(() =>
      handoffBodySchema.parse({
        projectConfig: { clientEmail: 'not-an-email' },
      })
    ).toThrow();
  });

  it('defaults name and description to empty strings in projectConfig', () => {
    const result = handoffBodySchema.parse({
      projectConfig: {},
    });
    expect(result.projectConfig?.name).toBe('');
    expect(result.projectConfig?.description).toBe('');
  });
});
