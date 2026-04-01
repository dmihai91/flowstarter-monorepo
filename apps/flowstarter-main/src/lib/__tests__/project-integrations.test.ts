import { describe, expect, it } from 'vitest';

import {
  buildProjectIntegrationUpdate,
  readProjectIntegrationSnapshot,
} from '../project-integrations';

describe('project-integrations', () => {
  it('reads integration settings from project.data when columns are absent', () => {
    const snapshot = readProjectIntegrationSnapshot({
      id: 'project-1',
      user_id: 'user-1',
      data: JSON.stringify({
        projectIntegrations: {
          calendly: {
            url: 'https://calendly.com/acme/demo',
            apiKeySecretId: 'vault-cal',
          },
          analytics: {
            propertyId: '123456789',
            refreshTokenSecretId: 'vault-ga',
            connectedAt: '2026-03-31T10:00:00.000Z',
          },
          domain: {
            publishedUrl: 'https://project.pages.dev',
            customDomain: 'example.com',
            status: 'active',
          },
        },
      }),
    });

    expect(snapshot).toEqual({
      calendly: {
        url: 'https://calendly.com/acme/demo',
        apiKeySecretId: 'vault-cal',
      },
      analytics: {
        propertyId: '123456789',
        refreshTokenSecretId: 'vault-ga',
        connectedAt: '2026-03-31T10:00:00.000Z',
      },
      domain: {
        publishedUrl: 'https://project.pages.dev',
        customDomain: 'example.com',
        status: 'active',
      },
    });
  });

  it('prefers explicit project columns when they exist', () => {
    const snapshot = readProjectIntegrationSnapshot({
      calendly_url: 'https://calendly.com/column/value',
      ga_property_id: 'column-property',
      ga_refresh_token_id: 'column-secret',
      ga_connected_at: '2026-03-30T00:00:00.000Z',
      data: JSON.stringify({
        projectIntegrations: {
          calendly: { url: 'https://calendly.com/data/value' },
          analytics: { propertyId: 'data-property' },
        },
      }),
    });

    expect(snapshot.calendly.url).toBe('https://calendly.com/column/value');
    expect(snapshot.analytics.propertyId).toBe('column-property');
    expect(snapshot.analytics.refreshTokenSecretId).toBe('column-secret');
  });

  it('builds a compatibility update payload with merged project data', () => {
    const update = buildProjectIntegrationUpdate(
      {
        calendly_url: null,
        ga_property_id: null,
        ga_refresh_token_id: null,
        ga_connected_at: null,
        data: JSON.stringify({
          existing: true,
          projectIntegrations: {
            calendly: { url: 'https://calendly.com/old/value' },
          },
        }),
      },
      {
        calendly: {
          url: 'https://calendly.com/new/value',
          apiKeySecretId: 'vault-cal',
        },
        analytics: {
          propertyId: '987654321',
          refreshTokenSecretId: 'vault-ga',
          connectedAt: '2026-03-31T12:00:00.000Z',
        },
      }
    );

    expect(update).toMatchObject({
      calendly_url: 'https://calendly.com/new/value',
      ga_property_id: '987654321',
      ga_refresh_token_id: 'vault-ga',
      ga_connected_at: '2026-03-31T12:00:00.000Z',
    });

    const data = JSON.parse(update.data as string);
    expect(data.existing).toBe(true);
    expect(data.projectIntegrations.calendly).toEqual({
      url: 'https://calendly.com/new/value',
      apiKeySecretId: 'vault-cal',
    });
    expect(data.projectIntegrations.analytics).toEqual({
      propertyId: '987654321',
      refreshTokenSecretId: 'vault-ga',
      connectedAt: '2026-03-31T12:00:00.000Z',
    });
  });
});
