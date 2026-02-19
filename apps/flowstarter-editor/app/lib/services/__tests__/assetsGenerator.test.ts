/**
 * Assets Generator Tests
 *
 * Unit tests for fal.ai image generation during site builds.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fal.ai client
const mockFalSubscribe = vi.fn();
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: mockFalSubscribe,
  },
}));

// Mock LLM for asset analysis
vi.mock('~/lib/services/llm', () => ({
  generateCompletion: vi.fn(),
}));

import { 
  analyzeAssetNeeds, 
  generateSiteAssets, 
  assetsToTemplateVars,
  type AssetSpec,
  type GeneratedAsset,
  type AssetsGeneratorInput,
} from '../assetsGenerator.server';
import { generateCompletion } from '~/lib/services/llm';

describe('Assets Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FAL_KEY = 'test-fal-key';
  });

  describe('analyzeAssetNeeds', () => {
    it('should analyze business and return asset specs', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockResolvedValueOnce(`[
        {"type": "hero", "name": "hero-banner", "prompt": "Modern bakery storefront with fresh bread"},
        {"type": "feature", "name": "bread-display", "prompt": "Artisan bread on wooden shelf"}
      ]`);

      const input: AssetsGeneratorInput = {
        businessName: 'Artisan Bakery',
        businessDescription: 'Traditional bakery with fresh bread',
        industry: 'Food & Beverage',
      };

      const specs = await analyzeAssetNeeds(input);
      
      expect(specs).toHaveLength(2);
      expect(specs[0].type).toBe('hero');
      expect(specs[0].name).toBe('hero-banner');
      expect(specs[0].prompt).toContain('bakery');
    });

    it('should return default assets on LLM failure', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM Error'));

      const input: AssetsGeneratorInput = {
        businessName: 'Test Business',
        businessDescription: 'A test business',
      };

      const specs = await analyzeAssetNeeds(input);
      
      expect(specs.length).toBeGreaterThan(0);
      expect(specs[0].type).toBe('hero');
    });

    it('should add dimensions to specs', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockResolvedValueOnce(`[
        {"type": "hero", "name": "hero", "prompt": "test hero"}
      ]`);

      const input: AssetsGeneratorInput = {
        businessName: 'Test',
        businessDescription: 'Test',
      };

      const specs = await analyzeAssetNeeds(input);
      
      expect(specs[0].width).toBe(1920);
      expect(specs[0].height).toBe(1080);
    });
  });

  describe('generateSiteAssets', () => {
    it('should generate images with fal.ai', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockResolvedValueOnce(`[
        {"type": "hero", "name": "hero", "prompt": "test prompt"}
      ]`);

      mockFalSubscribe.mockResolvedValueOnce({
        data: {
          images: [{ url: 'https://fal.ai/generated/image.jpg' }],
          seed: 12345,
        },
      });

      const input: AssetsGeneratorInput = {
        businessName: 'Test Business',
        businessDescription: 'A test business',
      };

      const progressMessages: string[] = [];
      const assets = await generateSiteAssets(input, (msg) => progressMessages.push(msg));
      
      expect(assets).toHaveLength(1);
      expect(assets[0].url).toBe('https://fal.ai/generated/image.jpg');
      expect(assets[0].type).toBe('hero');
      expect(progressMessages.length).toBeGreaterThan(0);
    });

    it('should return empty array when FAL_KEY not set', async () => {
      delete process.env.FAL_KEY;
      
      const input: AssetsGeneratorInput = {
        businessName: 'Test',
        businessDescription: 'Test',
      };

      const assets = await generateSiteAssets(input);
      
      expect(assets).toHaveLength(0);
    });

    it('should handle fal.ai errors gracefully', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockResolvedValueOnce(`[
        {"type": "hero", "name": "hero", "prompt": "test"}
      ]`);

      mockFalSubscribe.mockRejectedValueOnce(new Error('fal.ai error'));

      const input: AssetsGeneratorInput = {
        businessName: 'Test',
        businessDescription: 'Test',
      };

      const assets = await generateSiteAssets(input);
      
      // Should not throw, just return what it could generate
      expect(Array.isArray(assets)).toBe(true);
    });

    it('should limit to 4 assets max', async () => {
      const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
      mockGenerateCompletion.mockResolvedValueOnce(`[
        {"type": "hero", "name": "hero", "prompt": "1"},
        {"type": "feature", "name": "f1", "prompt": "2"},
        {"type": "feature", "name": "f2", "prompt": "3"},
        {"type": "feature", "name": "f3", "prompt": "4"},
        {"type": "feature", "name": "f4", "prompt": "5"},
        {"type": "feature", "name": "f5", "prompt": "6"}
      ]`);

      mockFalSubscribe.mockResolvedValue({
        data: { images: [{ url: 'https://fal.ai/img.jpg' }] },
      });

      const input: AssetsGeneratorInput = {
        businessName: 'Test',
        businessDescription: 'Test',
      };

      const assets = await generateSiteAssets(input);
      
      // Should cap at 4
      expect(assets.length).toBeLessThanOrEqual(4);
    });
  });

  describe('assetsToTemplateVars', () => {
    it('should convert assets to template variables', () => {
      const assets: GeneratedAsset[] = [
        { type: 'hero', name: 'hero-banner', url: 'https://fal.ai/hero.jpg', prompt: 'hero' },
        { type: 'feature', name: 'feature-1', url: 'https://fal.ai/feature.jpg', prompt: 'feature' },
      ];

      const vars = assetsToTemplateVars(assets);
      
      expect(vars.heroImage).toBe('https://fal.ai/hero.jpg');
      expect(vars.hero_image_url).toBe('https://fal.ai/hero.jpg');
      expect(vars.featureImage).toBe('https://fal.ai/feature.jpg');
    });

    it('should handle empty assets', () => {
      const vars = assetsToTemplateVars([]);
      expect(Object.keys(vars)).toHaveLength(0);
    });
  });
});

describe('Asset Types', () => {
  it('should support all asset types', () => {
    const types = ['hero', 'product', 'team', 'background', 'feature'];
    
    types.forEach(type => {
      const spec: AssetSpec = {
        type: type as any,
        name: `test-${type}`,
        prompt: `Test ${type} image`,
      };
      expect(spec.type).toBe(type);
    });
  });
});

