import type { CompleteResult } from '@/lib/ai/enrich-project';
import type { IntakeInput, ProjectBrief } from './contracts';

function normalizeOfferings(offerings: string): string[] {
  return offerings
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function inferArchetype(enriched: CompleteResult): string {
  if (enriched.goal === 'sales') return 'course-creator';
  if (enriched.goal === 'bookings' && enriched.offerType === 'accessible') {
    return 'local-expert';
  }
  if (enriched.goal === 'bookings') return 'service-provider';
  if (enriched.brandTone === 'bold') return 'portfolio-showcase';
  return 'authority-builder';
}

export function buildProjectBrief(
  intake: IntakeInput,
  enriched: CompleteResult
): ProjectBrief {
  return {
    version: '1.0',
    source: 'project-brief',
    generatedAt: new Date().toISOString(),
    siteName: enriched.siteName,
    summary: enriched.description,
    industry: enriched.industry,
    archetype: inferArchetype(enriched),
    targetAudience: enriched.targetAudience,
    usp: enriched.uvp,
    goal: enriched.goal,
    offerType: enriched.offerType,
    brandTone: enriched.brandTone,
    offerings: normalizeOfferings(enriched.offerings),
    contact: {
      email: enriched.contactEmail || intake.client?.email,
      phone: enriched.contactPhone || intake.client?.phone,
      address: enriched.contactAddress,
      clientName: intake.client?.name,
    },
    sourceInput: {
      userDescription: intake.description,
      normalizedDescription: enriched.description,
    },
  };
}
