/**
 * @fileoverview Prompt injection detection and sanitization.
 * @module @flowstarter/security/prompt-injection-guard
 */

import { Severity } from './types.js';

/**
 * Result of prompt injection detection.
 */
export interface InjectionDetectionResult {
  /** Whether injection was detected */
  detected: boolean;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Types of injection patterns found */
  patterns: InjectionPattern[];
  /** Risk level */
  severity: Severity;
  /** The original input */
  originalInput: string;
  /** The sanitized input (if sanitization was applied) */
  sanitizedInput?: string;
}

/**
 * A detected injection pattern.
 */
export interface InjectionPattern {
  /** Type of injection pattern */
  type: InjectionType;
  /** The matched text */
  matchedText: string;
  /** Position in the input string */
  position: number;
  /** Description of the pattern */
  description: string;
  /** Weight/severity of this pattern */
  weight: number;
}

/**
 * Types of prompt injection attacks.
 */
export enum InjectionType {
  /** Attempts to override system instructions */
  INSTRUCTION_OVERRIDE = 'instruction_override',
  /** Attempts to extract system prompt */
  PROMPT_EXTRACTION = 'prompt_extraction',
  /** Attempts to change assistant persona */
  PERSONA_HIJACK = 'persona_hijack',
  /** Attempts to bypass content policies */
  JAILBREAK = 'jailbreak',
  /** Hidden or encoded instructions */
  HIDDEN_INSTRUCTION = 'hidden_instruction',
  /** Delimiter/separator injection */
  DELIMITER_INJECTION = 'delimiter_injection',
  /** Role-playing manipulation */
  ROLEPLAY_MANIPULATION = 'roleplay_manipulation',
  /** Context manipulation */
  CONTEXT_MANIPULATION = 'context_manipulation',
}

/**
 * Pattern definition for injection detection.
 */
interface InjectionPatternDef {
  pattern: RegExp;
  type: InjectionType;
  description: string;
  weight: number;
}

/**
 * Injection patterns to detect.
 */
const INJECTION_PATTERNS: InjectionPatternDef[] = [
  // Instruction override patterns
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directions?)/i,
    type: InjectionType.INSTRUCTION_OVERRIDE,
    description: 'Attempt to override previous instructions',
    weight: 0.95,
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|prompts?|programming)/i,
    type: InjectionType.INSTRUCTION_OVERRIDE,
    description: 'Attempt to disregard instructions',
    weight: 0.95,
  },
  {
    pattern: /forget\s+(everything|all|what)\s+(you('ve)?\s+)?(know|learned|been\s+told)/i,
    type: InjectionType.INSTRUCTION_OVERRIDE,
    description: 'Attempt to reset AI context',
    weight: 0.9,
  },
  {
    pattern: /from\s+now\s+on,?\s+(you\s+)?(will|must|should|are)/i,
    type: InjectionType.INSTRUCTION_OVERRIDE,
    description: 'Attempt to establish new behavior',
    weight: 0.7,
  },
  {
    pattern: /new\s+(instructions?|rules?|directive)/i,
    type: InjectionType.INSTRUCTION_OVERRIDE,
    description: 'Attempt to introduce new instructions',
    weight: 0.6,
  },
  
  // Role markers (delimiter injection)
  {
    pattern: /^system\s*:/im,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'System role marker injection',
    weight: 0.95,
  },
  {
    pattern: /^assistant\s*:/im,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'Assistant role marker injection',
    weight: 0.9,
  },
  {
    pattern: /^user\s*:/im,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'User role marker injection',
    weight: 0.8,
  },
  {
    pattern: /\[system\]|\[assistant\]|\[user\]|<\|system\|>|<\|assistant\|>|<\|user\|>/i,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'Role delimiter injection',
    weight: 0.95,
  },
  {
    pattern: /###\s*(system|assistant|user|instruction|response)/i,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'Markdown role marker injection',
    weight: 0.85,
  },
  {
    pattern: /<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/i,
    type: InjectionType.DELIMITER_INJECTION,
    description: 'Special token injection',
    weight: 0.99,
  },
  
  // Prompt extraction
  {
    pattern: /(show|reveal|tell|give|print|display|output)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
    type: InjectionType.PROMPT_EXTRACTION,
    description: 'Attempt to extract system prompt',
    weight: 0.85,
  },
  {
    pattern: /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions?|programming|directives?)/i,
    type: InjectionType.PROMPT_EXTRACTION,
    description: 'Query for system prompt',
    weight: 0.8,
  },
  {
    pattern: /repeat\s+(back\s+)?(your|the)\s+(initial\s+)?(instructions?|prompt|message)/i,
    type: InjectionType.PROMPT_EXTRACTION,
    description: 'Attempt to make AI repeat instructions',
    weight: 0.85,
  },
  {
    pattern: /output\s+(everything|all)\s+(before|above)\s+(this|the\s+user)/i,
    type: InjectionType.PROMPT_EXTRACTION,
    description: 'Attempt to dump context',
    weight: 0.9,
  },
  
  // Jailbreak attempts
  {
    pattern: /\bDAN\b|\bDo\s+Anything\s+Now\b/i,
    type: InjectionType.JAILBREAK,
    description: 'DAN jailbreak attempt',
    weight: 0.99,
  },
  {
    pattern: /jailbreak(ing|ed)?|bypass\s+(the\s+)?(filter|restriction|safety|content\s+policy)/i,
    type: InjectionType.JAILBREAK,
    description: 'Explicit jailbreak attempt',
    weight: 0.95,
  },
  {
    pattern: /pretend\s+(you\s+)?(are|have)\s+no\s+(rules?|restrictions?|limits?|filters?)/i,
    type: InjectionType.JAILBREAK,
    description: 'Pretend no rules jailbreak',
    weight: 0.9,
  },
  {
    pattern: /developer\s+mode|god\s+mode|unrestricted\s+mode/i,
    type: InjectionType.JAILBREAK,
    description: 'Mode switching jailbreak',
    weight: 0.95,
  },
  {
    pattern: /act\s+(as|like)\s+(if\s+)?you\s+(don'?t\s+have|have\s+no)\s+(content\s+)?(restrictions?|filters?|guidelines?)/i,
    type: InjectionType.JAILBREAK,
    description: 'Restriction bypass request',
    weight: 0.9,
  },
  {
    pattern: /enable\s+chaos\s+mode|evil\s+mode|villain\s+mode/i,
    type: InjectionType.JAILBREAK,
    description: 'Evil mode jailbreak',
    weight: 0.95,
  },
  
  // Persona hijacking
  {
    pattern: /you\s+are\s+(now\s+)?(a|an)\s+[a-z]+\s+(who|that|which)\s+(doesn'?t|does\s+not|won'?t)/i,
    type: InjectionType.PERSONA_HIJACK,
    description: 'Persona redefinition with bypass',
    weight: 0.85,
  },
  {
    pattern: /your\s+new\s+(name|identity|persona|personality)\s+is/i,
    type: InjectionType.PERSONA_HIJACK,
    description: 'Identity reassignment attempt',
    weight: 0.8,
  },
  {
    pattern: /stop\s+being\s+(an?\s+)?ai|you'?re\s+not\s+(an?\s+)?ai/i,
    type: InjectionType.PERSONA_HIJACK,
    description: 'AI identity denial',
    weight: 0.75,
  },
  
  // Roleplay manipulation
  {
    pattern: /let'?s\s+(play|do)\s+(a\s+)?(game|roleplay|scenario)\s+where\s+you\s+(can|must|have\s+to)/i,
    type: InjectionType.ROLEPLAY_MANIPULATION,
    description: 'Roleplay-based bypass attempt',
    weight: 0.7,
  },
  {
    pattern: /in\s+this\s+(fictional|hypothetical|imaginary)\s+(scenario|story|world),?\s+(you|there\s+are\s+no)/i,
    type: InjectionType.ROLEPLAY_MANIPULATION,
    description: 'Fictional scenario bypass',
    weight: 0.75,
  },
  {
    pattern: /pretend\s+(this\s+is|we'?re\s+in)\s+(a\s+)?(movie|story|fiction|game)/i,
    type: InjectionType.ROLEPLAY_MANIPULATION,
    description: 'Fiction framing bypass',
    weight: 0.7,
  },
  
  // Hidden instructions (encoded/obfuscated)
  {
    pattern: /base64|rot13|hex\s*encode|unicode\s*escape/i,
    type: InjectionType.HIDDEN_INSTRUCTION,
    description: 'Encoding mention (possible hidden content)',
    weight: 0.5,
  },
  {
    pattern: /\u200b|\u200c|\u200d|\u2060|\ufeff/,
    type: InjectionType.HIDDEN_INSTRUCTION,
    description: 'Zero-width characters detected',
    weight: 0.8,
  },
  {
    pattern: /<!--.*?-->/s,
    type: InjectionType.HIDDEN_INSTRUCTION,
    description: 'HTML comment (possible hidden instruction)',
    weight: 0.6,
  },
  
  // Context manipulation
  {
    pattern: /end\s+of\s+(previous|prior|user)\s+(message|input|prompt|text)/i,
    type: InjectionType.CONTEXT_MANIPULATION,
    description: 'Fake message boundary',
    weight: 0.9,
  },
  {
    pattern: /\[end\]|\[\/end\]|<\/message>|<\/input>/i,
    type: InjectionType.CONTEXT_MANIPULATION,
    description: 'Fake closing tag',
    weight: 0.85,
  },
  {
    pattern: /actual\s+(user\s+)?(request|question|message|input)\s*:/i,
    type: InjectionType.CONTEXT_MANIPULATION,
    description: 'Fake "actual request" framing',
    weight: 0.9,
  },
];

/**
 * Guard against prompt injection attacks.
 * Detects and sanitizes user inputs before sending to LLM.
 */
export class PromptInjectionGuard {
  private patterns: InjectionPatternDef[];
  private strictMode: boolean;

  /**
   * Create a new PromptInjectionGuard.
   * @param strictMode - If true, lower thresholds for detection
   */
  constructor(strictMode = false) {
    this.patterns = INJECTION_PATTERNS;
    this.strictMode = strictMode;
  }

  /**
   * Detect prompt injection attempts in the input.
   * @param input - The user input to analyze
   * @returns Detection result with details
   */
  detect(input: string): InjectionDetectionResult {
    const detectedPatterns: InjectionPattern[] = [];
    
    for (const def of this.patterns) {
      const matches = input.matchAll(new RegExp(def.pattern.source, def.pattern.flags + 'g'));
      
      for (const match of matches) {
        detectedPatterns.push({
          type: def.type,
          matchedText: match[0],
          position: match.index ?? 0,
          description: def.description,
          weight: def.weight,
        });
      }
    }
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(detectedPatterns);
    
    // Determine severity
    const severity = this.determineSeverity(confidence, detectedPatterns);
    
    // Threshold for detection
    const threshold = this.strictMode ? 0.3 : 0.5;
    const detected = confidence >= threshold;
    
    return {
      detected,
      confidence,
      patterns: detectedPatterns,
      severity,
      originalInput: input,
    };
  }

  /**
   * Check if input contains prompt injection (simple boolean check).
   * @param input - The user input to check
   * @returns True if injection is detected
   */
  detectInjection(input: string): boolean {
    return this.detect(input).detected;
  }

  /**
   * Sanitize user input by removing or neutralizing injection attempts.
   * @param input - The user input to sanitize
   * @returns Sanitized input string
   */
  sanitize(input: string): string {
    let sanitized = input;
    
    // Remove zero-width characters
    sanitized = sanitized.replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, '');
    
    // Neutralize role markers
    sanitized = sanitized.replace(/^(system|assistant|user)\s*:/gim, '$1_:');
    
    // Neutralize special tokens
    sanitized = sanitized.replace(/<\|[^|]+\|>/g, '<blocked>');
    
    // Neutralize markdown role markers
    sanitized = sanitized.replace(/###\s*(system|assistant|user|instruction)/gi, '### [$1]');
    
    // Remove HTML comments
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    
    // Neutralize bracket markers
    sanitized = sanitized.replace(/\[(system|assistant|user)\]/gi, '[$1-blocked]');
    
    // Escape potential delimiter patterns
    sanitized = sanitized.replace(/\[end\]|\[\/end\]/gi, '[blocked]');
    
    return sanitized;
  }

  /**
   * Detect and sanitize in one call.
   * @param input - The user input
   * @returns Detection result with sanitized input included
   */
  detectAndSanitize(input: string): InjectionDetectionResult {
    const result = this.detect(input);
    result.sanitizedInput = this.sanitize(input);
    return result;
  }

  /**
   * Wrap user input with safety markers.
   * Use this to clearly delineate user content in prompts.
   * @param input - The user input
   * @returns Input wrapped with safety markers
   */
  wrapUserInput(input: string): string {
    const sanitized = this.sanitize(input);
    return `[USER_INPUT_START]\n${sanitized}\n[USER_INPUT_END]`;
  }

  /**
   * Calculate confidence score from detected patterns.
   */
  private calculateConfidence(patterns: InjectionPattern[]): number {
    if (patterns.length === 0) return 0;
    
    // Get unique pattern types and their max weights
    const typeWeights = new Map<InjectionType, number>();
    
    for (const pattern of patterns) {
      const existing = typeWeights.get(pattern.type) ?? 0;
      typeWeights.set(pattern.type, Math.max(existing, pattern.weight));
    }
    
    // Combine weights: max weight is primary, others add diminishing contribution
    const weights = [...typeWeights.values()].sort((a, b) => b - a);
    
    let combined = weights[0];
    for (let i = 1; i < weights.length; i++) {
      combined += weights[i] * (0.2 / i);
    }
    
    return Math.min(combined, 1.0);
  }

  /**
   * Determine severity based on confidence and pattern types.
   */
  private determineSeverity(confidence: number, patterns: InjectionPattern[]): Severity {
    // Critical patterns
    const hasCritical = patterns.some(
      p => p.type === InjectionType.JAILBREAK && p.weight >= 0.95
    );
    
    if (hasCritical || confidence >= 0.9) {
      return Severity.CRITICAL;
    }
    
    if (confidence >= 0.7) {
      return Severity.HIGH;
    }
    
    if (confidence >= 0.5) {
      return Severity.MEDIUM;
    }
    
    return Severity.LOW;
  }

  /**
   * Add a custom injection pattern.
   * @param pattern - Regular expression to match
   * @param type - Type of injection
   * @param description - Human-readable description
   * @param weight - Weight/severity (0-1)
   */
  addPattern(
    pattern: RegExp,
    type: InjectionType,
    description: string,
    weight: number
  ): void {
    this.patterns.push({ pattern, type, description, weight });
  }

  /**
   * Get all registered patterns.
   */
  getPatterns(): InjectionPatternDef[] {
    return [...this.patterns];
  }
}
