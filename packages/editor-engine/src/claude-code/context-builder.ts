/**
 * Context Builder
 *
 * Builds CONTEXT.md files for Claude Code with all project information.
 * Framework-agnostic - works with any sandbox provider.
 */

import type { Sandbox } from '@daytonaio/sdk';
import type {
  ChatMessage,
  ContextData,
  DesignPreferences,
  ExistingContent,
} from './types';

export const CONTEXT_FILE_PATH = '/workspace/CONTEXT.md';

/**
 * Build CONTEXT.md content from context data.
 */
export function buildContextMarkdown(data: ContextData): string {
  const sections: string[] = [];

  sections.push('# Project Context');
  sections.push('');
  sections.push('This file contains all relevant context for building this website.');
  sections.push('Read this before making any changes.');
  sections.push('');

  // Project info
  sections.push('## Project Information');
  sections.push('');
  sections.push(`- **Project ID:** ${data.projectId}`);
  if (data.projectName) sections.push(`- **Project Name:** ${data.projectName}`);
  if (data.templateId) sections.push(`- **Template:** ${data.templateName || data.templateId}`);
  sections.push('');

  // Business info
  if (data.businessName || data.businessType || data.businessDescription) {
    sections.push('## Business Information');
    sections.push('');
    if (data.businessName) sections.push(`- **Business Name:** ${data.businessName}`);
    if (data.businessType) sections.push(`- **Type:** ${data.businessType}`);
    if (data.industry) sections.push(`- **Industry:** ${data.industry}`);
    if (data.businessDescription) {
      sections.push('');
      sections.push('### Description');
      sections.push('');
      sections.push(data.businessDescription);
    }
    if (data.targetAudience) {
      sections.push('');
      sections.push('### Target Audience');
      sections.push('');
      sections.push(data.targetAudience);
    }
    sections.push('');
  }

  // Client info
  if (data.clientName || data.clientEmail || data.clientWebsite) {
    sections.push('## Client Information');
    sections.push('');
    if (data.clientName) sections.push(`- **Name:** ${data.clientName}`);
    if (data.clientEmail) sections.push(`- **Email:** ${data.clientEmail}`);
    if (data.clientPhone) sections.push(`- **Phone:** ${data.clientPhone}`);
    if (data.clientWebsite) sections.push(`- **Website:** ${data.clientWebsite}`);
    sections.push('');
  }

  // Design preferences
  if (data.designPreferences) {
    sections.push(buildDesignPreferencesSection(data.designPreferences));
  }

  // Existing content
  if (data.existingContent) {
    sections.push(buildExistingContentSection(data.existingContent));
  }

  // Integrations (Phase 4)
  if (data.integrations) {
    sections.push('## Integrations');
    sections.push('');
    if (data.integrations.bookingProvider) {
      sections.push(`- **Booking Provider:** ${data.integrations.bookingProvider}`);
    }
    if (data.integrations.bookingUrl) {
      sections.push(`- **Booking URL:** ${data.integrations.bookingUrl}`);
    }
    if (data.integrations.newsletterProvider) {
      sections.push(`- **Newsletter Provider:** ${data.integrations.newsletterProvider}`);
    }
    if (data.integrations.newsletterUrl) {
      sections.push(`- **Newsletter URL:** ${data.integrations.newsletterUrl}`);
    }
    sections.push('');
  }

  // Contact details (Phase 4)
  if (data.contactDetails) {
    sections.push('## Contact Details');
    sections.push('');
    if (data.contactDetails.email) sections.push(`- **Email:** ${data.contactDetails.email}`);
    if (data.contactDetails.phone) sections.push(`- **Phone:** ${data.contactDetails.phone}`);
    if (data.contactDetails.address) sections.push(`- **Address:** ${data.contactDetails.address}`);
    if (data.contactDetails.socialLinks) {
      sections.push('');
      for (const [platform, url] of Object.entries(data.contactDetails.socialLinks)) {
        sections.push(`- **${platform}:** ${url}`);
      }
    }
    sections.push('');
  }

  // Domain info (Phase 4)
  if (data.domainInfo) {
    sections.push('## Domain & Hosting');
    sections.push('');
    if (data.domainInfo.domainType) sections.push(`- **Type:** ${data.domainInfo.domainType}`);
    if (data.domainInfo.domainName) sections.push(`- **Domain:** ${data.domainInfo.domainName}`);
    if (data.domainInfo.domainProvider) sections.push(`- **Provider:** ${data.domainInfo.domainProvider}`);
    sections.push('');
  }

  // Current files (Phase 4)
  if (data.currentFiles && data.currentFiles.length > 0) {
    sections.push('## Current Files');
    sections.push('');
    for (const file of data.currentFiles) {
      const modified = file.lastModified
        ? ` (modified: ${new Date(file.lastModified).toISOString()})`
        : '';
      sections.push(`- ${file.path}${modified}`);
    }
    sections.push('');
  }

  // Chat history
  if (data.chatHistory && data.chatHistory.length > 0) {
    sections.push(buildChatHistorySection(data.chatHistory));
  }

  // Additional instructions
  if (data.additionalInstructions) {
    sections.push('## Additional Instructions');
    sections.push('');
    sections.push(data.additionalInstructions);
    sections.push('');
  }

  // Build instructions
  sections.push('---');
  sections.push('');
  sections.push('## Build Instructions');
  sections.push('');
  sections.push('1. This is an Astro project with React components');
  sections.push('2. Run `npm install` to install dependencies');
  sections.push('3. Run `npm run dev` to start the development server');
  sections.push('4. Make changes based on the context above');
  sections.push('5. Ensure all changes are consistent with the business branding');
  sections.push('');

  return sections.join('\n');
}

function buildDesignPreferencesSection(prefs: DesignPreferences): string {
  const lines: string[] = [];
  lines.push('## Design Preferences');
  lines.push('');
  if (prefs.colorScheme) lines.push(`- **Color Scheme:** ${prefs.colorScheme}`);
  if (prefs.style) lines.push(`- **Style:** ${prefs.style}`);
  if (prefs.mood) lines.push(`- **Mood:** ${prefs.mood}`);
  if (prefs.palette) lines.push(`- **Palette:** ${prefs.palette}`);
  if (prefs.fonts) {
    if (prefs.fonts.heading) lines.push(`- **Heading Font:** ${prefs.fonts.heading}`);
    if (prefs.fonts.body) lines.push(`- **Body Font:** ${prefs.fonts.body}`);
  }
  if (prefs.inspirationUrls && prefs.inspirationUrls.length > 0) {
    lines.push('');
    lines.push('### Inspiration');
    lines.push('');
    for (const url of prefs.inspirationUrls) {
      lines.push(`- ${url}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function buildExistingContentSection(content: ExistingContent): string {
  const lines: string[] = [];
  lines.push('## Existing Content');
  lines.push('');
  if (content.logo) lines.push(`- **Logo:** ${content.logo}`);
  if (content.images && content.images.length > 0) {
    lines.push('');
    lines.push('### Images');
    lines.push('');
    for (const img of content.images) {
      lines.push(`- ${img}`);
    }
  }
  if (content.copy) {
    lines.push('');
    lines.push('### Copy/Text');
    lines.push('');
    lines.push(content.copy);
  }
  if (content.socialLinks && Object.keys(content.socialLinks).length > 0) {
    lines.push('');
    lines.push('### Social Links');
    lines.push('');
    for (const [platform, url] of Object.entries(content.socialLinks)) {
      lines.push(`- **${platform}:** ${url}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function buildChatHistorySection(messages: ChatMessage[]): string {
  const lines: string[] = [];
  lines.push('## Conversation Summary');
  lines.push('');
  lines.push('Key points from the conversation:');
  lines.push('');

  const userMessages = messages.filter((m) => m.role === 'user');
  const recentMessages = userMessages.slice(-20);

  for (const msg of recentMessages) {
    const content = msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content;
    lines.push(`- ${content}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Write CONTEXT.md to a sandbox.
 */
export async function writeContextFile(
  sandbox: Sandbox,
  data: ContextData,
): Promise<string> {
  const content = buildContextMarkdown(data);
  await sandbox.fs.uploadFile(Buffer.from(content, 'utf-8'), CONTEXT_FILE_PATH);
  return CONTEXT_FILE_PATH;
}

/**
 * Read CONTEXT.md from a sandbox.
 */
export async function readContextFile(sandbox: Sandbox): Promise<string | null> {
  try {
    const buffer = await sandbox.fs.downloadFile(CONTEXT_FILE_PATH);
    return buffer.toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Build context data from Convex project data.
 */
export function buildContextFromConvex(convexData: {
  project?: {
    _id: string;
    name?: string;
    templateId?: string;
    templateName?: string;
  };
  business?: {
    name?: string;
    type?: string;
    description?: string;
    industry?: string;
    targetAudience?: string;
  };
  client?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: number;
  }>;
  preferences?: DesignPreferences;
  content?: ExistingContent;
  additionalInstructions?: string;
}): ContextData {
  return {
    projectId: convexData.project?._id || 'unknown',
    projectName: convexData.project?.name,
    templateId: convexData.project?.templateId,
    templateName: convexData.project?.templateName,

    businessName: convexData.business?.name,
    businessType: convexData.business?.type,
    businessDescription: convexData.business?.description,
    industry: convexData.business?.industry,
    targetAudience: convexData.business?.targetAudience,

    clientName: convexData.client?.name,
    clientEmail: convexData.client?.email,
    clientPhone: convexData.client?.phone,
    clientWebsite: convexData.client?.website,

    chatHistory: convexData.messages?.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.createdAt ? new Date(m.createdAt) : undefined,
    })),

    designPreferences: convexData.preferences,
    existingContent: convexData.content,
    additionalInstructions: convexData.additionalInstructions,
  };
}
