/**
 * @fileoverview Main content moderation class for detecting harmful content.
 * @module @flowstarter/security/content-moderator
 */

import {
  BlockedCategory,
  ModerationFlag,
  ModerationInput,
  ModerationResult,
  Severity,
} from './types.js';
import { SECURITY_WEIGHTS, PROTECTED_BRANDS, DEFAULT_THRESHOLD, MAX_TEXT_LENGTH } from './constants.js';
import { SlangDictionary } from './slang-dictionary.js';

/**
 * Pattern definitions for different categories of harmful content.
 */
interface PatternDefinition {
  pattern: RegExp;
  category: BlockedCategory;
  severity: Severity;
  description: string;
  weight: number;
}

/**
 * Keyword-based patterns for quick detection.
 */
const KEYWORD_PATTERNS: PatternDefinition[] = [
  // Phishing patterns
  {
    pattern: /verify\s+(your\s+)?account\s+immediately/i,
    category: BlockedCategory.PHISHING,
    severity: Severity.HIGH,
    description: 'Urgent account verification request',
    weight: 0.85,
  },
  {
    pattern: /confirm\s+(your\s+)?(identity|password|credentials)/i,
    category: BlockedCategory.PHISHING,
    severity: Severity.HIGH,
    description: 'Credential confirmation request',
    weight: 0.8,
  },
  {
    pattern: /login\s+.{0,20}expired/i,
    category: BlockedCategory.PHISHING,
    severity: Severity.MEDIUM,
    description: 'Fake login expiration notice',
    weight: 0.7,
  },
  {
    pattern: /update\s+(your\s+)?payment\s+(method|info|details)/i,
    category: BlockedCategory.PHISHING,
    severity: Severity.MEDIUM,
    description: 'Payment update request',
    weight: 0.65,
  },
  {
    pattern: /your\s+account\s+(has\s+been|will\s+be)\s+(suspended|locked|closed)/i,
    category: BlockedCategory.PHISHING,
    severity: Severity.HIGH,
    description: 'Account suspension threat',
    weight: 0.85,
  },

  // Scam patterns
  {
    pattern: /congratulations[!,]?\s+(you('ve)?\s+)?(won|been\s+selected)/i,
    category: BlockedCategory.SCAM,
    severity: Severity.HIGH,
    description: 'Prize/lottery scam',
    weight: 0.9,
  },
  {
    pattern: /wire\s+(me\s+)?money/i,
    category: BlockedCategory.SCAM,
    severity: Severity.HIGH,
    description: 'Wire transfer request',
    weight: 0.85,
  },
  {
    pattern: /inheritance\s+.{0,30}(million|deceased)/i,
    category: BlockedCategory.SCAM,
    severity: Severity.CRITICAL,
    description: 'Inheritance scam',
    weight: 0.95,
  },
  {
    pattern: /nigerian?\s+prince/i,
    category: BlockedCategory.SCAM,
    severity: Severity.CRITICAL,
    description: 'Classic Nigerian prince scam',
    weight: 0.99,
  },
  {
    pattern: /guaranteed\s+(returns?|profit|income)\s+of\s+\d+%/i,
    category: BlockedCategory.SCAM,
    severity: Severity.HIGH,
    description: 'Unrealistic investment returns',
    weight: 0.85,
  },
  {
    pattern: /double\s+your\s+(money|bitcoin|crypto)/i,
    category: BlockedCategory.SCAM,
    severity: Severity.CRITICAL,
    description: 'Crypto doubling scam',
    weight: 0.95,
  },

  // Drug patterns
  {
    pattern: /buy\s+(drugs?|cocaine|heroin|meth|mdma|lsd)/i,
    category: BlockedCategory.DRUGS,
    severity: Severity.CRITICAL,
    description: 'Direct drug sales',
    weight: 0.99,
  },
  {
    pattern: /overnight\s+shipping\s+.{0,20}(discreet|stealth)/i,
    category: BlockedCategory.DRUGS,
    severity: Severity.HIGH,
    description: 'Drug shipping terminology',
    weight: 0.8,
  },
  {
    pattern: /dark\s*(web|net)\s+vendor/i,
    category: BlockedCategory.DRUGS,
    severity: Severity.CRITICAL,
    description: 'Darknet vendor reference',
    weight: 0.95,
  },

  // Weapons patterns
  {
    pattern: /buy\s+(guns?|firearms?|weapons?)\s+.{0,20}(no\s+(background\s+)?check|unlicensed)/i,
    category: BlockedCategory.WEAPONS,
    severity: Severity.CRITICAL,
    description: 'Illegal weapon sales',
    weight: 0.99,
  },
  {
    pattern: /3d\s+print(ed|able)?\s+gun/i,
    category: BlockedCategory.WEAPONS,
    severity: Severity.CRITICAL,
    description: '3D printed firearm',
    weight: 0.95,
  },
  {
    pattern: /how\s+to\s+make\s+.{0,20}(bomb|explosive|poison)/i,
    category: BlockedCategory.WEAPONS,
    severity: Severity.CRITICAL,
    description: 'Weapon/explosive manufacturing',
    weight: 0.99,
  },
  {
    pattern: /fully?\s+auto(matic)?\s+conversion/i,
    category: BlockedCategory.WEAPONS,
    severity: Severity.CRITICAL,
    description: 'Illegal weapon modification',
    weight: 0.95,
  },

  // Gambling patterns
  {
    pattern: /online\s+(casino|poker|betting)\s+.{0,20}(unlicensed|offshore)/i,
    category: BlockedCategory.GAMBLING,
    severity: Severity.HIGH,
    description: 'Unlicensed gambling site',
    weight: 0.8,
  },
  {
    pattern: /sports\s+betting\s+(tips?|predictions?)\s+.{0,20}guaranteed/i,
    category: BlockedCategory.GAMBLING,
    severity: Severity.MEDIUM,
    description: 'Gambling tip scam',
    weight: 0.7,
  },

  // Terrorism patterns
  {
    pattern: /join\s+(our\s+)?(jihad|caliphate|holy\s+war)/i,
    category: BlockedCategory.TERRORISM,
    severity: Severity.CRITICAL,
    description: 'Terrorist recruitment',
    weight: 1.0,
  },
  {
    pattern: /attack\s+(the\s+)?(infidels?|west|government)/i,
    category: BlockedCategory.TERRORISM,
    severity: Severity.HIGH,
    description: 'Terrorist incitement',
    weight: 0.9,
  },

  // Counterfeit patterns
  {
    pattern: /fake\s+(id|passport|license|diploma|degree)/i,
    category: BlockedCategory.COUNTERFEIT,
    severity: Severity.HIGH,
    description: 'Counterfeit document sales',
    weight: 0.9,
  },
  {
    pattern: /counterfeit\s+(money|currency|bills?)/i,
    category: BlockedCategory.COUNTERFEIT,
    severity: Severity.CRITICAL,
    description: 'Counterfeit currency',
    weight: 0.95,
  },
  {
    pattern: /replica\s+(watch(es)?|bags?|luxury)/i,
    category: BlockedCategory.COUNTERFEIT,
    severity: Severity.MEDIUM,
    description: 'Counterfeit luxury goods',
    weight: 0.6,
  },

  // Malware patterns
  {
    pattern: /download\s+.{0,20}(keylogger|rat|trojan|ransomware)/i,
    category: BlockedCategory.MALWARE,
    severity: Severity.CRITICAL,
    description: 'Malware distribution',
    weight: 0.99,
  },
  {
    pattern: /hack(ing)?\s+(tool|kit|service)/i,
    category: BlockedCategory.MALWARE,
    severity: Severity.HIGH,
    description: 'Hacking tools',
    weight: 0.85,
  },
  {
    pattern: /ddos\s+(attack|service|for\s+hire)/i,
    category: BlockedCategory.MALWARE,
    severity: Severity.CRITICAL,
    description: 'DDoS attack service',
    weight: 0.95,
  },
  {
    pattern: /stolen\s+(credentials?|accounts?|data)/i,
    category: BlockedCategory.MALWARE,
    severity: Severity.CRITICAL,
    description: 'Stolen data trading',
    weight: 0.95,
  },
];

/**
 * Brand impersonation patterns.
 */
const BRAND_IMPERSONATION_PATTERNS: Array<{ pattern: RegExp; brand: string }> = [
  // PayPal
  { pattern: /paypa[1l](?!l)|pay-pal|paypai|paypaI/i, brand: 'PayPal' },
  { pattern: /p[a@]yp[a@][l1]/i, brand: 'PayPal' },
  
  // Amazon
  { pattern: /amaz[0o]n|arnaz[0o]n|amazon(?!\.com)/i, brand: 'Amazon' },
  
  // Apple
  { pattern: /app[1l]e(?!\.com)|a\s*p\s*p\s*l\s*e/i, brand: 'Apple' },
  
  // Google
  { pattern: /g[0o]{2}g[1l]e|go+gle|googIe/i, brand: 'Google' },
  
  // Microsoft
  { pattern: /micr[0o]s[0o]ft|m[1i]cr[0o]soft/i, brand: 'Microsoft' },
  
  // Netflix
  { pattern: /netf[1l]ix|netf[1l]lx/i, brand: 'Netflix' },
  
  // Facebook/Meta
  { pattern: /faceb[0o]{2}k|faceb[0o]ok/i, brand: 'Facebook' },
  
  // Chase
  { pattern: /chas[3e]\s+bank|ch[a@]se\s+online/i, brand: 'Chase' },
  
  // Wells Fargo
  { pattern: /we[l1]{2}s?\s*farg[0o]/i, brand: 'Wells Fargo' },
  
  // Bank of America
  { pattern: /bank\s*[0o]f\s*amer[1i]ca/i, brand: 'Bank of America' },
];

/**
 * Main content moderation class.
 * Analyzes text content for harmful patterns and returns detailed results.
 */
export class ContentModerator {
  private slangDictionary: SlangDictionary;

  constructor() {
    this.slangDictionary = new SlangDictionary();
  }

  /**
   * Moderate the given content for harmful patterns.
   * @param input - The moderation input containing text and options
   * @returns Promise resolving to the moderation result
   */
  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const startTime = performance.now();
    const flags: ModerationFlag[] = [];
    const threshold = input.threshold ?? DEFAULT_THRESHOLD;
    
    // Validate input
    const text = input.text.slice(0, MAX_TEXT_LENGTH);
    
    // Run all detection methods
    this.detectKeywordPatterns(text, input.categories, flags);
    this.detectBrandImpersonation(text, input.categories, flags);
    this.detectSlangTerms(text, input.categories, flags);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(flags);
    
    // Determine highest severity
    const highestSeverity = this.getHighestSeverity(flags);
    
    // Get violated categories
    const violatedCategories = [...new Set(flags.map(f => f.category))];
    
    // Determine if passed based on threshold
    const passed = riskScore < threshold && highestSeverity !== Severity.CRITICAL;
    
    const processingTimeMs = performance.now() - startTime;
    
    return {
      passed,
      riskScore,
      flags,
      highestSeverity,
      violatedCategories,
      timestamp: Date.now(),
      processingTimeMs,
    };
  }

  /**
   * Detect keyword-based patterns in the text.
   */
  private detectKeywordPatterns(
    text: string,
    categories: BlockedCategory[] | undefined,
    flags: ModerationFlag[]
  ): void {
    for (const pattern of KEYWORD_PATTERNS) {
      // Skip if category filtering is enabled and this category isn't included
      if (categories && !categories.includes(pattern.category)) {
        continue;
      }
      
      const match = text.match(pattern.pattern);
      if (match) {
        flags.push({
          category: pattern.category,
          severity: pattern.severity,
          description: pattern.description,
          matchedText: match[0],
          confidence: pattern.weight,
        });
      }
    }
  }

  /**
   * Detect brand impersonation attempts.
   */
  private detectBrandImpersonation(
    text: string,
    categories: BlockedCategory[] | undefined,
    flags: ModerationFlag[]
  ): void {
    // Skip if category filtering is enabled and brand impersonation isn't included
    if (categories && !categories.includes(BlockedCategory.BRAND_IMPERSONATION)) {
      return;
    }
    
    for (const { pattern, brand } of BRAND_IMPERSONATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        // Check if it's a legitimate reference (e.g., domain name)
        const isLegitimate = this.isLegitimateReference(text, match.index!, brand);
        
        if (!isLegitimate) {
          flags.push({
            category: BlockedCategory.BRAND_IMPERSONATION,
            severity: Severity.HIGH,
            description: `Possible ${brand} impersonation detected`,
            matchedText: match[0],
            confidence: 0.85,
            metadata: { brand },
          });
        }
      }
    }
    
    // Check for suspicious domain patterns
    this.detectSuspiciousDomains(text, flags);
  }

  /**
   * Check if a brand reference appears to be legitimate.
   */
  private isLegitimateReference(text: string, position: number, brand: string): boolean {
    const brandLower = brand.toLowerCase();
    const surrounding = text.slice(Math.max(0, position - 20), position + 30).toLowerCase();
    
    // Check for legitimate domain patterns
    const legitimateDomains = [
      `${brandLower}.com`,
      `${brandLower}.org`,
      `${brandLower}.net`,
      `www.${brandLower}`,
    ];
    
    for (const domain of legitimateDomains) {
      if (surrounding.includes(domain)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect suspicious domains that mimic legitimate services.
   */
  private detectSuspiciousDomains(text: string, flags: ModerationFlag[]): void {
    // Pattern for URLs with brand names in subdomains or paths
    const urlPattern = /https?:\/\/([a-z0-9.-]+)\.[a-z]{2,}(\/[^\s]*)?/gi;
    let match;
    
    while ((match = urlPattern.exec(text)) !== null) {
      const domain = match[1].toLowerCase();
      
      for (const brand of PROTECTED_BRANDS) {
        // Check for typosquatting patterns
        if (domain.includes(brand) && !domain.endsWith(brand)) {
          // Brand name in subdomain or with additions
          flags.push({
            category: BlockedCategory.BRAND_IMPERSONATION,
            severity: Severity.HIGH,
            description: `Suspicious domain mimicking ${brand}`,
            matchedText: match[0],
            confidence: 0.8,
            metadata: { brand, domain },
          });
          break;
        }
      }
    }
  }

  /**
   * Detect slang/code word usage.
   */
  private detectSlangTerms(
    text: string,
    categories: BlockedCategory[] | undefined,
    flags: ModerationFlag[]
  ): void {
    const matches = this.slangDictionary.lookup(text);
    
    for (const match of matches) {
      // Skip if category filtering is enabled and this category isn't included
      if (categories && !categories.includes(match.entry.category)) {
        continue;
      }
      
      // Determine severity based on weight and context requirement
      let severity: Severity;
      if (match.entry.weight >= 0.9) {
        severity = Severity.HIGH;
      } else if (match.entry.weight >= 0.7) {
        severity = match.entry.contextRequired ? Severity.MEDIUM : Severity.HIGH;
      } else if (match.entry.weight >= 0.5) {
        severity = match.entry.contextRequired ? Severity.LOW : Severity.MEDIUM;
      } else {
        severity = Severity.LOW;
      }
      
      // Lower confidence for terms that require context
      const confidence = match.entry.contextRequired 
        ? match.entry.weight * 0.7 
        : match.entry.weight;
      
      flags.push({
        category: match.entry.category,
        severity,
        description: `Slang term detected: "${match.entry.term}" (${match.entry.meaning})`,
        matchedText: match.matchedText,
        confidence,
        metadata: {
          meaning: match.entry.meaning,
          contextRequired: match.entry.contextRequired,
        },
      });
    }
  }

  /**
   * Calculate the overall risk score from all flags.
   */
  private calculateRiskScore(flags: ModerationFlag[]): number {
    if (flags.length === 0) return 0;
    
    // Group flags by category and take the highest confidence for each
    const categoryScores = new Map<BlockedCategory, number>();
    
    for (const flag of flags) {
      const categoryWeight = SECURITY_WEIGHTS[flag.category] ?? 0.5;
      const weightedConfidence = flag.confidence * categoryWeight;
      
      const existing = categoryScores.get(flag.category) ?? 0;
      categoryScores.set(flag.category, Math.max(existing, weightedConfidence));
    }
    
    // Combine scores: max score weighted heavily, others contribute less
    const scores = [...categoryScores.values()].sort((a, b) => b - a);
    
    let combinedScore = scores[0];
    for (let i = 1; i < scores.length; i++) {
      // Each additional category adds diminishing contribution
      combinedScore += scores[i] * (0.3 / i);
    }
    
    return Math.min(combinedScore, 1.0);
  }

  /**
   * Get the highest severity from all flags.
   */
  private getHighestSeverity(flags: ModerationFlag[]): Severity | null {
    if (flags.length === 0) return null;
    
    const severityOrder = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW];
    
    for (const severity of severityOrder) {
      if (flags.some(f => f.severity === severity)) {
        return severity;
      }
    }
    
    return null;
  }

  /**
   * Quick check if text contains any obvious red flags.
   * Use this for fast pre-filtering before full moderation.
   * @param text - The text to check
   * @returns True if text contains obvious harmful content
   */
  quickCheck(text: string): boolean {
    // Check for critical patterns only
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.severity === Severity.CRITICAL && pattern.pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  }
}
