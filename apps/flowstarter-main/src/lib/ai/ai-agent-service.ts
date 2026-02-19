/**
 * AI Agent Service
 * Handles interactions with AI agent API endpoints
 */

import { TemplateInfo, WebsiteProjectDetails } from './types';

export interface AIAgentRequest {
  agent:
    | 'code-editor'
    | 'template-customizer'
    | 'file-analyzer'
    | 'project-suggestions'
    | 'logo-generator'
    | 'website-generator';
  action: string;
  context: Record<string, unknown>;
  files?: Array<{
    path: string;
    content: string;
  }>;
}

export interface AIAgentResponse {
  agent: string;
  action: string;
  response: unknown;
  timestamp: string;
}

export interface ProjectContext {
  id: string;
  name?: string;
  description?: string;
  template?: string;
  template_id?: string;
  target_users?: string;
  business_goals?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

class AIAgentService {
  private baseUrl = '/api/ai/agent';

  async callAgent(request: AIAgentRequest): Promise<AIAgentResponse> {
    const requestId = `agent_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      console.log(
        `[${requestId}] Calling ${request.agent} agent with action: ${request.action}`
      );

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${requestId}] Agent error response:`, errorData);

        const error = new Error(
          errorData.error || `Failed to call ${request.agent} agent`
        ) as Error & { response?: { status: number; data: unknown } };

        error.response = {
          status: response.status,
          data: errorData,
        };

        throw error;
      }

      const result = await response.json();
      console.log(`[${requestId}] Agent response received:`, {
        agent: result.agent,
        action: result.action,
        hasResponse: !!result.response,
      });

      return result;
    } catch (error) {
      console.error(`[${requestId}] Failed to call AI agent:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        agent: request.agent,
        action: request.action,
      });
      throw error;
    }
  }

  async generateProjectSuggestions(
    templateId: string,
    businessInfo: unknown,
    projectId?: string,
    pipelineId?: string
  ) {
    return this.callAgent({
      agent: 'project-suggestions',
      action: 'generate-full',
      context: { templateId, businessInfo, projectId, pipelineId },
    });
  }

  async regenerateProjectField(
    fieldType: string,
    templateId: string,
    businessInfo: unknown,
    additionalContext: Record<string, unknown> = {}
  ) {
    const actionMap: Record<string, string> = {
      names: 'regenerate-names',
      description: 'regenerate-description',
      targetUsers: 'regenerate-targetUsers',
      businessGoals: 'regenerate-businessGoals',
      USP: 'regenerate-USP',
    };

    const action = actionMap[fieldType] || 'regenerate-field';
    const context =
      action === 'regenerate-field'
        ? {
            templateId,
            businessInfo,
            regenerateField: fieldType,
            ...additionalContext,
          }
        : { templateId, businessInfo, ...additionalContext };

    return this.callAgent({
      agent: 'project-suggestions',
      action,
      context,
    });
  }

  async generateUSP(
    businessInfo: unknown,
    uspContext: Record<string, unknown>
  ) {
    return this.callAgent({
      agent: 'project-suggestions',
      action: 'generate-usp',
      context: {
        businessInfo,
        ...uspContext,
      },
    });
  }

  async generateLogoSpecs(
    projectName: string,
    businessInfo: unknown,
    logoContext: Record<string, unknown>
  ) {
    return this.callAgent({
      agent: 'logo-generator',
      action: 'generate',
      context: {
        projectName,
        businessInfo,
        ...logoContext,
      },
    });
  }

  async editCode(
    filePath: string,
    fileContent: string,
    editInstructions: string,
    projectContext: unknown
  ) {
    return this.callAgent({
      agent: 'code-editor',
      action: 'edit',
      context: {
        file_path: filePath,
        file_content: fileContent,
        edit_instructions: editInstructions,
        project_context: projectContext,
      },
    });
  }

  async analyzeCode(filePath: string, fileContent: string) {
    return this.callAgent({
      agent: 'code-editor',
      action: 'analyze',
      context: {
        file_path: filePath,
        file_content: fileContent,
      },
    });
  }

  async customizeTemplate(
    filePath: string,
    fileContent: string,
    customizationRequest: string,
    projectContext: unknown
  ) {
    return this.callAgent({
      agent: 'template-customizer',
      action: 'customize',
      context: {
        file_path: filePath,
        file_content: fileContent,
        customization_request: customizationRequest,
        project_context: projectContext,
      },
    });
  }

  async getTemplateSuggestions(
    filePath: string,
    fileContent: string,
    projectContext: unknown
  ) {
    return this.callAgent({
      agent: 'template-customizer',
      action: 'suggest',
      context: {
        file_path: filePath,
        file_content: fileContent,
        project_context: projectContext,
      },
    });
  }

  async analyzeFiles(
    files: Array<{ path: string; content: string }>,
    analysisType: string
  ) {
    return this.callAgent({
      agent: 'file-analyzer',
      action: 'analyze',
      context: {
        files,
        analysis_type: analysisType,
      },
    });
  }

  async generateWebsiteCode(
    projectDetails: Record<string, unknown>,
    templateInfo: Record<string, unknown>,
    templateCode?: string,
    useOrchestrator = true
  ) {
    return this.callAgent({
      agent: 'website-generator',
      action: 'generate',
      context: {
        projectDetails,
        templateInfo,
        templateCode,
        useOrchestrator,
      },
    });
  }

  async *generateWebsiteCodeStream(
    projectDetails: WebsiteProjectDetails,
    templateInfo: TemplateInfo,
    templateCode?: string,
    useOrchestrator = true,
    sessionId?: string // Convex session ID for real-time state sync
  ): AsyncGenerator<unknown, void, unknown> {
    console.log('🚀 Starting streaming request to /api/ai/generate-website');
    console.log(`📍 Session ID: ${sessionId || 'not provided'}`);
    const response = await fetch('/api/ai/generate-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectDetails,
        templateInfo,
        templateCode,
        useOrchestrator,
        stream: true,
        sessionId, // Pass session ID for Convex state sync
      }),
      cache: 'no-store',
    });

    console.log('✅ Got response, status:', response.status);
    console.log(
      '📊 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      console.error(
        '❌ Response not OK:',
        response.status,
        response.statusText
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      console.error('❌ No response body');
      throw new Error('No response body');
    }

    console.log('📖 Starting to read response body stream...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      let eventCount = 0;
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`🏁 Stream ended after ${eventCount} events`);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              eventCount++;
              console.log(
                `📨 SSE Event #${eventCount}:`,
                parsed.stage || parsed.status,
                '-',
                parsed.message?.substring(0, 50)
              );
              yield parsed;
            } catch (e) {
              console.error(
                'Error parsing SSE data:',
                e,
                'Raw data:',
                data.substring(0, 100)
              );
            }
          } else if (line.trim() && !line.startsWith(':')) {
            console.log('⚠️ Non-SSE line:', line.substring(0, 100));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const aiAgentService = new AIAgentService();
