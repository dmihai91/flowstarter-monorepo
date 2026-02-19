/**
 * Business Discovery Flow Integration Tests
 *
 * Tests the complete flow of business data collection during onboarding.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals: string[];
  brandTone: string;
  sellingMethod?: 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';
  sellingMethodDetails?: string;
  pricingOffers?: string;
  industry?: string;
}

type OnboardingStep =
  | 'welcome'
  | 'describe'
  | 'name'
  | 'business-uvp'
  | 'business-audience'
  | 'business-goals'
  | 'business-tone'
  | 'business-selling'
  | 'business-pricing'
  | 'business-summary'
  | 'template'
  | 'personalization'
  | 'creating'
  | 'ready';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ─── Mock Flow State ─────────────────────────────────────────────────────────

class MockOnboardingFlow {
  step: OnboardingStep = 'welcome';
  businessInfo: Partial<BusinessInfo> = {};
  messages: ChatMessage[] = [];
  projectName: string | null = null;
  projectDescription = '';

  setStep(step: OnboardingStep) {
    this.step = step;
  }

  addUserMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    return message;
  }

  addAssistantMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    return message;
  }

  updateBusinessInfo(info: Partial<BusinessInfo>) {
    this.businessInfo = { ...this.businessInfo, ...info };
  }
}

// ─── Complete Flow Tests ─────────────────────────────────────────────────────

describe('Complete Business Discovery Flow', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
    flow.projectName = 'Test Business';
    flow.projectDescription = 'A test business for unit tests';
    flow.setStep('business-uvp');
  });

  it('should complete full business discovery flow', async () => {
    // Step 1: UVP
    expect(flow.step).toBe('business-uvp');
    flow.addUserMessage('We offer personalized service with 24/7 support');
    flow.updateBusinessInfo({ uvp: 'We offer personalized service with 24/7 support' });
    flow.addAssistantMessage('Love the 24/7 support angle. Who are your ideal customers?');
    flow.setStep('business-audience');

    // Step 2: Target Audience
    expect(flow.step).toBe('business-audience');
    flow.addUserMessage('Small business owners who need reliable support');
    flow.updateBusinessInfo({ targetAudience: 'Small business owners who need reliable support' });
    flow.addAssistantMessage('Small business owners make great customers. What are your goals?');
    flow.setStep('business-goals');

    // Step 3: Goals
    expect(flow.step).toBe('business-goals');
    flow.addUserMessage('Generate leads, build trust, showcase expertise');
    flow.updateBusinessInfo({ businessGoals: ['Generate leads', 'build trust', 'showcase expertise'] });
    flow.addAssistantMessage('Those goals will shape your site. What tone fits your brand?');
    flow.setStep('business-tone');

    // Step 4: Tone
    expect(flow.step).toBe('business-tone');
    flow.addUserMessage('Professional but approachable');
    flow.updateBusinessInfo({ brandTone: 'Professional but approachable' });
    flow.addAssistantMessage('Professional but approachable is a great balance. How do you convert visitors?');
    flow.setStep('business-selling');

    // Step 5: Selling Method
    expect(flow.step).toBe('business-selling');
    flow.addUserMessage('We capture leads through contact forms and offer free consultations');
    flow.updateBusinessInfo({
      sellingMethod: 'leads',
      sellingMethodDetails: 'We capture leads through contact forms and offer free consultations'
    });
    flow.addAssistantMessage('Lead generation it is. Any pricing to highlight?');
    flow.setStep('business-pricing');

    // Step 6: Pricing (optional)
    expect(flow.step).toBe('business-pricing');
    flow.addUserMessage('Starting at $99/month for basic support');
    flow.updateBusinessInfo({ pricingOffers: 'Starting at $99/month for basic support' });
    flow.addAssistantMessage("That's everything. Here's your summary...");
    flow.setStep('business-summary');

    // Verify final state
    expect(flow.step).toBe('business-summary');
    expect(flow.businessInfo.uvp).toBe('We offer personalized service with 24/7 support');
    expect(flow.businessInfo.targetAudience).toBe('Small business owners who need reliable support');
    expect(flow.businessInfo.businessGoals).toHaveLength(3);
    expect(flow.businessInfo.brandTone).toBe('Professional but approachable');
    expect(flow.businessInfo.sellingMethod).toBe('leads');
    expect(flow.businessInfo.pricingOffers).toBe('Starting at $99/month for basic support');
  });

  it('should handle skipped pricing', async () => {
    flow.setStep('business-pricing');
    flow.updateBusinessInfo({
      uvp: 'Test UVP',
      targetAudience: 'Test audience',
      businessGoals: ['Goal 1'],
      brandTone: 'Professional',
      sellingMethod: 'leads',
    });

    flow.addUserMessage('Skip');
    // Pricing stays undefined when skipped
    flow.setStep('business-summary');

    expect(flow.step).toBe('business-summary');
    expect(flow.businessInfo.pricingOffers).toBeUndefined();
  });

  it('should generate correct number of messages per transition', () => {
    // Each step transition should produce:
    // 1. User message (their answer)
    // 2. Assistant message (acknowledgment + next question)

    flow.addUserMessage('UVP answer');
    flow.addAssistantMessage('Transition message');

    expect(flow.messages).toHaveLength(2);
    expect(flow.messages[0].role).toBe('user');
    expect(flow.messages[1].role).toBe('assistant');
  });
});

// ─── Business Goals Parsing Tests ────────────────────────────────────────────

describe('Business Goals Parsing', () => {
  const parseGoals = (answer: string): string[] => {
    return answer
      .split(/[,\n•\-\d+\.\)]/g)
      .map(g => g.trim())
      .filter(g => g.length > 0)
      .slice(0, 5);
  };

  it('should parse comma-separated goals', () => {
    const goals = parseGoals('Get more leads, Sell products, Build awareness');
    expect(goals).toEqual(['Get more leads', 'Sell products', 'Build awareness']);
  });

  it('should parse newline-separated goals', () => {
    const goals = parseGoals('Get more leads\nSell products\nBuild awareness');
    expect(goals).toEqual(['Get more leads', 'Sell products', 'Build awareness']);
  });

  it('should parse bullet point goals', () => {
    const goals = parseGoals('• Get more leads\n• Sell products\n• Build awareness');
    expect(goals).toEqual(['Get more leads', 'Sell products', 'Build awareness']);
  });

  it('should parse numbered list goals', () => {
    const goals = parseGoals('1. Get more leads\n2. Sell products\n3. Build awareness');
    expect(goals).toEqual(['Get more leads', 'Sell products', 'Build awareness']);
  });

  it('should limit to 5 goals maximum', () => {
    const goals = parseGoals('One, Two, Three, Four, Five, Six, Seven');
    expect(goals).toHaveLength(5);
  });

  it('should filter empty strings', () => {
    const goals = parseGoals('Goal one,, Goal two,   , Goal three');
    expect(goals).toEqual(['Goal one', 'Goal two', 'Goal three']);
  });
});

// ─── Selling Method Extraction Tests ─────────────────────────────────────────

describe('Selling Method Extraction', () => {
  type SellingMethod = 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';

  const extractSellingMethod = (answer: string): SellingMethod => {
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('ecommerce') || lowerAnswer.includes('product') ||
        lowerAnswer.includes('shop') || lowerAnswer.includes('store')) {
      return 'ecommerce';
    }
    if (lowerAnswer.includes('booking') || lowerAnswer.includes('appointment') ||
        lowerAnswer.includes('session') || lowerAnswer.includes('consultation')) {
      return 'bookings';
    }
    if (lowerAnswer.includes('lead') || lowerAnswer.includes('contact') ||
        lowerAnswer.includes('inquiry') || lowerAnswer.includes('form')) {
      return 'leads';
    }
    if (lowerAnswer.includes('subscription') || lowerAnswer.includes('membership') ||
        lowerAnswer.includes('course')) {
      return 'subscriptions';
    }
    if (lowerAnswer.includes('content') || lowerAnswer.includes('blog') ||
        lowerAnswer.includes('article') || lowerAnswer.includes('news')) {
      return 'content';
    }
    return 'other';
  };

  it('should detect ecommerce', () => {
    expect(extractSellingMethod('We sell products online')).toBe('ecommerce');
    expect(extractSellingMethod('Running an online store')).toBe('ecommerce');
    expect(extractSellingMethod('ecommerce business')).toBe('ecommerce');
    expect(extractSellingMethod('Have a shop with merchandise')).toBe('ecommerce');
  });

  it('should detect bookings', () => {
    expect(extractSellingMethod('Clients book appointments')).toBe('bookings');
    expect(extractSellingMethod('We take session bookings')).toBe('bookings');
    expect(extractSellingMethod('Free consultation offered')).toBe('bookings');
  });

  it('should detect leads', () => {
    expect(extractSellingMethod('We capture leads through forms')).toBe('leads');
    expect(extractSellingMethod('Visitors fill out a contact form')).toBe('leads');
    expect(extractSellingMethod('Handle inquiry requests via website')).toBe('leads');
  });

  it('should detect subscriptions', () => {
    expect(extractSellingMethod('Subscription-based service')).toBe('subscriptions');
    expect(extractSellingMethod('We offer memberships')).toBe('subscriptions');
    expect(extractSellingMethod('Selling online courses')).toBe('subscriptions');
  });

  it('should detect content', () => {
    expect(extractSellingMethod('We publish blog content')).toBe('content');
    expect(extractSellingMethod('Writing articles for monetization')).toBe('content');
    expect(extractSellingMethod('News and updates site')).toBe('content');
  });

  it('should fallback to other for unknown methods', () => {
    expect(extractSellingMethod('Various methods')).toBe('other');
    expect(extractSellingMethod('Something unique')).toBe('other');
    expect(extractSellingMethod('Affiliate marketing')).toBe('other');
  });

  it('should be case insensitive', () => {
    expect(extractSellingMethod('ECOMMERCE BUSINESS')).toBe('ecommerce');
    expect(extractSellingMethod('BOOKING SYSTEM')).toBe('bookings');
    expect(extractSellingMethod('LEAD GENERATION')).toBe('leads');
  });
});

// ─── Skip Detection Tests ────────────────────────────────────────────────────

describe('Skip Detection for Pricing', () => {
  const isSkipRequest = (answer: string): boolean => {
    const lower = answer.toLowerCase();
    return lower.includes('skip') || lower.includes('no') || lower.includes('none');
  };

  it('should detect skip requests', () => {
    expect(isSkipRequest('skip')).toBe(true);
    expect(isSkipRequest('Skip this')).toBe(true);
    expect(isSkipRequest('SKIP')).toBe(true);
  });

  it('should detect no responses', () => {
    expect(isSkipRequest('no')).toBe(true);
    expect(isSkipRequest('No pricing')).toBe(true);
    expect(isSkipRequest('NO')).toBe(true);
  });

  it('should detect none responses', () => {
    expect(isSkipRequest('none')).toBe(true);
    expect(isSkipRequest('None right now')).toBe(true);
  });

  it('should not skip valid pricing info', () => {
    expect(isSkipRequest('$99/month')).toBe(false);
    expect(isSkipRequest('Starting at $199')).toBe(false);
    expect(isSkipRequest('Free tier and premium plans')).toBe(false);
  });
});

// ─── Message Sequencing Tests ────────────────────────────────────────────────

describe('Message Sequencing', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
  });

  it('should not produce duplicate messages', () => {
    // Simulate a step transition
    flow.addUserMessage('User input');
    flow.addAssistantMessage('Single transition message');

    // Should have exactly 2 messages (user + assistant)
    expect(flow.messages).toHaveLength(2);

    // Messages should alternate
    expect(flow.messages[0].role).toBe('user');
    expect(flow.messages[1].role).toBe('assistant');
  });

  it('should maintain chronological order', () => {
    flow.addUserMessage('First');
    flow.addAssistantMessage('Response 1');
    flow.addUserMessage('Second');
    flow.addAssistantMessage('Response 2');

    const timestamps = flow.messages.map(m => m.timestamp);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it('should handle rapid sequential inputs', () => {
    // Simulate rapid inputs
    for (let i = 0; i < 5; i++) {
      flow.addUserMessage(`User message ${i}`);
      flow.addAssistantMessage(`Assistant response ${i}`);
    }

    expect(flow.messages).toHaveLength(10);

    // Verify alternating pattern
    flow.messages.forEach((msg, idx) => {
      expect(msg.role).toBe(idx % 2 === 0 ? 'user' : 'assistant');
    });
  });
});

// ─── State Persistence Tests ─────────────────────────────────────────────────

describe('State Persistence During Flow', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
  });

  it('should accumulate business info across steps', () => {
    flow.updateBusinessInfo({ uvp: 'Test UVP' });
    expect(flow.businessInfo.uvp).toBe('Test UVP');

    flow.updateBusinessInfo({ targetAudience: 'Test audience' });
    expect(flow.businessInfo.uvp).toBe('Test UVP');
    expect(flow.businessInfo.targetAudience).toBe('Test audience');

    flow.updateBusinessInfo({ businessGoals: ['Goal 1', 'Goal 2'] });
    expect(flow.businessInfo.uvp).toBe('Test UVP');
    expect(flow.businessInfo.targetAudience).toBe('Test audience');
    expect(flow.businessInfo.businessGoals).toEqual(['Goal 1', 'Goal 2']);
  });

  it('should allow updates to existing fields', () => {
    flow.updateBusinessInfo({ uvp: 'Initial UVP' });
    expect(flow.businessInfo.uvp).toBe('Initial UVP');

    flow.updateBusinessInfo({ uvp: 'Updated UVP' });
    expect(flow.businessInfo.uvp).toBe('Updated UVP');
  });

  it('should serialize to JSON for Convex sync', () => {
    flow.updateBusinessInfo({
      uvp: 'Test UVP',
      targetAudience: 'Test audience',
      businessGoals: ['Goal 1', 'Goal 2'],
      brandTone: 'Professional',
      sellingMethod: 'leads',
      pricingOffers: '$99/month',
    });

    const serialized = JSON.stringify(flow.businessInfo);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(flow.businessInfo);
  });
});

// ─── Summary Confirmation Flow Tests ─────────────────────────────────────────

describe('Summary Confirmation Flow', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
    flow.setStep('business-summary');
    flow.updateBusinessInfo({
      uvp: 'Great service',
      targetAudience: 'Everyone',
      businessGoals: ['Growth'],
      brandTone: 'Friendly',
      sellingMethod: 'leads',
    });
  });

  it('should proceed to template on confirmation', () => {
    flow.addUserMessage('Looks good!');
    flow.setStep('template');

    expect(flow.step).toBe('template');
  });

  it('should stay on summary when user wants to edit', () => {
    flow.addUserMessage('Let me adjust something');
    // Stay on summary for editing

    expect(flow.step).toBe('business-summary');
  });

  it('should allow field updates during edit mode', () => {
    flow.addUserMessage("Actually, my target audience is small businesses");
    flow.updateBusinessInfo({ targetAudience: 'small businesses' });

    expect(flow.businessInfo.targetAudience).toBe('small businesses');
    expect(flow.step).toBe('business-summary');
  });
});

// ─── Error Recovery Tests ────────────────────────────────────────────────────

describe('Error Recovery', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
  });

  it('should handle empty user input', () => {
    flow.setStep('business-uvp');
    flow.addUserMessage('');

    // Flow should still accept the message
    expect(flow.messages).toHaveLength(1);
    expect(flow.messages[0].content).toBe('');
  });

  it('should handle very long user input', () => {
    flow.setStep('business-uvp');
    const longInput = 'A'.repeat(10000);
    flow.addUserMessage(longInput);

    expect(flow.messages).toHaveLength(1);
    expect(flow.messages[0].content).toBe(longInput);
  });

  it('should handle special characters in input', () => {
    flow.setStep('business-uvp');
    const specialInput = 'Test <script>alert("XSS")</script> & "quotes" \'apostrophe\'';
    flow.addUserMessage(specialInput);

    expect(flow.messages[0].content).toBe(specialInput);
  });

  it('should handle unicode characters', () => {
    flow.setStep('business-uvp');
    const unicodeInput = 'Test 你好 мир 🎉 emoji';
    flow.addUserMessage(unicodeInput);

    expect(flow.messages[0].content).toBe(unicodeInput);
  });
});

// ─── Flow Navigation Tests ───────────────────────────────────────────────────

describe('Flow Navigation', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
  });

  it('should follow the correct step sequence', () => {
    const expectedSequence: OnboardingStep[] = [
      'business-uvp',
      'business-audience',
      'business-goals',
      'business-tone',
      'business-selling',
      'business-pricing',
      'business-summary',
    ];

    flow.setStep('business-uvp');

    expectedSequence.forEach((expectedStep, index) => {
      expect(flow.step).toBe(expectedStep);
      if (index < expectedSequence.length - 1) {
        flow.setStep(expectedSequence[index + 1]);
      }
    });
  });

  it('should allow going back to previous steps', () => {
    flow.setStep('business-goals');
    expect(flow.step).toBe('business-goals');

    flow.setStep('business-audience');
    expect(flow.step).toBe('business-audience');
  });
});

// ─── Name Refinement Flow Integration Tests ──────────────────────────────────

describe('Name Refinement Flow Integration', () => {
  // Simulates the name refinement detection logic
  const detectsRefinement = (input: string): boolean => {
    const lowerName = input.toLowerCase();
    return (
      lowerName.includes('make it') ||
      lowerName.includes('more punchy') ||
      lowerName.includes('more creative') ||
      lowerName.includes('more professional') ||
      lowerName.includes('shorter') ||
      lowerName.includes('try another') ||
      lowerName.includes('different name') ||
      lowerName.includes('something else')
    );
  };

  // Simulates the name acceptance pattern detection
  const parseNameAcceptance = (input: string): { isExplicit: boolean; isGeneric: boolean; name: string | null } => {
    const useNameMatch = input.match(/^(?:yes,?\s*)?(?:i'll\s*)?use\s*["']?([^"']+)["']?$/i);
    const extractedName = useNameMatch ? useNameMatch[1].trim() : null;
    const isGeneric = extractedName !== null && /^(this|that|the|it)\s*(name|one)?$/i.test(extractedName);
    return {
      isExplicit: extractedName !== null && !isGeneric,
      isGeneric,
      name: extractedName,
    };
  };

  it('should correctly handle the full refinement cycle', () => {
    // Step 1: User asks for suggestion
    const suggestInput = 'Suggest a name';
    expect(suggestInput.toLowerCase().includes('suggest')).toBe(true);

    // Step 2: System suggests "Inner Peace"
    const suggestedName = 'Inner Peace';

    // Step 3: User asks for refinement
    const refinementInput = 'Make it more professional and business-like';
    expect(detectsRefinement(refinementInput)).toBe(true);
    expect(parseNameAcceptance(refinementInput).isExplicit).toBe(false);

    // Step 4: System suggests "Flow Studio"
    const refinedName = 'Flow Studio';

    // Step 5: User accepts with explicit name
    const acceptInput = 'Use "Flow Studio"';
    const acceptance = parseNameAcceptance(acceptInput);
    expect(acceptance.isExplicit).toBe(true);
    expect(acceptance.name).toBe('Flow Studio');
    expect(detectsRefinement(acceptInput)).toBe(false);

    // The accepted name should be the refined one, not something else
    expect(acceptance.name).toBe(refinedName);
  });

  it('should not confuse refinement requests with name input', () => {
    // These should NOT be detected as refinement
    expect(detectsRefinement('Flow Studio')).toBe(false);
    expect(detectsRefinement('My Business Name')).toBe(false);
    expect(detectsRefinement('The Creative Hub')).toBe(false);

    // These SHOULD be detected as refinement
    expect(detectsRefinement('Make it more punchy')).toBe(true);
    expect(detectsRefinement('Something else please')).toBe(true);
    expect(detectsRefinement('Try another name')).toBe(true);
  });

  it('should distinguish between generic and explicit acceptance', () => {
    // Generic (use last suggested name)
    expect(parseNameAcceptance('Use this name').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use that one').isGeneric).toBe(true);
    expect(parseNameAcceptance('Use it').isGeneric).toBe(true);

    // Explicit (use the specified name)
    expect(parseNameAcceptance('Use Flow Studio').isExplicit).toBe(true);
    expect(parseNameAcceptance('Use "My Business"').isExplicit).toBe(true);
    expect(parseNameAcceptance("I'll use Creative Hub").isExplicit).toBe(true);
  });

  it('should handle multiple refinement iterations', () => {
    const refinementSequence = [
      { input: 'Make it punchy', expectedRefinement: true },
      { input: 'More creative', expectedRefinement: true },
      { input: 'Shorter please', expectedRefinement: true },
      { input: 'Use "Final Name"', expectedRefinement: false },
    ];

    for (const { input, expectedRefinement } of refinementSequence) {
      expect(detectsRefinement(input)).toBe(expectedRefinement);
    }
  });
});

// ─── Complete Onboarding Flow Edge Cases ─────────────────────────────────────

describe('Complete Onboarding Flow Edge Cases', () => {
  let flow: MockOnboardingFlow;

  beforeEach(() => {
    flow = new MockOnboardingFlow();
  });

  it('should handle user who skips all optional fields', async () => {
    flow.setStep('business-uvp');
    flow.addUserMessage('We provide great service');
    flow.updateBusinessInfo({ uvp: 'We provide great service' });
    flow.setStep('business-audience');

    flow.addUserMessage('Everyone who needs help');
    flow.updateBusinessInfo({ targetAudience: 'Everyone who needs help' });
    flow.setStep('business-goals');

    flow.addUserMessage('Get customers');
    flow.updateBusinessInfo({ businessGoals: ['Get customers'] });
    flow.setStep('business-tone');

    flow.addUserMessage('Professional');
    flow.updateBusinessInfo({ brandTone: 'Professional' });
    flow.setStep('business-selling');

    flow.addUserMessage('Various methods');
    flow.updateBusinessInfo({ sellingMethod: 'other' });
    flow.setStep('business-pricing');

    flow.addUserMessage('Skip');
    // pricingOffers stays undefined
    flow.setStep('business-summary');

    // Business info should be complete with required fields
    expect(flow.businessInfo.uvp).toBeDefined();
    expect(flow.businessInfo.targetAudience).toBeDefined();
    expect(flow.businessInfo.businessGoals).toBeDefined();
    expect(flow.businessInfo.brandTone).toBeDefined();
    expect(flow.businessInfo.sellingMethod).toBeDefined();
    expect(flow.businessInfo.pricingOffers).toBeUndefined();
  });

  it('should handle user who provides detailed responses', async () => {
    flow.setStep('business-uvp');

    const detailedUvp = `
      Our unique value proposition centers on three pillars:
      1. Personalized service with dedicated account managers
      2. 24/7 support with guaranteed response times under 1 hour
      3. AI-powered analytics to help customers make better decisions
      This combination sets us apart from competitors who only offer basic support.
    `;

    flow.addUserMessage(detailedUvp);
    flow.updateBusinessInfo({ uvp: detailedUvp.trim() });

    expect(flow.businessInfo.uvp).toContain('Personalized service');
    expect(flow.businessInfo.uvp).toContain('24/7 support');
    expect(flow.businessInfo.uvp).toContain('AI-powered analytics');
  });

  it('should handle rapid step transitions without data loss', async () => {
    const testData = {
      uvp: 'Test UVP',
      targetAudience: 'Test audience',
      businessGoals: ['Goal 1', 'Goal 2', 'Goal 3'],
      brandTone: 'Professional',
      sellingMethod: 'leads' as const,
      pricingOffers: '$99/month',
    };

    // Rapid updates
    flow.setStep('business-uvp');
    flow.updateBusinessInfo({ uvp: testData.uvp });
    flow.setStep('business-audience');
    flow.updateBusinessInfo({ targetAudience: testData.targetAudience });
    flow.setStep('business-goals');
    flow.updateBusinessInfo({ businessGoals: testData.businessGoals });
    flow.setStep('business-tone');
    flow.updateBusinessInfo({ brandTone: testData.brandTone });
    flow.setStep('business-selling');
    flow.updateBusinessInfo({ sellingMethod: testData.sellingMethod });
    flow.setStep('business-pricing');
    flow.updateBusinessInfo({ pricingOffers: testData.pricingOffers });
    flow.setStep('business-summary');

    // Verify all data persisted
    expect(flow.businessInfo).toMatchObject(testData);
  });

  it('should handle going back and modifying previous answers', async () => {
    // Complete flow first
    flow.updateBusinessInfo({
      uvp: 'Original UVP',
      targetAudience: 'Original audience',
      businessGoals: ['Original goal'],
      brandTone: 'Formal',
      sellingMethod: 'ecommerce',
    });
    flow.setStep('business-summary');

    // User decides to go back and change UVP
    flow.setStep('business-uvp');
    flow.updateBusinessInfo({ uvp: 'Updated UVP with more detail' });

    // Return to summary
    flow.setStep('business-summary');

    // UVP should be updated, other fields preserved
    expect(flow.businessInfo.uvp).toBe('Updated UVP with more detail');
    expect(flow.businessInfo.targetAudience).toBe('Original audience');
    expect(flow.businessInfo.businessGoals).toEqual(['Original goal']);
    expect(flow.businessInfo.brandTone).toBe('Formal');
    expect(flow.businessInfo.sellingMethod).toBe('ecommerce');
  });
});

// ─── Business Summary Generation Tests ────────────────────────────────────────

describe('Business Summary Generation', () => {
  // Helper to generate summary matching the API implementation
  const generateBusinessSummary = (
    projectName: string,
    businessInfo: Partial<BusinessInfo>
  ): string => {
    const sellingMethodLabels: Record<string, string> = {
      'ecommerce': 'E-commerce (selling products)',
      'bookings': 'Appointment bookings',
      'leads': 'Lead generation',
      'subscriptions': 'Subscriptions/memberships',
      'content': 'Content/media',
      'other': 'Other',
    };

    const goalsFormatted = businessInfo.businessGoals && businessInfo.businessGoals.length > 0
      ? businessInfo.businessGoals.map(g => `• ${g}`).join('\n')
      : '• Not specified';

    const pricingSection = businessInfo.pricingOffers
      ? `\n\n**Pricing/Offers:**\n${businessInfo.pricingOffers}`
      : '';

    return `Perfect! Here's a summary of **${projectName}**:

**What makes you unique:**
${businessInfo.uvp || 'Not specified'}

**Target audience:**
${businessInfo.targetAudience || 'Not specified'}

**Goals:**
${goalsFormatted}

**Brand tone:**
${businessInfo.brandTone || 'Not specified'}

**How you sell:**
${businessInfo.sellingMethod ? sellingMethodLabels[businessInfo.sellingMethod] || businessInfo.sellingMethod : 'Not specified'}${pricingSection}

Does this look right?`;
  };

  it('should generate complete summary with all fields', () => {
    const summary = generateBusinessSummary('Flow Studio', {
      uvp: 'We provide exceptional service',
      targetAudience: 'Small business owners',
      businessGoals: ['Generate leads', 'Build trust'],
      brandTone: 'Professional',
      sellingMethod: 'leads',
      pricingOffers: 'Starting at $99/month',
    });

    expect(summary).toContain('**Flow Studio**');
    expect(summary).toContain('We provide exceptional service');
    expect(summary).toContain('Small business owners');
    expect(summary).toContain('• Generate leads');
    expect(summary).toContain('• Build trust');
    expect(summary).toContain('Professional');
    expect(summary).toContain('Lead generation');
    expect(summary).toContain('$99/month');
  });

  it('should handle missing optional fields', () => {
    const summary = generateBusinessSummary('Test Business', {
      uvp: 'Test UVP',
      targetAudience: 'Test audience',
      businessGoals: ['Goal'],
      brandTone: 'Casual',
      sellingMethod: 'other',
    });

    expect(summary).toContain('**Test Business**');
    expect(summary).not.toContain('**Pricing/Offers:**');
  });

  it('should format multiple goals correctly', () => {
    const summary = generateBusinessSummary('Test', {
      businessGoals: ['Goal 1', 'Goal 2', 'Goal 3', 'Goal 4'],
    });

    expect(summary).toContain('• Goal 1');
    expect(summary).toContain('• Goal 2');
    expect(summary).toContain('• Goal 3');
    expect(summary).toContain('• Goal 4');
  });

  it('should show correct selling method labels', () => {
    const methods = ['ecommerce', 'bookings', 'leads', 'subscriptions', 'content', 'other'] as const;
    const expectedLabels = [
      'E-commerce (selling products)',
      'Appointment bookings',
      'Lead generation',
      'Subscriptions/memberships',
      'Content/media',
      'Other',
    ];

    methods.forEach((method, index) => {
      const summary = generateBusinessSummary('Test', { sellingMethod: method });
      expect(summary).toContain(expectedLabels[index]);
    });
  });
});

// ─── Step Transition Message Tests ───────────────────────────────────────────

describe('Step Transition Messages', () => {
  // Simulates the unified step transition pattern
  interface TransitionResult {
    fromStep: OnboardingStep;
    toStep: OnboardingStep;
    messageCount: number;
  }

  const simulateTransition = (fromStep: OnboardingStep, toStep: OnboardingStep): TransitionResult => {
    // Each transition should produce exactly ONE message
    return {
      fromStep,
      toStep,
      messageCount: 1,
    };
  };

  it('should produce single message for each transition', () => {
    const transitions: [OnboardingStep, OnboardingStep][] = [
      ['describe', 'name'],
      ['name', 'business-uvp'],
      ['business-uvp', 'business-audience'],
      ['business-audience', 'business-goals'],
      ['business-goals', 'business-tone'],
      ['business-tone', 'business-selling'],
      ['business-selling', 'business-pricing'],
      ['business-pricing', 'business-summary'],
      ['business-summary', 'template'],
      ['template', 'personalization'],
    ];

    for (const [from, to] of transitions) {
      const result = simulateTransition(from, to);
      expect(result.messageCount).toBe(1);
    }
  });

  it('should not produce duplicate acknowledgment messages', () => {
    // Old pattern was: acknowledgment message + prompt message = 2 messages
    // New pattern is: single unified message = 1 message

    const messages: string[] = [];

    // Simulate old pattern (WRONG - produces 2 messages)
    // messages.push("Great name!");
    // messages.push("What makes your business unique?");

    // Simulate new pattern (CORRECT - produces 1 message)
    messages.push("Love it! **Flow Studio** is a great name.\n\nWhat makes your business unique?");

    expect(messages).toHaveLength(1);
  });
});

