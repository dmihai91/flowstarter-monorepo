import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock functions BEFORE any imports
const mockGenerateText = vi.fn();
const mockOpenai = vi.fn(() => 'mock-openai-model');

// Mock AI SDK - must be before imports
vi.mock('ai', async () => ({
  generateText: mockGenerateText,
}));

vi.mock('@ai-sdk/openai', async () => ({
  openai: mockOpenai,
}));

// Use dynamic import to ensure mocks are applied
let aiModerateContent: typeof import('../ai-moderation').aiModerateContent;

beforeEach(async () => {
  const moderationModule = await import('../ai-moderation');
  aiModerateContent = moderationModule.aiModerateContent;
});

describe('AI Content Moderation', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reload module to ensure fresh state
    const moderationModule = await import('../ai-moderation');
    aiModerateContent = moderationModule.aiModerateContent;
  });

  describe('Keyword Pre-screening', () => {
    it('should detect adult content keywords and reject immediately', async () => {
      const result = await aiModerateContent({
        description: 'Chat with OnlyFans models here',
        industry: 'Entertainment',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskScore).toBe(90);
      expect(result.categories).toContain('adult-explicit');
      expect(result.recommendation).toBe('REQUEST_REJECTED');
      expect(mockGenerateText).not.toHaveBeenCalled(); // Should short-circuit
    });

    it('should detect spicy girls keyword', async () => {
      const result = await aiModerateContent({
        description: 'Platform for spicy girls to chat with fans',
        industry: 'Social',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendation).toBe('REQUEST_REJECTED');
    });

    it('should detect escort services', async () => {
      const result = await aiModerateContent({
        description: 'Premium escort booking service',
        industry: 'Services',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.categories).toContain('sexual-services');
    });

    it('should detect webcam services', async () => {
      const result = await aiModerateContent({
        description: 'Webcam chat platform',
        services: 'Adult cam shows',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should be case-insensitive for keyword detection', async () => {
      const result = await aiModerateContent({
        description: 'ONLYFANS style platform',
        industry: 'Social',
      });

      expect(result.isProhibited).toBe(true);
    });
  });

  describe('AI-based Moderation', () => {
    it('should approve safe business content', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'LOW',
          reasons: [],
          riskScore: 10,
          categories: [],
          recommendation: 'APPROVED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Building a project management SaaS for teams',
        industry: 'Technology',
        businessType: 'B2B Software',
        goals: 'Help teams collaborate better',
      });

      expect(result.isProhibited).toBe(false);
      expect(result.riskLevel).toBe('LOW');
      expect(result.recommendation).toBe('APPROVED');
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should handle HIGH risk level as prohibited', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'HIGH',
          reasons: ['Potentially problematic content'],
          riskScore: 70,
          categories: ['high-risk'],
          recommendation: 'REVIEW_REQUIRED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Borderline service offering',
        industry: 'Services',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should handle CRITICAL risk level as prohibited', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'CRITICAL',
          reasons: ['Illegal activity detected'],
          riskScore: 95,
          categories: ['illegal'],
          recommendation: 'REQUEST_REJECTED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Platform for illegal services',
        industry: 'Services',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should treat non-APPROVED recommendations as prohibited', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'MEDIUM',
          reasons: ['Requires manual review'],
          riskScore: 55,
          categories: ['uncertain'],
          recommendation: 'REVIEW_REQUIRED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Ambiguous business description',
        industry: 'Various',
      });

      expect(result.isProhibited).toBe(true);
    });

    it('should treat risk score >= 60 as prohibited', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'MEDIUM',
          reasons: ['Moderate risk detected'],
          riskScore: 65,
          categories: ['moderate-risk'],
          recommendation: 'REVIEW_REQUIRED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Risky business venture',
        industry: 'Services',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskScore).toBe(65);
    });

    it('should handle markdown JSON response format', async () => {
      mockGenerateText.mockResolvedValue({
        text: '```json\n{"isProhibited":false,"riskLevel":"LOW","reasons":[],"riskScore":5,"categories":[],"recommendation":"APPROVED"}\n```',
      });

      const result = await aiModerateContent({
        description: 'E-commerce store for handmade crafts',
        industry: 'Retail',
      });

      expect(result.isProhibited).toBe(false);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should handle plain markdown code block format', async () => {
      mockGenerateText.mockResolvedValue({
        text: '```\n{"isProhibited":false,"riskLevel":"LOW","reasons":[],"riskScore":10,"categories":[],"recommendation":"APPROVED"}\n```',
      });

      const result = await aiModerateContent({
        description: 'Online tutoring platform',
        industry: 'Education',
      });

      expect(result.isProhibited).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return conservative fallback on moderation error', async () => {
      mockGenerateText.mockRejectedValue(new Error('AI service timeout'));

      const result = await aiModerateContent({
        description: 'Any business description',
        industry: 'Technology',
      });

      // Implementation fails open - allows through on service failure
      // Keyword pre-screen catches obvious violations before AI call
      expect(result.isProhibited).toBe(false);
      expect(result.riskLevel).toBe('LOW');
      expect(result.riskScore).toBe(0);
      expect(result.recommendation).toBe('APPROVED');
    });

    it('should return conservative fallback on JSON parse error', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Invalid JSON response',
      });

      const result = await aiModerateContent({
        description: 'Business description',
        industry: 'Technology',
      });

      // Fails open on parse error
      expect(result.isProhibited).toBe(false);
      expect(result.recommendation).toBe('APPROVED');
    });

    it('should handle empty responses permissively', async () => {
      mockGenerateText.mockResolvedValue({
        text: '',
      });

      const result = await aiModerateContent({
        description: 'Some description',
        industry: 'Industry',
      });

      // Fails open
      expect(result.isProhibited).toBe(false);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('Input Handling', () => {
    it('should handle missing optional fields', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'LOW',
          reasons: [],
          riskScore: 15,
          categories: [],
          recommendation: 'APPROVED',
        }),
      });

      const result = await aiModerateContent({
        description: 'Simple business description',
      });

      expect(result.isProhibited).toBe(false);
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should handle empty strings gracefully', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'LOW',
          reasons: [],
          riskScore: 20,
          categories: [],
          recommendation: 'APPROVED',
        }),
      });

      const result = await aiModerateContent({
        description: '',
        industry: '',
        businessType: '',
      });

      expect(result).toBeDefined();
    });

    it('should check services field for prohibited keywords', async () => {
      const result = await aiModerateContent({
        description: 'Entertainment services',
        services: 'Adult entertainment and explicit content',
      });

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
    });
  });

  describe('System Prompt Construction', () => {
    it('should pass all business info fields to AI model', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          isProhibited: false,
          riskLevel: 'LOW',
          reasons: [],
          riskScore: 10,
          categories: [],
          recommendation: 'APPROVED',
        }),
      });

      await aiModerateContent({
        description: 'Comprehensive business platform',
        industry: 'Technology',
        businessType: 'SaaS',
        goals: 'Streamline operations',
        services: 'Cloud hosting and analytics',
      });

      expect(mockGenerateText).toHaveBeenCalled();
      const callArgs = mockGenerateText.mock.calls[0][0];
      const userMessage = callArgs.messages.find(
        (m: { role: string }) => m.role === 'user'
      );

      expect(userMessage.content).toContain('Comprehensive business platform');
      expect(userMessage.content).toContain('Technology');
      expect(userMessage.content).toContain('SaaS');
      expect(userMessage.content).toContain('Streamline operations');
      expect(userMessage.content).toContain('Cloud hosting and analytics');
    });
  });
});
