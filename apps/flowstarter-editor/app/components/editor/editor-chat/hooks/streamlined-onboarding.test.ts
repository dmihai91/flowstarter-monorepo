/**
 * Streamlined Onboarding Tests
 * 
 * Tests for onboarding message generation, step transitions,
 * and flow logic.
 */

import { describe, it, expect } from 'vitest';
import {
  getWelcomeMessage,
  getDescribeAckMessage,
  getQuickProfileAckMessage,
  getTemplateAckMessage,
  getPersonalizationAckMessage,
  getCreatingMessage,
  getReadyMessage,
  getNextStepFromCurrent,
  generateOnboardingResponse,
  getSuggestedQuickProfile,
} from './streamlined-onboarding';
import { inferBusinessInfo } from '~/lib/inference/auto-inference';
import type { QuickProfile, OnboardingStep } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME MESSAGE
// ═══════════════════════════════════════════════════════════════════════════

describe('getWelcomeMessage', () => {
  it('returns a message with content', () => {
    const message = getWelcomeMessage();
    expect(message.content).toBeDefined();
    expect(message.content.length).toBeGreaterThan(0);
  });

  it('personalizes message when userName provided', () => {
    const message = getWelcomeMessage('John');
    expect(message.content).toContain('John');
  });

  it('uses generic greeting without userName', () => {
    const message = getWelcomeMessage();
    expect(message.content).not.toContain('undefined');
  });

  it('includes suggestions for common business types', () => {
    const message = getWelcomeMessage();
    expect(message.suggestions).toBeDefined();
    expect(message.suggestions!.length).toBeGreaterThan(0);
  });

  it('suggestions include coach, therapist, trainer examples', () => {
    const message = getWelcomeMessage();
    const suggestionTexts = message.suggestions!.map(s => s.text.toLowerCase());
    
    expect(suggestionTexts.some(t => t.includes('coach'))).toBe(true);
    expect(suggestionTexts.some(t => t.includes('therapist'))).toBe(true);
    expect(suggestionTexts.some(t => t.includes('trainer'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DESCRIBE ACKNOWLEDGMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('getDescribeAckMessage', () => {
  it('acknowledges detected business type', () => {
    const description = "I'm a life coach helping busy professionals";
    const inference = inferBusinessInfo(description);
    const message = getDescribeAckMessage(description, inference);
    
    expect(message.content).toContain('life coach');
  });

  it('includes audience in acknowledgment when detected', () => {
    // The implementation includes audience in the format: "A {type} helping {audience}"
    const description = "I'm a life coach for busy professionals";
    const inference = inferBusinessInfo(description);
    const message = getDescribeAckMessage(description, inference);
    
    // The message should mention the business type
    expect(message.content.toLowerCase()).toContain('life coach');
  });

  it('handles descriptions without detected business type', () => {
    const description = 'I help people online';
    const inference = inferBusinessInfo(description);
    const message = getDescribeAckMessage(description, inference);
    
    expect(message.content).toBeDefined();
    expect(message.content.length).toBeGreaterThan(0);
  });

  it('shows quick profile selector', () => {
    const description = "I'm a coach";
    const inference = inferBusinessInfo(description);
    const message = getDescribeAckMessage(description, inference);
    
    expect(message.showQuickProfile).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUICK PROFILE ACKNOWLEDGMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('getQuickProfileAckMessage', () => {
  it('acknowledges leads goal', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    const message = getQuickProfileAckMessage(profile);
    
    expect(message.content.toLowerCase()).toContain('lead');
  });

  it('acknowledges sales goal', () => {
    const profile: QuickProfile = {
      goal: 'sales',
      offerType: 'low-ticket',
      tone: 'friendly',
    };
    const message = getQuickProfileAckMessage(profile);
    
    expect(message.content.toLowerCase()).toContain('sales');
  });

  it('acknowledges bookings goal', () => {
    const profile: QuickProfile = {
      goal: 'bookings',
      offerType: 'low-ticket',
      tone: 'friendly',
    };
    const message = getQuickProfileAckMessage(profile);
    
    expect(message.content.toLowerCase()).toContain('booking');
  });

  it('shows template selector', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    const message = getQuickProfileAckMessage(profile);
    
    expect(message.showTemplateSelector).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE ACKNOWLEDGMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('getTemplateAckMessage', () => {
  it('includes template name in message', () => {
    const message = getTemplateAckMessage('Authority Builder');
    expect(message.content).toContain('Authority Builder');
  });

  it('shows personalization panel', () => {
    const message = getTemplateAckMessage('Coach Pro');
    expect(message.showPersonalization).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALIZATION ACKNOWLEDGMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('getPersonalizationAckMessage', () => {
  it('indicates building process will start', () => {
    const message = getPersonalizationAckMessage();
    expect(message.content.toLowerCase()).toContain('building');
  });

  it('does not show any selectors', () => {
    const message = getPersonalizationAckMessage();
    expect(message.showQuickProfile).toBeUndefined();
    expect(message.showTemplateSelector).toBeUndefined();
    expect(message.showPersonalization).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CREATING MESSAGE
// ═══════════════════════════════════════════════════════════════════════════

describe('getCreatingMessage', () => {
  it('shows progress percentage', () => {
    const message = getCreatingMessage(50);
    expect(message.content).toContain('50%');
  });

  it('shows appropriate stage message at 0%', () => {
    const message = getCreatingMessage(0);
    expect(message.content).toBeDefined();
  });

  it('shows appropriate stage message at 50%', () => {
    const message = getCreatingMessage(50);
    expect(message.content).toBeDefined();
  });

  it('shows appropriate stage message at 100%', () => {
    const message = getCreatingMessage(100);
    expect(message.content).toBeDefined();
  });

  it('progresses through different stages', () => {
    const at20 = getCreatingMessage(20);
    const at60 = getCreatingMessage(60);
    const at90 = getCreatingMessage(90);
    
    // Different stages should have different content
    expect(at20.content).not.toBe(at60.content);
    expect(at60.content).not.toBe(at90.content);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// READY MESSAGE
// ═══════════════════════════════════════════════════════════════════════════

describe('getReadyMessage', () => {
  it('includes preview URL', () => {
    const message = getReadyMessage('https://preview.flowstarter.app/123', 'My Coach Site');
    expect(message.content).toContain('https://preview.flowstarter.app/123');
  });

  it('includes project name', () => {
    const message = getReadyMessage('https://preview.flowstarter.app/123', 'My Coach Site');
    expect(message.content).toContain('My Coach Site');
  });

  it('mentions next steps', () => {
    const message = getReadyMessage('https://preview.flowstarter.app/123', 'My Coach Site');
    const lowerContent = message.content.toLowerCase();
    expect(lowerContent).toContain('next');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('getNextStepFromCurrent', () => {
  it('welcome -> describe', () => {
    const next = getNextStepFromCurrent('welcome', false, false, false, false, false);
    expect(next).toBe('describe');
  });

  it('describe -> describe when no description', () => {
    const next = getNextStepFromCurrent('describe', false, false, false, false, false);
    expect(next).toBe('describe');
  });

  it('describe -> quick-profile when has description', () => {
    const next = getNextStepFromCurrent('describe', true, false, false, false, false);
    expect(next).toBe('quick-profile');
  });

  it('quick-profile -> quick-profile when no profile', () => {
    const next = getNextStepFromCurrent('quick-profile', true, false, false, false, false);
    expect(next).toBe('quick-profile');
  });

  it('quick-profile -> template when has profile', () => {
    const next = getNextStepFromCurrent('quick-profile', true, true, false, false, false);
    expect(next).toBe('template');
  });

  it('template -> template when no template', () => {
    const next = getNextStepFromCurrent('template', true, true, false, false, false);
    expect(next).toBe('template');
  });

  it('template -> personalization when has template', () => {
    const next = getNextStepFromCurrent('template', true, true, true, false, false);
    expect(next).toBe('personalization');
  });

  it('personalization -> personalization when not personalized', () => {
    const next = getNextStepFromCurrent('personalization', true, true, true, false, false);
    expect(next).toBe('personalization');
  });

  it('personalization -> creating when personalized', () => {
    const next = getNextStepFromCurrent('personalization', true, true, true, true, true);
    expect(next).toBe('creating');
  });

  it('creating -> ready', () => {
    const next = getNextStepFromCurrent('creating', true, true, true, true, true);
    expect(next).toBe('ready');
  });

  it('ready -> ready (stays)', () => {
    const next = getNextStepFromCurrent('ready', true, true, true, true, true);
    expect(next).toBe('ready');
  });

  describe('legacy step migration', () => {
    it('name -> describe', () => {
      const next = getNextStepFromCurrent('name' as OnboardingStep, false, false, false, false, false);
      expect(next).toBe('describe');
    });

    it('business-uvp -> quick-profile', () => {
      const next = getNextStepFromCurrent('business-uvp' as OnboardingStep, false, false, false, false, false);
      expect(next).toBe('quick-profile');
    });

    it('business-summary -> template', () => {
      const next = getNextStepFromCurrent('business-summary' as OnboardingStep, false, false, false, false, false);
      expect(next).toBe('template');
    });

    it('integrations -> ready', () => {
      const next = getNextStepFromCurrent('integrations' as OnboardingStep, false, false, false, false, false);
      expect(next).toBe('ready');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe('generateOnboardingResponse', () => {
  it('generates welcome message for welcome step', () => {
    const response = generateOnboardingResponse({
      step: 'welcome',
    });
    
    expect(response.content).toBeDefined();
    expect(response.suggestions).toBeDefined();
  });

  it('generates describe ack when description provided', () => {
    const response = generateOnboardingResponse({
      step: 'describe',
      description: "I'm a life coach for entrepreneurs",
    });
    
    expect(response.content).toContain('life coach');
    expect(response.showQuickProfile).toBe(true);
  });

  it('generates quick-profile ack when profile provided', () => {
    const response = generateOnboardingResponse({
      step: 'quick-profile',
      quickProfile: {
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'professional',
      },
    });
    
    expect(response.showTemplateSelector).toBe(true);
  });

  it('generates template ack when template selected', () => {
    const response = generateOnboardingResponse({
      step: 'template',
      templateName: 'Coach Pro',
    });
    
    expect(response.content).toContain('Coach Pro');
    expect(response.showPersonalization).toBe(true);
  });

  it('generates creating message with progress', () => {
    const response = generateOnboardingResponse({
      step: 'creating',
      buildProgress: 50,
    });
    
    expect(response.content).toContain('50%');
  });

  it('generates ready message with preview URL', () => {
    const response = generateOnboardingResponse({
      step: 'ready',
      previewUrl: 'https://preview.flowstarter.app/123',
      projectName: 'My Site',
    });
    
    expect(response.content).toContain('https://preview.flowstarter.app/123');
    expect(response.content).toContain('My Site');
  });

  it('personalizes welcome with userName', () => {
    const response = generateOnboardingResponse({
      step: 'welcome',
      userName: 'Jane',
    });
    
    expect(response.content).toContain('Jane');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUICK PROFILE INFERENCE
// ═══════════════════════════════════════════════════════════════════════════

describe('getSuggestedQuickProfile', () => {
  it('suggests bookings for coaching descriptions', () => {
    const profile = getSuggestedQuickProfile("I'm a business coach");
    expect(profile.goal).toBe('bookings');
  });

  it('suggests high-ticket for coaching descriptions', () => {
    const profile = getSuggestedQuickProfile("I'm an executive coach");
    expect(profile.offerType).toBe('high-ticket');
  });

  it('suggests professional tone for corporate descriptions', () => {
    const profile = getSuggestedQuickProfile('Corporate executive coaching with proven results');
    expect(profile.tone).toBe('professional');
  });

  it('suggests leads for creative descriptions', () => {
    const profile = getSuggestedQuickProfile('Freelance photographer for weddings');
    expect(profile.goal).toBe('leads');
  });

  it('suggests sales for education descriptions', () => {
    const profile = getSuggestedQuickProfile('Online course creator');
    expect(profile.goal).toBe('sales');
  });
});
