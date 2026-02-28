import { Daytona, type DaytonaConfig } from '@daytonaio/sdk';

let daytonaClient: Daytona | null = null;

const sandboxCache = new Map<string, { sandboxId: string; previewUrl?: string }>();

export function getClient(): Daytona {
  const apiKey = process.env.DAYTONA_API_KEY || '';
  const apiUrl = process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';

  if (!apiKey) throw new Error('DAYTONA_API_KEY not configured');
  if (daytonaClient) return daytonaClient;

  const config: DaytonaConfig = { apiKey, apiUrl };
  daytonaClient = new Daytona(config);
  return daytonaClient;
}

export function getCachedSandbox(projectId: string) {
  return sandboxCache.get(projectId) || null;
}

export function setCachedSandbox(projectId: string, info: { sandboxId: string; previewUrl?: string }) {
  sandboxCache.set(projectId, info);
}
