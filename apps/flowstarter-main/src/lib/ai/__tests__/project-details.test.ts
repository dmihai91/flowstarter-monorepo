import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock functions BEFORE any imports
const mockAiModerateContent = vi.fn();
const mockGenerateObject = vi.fn();
const mockModels = {
  projectDetails: 'mock-model',
};

// Mock dependencies - must be before imports
vi.mock('../ai-moderation', async () => ({
  aiModerateContent: mockAiModerateContent,
}));

vi.mock('ai', async () => ({
  generateObject: mockGenerateObject,
}));

vi.mock('../openrouter-client', async () => ({
  models: mockModels,
}));

// Use dynamic import to ensure mocks are applied
let generateProjectDetails: typeof import('../project-details').generateProjectDetails;
let moderateBusinessInfo: typeof import('../project-details').moderateBusinessInfo;
type BusinessInfo = import('../project-details').BusinessInfo;

beforeEach(async () => {
  // Set the environment variable before importing the module
  vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');
  const projectDetailsModule = await import('../project-details');
  generateProjectDetails = projectDetailsModule.generateProjectDetails;
  moderateBusinessInfo = projectDetailsModule.moderateBusinessInfo;
});

describe('AI Project Details Generation', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Ensure env var is set for each test
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');
    // Reload module to ensure fresh state
    const projectDetailsModule = await import('../project-details');
    generateProjectDetails = projectDetailsModule.generateProjectDetails;
    moderateBusinessInfo = projectDetailsModule.moderateBusinessInfo;
  });

  describe('moderateBusinessInfo', () => {
    it('should return safe result for approved content', async () => {
      mockAiModerateContent.mockResolvedValue({
        isProhibited: false,
        riskLevel: 'LOW',
        reasons: [],
        riskScore: 10,
        categories: [],
        recommendation: 'APPROVED',
      });

      const businessInfo: BusinessInfo = {
        description: 'Building a SaaS platform for project management',
        industry: 'Technology',
        businessType: 'B2B SaaS',
      };

      const result = await moderateBusinessInfo(businessInfo);

      expect(result.isProhibited).toBe(false);
      expect(result.riskLevel).toBe('LOW');
      expect(result.recommendation).toBe('APPROVED');
    });

    it('should return prohibited result for high-risk content', async () => {
      mockAiModerateContent.mockResolvedValue({
        isProhibited: true,
        riskLevel: 'HIGH',
        reasons: ['Prohibited content detected'],
        riskScore: 90,
        categories: ['adult-content'],
        recommendation: 'REQUEST_REJECTED',
      });

      const businessInfo: BusinessInfo = {
        description: 'Adult entertainment website',
        industry: 'Entertainment',
      };

      const result = await moderateBusinessInfo(businessInfo);

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendation).toBe('REQUEST_REJECTED');
    });

    it('should return conservative fallback on moderation error', async () => {
      mockAiModerateContent.mockRejectedValue(new Error('Service unavailable'));

      const businessInfo: BusinessInfo = {
        description: 'A business platform',
        industry: 'Technology',
      };

      const result = await moderateBusinessInfo(businessInfo);

      expect(result.isProhibited).toBe(true);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.reasons).toContain(
        'Moderation service unavailable; conservative review required'
      );
      expect(result.recommendation).toBe('REVIEW_REQUIRED');
    });
  });

  describe('generateProjectDetails', () => {
    const validBusinessInfo: BusinessInfo = {
      description:
        'Building a modern e-commerce platform for sustainable fashion brands',
      industry: 'E-commerce',
      businessType: 'B2C',
      targetAudience: 'Eco-conscious millennials',
      uniqueSellingPoint: 'Carbon-neutral shipping and sustainable materials',
    };

    it('should generate project details successfully', async () => {
      // Description must be at least 300 chars, USP must be at least 150 chars
      const longDescription =
        'A sustainable fashion e-commerce platform connecting eco-conscious consumers with ethical brands. We partner with verified sustainable manufacturers and ensure carbon-neutral shipping on every order. Our platform makes it easy to discover and shop for eco-friendly fashion that looks great and feels even better knowing you are making a positive impact on the environment.';
      const longUSP =
        'Carbon-neutral shipping with verified sustainable materials. Every product on our platform is certified eco-friendly and we offset 100% of our carbon footprint through verified environmental programs.';

      mockGenerateObject.mockResolvedValue({
        object: {
          name: 'EcoStyle',
          names: ['EcoStyle', 'GreenThreads', 'SustainShop'],
          description: longDescription,
          targetUsers:
            'Millennials interested in sustainable fashion; Eco-conscious shoppers',
          businessGoals:
            'Promote sustainable fashion; Reduce carbon footprint; Support ethical brands',
          USP: longUSP,
        },
      });

      const result = await generateProjectDetails(
        'Generate compelling project details for this sustainable fashion platform',
        validBusinessInfo
      );

      expect(result.names).toHaveLength(3);
      expect(result.names[0]).toBe('EcoStyle');
      expect(result.description).toContain('sustainable fashion');
      expect(result.targetUsers).toContain('Millennials');
      expect(result.businessGoals).toContain('sustainable fashion');
      expect(result.USP).toContain('Carbon-neutral');
    });

    it('should reject invalid business info with missing description', async () => {
      const invalidBusinessInfo: BusinessInfo = {
        industry: 'Technology',
        description: '', // Empty - will fail validation
      };

      await expect(
        generateProjectDetails('Generate details', invalidBusinessInfo)
      ).rejects.toThrow('Invalid business info');
    });

    it('should reject invalid business info with missing industry', async () => {
      const invalidBusinessInfo: BusinessInfo = {
        description: 'A comprehensive business platform for enterprises',
        industry: '', // Empty
      };

      await expect(
        generateProjectDetails('Generate details', invalidBusinessInfo)
      ).rejects.toThrow('Invalid business info');
    });

    it('should handle catchy chip action context', async () => {
      // Meet minimum length requirements: description >= 300, USP >= 150
      const catchyDescription =
        'Catchy description with memorable phrasing! Our fashion platform brings you the hottest trends at lightning speed. We curate the most stylish pieces from top designers and emerging brands, delivering them straight to your door with our express shipping. Experience fashion like never before with our personalized style recommendations and exclusive member discounts.';
      const catchyUSP =
        'Lightning-fast fashion finds delivered to your door within 24 hours. Our AI-powered style engine learns your preferences and curates the perfect wardrobe for you every season.';

      mockGenerateObject.mockResolvedValue({
        object: {
          names: ['SnapStyle', 'TrendPop'],
          description: catchyDescription,
          targetUsers: 'Fashion-forward shoppers',
          businessGoals: 'Create buzz; Go viral',
          USP: catchyUSP,
        },
      });

      const result = await generateProjectDetails(
        'Generate catchy project details',
        validBusinessInfo,
        { chipAction: 'makeItCatchy', randomSeed: 12345 }
      );

      expect(result.names).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('should handle shorter chip action context', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          names: ['EcoShop'],
          description: 'Sustainable fashion, fast.',
          targetUsers: 'Eco shoppers',
          businessGoals: 'Sustainability',
          USP: 'Green shipping',
        },
      });

      const result = await generateProjectDetails(
        'Generate concise project details',
        validBusinessInfo,
        { chipAction: 'makeItShorter' }
      );

      expect(result.description.length).toBeLessThanOrEqual(500);
      expect(result.description).toBeTruthy();
    });

    it('should include custom prompt instructions', async () => {
      // Meet minimum length requirements
      const luxuryDescription =
        'Following custom instructions exactly. Our luxurious premium brand delivers an unparalleled experience to discerning customers who appreciate the finer things in life. From meticulously sourced materials to expert craftsmanship, every detail is carefully considered to exceed your expectations. Discover a world of refined elegance and sophisticated style.';
      const luxuryUSP =
        'Custom USP crafted with precision and care. We offer exclusive access to limited edition products and personalized concierge service that caters to your unique preferences and lifestyle needs.';

      mockGenerateObject.mockResolvedValue({
        object: {
          names: ['CustomBrand'],
          description: luxuryDescription,
          targetUsers: 'Target audience',
          businessGoals: 'Custom goals',
          USP: luxuryUSP,
        },
      });

      const customPrompt = 'Make it sound luxurious and premium';

      await generateProjectDetails(
        'Generate project details',
        validBusinessInfo,
        { customPrompt, randomSeed: 54321 }
      );

      expect(mockGenerateObject).toHaveBeenCalled();
      const callArgs = mockGenerateObject.mock.calls[0][0];
      // The prompt is passed directly, not as messages array
      expect(callArgs.prompt).toContain(customPrompt);
    });

    it('should handle previousValue for regeneration', async () => {
      // Meet minimum length requirements
      const altDescription =
        'A completely different approach to sustainable fashion that revolutionizes how you shop. Our innovative platform combines cutting-edge technology with eco-conscious values to deliver a shopping experience that is both enjoyable and environmentally responsible. We partner with emerging designers who share our commitment to sustainability and ethical production practices.';
      const altUSP =
        'Different USP that sets us apart from the competition. Our unique approach combines personalized styling with sustainable sourcing to create a fashion experience that is truly one of a kind.';

      mockGenerateObject.mockResolvedValue({
        object: {
          names: ['NewName', 'FreshName'],
          description: altDescription,
          targetUsers: 'New target',
          businessGoals: 'New goals',
          USP: altUSP,
        },
      });

      await generateProjectDetails(
        'Generate alternative project details',
        validBusinessInfo,
        {
          previousValue: 'OldProjectName',
          chipAction: 'alternatives',
          randomSeed: 99999,
        }
      );

      expect(mockGenerateObject).toHaveBeenCalled();
      const callArgs = mockGenerateObject.mock.calls[0][0];
      // The prompt is passed directly, not as messages array
      expect(callArgs.prompt).toContain('OldProjectName');
    });

    it('should retry with lower temperature on first failure', async () => {
      // Meet minimum length requirements
      const retryDescription =
        'Generated on second attempt after the first one failed. Our platform delivers exceptional value to customers through innovative technology and personalized service. We combine industry expertise with cutting-edge solutions to create experiences that exceed expectations. Join thousands of satisfied customers who have discovered the difference our approach makes.';
      const retryUSP =
        'USP that differentiates us from competitors. Our unique methodology combines proven strategies with innovative techniques to deliver results that speak for themselves.';

      mockGenerateObject
        .mockResolvedValueOnce({ object: null })
        .mockResolvedValueOnce({
          object: {
            names: ['RetrySuccess'],
            description: retryDescription,
            targetUsers: 'Target users',
            businessGoals: 'Goals',
            USP: retryUSP,
          },
        });

      const result = await generateProjectDetails(
        'Generate details',
        validBusinessInfo
      );

      expect(result.names[0]).toBe('RetrySuccess');
      expect(mockGenerateObject).toHaveBeenCalledTimes(2);
    });

    it('should throw error when generation fails completely', async () => {
      // Mock returns null for all retry attempts (3 temperatures x 3 retries = 9 calls max)
      mockGenerateObject.mockResolvedValue({ object: null });

      await expect(
        generateProjectDetails('Generate details', validBusinessInfo)
      ).rejects.toThrow(/Failed to generate project details/);
    });

    it('should truncate description to 700 characters', async () => {
      const longDescription = 'A'.repeat(800);

      mockGenerateObject.mockResolvedValue({
        object: {
          names: ['TestProject'],
          description: longDescription,
          targetUsers: 'Users',
          businessGoals: 'Goals',
          USP: 'U'.repeat(200), // Meet minimum USP length
        },
      });

      const result = await generateProjectDetails(
        'Generate details',
        validBusinessInfo
      );

      expect(result.description.length).toBe(700);
    });

    it('should handle missing optional fields gracefully', async () => {
      // Meet minimum length requirements - USP is optional so we test with minimal USP
      const minimalDescription =
        'A minimal description that still meets our length requirements. This project focuses on delivering core value to users through a streamlined experience. We prioritize simplicity and ease of use while maintaining high quality standards. Our approach emphasizes getting things done efficiently without unnecessary complexity.';
      const minimalUSP =
        'Simple and effective solution that gets the job done. We focus on what matters most to our users and deliver results without unnecessary bells and whistles.';

      mockGenerateObject.mockResolvedValue({
        object: {
          name: 'MinimalProject',
          description: minimalDescription,
          targetUsers: 'Some users',
          USP: minimalUSP,
        },
      });

      const result = await generateProjectDetails(
        'Generate minimal details',
        validBusinessInfo
      );

      expect(result.names).toEqual(['MinimalProject']);
      expect(result.businessGoals).toBeUndefined();
      expect(result.brandTone).toBeUndefined();
    });
  });

  describe('Business Info Validation', () => {
    it('should validate minimum description length', async () => {
      const shortDescription: BusinessInfo = {
        description: '', // Empty - will fail validation
        industry: 'Tech',
      };

      await expect(
        generateProjectDetails('Generate', shortDescription)
      ).rejects.toThrow();
    });

    it('should validate required industry field', async () => {
      const noIndustry: BusinessInfo = {
        description: 'A valid length description here',
      };

      await expect(
        generateProjectDetails('Generate', noIndustry)
      ).rejects.toThrow();
    });
  });
});
