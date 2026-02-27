/**
 * Context Builder
 *
 * Builds CONTEXT.md files from Convex data to provide Claude Code
 * with all the information it needs about the project and client.
 */

import { createLogger } from '~/lib/utils/logger';
import { getSandbox } from './workspaceManager';
import type {
  ChatMessage,
  ClaudeCodeEnv,
  ContextData,
  DesignPreferences,
  ExistingContent,
} from './types';

const log = createLogger('ClaudeCodeContext');

/**
 * Default context file path in workspace
 */
export const CONTEXT_FILE_PATH = '/workspace/CONTEXT.md';

/**
 * Build CONTEXT.md content from context data
 */
export function buildContextMarkdown(data: ContextData): string {
  const sections: string[] = [];

  // Header
  sections.push('# Project Context');
  sections.push('');
  sections.push('This file contains all relevant context for building this website.');
  sections.push('Read this before making any changes.');
  sections.push('');

  // Project info
  sections.push('## Project Information');
  sections.push('');
  sections.push(`- **Project ID:** ${data.projectId}`);
  if (data.projectName) {
    sections.push(`- **Project Name:** ${data.projectName}`);
  }
  if (data.templateId) {
    sections.push(`- **Template:** ${data.templateName || data.templateId}`);
  }
  sections.push('');

  // Business info
  if (data.businessName || data.businessType || data.businessDescription) {
    sections.push('## Business Information');
    sections.push('');
    if (data.businessName) {
      sections.push(`- **Business Name:** ${data.businessName}`);
    }
    if (data.businessType) {
      sections.push(`- **Type:** ${data.businessType}`);
    }
    if (data.industry) {
      sections.push(`- **Industry:** ${data.industry}`);
    }
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
    if (data.clientName) {
      sections.push(`- **Name:** ${data.clientName}`);
    }
    if (data.clientEmail) {
      sections.push(`- **Email:** ${data.clientEmail}`);
    }
    if (data.clientPhone) {
      sections.push(`- **Phone:** ${data.clientPhone}`);
    }
    if (data.clientWebsite) {
      sections.push(`- **Website:** ${data.clientWebsite}`);
    }
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

  // Chat history (conversation summary)
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

  // Footer with build instructions
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

/**
 * Build design preferences section
 */
function buildDesignPreferencesSection(prefs: DesignPreferences): string {
  const lines: string[] = [];

  lines.push('## Design Preferences');
  lines.push('');

  if (prefs.colorScheme) {
    lines.push(`- **Color Scheme:** ${prefs.colorScheme}`);
  }
  if (prefs.style) {
    lines.push(`- **Style:** ${prefs.style}`);
  }
  if (prefs.mood) {
    lines.push(`- **Mood:** ${prefs.mood}`);
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

/**
 * Build existing content section
 */
function buildExistingContentSection(content: ExistingContent): string {
  const lines: string[] = [];

  lines.push('## Existing Content');
  lines.push('');

  if (content.logo) {
    lines.push(`- **Logo:** ${content.logo}`);
  }
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

/**
 * Build chat history section (summarized for context)
 */
function buildChatHistorySection(messages: ChatMessage[]): string {
  const lines: string[] = [];

  lines.push('## Conversation Summary');
  lines.push('');
  lines.push('Key points from the onboarding conversation:');
  lines.push('');

  // Group user messages as requirements
  const userMessages = messages.filter((m) => m.role === 'user');
  const recentMessages = userMessages.slice(-10); // Last 10 user messages

  for (const msg of recentMessages) {
    // Truncate very long messages
    const content = msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content;
    lines.push(`- ${content}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Write CONTEXT.md to workspace
 */
export async function writeContextFile(
  workspaceId: string,
  data: ContextData,
  env?: ClaudeCodeEnv
): Promise<string> {
  log.info(`Writing context file for workspace ${workspaceId}`);

  const sandbox = await getSandbox(workspaceId, env);
  if (!sandbox) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  const content = buildContextMarkdown(data);

  // Write file to workspace
  await sandbox.fs.uploadFile(CONTEXT_FILE_PATH, Buffer.from(content, 'utf-8'));

  log.debug(`Context file written to ${CONTEXT_FILE_PATH}`);

  return CONTEXT_FILE_PATH;
}

/**
 * Read CONTEXT.md from workspace
 */
export async function readContextFile(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<string | null> {
  try {
    const sandbox = await getSandbox(workspaceId, env);
    if (!sandbox) {
      return null;
    }

    const buffer = await sandbox.fs.downloadFile(CONTEXT_FILE_PATH);
    return buffer.toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Update specific sections of CONTEXT.md
 */
export async function updateContextFile(
  workspaceId: string,
  updates: Partial<ContextData>,
  env?: ClaudeCodeEnv
): Promise<void> {
  log.info(`Updating context file for workspace ${workspaceId}`);

  // Read existing context
  const existingContent = await readContextFile(workspaceId, env);

  // If no existing file, create new one
  if (!existingContent) {
    if (updates.projectId) {
      await writeContextFile(workspaceId, updates as ContextData, env);
    }
    return;
  }

  // For simplicity, we rebuild the entire file with merged data
  // A more sophisticated approach would parse and merge sections
  const sandbox = await getSandbox(workspaceId, env);
  if (!sandbox) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  // Add update note
  const updateNote = `\n\n---\n\n## Recent Updates\n\nContext updated at ${new Date().toISOString()}\n\n`;

  const updatedContent = existingContent + updateNote + JSON.stringify(updates, null, 2);

  await sandbox.fs.uploadFile(CONTEXT_FILE_PATH, Buffer.from(updatedContent, 'utf-8'));
}

/**
 * Build context data from Convex project data
 * This function should be called with data fetched from Convex
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
  preferences?: {
    colorScheme?: string;
    style?: string;
    mood?: string;
    inspirationUrls?: string[];
  };
  content?: {
    logo?: string;
    images?: string[];
    copy?: string;
    socialLinks?: Record<string, string>;
  };
  additionalInstructions?: string;
}): ContextData {
  const data: ContextData = {
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

  return data;
}
