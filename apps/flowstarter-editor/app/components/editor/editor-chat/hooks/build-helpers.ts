import type { SystemFont, ContactDetails, IntegrationConfig, BusinessInfo } from '../types';
import { BUILD_PROGRESS } from './simple-build-types';

/**
 * Maps infrastructure progress messages to granular build phases and progress values.
 */
export function mapProgressMessage(
  message: string,
  setBuildPhase: (phase: string) => void,
  setBuildProgress: (progress: number) => void,
  setBuildStep: (step: string) => void,
): void {
  setBuildStep(message);

  if (message.includes('Provisioning cloud sandbox')) {
    setBuildPhase('deploying');
    setBuildProgress(BUILD_PROGRESS.DEPLOYING_START);
  } else if (message.includes('Uploading') && message.includes('files')) {
    setBuildPhase('deploying-upload');
    setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 3);
  } else if (message.includes('Installing dependencies')) {
    setBuildPhase('deploying-install');
    setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 8);
  } else if (message.includes('Starting') && message.includes('dev server')) {
    setBuildPhase('deploying-server');
    setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 15);
  } else if (message.includes('Waiting for') && message.includes('respond')) {
    setBuildPhase('deploying-waiting');
    setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 20);
  } else if (message.includes('Preview server is live')) {
    setBuildProgress(95);
  } else if (
    message.includes('Fixing automatically') ||
    message.includes('Quick fix:') ||
    message.includes('Analyzing error') ||
    message.includes('Fixed:') ||
    message.includes('Removed broken import')
  ) {
    setBuildPhase('fixing');
    setBuildProgress(Math.min(BUILD_PROGRESS.DEPLOYING_START + 25, 88));
  } else if (message.includes('Retrying preview')) {
    setBuildPhase('fixing-retry');
    setBuildProgress(Math.min(BUILD_PROGRESS.DEPLOYING_START + 28, 90));
  } else if (message.includes('Preview ready after')) {
    setBuildPhase('complete-healed');
  } else if (
    message.includes('Generating files') ||
    message.includes('Creating ') ||
    message.includes('Customizing ') ||
    message.includes('Completed ') ||
    message.includes('Planning strategic')
  ) {
    setBuildProgress(Math.min(BUILD_PROGRESS.GENERATING_PROGRESS + 10, 90));
  } else {
    setBuildProgress(Math.min(BUILD_PROGRESS.GENERATING_PROGRESS + 10, 90));
  }
}

interface SiteGenerationParams {
  projectId: string;
  projectName: string;
  templateId: string;
  templateName: string;
  businessData: BusinessInfo | null;
  projectDescription: string;
  palette: { colors: string[] };
  font: SystemFont;
  integrations: IntegrationConfig[];
  contactDetails?: ContactDetails;
  generateImages: boolean;
  signal: AbortSignal;
  onProgress: (message: string) => void;
}

/**
 * Builds the site generation input for the Claude Agent service.
 */
export function buildSiteGenerationInput(params: SiteGenerationParams) {
  const {
    projectId, projectName, templateId, templateName, businessData,
    projectDescription, palette, font, integrations, contactDetails,
    generateImages, signal, onProgress,
  } = params;

  return {
    projectId,
    siteName: projectName,
    businessInfo: {
      name: businessData?.businessType || projectName || 'My Business',
      tagline: businessData?.uvp || businessData?.targetAudience || undefined,
      description: businessData?.description || projectDescription || undefined,
      services: businessData?.businessGoals || undefined,
      targetAudience: businessData?.targetAudience || undefined,
      industry: businessData?.industry || undefined,
    },
    template: { slug: templateId || 'default', name: templateName },
    design: {
      primaryColor: palette.colors[0] || '#3B82F6',
      secondaryColor: palette.colors[1] || '#1E40AF',
      accentColor: palette.colors[2] || '#60A5FA',
      fontFamily: font.body,
      headingFont: font.heading,
    },
    integrations: integrations.map(i => ({ id: i.id, name: i.name, config: i.config || {} })),
    contactDetails: contactDetails
      ? { email: contactDetails.email || undefined, phone: contactDetails.phone || undefined, address: contactDetails.address || undefined }
      : undefined,
    deployToPreview: true,
    generateImages: generateImages || false,
    signal,
    onProgress,
  };
}

/** Maps ContactDetails fields to Convex-compatible format (undefined instead of empty string). */
export function toConvexContactDetails(details: ContactDetails) {
  const fields = ['email', 'phone', 'address', 'website', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'] as const;
  return Object.fromEntries(fields.map(f => [f, (details as unknown as Record<string, string | undefined>)[f] || undefined]));
}
