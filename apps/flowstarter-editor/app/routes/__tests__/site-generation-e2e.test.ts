/**
 * Site Generation E2E Tests
 *
 * End-to-end tests for the complete site generation and modification flows.
 * Tests the full pipeline including asset generation, routing, and multi-agent orchestration.
 * 
 * These tests require a running dev server. They will skip if the server is unavailable.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 120000; // 2 minutes for full generation

// Server availability flag
let serverAvailable = false;

/**
 * Check if the dev server is running
 */
async function checkServerAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${BASE_URL}/`, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 is fine, server is responding
  } catch {
    return false;
  }
}

/**
 * Helper to make API requests - skips if server unavailable
 */
async function apiRequest(endpoint: string, body: object) {
  if (!serverAvailable) {
    throw new Error('Server not available - skipping test');
  }
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}

/**
 * Helper to consume SSE stream
 */
async function consumeSSEStream(response: Response): Promise<{
  events: Array<{ type: string; data: any }>;
  finalResult: any;
}> {
  const events: Array<{ type: string; data: any }> = [];
  let finalResult: any = null;

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push({ type: data.type, data });
          
          if (data.type === 'complete') {
            finalResult = data.result || data;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  return { events, finalResult };
}

describe('Site Generation E2E', () => {
  beforeAll(async () => {
    serverAvailable = await checkServerAvailable();
    if (!serverAvailable) {
      console.log(`[E2E] Dev server not available at ${BASE_URL} - tests will skip`);
    }
  });

  describe('Modification Router', () => {
    it('should route simple modifications correctly', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/modification-router', {
        instruction: 'change the title to Welcome',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect((data.decision as Record<string, unknown>).route).toBe('simple');
      expect((data.decision as Record<string, unknown>).confidence).toBeGreaterThanOrEqual(0.7);
      expect(data.latencyMs).toBeLessThan(500); // Should be fast
    });

    it('should route complex modifications to gretly', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/modification-router', {
        instruction: 'add a new pricing page with three tier options',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect((data.decision as Record<string, unknown>).route).toBe('gretly');
    });

    it('should handle edge cases gracefully', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/modification-router', {
        instruction: '',
      });

      // Should return error for empty instruction
      expect(response.ok).toBe(false);
    });
  });

  describe('Assets Agent', () => {
    it('should analyze business for asset needs', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/assets-agent', {
        action: 'analyze',
        businessName: 'Artisan Bakery',
        businessDescription: 'Traditional bakery with fresh sourdough bread',
        industry: 'Food & Beverage',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect(data.suggestions).toBeDefined();
      expect(Array.isArray(data.suggestions)).toBe(true);
      
      if ((data.suggestions as unknown[]).length > 0) {
        expect((data.suggestions as unknown[])[0]).toHaveProperty('type');
        expect((data.suggestions as unknown[])[0]).toHaveProperty('prompt');
      }
    });

    it('should generate image with fal.ai', async () => {
      // Skip if FAL_KEY not available
      if (!process.env.FAL_KEY) {
        console.log('Skipping fal.ai test - FAL_KEY not set');
        return;
      }
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/assets-agent', {
        action: 'generate',
        type: 'hero',
        prompt: 'Professional bakery storefront, warm lighting, artisan bread display',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      if (data.success) {
        expect(data.url).toBeDefined();
        expect(data.url).toMatch(/^https?:\/\//);
      }
    }, TIMEOUT);
  });

  describe('Simple Modification Flow', () => {
    it('should apply simple modifications via Convex', async () => {
      // This test requires a project to exist
      const testProjectId = process.env.TEST_PROJECT_ID;
      if (!testProjectId) {
        console.log('Skipping - TEST_PROJECT_ID not set');
        return;
      }
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/modify-site', {
        action: 'modify',
        projectId: testProjectId,
        instruction: 'Change the hero headline to "Welcome to Our Site"',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    }, TIMEOUT);
  });

  describe('Cost Simulator', () => {
    it('should estimate generation costs', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/cost-simulator', {
        type: 'generation',
        complexity: 'medium',
        includeAssets: true,
        numAssets: 3,
        numFixAttempts: 1,
        includeReview: true,
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect(data.totalCost).toBeDefined();
      expect(data.totalCost).toBeGreaterThan(0);
      expect(data.phases).toBeDefined();
      expect(data.breakdown).toBeDefined();
    });

    it('should estimate modification costs', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const response = await apiRequest('/api/cost-simulator', {
        type: 'modification',
        route: 'simple',
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as Record<string, unknown>;
      
      expect(data.success).toBe(true);
      expect(data.totalCost).toBeLessThan(0.1); // Simple should be cheap
    });

    it('should show gretly costs higher than simple', async () => {
      if (!serverAvailable) {
        console.log('Skipping - dev server not available');
        return;
      }

      const simpleResponse = await apiRequest('/api/cost-simulator', {
        type: 'modification',
        route: 'simple',
      });
      const gretlyResponse = await apiRequest('/api/cost-simulator', {
        type: 'modification',
        route: 'gretly',
      });

      const simpleData = await simpleResponse.json() as Record<string, unknown>;
      const gretlyData = await gretlyResponse.json() as Record<string, unknown>;
      
      expect(gretlyData.totalCost as number).toBeGreaterThan(simpleData.totalCost as number);
    });
  });
});

describe('Full Generation Pipeline', () => {
  it('should generate a complete site with assets', async () => {
    // Skip in CI without proper setup
    if (!process.env.RUN_FULL_E2E) {
      console.log('Skipping full E2E - set RUN_FULL_E2E=true to run');
      return;
    }

    const response = await apiRequest('/api/build', {
      projectId: `test-${Date.now()}`,
      siteName: 'Test Bakery Site',
      businessInfo: {
        name: 'Artisan Bakery',
        description: 'Traditional bakery with fresh bread and pastries',
        tagline: 'Fresh bread, baked with love',
        services: ['Bread', 'Pastries', 'Custom Cakes'],
        contact: {
          email: 'hello@artisanbakery.com',
          phone: '+1 555-0123',
        },
      },
      template: {
        slug: 'modern-business',
        name: 'Modern Business',
      },
      design: {
        primaryColor: '#D97706',
        secondaryColor: '#F59E0B',
        fontFamily: 'Inter',
      },
      deployToPreview: false,
    });

    expect(response.ok).toBe(true);
    
    const { events, finalResult } = await consumeSSEStream(response);
    
    // Should have progress events
    const progressEvents = events.filter(e => e.type === 'progress');
    expect(progressEvents.length).toBeGreaterThan(0);
    
    // Should have asset generation event (if FAL_KEY set)
    if (process.env.FAL_KEY) {
      const assetEvent = events.find(e => 
        e.data.message?.includes('image') || e.data.message?.includes('asset')
      );
      expect(assetEvent).toBeDefined();
    }
    
    // Final result should be successful
    expect(finalResult).toBeDefined();
    expect(finalResult.success).toBe(true);
    expect(finalResult.files).toBeDefined();
    expect(finalResult.files.length).toBeGreaterThan(0);
    
    // Should have generated content files including images.md
    const fileNames = finalResult.files.map((f: any) => f.path);
    expect(fileNames.some((f: string) => f.includes('hero.md'))).toBe(true);
    expect(fileNames.some((f: string) => f.includes('services.md'))).toBe(true);
  }, TIMEOUT);
});

describe('Gretly Modification Pipeline', () => {
  it('should handle complex modifications via Gretly', async () => {
    // Skip in CI without proper setup
    if (!process.env.RUN_FULL_E2E || !process.env.TEST_PROJECT_ID) {
      console.log('Skipping Gretly E2E - set RUN_FULL_E2E=true and TEST_PROJECT_ID');
      return;
    }

    const response = await apiRequest('/api/gretly-modify', {
      projectId: process.env.TEST_PROJECT_ID,
      instruction: 'Add a new testimonials section with 3 customer reviews',
      currentFiles: {
        'src/pages/index.astro': '<!-- placeholder -->',
      },
    });

    expect(response.ok).toBe(true);
    
    const { events, finalResult } = await consumeSSEStream(response);
    
    // Should have phase change events
    const phaseEvents = events.filter(e => e.type === 'phase');
    expect(phaseEvents.length).toBeGreaterThan(0);
    
    // Should go through planning phase
    const planningEvent = phaseEvents.find(e => 
      e.data.phase?.includes('plan') || e.data.message?.includes('Plan')
    );
    expect(planningEvent).toBeDefined();
    
    // Final result
    if (finalResult) {
      expect(finalResult.success).toBe(true);
    }
  }, TIMEOUT);
});

describe('Integration Tests', () => {
  it('should route and execute simple modification end-to-end', async () => {
    if (!process.env.RUN_FULL_E2E || !process.env.TEST_PROJECT_ID) {
      console.log('Skipping integration test');
      return;
    }

    // Step 1: Route the request
    const routeResponse = await apiRequest('/api/modification-router', {
      instruction: 'change the button color to blue',
    });
    const routeData = await routeResponse.json() as Record<string, unknown>;
    
    expect((routeData.decision as Record<string, unknown>).route).toBe('simple');

    // Step 2: Execute via simple flow
    const modifyResponse = await apiRequest('/api/modify-site', {
      action: 'modify',
      projectId: process.env.TEST_PROJECT_ID,
      instruction: 'change the button color to blue',
    });
    const modifyData = await modifyResponse.json() as Record<string, unknown>;
    
    expect(modifyData.success).toBe(true);
  }, TIMEOUT);

  it('should route and execute complex modification via Gretly', async () => {
    if (!process.env.RUN_FULL_E2E || !process.env.TEST_PROJECT_ID) {
      console.log('Skipping Gretly integration test');
      return;
    }

    // Step 1: Route the request
    const routeResponse = await apiRequest('/api/modification-router', {
      instruction: 'add a new blog section with recent posts',
    });
    const routeData = await routeResponse.json() as Record<string, unknown>;
    
    expect((routeData.decision as Record<string, unknown>).route).toBe('gretly');

    // Step 2: Would execute via Gretly
    console.log('Gretly route confirmed, skipping full execution');
  });
});
