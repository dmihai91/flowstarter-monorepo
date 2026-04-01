import 'server-only';

type UnknownRecord = Record<string, unknown>;

type ProjectIntegrationSection = {
  calendly?: {
    url?: string | null;
    apiKeySecretId?: string | null;
  };
  analytics?: {
    propertyId?: string | null;
    refreshTokenSecretId?: string | null;
    connectedAt?: string | null;
  };
  domain?: {
    publishedUrl?: string | null;
    customDomain?: string | null;
    status?: string | null;
  };
};

export type ProjectIntegrationSnapshot = {
  calendly: {
    url: string | null;
    apiKeySecretId: string | null;
  };
  analytics: {
    propertyId: string | null;
    refreshTokenSecretId: string | null;
    connectedAt: string | null;
  };
  domain: {
    publishedUrl: string | null;
    customDomain: string | null;
    status: string | null;
  };
};

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function parseProjectData(value: unknown): UnknownRecord {
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

function readProjectIntegrationSection(
  project: UnknownRecord
): ProjectIntegrationSection {
  const data = parseProjectData(project.data);
  return isRecord(data.projectIntegrations)
    ? (data.projectIntegrations as ProjectIntegrationSection)
    : {};
}

export function readProjectIntegrationSnapshot(
  project: UnknownRecord | null | undefined
): ProjectIntegrationSnapshot {
  if (!project) {
    return {
      calendly: { url: null, apiKeySecretId: null },
      analytics: {
        propertyId: null,
        refreshTokenSecretId: null,
        connectedAt: null,
      },
      domain: {
        publishedUrl: null,
        customDomain: null,
        status: null,
      },
    };
  }

  const stored = readProjectIntegrationSection(project);

  return {
    calendly: {
      url:
        asString(project.calendly_url) ??
        asString(stored.calendly?.url) ??
        null,
      apiKeySecretId:
        asString(project.calendly_api_key_id) ??
        asString(stored.calendly?.apiKeySecretId) ??
        null,
    },
    analytics: {
      propertyId:
        asString(project.ga_property_id) ??
        asString(project.analytics_ga_property_id) ??
        asString(stored.analytics?.propertyId) ??
        null,
      refreshTokenSecretId:
        asString(project.ga_refresh_token_id) ??
        asString(stored.analytics?.refreshTokenSecretId) ??
        null,
      connectedAt:
        asString(project.ga_connected_at) ??
        asString(stored.analytics?.connectedAt) ??
        null,
    },
    domain: {
      publishedUrl:
        asString(project.published_url) ??
        asString(stored.domain?.publishedUrl) ??
        null,
      customDomain:
        asString(project.custom_domain) ??
        asString(stored.domain?.customDomain) ??
        null,
      status:
        asString(project.domain_status) ??
        asString(stored.domain?.status) ??
        null,
    },
  };
}

type IntegrationPatch = {
  calendly?: {
    url?: string | null;
    apiKeySecretId?: string | null;
  };
  analytics?: {
    propertyId?: string | null;
    refreshTokenSecretId?: string | null;
    connectedAt?: string | null;
  };
  domain?: {
    publishedUrl?: string | null;
    customDomain?: string | null;
    status?: string | null;
  };
};

function mergeSection<T extends UnknownRecord>(
  current: T | undefined,
  patch: T | undefined
): T | undefined {
  if (!patch) return current;
  return { ...(current ?? {}), ...patch };
}

export function buildProjectIntegrationUpdate(
  project: UnknownRecord,
  patch: IntegrationPatch
): Record<string, unknown> {
  const data = parseProjectData(project.data);
  const existing = readProjectIntegrationSection(project);
  const nextProjectIntegrations: ProjectIntegrationSection = {
    calendly: mergeSection(existing.calendly, patch.calendly),
    analytics: mergeSection(existing.analytics, patch.analytics),
    domain: mergeSection(existing.domain, patch.domain),
  };

  const update: Record<string, unknown> = {
    data: JSON.stringify({
      ...data,
      projectIntegrations: nextProjectIntegrations,
    }),
  };

  if (patch.calendly) {
    if (Object.prototype.hasOwnProperty.call(project, 'calendly_url')) {
      update.calendly_url = patch.calendly.url ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(project, 'calendly_api_key_id')) {
      update.calendly_api_key_id = patch.calendly.apiKeySecretId ?? null;
    }
  }

  if (patch.analytics) {
    if (Object.prototype.hasOwnProperty.call(project, 'ga_property_id')) {
      update.ga_property_id = patch.analytics.propertyId ?? null;
    }
    if (
      Object.prototype.hasOwnProperty.call(project, 'analytics_ga_property_id')
    ) {
      update.analytics_ga_property_id = patch.analytics.propertyId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(project, 'ga_refresh_token_id')) {
      update.ga_refresh_token_id = patch.analytics.refreshTokenSecretId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(project, 'ga_connected_at')) {
      update.ga_connected_at = patch.analytics.connectedAt ?? null;
    }
  }

  if (patch.domain) {
    if (Object.prototype.hasOwnProperty.call(project, 'published_url')) {
      update.published_url = patch.domain.publishedUrl ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(project, 'custom_domain')) {
      update.custom_domain = patch.domain.customDomain ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(project, 'domain_status')) {
      update.domain_status = patch.domain.status ?? null;
    }
  }

  return update;
}
