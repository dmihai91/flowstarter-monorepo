import { generateCompletion, generateJSON, prompts, type LLMMessage } from './llm';

/**
 * Business Details Agent
 *
 * Interactive agent for gathering comprehensive business information during onboarding:
 * - Unique Selling Proposition (USP)
 * - Target customers/audience
 * - Pricing and offers
 * - Business goals
 * - Brand tone and personality
 * - Industry/niche
 */

export interface BusinessDetails {
  businessName: string;
  description: string;
  uvp: string; // Unique Value Proposition
  targetAudience: string;
  industry?: string;
  pricingOffers?: string;
  businessGoals: string[];
  brandTone: string;
  sellingMethod?: string;
  sellingMethodDetails?: string;
  features?: string[];
}

export interface ProjectMetadata {
  projectName: string;
  description: string;
  tags: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class BusinessAgent {
  private conversationHistory: ChatMessage[] = [];
  private businessDetails: Partial<BusinessDetails> = {};
  private gatheringPhase: 'initial' | 'uvp' | 'audience' | 'goals' | 'pricing' | 'tone' | 'summary' = 'initial';

  /**
   * Start the conversation
   */
  async start(): Promise<string> {
    const initialMessage = await generateCompletion(
      [
        { role: 'system', content: prompts.businessAgent },
        { role: 'user', content: 'Hello, I want to start a new project.' },
      ],
      { temperature: 0.8 },
    );

    this.conversationHistory.push({
      role: 'assistant',
      content: initialMessage,
    });

    return initialMessage;
  }

  /**
   * Process user response and get next question or extract information
   */
  async processResponse(
    userMessage: string,
  ): Promise<{ message: string; isComplete: boolean; businessInfo?: BusinessDetails }> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Extract information from user message
    await this.extractInformation(userMessage);

    // Check if we have enough information
    if (this.hasEnoughInformation()) {
      const summary = this.generateSummary();
      return {
        message: summary,
        isComplete: true,
        businessInfo: this.getBusinessDetails(),
      };
    }

    // Get next question based on what's missing
    const nextQuestion = await this.getNextQuestion();

    this.conversationHistory.push({
      role: 'assistant',
      content: nextQuestion,
    });

    return { message: nextQuestion, isComplete: false };
  }

  /**
   * Get the next question to ask based on what information is missing
   */
  private async getNextQuestion(): Promise<string> {
    const missing = this.getMissingFields();

    const messages: LLMMessage[] = [
      { role: 'system', content: prompts.businessAgent },
      ...this.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'system',
        content: `Information gathered so far: ${JSON.stringify(this.businessDetails)}

Missing information: ${missing.join(', ')}

Ask ONE focused question to gather the next piece of missing information. Be conversational and specific.
Priority order: business description, unique value proposition, target audience, goals, pricing (optional), brand tone (optional).`,
      },
    ];

    return await generateCompletion(messages, { temperature: 0.8 });
  }

  /**
   * Get list of missing required fields
   */
  private getMissingFields(): string[] {
    const missing: string[] = [];

    if (!this.businessDetails.businessName) {
      missing.push('business name');
    }

    if (!this.businessDetails.description) {
      missing.push('business description');
    }

    if (!this.businessDetails.uvp) {
      missing.push('unique value proposition (what makes them special)');
    }

    if (!this.businessDetails.targetAudience) {
      missing.push('target audience');
    }

    if (!this.businessDetails.businessGoals || this.businessDetails.businessGoals.length === 0) {
      missing.push('main goals');
    }

    return missing;
  }

  /**
   * Extract information from user message using LLM
   */
  private async extractInformation(userMessage: string): Promise<void> {
    const extractionPrompt = `Extract business information from this conversation message:

"${userMessage}"

Previous conversation context:
${this.conversationHistory
  .slice(-4)
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

Current information we have: ${JSON.stringify(this.businessDetails)}

Extract any new information mentioned. Only include fields that are clearly mentioned.
Respond with JSON (use null for fields not mentioned in this message):
{
  "businessName": "extracted name or null",
  "description": "what the business/project does or null",
  "uvp": "unique value proposition - what makes them different or null",
  "targetAudience": "who are their customers/users or null",
  \"industry\": \"industry or niche or null\",
  \"pricingOffers\": \"pricing structure or special offers mentioned or null\",
  \"businessGoals\": [\"goal1\", \"goal2\"] or null,
  \"brandTone\": \"professional/friendly/playful/luxury/etc or null\",
  \"sellingMethod\": \"ecommerce/bookings/leads/subscriptions/content/other or null\",
  \"sellingMethodDetails\": \"rich text detail of how they sell or null\",
  \"features\": [\"feature1\", \"feature2\"] or null
}`;

    try {
      const extracted = await generateJSON<Partial<BusinessDetails>>([{ role: 'user', content: extractionPrompt }], {
        temperature: 0.3,
      });

      // Merge extracted information (don't overwrite with null)
      if (extracted.businessName) {
        this.businessDetails.businessName = extracted.businessName;
      }

      if (extracted.description) {
        this.businessDetails.description = extracted.description;
      }

      if (extracted.uvp) {
        this.businessDetails.uvp = extracted.uvp;
      }

      if (extracted.targetAudience) {
        this.businessDetails.targetAudience = extracted.targetAudience;
      }

      if (extracted.industry) {
        this.businessDetails.industry = extracted.industry;
      }

      if (extracted.pricingOffers) {
        this.businessDetails.pricingOffers = extracted.pricingOffers;
      }

      if (extracted.brandTone) {
        this.businessDetails.brandTone = extracted.brandTone;
      }

      if (extracted.sellingMethod) {
        this.businessDetails.sellingMethod = extracted.sellingMethod;
      }

      if (extracted.sellingMethodDetails) {
        this.businessDetails.sellingMethodDetails = extracted.sellingMethodDetails;
      }

      if (extracted.businessGoals && extracted.businessGoals.length > 0) {
        this.businessDetails.businessGoals = [
          ...(this.businessDetails.businessGoals || []),
          ...extracted.businessGoals,
        ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate
      }

      if (extracted.features && extracted.features.length > 0) {
        this.businessDetails.features = [...(this.businessDetails.features || []), ...extracted.features].filter(
          (v, i, a) => a.indexOf(v) === i,
        ); // Deduplicate
      }
    } catch (error) {
      console.error('Failed to extract information:', error);
    }
  }

  /**
   * Check if we have enough information to proceed
   */
  private hasEnoughInformation(): boolean {
    const hasRequired = !!(
      this.businessDetails.businessName &&
      this.businessDetails.description &&
      this.businessDetails.uvp &&
      this.businessDetails.targetAudience &&
      this.businessDetails.businessGoals &&
      this.businessDetails.businessGoals.length > 0
    );

    // Also require at least 4 conversation exchanges (2 rounds of Q&A)
    return hasRequired && this.conversationHistory.length >= 4;
  }

  /**
   * Generate summary of gathered information
   */
  private generateSummary(): string {
    const details = this.businessDetails;
    return `I've gathered the key information about your project:

**Business:** ${details.businessName}
**What you do:** ${details.description}
**Unique Value:** ${details.uvp}
**Target Audience:** ${details.targetAudience}
${details.industry ? `**Industry:** ${details.industry}` : ''}
${details.pricingOffers ? `**Pricing/Offers:** ${details.pricingOffers}` : ''}
**Goals:** ${details.businessGoals?.join(', ') || 'Not specified'}
${details.brandTone ? `**Brand Tone:** ${details.brandTone}` : ''}
${details.features && details.features.length > 0 ? `**Key Features:** ${details.features.join(', ')}` : ''}

This will help me find the perfect template and customize it for your brand!`;
  }

  /**
   * Generate project metadata from business details
   */
  async generateProjectMetadata(): Promise<ProjectMetadata> {
    const businessInfo = this.formatBusinessInfoForLLM();

    const metadata = await generateJSON<ProjectMetadata>(
      [{ role: 'user', content: prompts.generateProjectMetadata(businessInfo) }],
      { temperature: 0.7 },
    );

    return metadata;
  }

  /**
   * Regenerate project metadata with feedback
   */
  async regenerateProjectMetadata(feedback?: string): Promise<ProjectMetadata> {
    const businessInfo = this.formatBusinessInfoForLLM();

    const metadata = await generateJSON<ProjectMetadata>(
      [
        {
          role: 'user',
          content:
            prompts.generateProjectMetadata(businessInfo) +
            (feedback ? `\n\nPlease address this feedback: ${feedback}` : '\n\nGenerate a different variation.'),
        },
      ],
      { temperature: 0.9 },
    );

    return metadata;
  }

  /**
   * Format business info for LLM prompts
   */
  private formatBusinessInfoForLLM(): string {
    const d = this.businessDetails;
    return `
Business Name: ${d.businessName || 'Not specified'}
Description: ${d.description || 'Not specified'}
Unique Value Proposition: ${d.uvp || 'Not specified'}
Target Audience: ${d.targetAudience || 'Not specified'}
Industry: ${d.industry || 'Not specified'}
Pricing/Offers: ${d.pricingOffers || 'Not specified'}
Goals: ${d.businessGoals?.join(', ') || 'Not specified'}
Brand Tone: ${d.brandTone || 'Not specified'}
Key Features: ${d.features?.join(', ') || 'Not specified'}
    `.trim();
  }

  /**
   * Get the gathered business details
   */
  getBusinessDetails(): BusinessDetails {
    return {
      businessName: this.businessDetails.businessName || '',
      description: this.businessDetails.description || '',
      uvp: this.businessDetails.uvp || '',
      targetAudience: this.businessDetails.targetAudience || '',
      industry: this.businessDetails.industry,
      sellingMethod: this.businessDetails.sellingMethod,
      sellingMethodDetails: this.businessDetails.sellingMethodDetails,
      pricingOffers: this.businessDetails.pricingOffers,
      businessGoals: this.businessDetails.businessGoals || [],
      brandTone: this.businessDetails.brandTone || 'professional',
      features: this.businessDetails.features,
    };
  }

  /**
   * Set business details (for restoration from saved state)
   */
  setBusinessDetails(details: Partial<BusinessDetails>): void {
    this.businessDetails = { ...this.businessDetails, ...details };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Check if information gathering is completed
   */
  isCompleted(): boolean {
    return this.hasEnoughInformation();
  }

  /**
   * Reset the agent state
   */
  reset(): void {
    this.conversationHistory = [];
    this.businessDetails = {};
    this.gatheringPhase = 'initial';
  }
}

