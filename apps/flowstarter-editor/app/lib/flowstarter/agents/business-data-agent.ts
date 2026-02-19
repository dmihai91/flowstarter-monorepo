/**
 * BusinessDataAgent - FlowOps-based Business Information Collection
 *
 * Interactive agent for gathering comprehensive business information during onboarding.
 * Built on FlowOps protocol for standardized agent communication.
 *
 * Collects:
 * - Business name and description
 * - Unique Value Proposition (UVP)
 * - Target audience
 * - Business goals
 * - Brand tone
 * - Industry/niche
 * - Pricing and offers (optional)
 * - Key features (optional)
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { generateCompletion, generateJSON, prompts, type LLMMessage } from '~/lib/services/llm';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface BusinessData {
  businessName: string;
  description: string;
  uvp: string; // Unique Value Proposition
  targetAudience: string;
  industry?: string;
  pricingOffers?: string;
  businessGoals: string[];
  brandTone: string;
  sellingMethod?: 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';
  sellingMethodDetails?: string;
  features?: string[];
}

export interface BusinessDataRequest {
  type: 'start' | 'continue' | 'extract' | 'validate';
  userMessage?: string;
  partialData?: Partial<BusinessData>;
}

export interface BusinessDataResponse {
  success: boolean;
  isComplete: boolean;
  message: string;
  businessData?: BusinessData;
  missingFields?: string[];
  extractedFields?: string[];
}

/*
 * ============================================================================
 * BusinessDataAgent Implementation
 * ============================================================================
 */

export class BusinessDataAgent extends BaseAgent {
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private businessData: Partial<BusinessData> = {};

  constructor() {
    super({
      name: 'business-data',
      description: 'Gathers business information through conversational interface',
      version: '1.0.0',
      systemPrompt: prompts.businessAgent,
      allowedTools: [],
      allowedAgents: ['planner', 'template-recommender'],
    });
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    let request: BusinessDataRequest;

    try {
      request = JSON.parse(message);
    } catch {
      // Treat as a direct user message (continue type)
      request = { type: 'continue', userMessage: message };
    }

    context.onProgress?.('Processing business information...', 10);

    switch (request.type) {
      case 'start':
        return this.handleStart(context);

      case 'continue':
        if (!request.userMessage) {
          return this.createErrorResponse('userMessage is required for continue type');
        }

        return this.handleContinue(request.userMessage, context);

      case 'extract':
        if (!request.userMessage) {
          return this.createErrorResponse('userMessage is required for extract type');
        }

        return this.handleExtract(request.userMessage, context);

      case 'validate':
        if (!request.partialData) {
          return this.createErrorResponse('partialData is required for validate type');
        }

        return this.handleValidate(request.partialData, context);

      default:
        return this.createErrorResponse(`Unknown request type: ${(request as BusinessDataRequest).type}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Request Handlers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async handleStart(context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Starting business information gathering...', 20);

    const initialMessage = await generateCompletion(
      [
        { role: 'system', content: this.config.systemPrompt || prompts.businessAgent },
        { role: 'user', content: 'Hello, I want to start a new project.' },
      ],
      { temperature: 0.8 },
    );

    this.conversationHistory.push({
      role: 'assistant',
      content: initialMessage,
    });

    const response: BusinessDataResponse = {
      success: true,
      isComplete: false,
      message: initialMessage,
      missingFields: this.getMissingFields(),
    };

    return this.createSuccessResponse(response);
  }

  private async handleContinue(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Processing your response...', 30);

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Extract information from user message
    await this.extractInformation(userMessage);
    context.onProgress?.('Extracting business details...', 50);

    // Check if we have enough information
    if (this.hasEnoughInformation()) {
      const summary = this.generateSummary();
      const response: BusinessDataResponse = {
        success: true,
        isComplete: true,
        message: summary,
        businessData: this.getBusinessData(),
      };

      return this.createSuccessResponse(response);
    }

    // Get next question
    context.onProgress?.('Preparing next question...', 70);

    const nextQuestion = await this.getNextQuestion();

    this.conversationHistory.push({
      role: 'assistant',
      content: nextQuestion,
    });

    const response: BusinessDataResponse = {
      success: true,
      isComplete: false,
      message: nextQuestion,
      missingFields: this.getMissingFields(),
    };

    return this.createSuccessResponse(response);
  }

  private async handleExtract(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Extracting business information...', 50);

    await this.extractInformation(userMessage);

    const extractedFields = Object.keys(this.businessData).filter(
      (key) => this.businessData[key as keyof BusinessData] !== undefined,
    );

    const response: BusinessDataResponse = {
      success: true,
      isComplete: this.hasEnoughInformation(),
      message: `Extracted ${extractedFields.length} fields`,
      businessData: this.hasEnoughInformation() ? this.getBusinessData() : undefined,
      missingFields: this.getMissingFields(),
      extractedFields,
    };

    return this.createSuccessResponse(response);
  }

  private async handleValidate(partialData: Partial<BusinessData>, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Validating business data...', 50);

    // Merge provided data
    this.businessData = { ...this.businessData, ...partialData };

    const missing = this.getMissingFields();
    const isComplete = missing.length === 0;

    const response: BusinessDataResponse = {
      success: true,
      isComplete,
      message: isComplete ? 'All required business information is complete' : `Missing fields: ${missing.join(', ')}`,
      businessData: isComplete ? this.getBusinessData() : undefined,
      missingFields: missing,
    };

    return this.createSuccessResponse(response);
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Information Extraction
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async extractInformation(userMessage: string): Promise<void> {
    const extractionPrompt = `Extract business information from this conversation message:

"${userMessage}"

Previous conversation context:
${this.conversationHistory
  .slice(-4)
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

Current information we have: ${JSON.stringify(this.businessData)}

Extract any new information mentioned. Only include fields that are clearly mentioned.
Respond with JSON (use null for fields not mentioned in this message):
{
  "businessName": "extracted name or null",
  "description": "what the business/project does or null",
  "uvp": "unique value proposition - what makes them different or null",
  "targetAudience": "who are their customers/users or null",
  "industry": "industry or niche or null",
  "pricingOffers": "pricing structure or special offers mentioned or null",
  "businessGoals": ["goal1", "goal2"] or null,
  "brandTone": "professional/friendly/playful/luxury/etc or null",
  "sellingMethod": "ecommerce/bookings/leads/subscriptions/content/other or null",
  "sellingMethodDetails": "rich text detail of how they sell or null",
  "features": ["feature1", "feature2"] or null
}`;

    try {
      const extracted = await generateJSON<Partial<BusinessData>>([{ role: 'user', content: extractionPrompt }], {
        temperature: 0.3,
      });

      // Merge extracted information (don't overwrite with null)
      if (extracted.businessName) {
        this.businessData.businessName = extracted.businessName;
      }

      if (extracted.description) {
        this.businessData.description = extracted.description;
      }

      if (extracted.uvp) {
        this.businessData.uvp = extracted.uvp;
      }

      if (extracted.targetAudience) {
        this.businessData.targetAudience = extracted.targetAudience;
      }

      if (extracted.industry) {
        this.businessData.industry = extracted.industry;
      }

      if (extracted.pricingOffers) {
        this.businessData.pricingOffers = extracted.pricingOffers;
      }

      if (extracted.brandTone) {
        this.businessData.brandTone = extracted.brandTone;
      }

      if (extracted.sellingMethod) {
        this.businessData.sellingMethod = extracted.sellingMethod;
      }

      if (extracted.sellingMethodDetails) {
        this.businessData.sellingMethodDetails = extracted.sellingMethodDetails;
      }

      if (extracted.businessGoals && extracted.businessGoals.length > 0) {
        this.businessData.businessGoals = [
          ...(this.businessData.businessGoals || []),
          ...extracted.businessGoals,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }

      if (extracted.features && extracted.features.length > 0) {
        this.businessData.features = [...(this.businessData.features || []), ...extracted.features].filter(
          (v, i, a) => a.indexOf(v) === i,
        );
      }
    } catch (error) {
      this.logger.warn('Failed to extract information:', error);
    }
  }

  private async getNextQuestion(): Promise<string> {
    const missing = this.getMissingFields();

    const messages: LLMMessage[] = [
      { role: 'system', content: this.config.systemPrompt || prompts.businessAgent },
      ...this.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'system',
        content: `Information gathered so far: ${JSON.stringify(this.businessData)}

Missing information: ${missing.join(', ')}

Ask ONE focused question to gather the next piece of missing information. Be conversational and specific.
Priority order: business description, unique value proposition, target audience, goals, pricing (optional), brand tone (optional).`,
      },
    ];

    return await generateCompletion(messages, { temperature: 0.8 });
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Validation
   * ──────────────────────────────────────────────────────────────────────────
   */

  private getMissingFields(): string[] {
    const missing: string[] = [];

    if (!this.businessData.businessName) {
      missing.push('business name');
    }

    if (!this.businessData.description) {
      missing.push('business description');
    }

    if (!this.businessData.uvp) {
      missing.push('unique value proposition');
    }

    if (!this.businessData.targetAudience) {
      missing.push('target audience');
    }

    if (!this.businessData.businessGoals || this.businessData.businessGoals.length === 0) {
      missing.push('main goals');
    }

    return missing;
  }

  private hasEnoughInformation(): boolean {
    const hasRequired = !!(
      this.businessData.businessName &&
      this.businessData.description &&
      this.businessData.uvp &&
      this.businessData.targetAudience &&
      this.businessData.businessGoals &&
      this.businessData.businessGoals.length > 0
    );

    // Also require at least 4 conversation exchanges
    return hasRequired && this.conversationHistory.length >= 4;
  }

  private generateSummary(): string {
    const d = this.businessData;
    return `I've gathered the key information about your project:

**Business:** ${d.businessName}
**What you do:** ${d.description}
**Unique Value:** ${d.uvp}
**Target Audience:** ${d.targetAudience}
${d.industry ? `**Industry:** ${d.industry}` : ''}
${d.pricingOffers ? `**Pricing/Offers:** ${d.pricingOffers}` : ''}
**Goals:** ${d.businessGoals?.join(', ') || 'Not specified'}
${d.brandTone ? `**Brand Tone:** ${d.brandTone}` : ''}
${d.features && d.features.length > 0 ? `**Key Features:** ${d.features.join(', ')}` : ''}

This will help me find the perfect template and customize it for your brand!`;
  }

  private getBusinessData(): BusinessData {
    return {
      businessName: this.businessData.businessName || '',
      description: this.businessData.description || '',
      uvp: this.businessData.uvp || '',
      targetAudience: this.businessData.targetAudience || '',
      industry: this.businessData.industry,
      sellingMethod: this.businessData.sellingMethod,
      sellingMethodDetails: this.businessData.sellingMethodDetails,
      pricingOffers: this.businessData.pricingOffers,
      businessGoals: this.businessData.businessGoals || [],
      brandTone: this.businessData.brandTone || 'professional',
      features: this.businessData.features,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * State Management
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Set business data (for restoration from saved state)
   */
  setBusinessData(data: Partial<BusinessData>): void {
    this.businessData = { ...this.businessData, ...data };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return this.conversationHistory;
  }

  /**
   * Set conversation history (for restoration)
   */
  setConversationHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    this.conversationHistory = history;
  }

  /**
   * Reset agent state
   */
  reset(): void {
    this.conversationHistory = [];
    this.businessData = {};
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Response Helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private createSuccessResponse(data: BusinessDataResponse): AgentResponse {
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: data.isComplete,
      toolCalls: [],
    };
  }

  private createErrorResponse(error: string): AgentResponse {
    const data: BusinessDataResponse = {
      success: false,
      isComplete: false,
      message: error,
    };
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton
 * ============================================================================
 */

let businessDataAgentInstance: BusinessDataAgent | null = null;

export function getBusinessDataAgent(): BusinessDataAgent {
  if (!businessDataAgentInstance) {
    businessDataAgentInstance = new BusinessDataAgent();
  }

  return businessDataAgentInstance;
}

export function resetBusinessDataAgent(): void {
  businessDataAgentInstance = null;
}

