type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function parseProjectData(value: unknown): UnknownRecord {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(value) ? value : {};
}

export function readProjectIntegrationConfig(project: unknown): {
  calendlyUrl: string | null;
  calendlyApiKeyId: string | null;
  gaPropertyId: string | null;
  gaRefreshTokenId: string | null;
} {
  const record = isRecord(project) ? project : {};
  const data = parseProjectData(record.data);
  const projectIntegrations = isRecord(data.projectIntegrations) ? (data.projectIntegrations as UnknownRecord) : {};
  const calendly = isRecord(projectIntegrations.calendly) ? (projectIntegrations.calendly as UnknownRecord) : {};
  const analytics = isRecord(projectIntegrations.analytics) ? (projectIntegrations.analytics as UnknownRecord) : {};

  return {
    calendlyUrl: asString(record.calendly_url) ?? asString(calendly.url) ?? null,
    calendlyApiKeyId: asString(record.calendly_api_key_id) ?? asString(calendly.apiKeySecretId) ?? null,
    gaPropertyId:
      asString(record.ga_property_id) ??
      asString(record.analytics_ga_property_id) ??
      asString(analytics.propertyId) ??
      null,
    gaRefreshTokenId: asString(record.ga_refresh_token_id) ?? asString(analytics.refreshTokenSecretId) ?? null,
  };
}

export function buildProjectIntegrationUpdate(
  project: unknown,
  patch: {
    calendly?: {
      url?: string | null;
      apiKeySecretId?: string | null;
    };
    analytics?: {
      propertyId?: string | null;
      refreshTokenSecretId?: string | null;
      connectedAt?: string | null;
    };
  },
): Record<string, unknown> {
  const record = isRecord(project) ? project : {};
  const data = parseProjectData(record.data);
  const current = readProjectIntegrationConfig(record);
  const projectIntegrations = isRecord(data.projectIntegrations)
    ? { ...(data.projectIntegrations as UnknownRecord) }
    : {};

  if (patch.calendly) {
    projectIntegrations.calendly = {
      url: patch.calendly.url !== undefined ? patch.calendly.url : current.calendlyUrl,
      apiKeySecretId:
        patch.calendly.apiKeySecretId !== undefined ? patch.calendly.apiKeySecretId : current.calendlyApiKeyId,
    };
  }

  if (patch.analytics) {
    const currentAnalytics = isRecord(projectIntegrations.analytics)
      ? (projectIntegrations.analytics as UnknownRecord)
      : {};

    projectIntegrations.analytics = {
      ...currentAnalytics,
      propertyId: patch.analytics.propertyId !== undefined ? patch.analytics.propertyId : current.gaPropertyId,
      refreshTokenSecretId:
        patch.analytics.refreshTokenSecretId !== undefined
          ? patch.analytics.refreshTokenSecretId
          : current.gaRefreshTokenId,
      connectedAt:
        patch.analytics.connectedAt !== undefined
          ? patch.analytics.connectedAt
          : asString(currentAnalytics.connectedAt),
    };
  }

  const update: Record<string, unknown> = {
    data: JSON.stringify({
      ...data,
      projectIntegrations,
    }),
  };

  if (patch.calendly) {
    if (Object.prototype.hasOwnProperty.call(record, 'calendly_url')) {
      update.calendly_url = patch.calendly.url ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'calendly_api_key_id')) {
      update.calendly_api_key_id = patch.calendly.apiKeySecretId ?? null;
    }
  }

  if (patch.analytics) {
    if (Object.prototype.hasOwnProperty.call(record, 'ga_property_id')) {
      update.ga_property_id = patch.analytics.propertyId ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'analytics_ga_property_id')) {
      update.analytics_ga_property_id = patch.analytics.propertyId ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'ga_refresh_token_id')) {
      update.ga_refresh_token_id = patch.analytics.refreshTokenSecretId ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'ga_connected_at')) {
      update.ga_connected_at = patch.analytics.connectedAt ?? null;
    }
  }

  return update;
}
