import { describe, expect, it } from 'vitest';

import { buildProjectIntegrationUpdate, readProjectIntegrationConfig } from './projectIntegrations';

describe('readProjectIntegrationConfig', () => {
  it('reads integration config from project data when columns are absent', () => {
    expect(
      readProjectIntegrationConfig({
        data: JSON.stringify({
          projectIntegrations: {
            calendly: {
              url: 'https://calendly.com/acme/demo',
              apiKeySecretId: 'vault-cal',
            },
            analytics: {
              propertyId: '123456789',
              refreshTokenSecretId: 'vault-ga',
            },
          },
        }),
      }),
    ).toEqual({
      calendlyUrl: 'https://calendly.com/acme/demo',
      calendlyApiKeyId: 'vault-cal',
      gaPropertyId: '123456789',
      gaRefreshTokenId: 'vault-ga',
    });
  });

  it('prefers direct project columns when they exist', () => {
    expect(
      readProjectIntegrationConfig({
        calendly_url: 'https://calendly.com/column/demo',
        calendly_api_key_id: 'column-cal',
        ga_property_id: 'column-ga',
        ga_refresh_token_id: 'column-refresh',
        data: JSON.stringify({
          projectIntegrations: {
            calendly: { url: 'https://calendly.com/data/demo' },
            analytics: { propertyId: 'data-ga' },
          },
        }),
      }),
    ).toEqual({
      calendlyUrl: 'https://calendly.com/column/demo',
      calendlyApiKeyId: 'column-cal',
      gaPropertyId: 'column-ga',
      gaRefreshTokenId: 'column-refresh',
    });
  });

  it('builds a compatibility update payload', () => {
    const update = buildProjectIntegrationUpdate(
      {
        calendly_url: null,
        ga_refresh_token_id: null,
        data: JSON.stringify({
          projectIntegrations: {
            analytics: {
              propertyId: 'old-property',
            },
          },
        }),
      },
      {
        calendly: {
          url: 'https://calendly.com/new/demo',
          apiKeySecretId: 'vault-cal',
        },
        analytics: {
          propertyId: 'new-property',
          refreshTokenSecretId: 'vault-ga',
          connectedAt: '2026-03-31T12:00:00.000Z',
        },
      },
    );

    expect(update.calendly_url).toBe('https://calendly.com/new/demo');
    expect(update.ga_refresh_token_id).toBe('vault-ga');

    const data = JSON.parse(update.data as string);
    expect(data.projectIntegrations.calendly).toEqual({
      url: 'https://calendly.com/new/demo',
      apiKeySecretId: 'vault-cal',
    });
    expect(data.projectIntegrations.analytics).toEqual({
      propertyId: 'new-property',
      refreshTokenSecretId: 'vault-ga',
      connectedAt: '2026-03-31T12:00:00.000Z',
    });
  });
});
