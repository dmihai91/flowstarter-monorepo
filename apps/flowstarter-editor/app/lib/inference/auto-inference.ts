/**
 * Auto-Inference Module
 * 
 * Automatically extracts business information from user descriptions
 * to minimize manual input during onboarding.
 * 
 * Infers:
 * - Business type (coach, therapist, trainer, etc.)
 * - Target audience
 * - Unique value proposition hints
 * - Recommended tone (can be overridden)
 * - Industry category
 */

import type { BrandTone, QuickProfile } from '~/components/editor/editor-chat/types';

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

interface BusinessTypeMatch {
  type: string;
  confidence: 'high' | 'medium' | 'low';
  category: string;
}

const BUSINESS_TYPE_PATTERNS: Array<{
  pattern: RegExp;
  type: string;
  category: string;
}> = [
  // Coaching
  { pattern: /\b(life\s*coach|coaching)/i, type: 'life coach', category: 'coaching' },
  { pattern: /\b(business\s*coach|executive\s*coach)/i, type: 'business coach', category: 'coaching' },
  { pattern: /\b(career\s*coach)/i, type: 'career coach', category: 'coaching' },
  { pattern: /\b(mindset|mindfulness)\s*coach/i, type: 'mindset coach', category: 'coaching' },
  { pattern: /\bcoach\b/i, type: 'coach', category: 'coaching' },
  
  // Mental Health
  { pattern: /\b(psychologist|psychology)/i, type: 'psychologist', category: 'mental-health' },
  { pattern: /\b(therapist|therapy|psychotherapy)/i, type: 'therapist', category: 'mental-health' },
  { pattern: /\b(counselor|counselling|counseling)/i, type: 'counselor', category: 'mental-health' },
  
  // Fitness
  { pattern: /\b(personal\s*trainer|pt\b|fitness\s*trainer)/i, type: 'personal trainer', category: 'fitness' },
  { pattern: /\b(yoga\s*(instructor|teacher))/i, type: 'yoga instructor', category: 'fitness' },
  { pattern: /\b(pilates)/i, type: 'pilates instructor', category: 'fitness' },
  { pattern: /\b(fitness\s*coach)/i, type: 'fitness coach', category: 'fitness' },
  { pattern: /\b(strength\s*coach|crossfit)/i, type: 'strength coach', category: 'fitness' },
  
  // Wellness
  { pattern: /\b(nutritionist|dietitian|nutrition)/i, type: 'nutritionist', category: 'wellness' },
  { pattern: /\b(massage\s*therapist)/i, type: 'massage therapist', category: 'wellness' },
  { pattern: /\b(acupunctur)/i, type: 'acupuncturist', category: 'wellness' },
  { pattern: /\b(naturopath)/i, type: 'naturopath', category: 'wellness' },
  { pattern: /\b(wellness|holistic)/i, type: 'wellness practitioner', category: 'wellness' },
  
  // Beauty
  { pattern: /\b(hair\s*stylist|hairstylist|hairdresser)/i, type: 'hairstylist', category: 'beauty' },
  { pattern: /\b(makeup\s*artist|mua\b)/i, type: 'makeup artist', category: 'beauty' },
  { pattern: /\b(esthetician|aesthetician|skincare)/i, type: 'esthetician', category: 'beauty' },
  { pattern: /\b(nail\s*(tech|technician|artist))/i, type: 'nail technician', category: 'beauty' },
  { pattern: /\b(barber)/i, type: 'barber', category: 'beauty' },
  
  // Creative
  { pattern: /\b(photograph)/i, type: 'photographer', category: 'creative' },
  { pattern: /\b(videograph)/i, type: 'videographer', category: 'creative' },
  { pattern: /\b(graphic\s*design)/i, type: 'graphic designer', category: 'creative' },
  { pattern: /\b(web\s*design)/i, type: 'web designer', category: 'creative' },
  { pattern: /\b(brand\s*design)/i, type: 'brand designer', category: 'creative' },
  { pattern: /\b(illustrat)/i, type: 'illustrator', category: 'creative' },
  
  // Education
  { pattern: /\b(tutor|tutoring)/i, type: 'tutor', category: 'education' },
  { pattern: /\b(music\s*(teacher|instructor|lesson))/i, type: 'music teacher', category: 'education' },
  { pattern: /\b(language\s*(teacher|tutor|instructor))/i, type: 'language teacher', category: 'education' },
  { pattern: /\b(online\s*course|course\s*creator)/i, type: 'course creator', category: 'education' },
];

export function detectBusinessType(description: string): BusinessTypeMatch | null {
  const lower = description.toLowerCase();
  
  for (const { pattern, type, category } of BUSINESS_TYPE_PATTERNS) {
    if (pattern.test(description)) {
      // Determine confidence based on match quality
      const exactMatch = new RegExp(`\\b${type}\\b`, 'i').test(description);
      return {
        type,
        category,
        confidence: exactMatch ? 'high' : 'medium',
      };
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TARGET AUDIENCE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

interface AudienceMatch {
  audience: string;
  confidence: 'high' | 'medium' | 'low';
}

const AUDIENCE_PATTERNS: Array<{
  pattern: RegExp;
  audience: string;
}> = [
  // Explicit "for" statements
  { pattern: /\bfor\s+(busy\s+)?(professionals|executives|entrepreneurs)/i, audience: 'busy professionals' },
  { pattern: /\bfor\s+(working\s+)?(moms?|mothers?|parents?)/i, audience: 'working parents' },
  { pattern: /\bfor\s+(small\s+)?business\s*owners?/i, audience: 'small business owners' },
  { pattern: /\bfor\s+(women|ladies|females?)/i, audience: 'women' },
  { pattern: /\bfor\s+(men|males?|guys?)/i, audience: 'men' },
  { pattern: /\bfor\s+(teens?|teenagers?|adolescents?)/i, audience: 'teenagers' },
  { pattern: /\bfor\s+(seniors?|elderly|older\s+adults?)/i, audience: 'seniors' },
  { pattern: /\bfor\s+(couples?|partners?)/i, audience: 'couples' },
  { pattern: /\bfor\s+(athletes?|sports)/i, audience: 'athletes' },
  { pattern: /\bfor\s+(beginners?|newbies?)/i, audience: 'beginners' },
  { pattern: /\bfor\s+(students?)/i, audience: 'students' },
  { pattern: /\bfor\s+(creatives?|artists?)/i, audience: 'creatives' },
  
  // "Help" statements
  { pattern: /\bhelp\s+(people|clients?|individuals?)\s+(who\s+)?(struggle|dealing|suffering)/i, audience: 'people seeking help' },
  { pattern: /\bhelp\s+(busy\s+)?(professionals?|executives?)/i, audience: 'busy professionals' },
  
  // "Work with" statements  
  { pattern: /\bwork\s+with\s+(high[\s-]?achieving|ambitious)/i, audience: 'high-achievers' },
  { pattern: /\bwork\s+with\s+(corporate|company|companies)/i, audience: 'corporate clients' },
];

export function extractTargetAudience(description: string): AudienceMatch | null {
  for (const { pattern, audience } of AUDIENCE_PATTERNS) {
    if (pattern.test(description)) {
      return { audience, confidence: 'high' };
    }
  }
  
  // Try to extract from "for X" or "help X" patterns generically
  const forMatch = description.match(/\bfor\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (forMatch) {
    return { audience: forMatch[1], confidence: 'medium' };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TONE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

interface ToneMatch {
  tone: BrandTone;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

export function detectTone(description: string): ToneMatch {
  const signals: string[] = [];
  let professionalScore = 0;
  let boldScore = 0;
  let friendlyScore = 0;
  
  // Professional indicators
  if (/\b(professional|expert|specialist|certified|licensed|experienced)\b/i.test(description)) {
    professionalScore += 2;
    signals.push('professional keywords');
  }
  if (/\b(corporate|executive|business|enterprise)\b/i.test(description)) {
    professionalScore += 1;
    signals.push('corporate context');
  }
  if (/\b(results|outcomes|measurable|proven|evidence)\b/i.test(description)) {
    professionalScore += 1;
    signals.push('results-focused');
  }
  
  // Bold indicators
  if (/!{2,}|!!/.test(description)) {
    boldScore += 2;
    signals.push('exclamation emphasis');
  }
  if (/\b(transform|breakthrough|unleash|ignite|dominate|crush|killer)\b/i.test(description)) {
    boldScore += 2;
    signals.push('power words');
  }
  if (/\b(best|top|#1|number one|leading)\b/i.test(description)) {
    boldScore += 1;
    signals.push('superlatives');
  }
  if (description.toUpperCase() === description && description.length > 20) {
    boldScore += 1;
    signals.push('all caps');
  }
  
  // Friendly indicators
  if (/\b(help|support|guide|journey|together|community)\b/i.test(description)) {
    friendlyScore += 2;
    signals.push('supportive language');
  }
  if (/\b(fun|enjoy|love|passion|heart)\b/i.test(description)) {
    friendlyScore += 1;
    signals.push('emotional words');
  }
  if (/😊|❤️|🙌|💪|✨|🌟/u.test(description)) {
    friendlyScore += 1;
    signals.push('emojis');
  }
  if (/\b(I'm|I am|my)\b/i.test(description)) {
    friendlyScore += 1;
    signals.push('personal pronouns');
  }
  
  // Determine winner
  const maxScore = Math.max(professionalScore, boldScore, friendlyScore);
  
  if (maxScore === 0) {
    return { tone: 'professional', confidence: 'low', signals: ['default'] };
  }
  
  let tone: BrandTone;
  if (boldScore === maxScore) {
    tone = 'bold';
  } else if (friendlyScore === maxScore) {
    tone = 'friendly';
  } else {
    tone = 'professional';
  }
  
  return {
    tone,
    confidence: maxScore >= 3 ? 'high' : 'medium',
    signals,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UVP EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export function extractUVP(description: string): string | null {
  // Look for explicit unique selling points
  const patterns = [
    /\bunique(?:ly)?\s+(.{10,50})/i,
    /\bspecializ(?:e|ing)\s+in\s+(.{10,50})/i,
    /\bfocus(?:ed|ing)?\s+on\s+(.{10,50})/i,
    /\bknown\s+for\s+(.{10,50})/i,
    /\bexpert\s+in\s+(.{10,50})/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim().replace(/[.,!?]$/, '');
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INFERENCE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface InferredBusinessInfo {
  businessType: BusinessTypeMatch | null;
  targetAudience: AudienceMatch | null;
  suggestedTone: ToneMatch;
  uvp: string | null;
  
  // Quick profile suggestions (user can override)
  suggestedProfile: Partial<QuickProfile>;
}

export function inferBusinessInfo(description: string): InferredBusinessInfo {
  const businessType = detectBusinessType(description);
  const targetAudience = extractTargetAudience(description);
  const suggestedTone = detectTone(description);
  const uvp = extractUVP(description);
  
  // Build suggested quick profile
  const suggestedProfile: Partial<QuickProfile> = {
    tone: suggestedTone.tone,
  };
  
  // Suggest goal based on business type
  if (businessType) {
    switch (businessType.category) {
      case 'coaching':
      case 'mental-health':
        suggestedProfile.goal = 'bookings';
        suggestedProfile.offerType = 'high-ticket';
        break;
      case 'fitness':
      case 'wellness':
      case 'beauty':
        suggestedProfile.goal = 'bookings';
        suggestedProfile.offerType = 'low-ticket';
        break;
      case 'creative':
        suggestedProfile.goal = 'leads';
        suggestedProfile.offerType = 'high-ticket';
        break;
      case 'education':
        suggestedProfile.goal = 'sales';
        suggestedProfile.offerType = 'low-ticket';
        break;
    }
  }
  
  return {
    businessType,
    targetAudience,
    suggestedTone,
    uvp,
    suggestedProfile,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT NAME GENERATION (Simple fallback)
// ═══════════════════════════════════════════════════════════════════════════

export function generateProjectName(description: string, businessType: BusinessTypeMatch | null): string {
  // If we detected a business type, use it
  if (businessType) {
    const capitalizedType = businessType.type
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `My ${capitalizedType} Site`;
  }
  
  // Fallback: extract first noun phrase
  const words = description.split(/\s+/).slice(0, 3);
  if (words.length > 0) {
    return `${words[0].charAt(0).toUpperCase()}${words[0].slice(1)} Site`;
  }
  
  return 'My Business Site';
}
