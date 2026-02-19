/**
 * @fileoverview Core TypeScript interfaces and types for the security module.
 * @module @flowstarter/security/types
 */

/**
 * Categories of content that can be blocked or flagged.
 */
export enum BlockedCategory {
  /** Phishing attempts - fake login pages, credential theft */
  PHISHING = 'phishing',
  /** Scam content - financial fraud, fake offers */
  SCAM = 'scam',
  /** Drug-related content including coded language */
  DRUGS = 'drugs',
  /** Weapons sales or manufacturing */
  WEAPONS = 'weapons',
  /** Gambling and betting operations */
  GAMBLING = 'gambling',
  /** Adult/escort services */
  ADULT = 'adult',
  /** Terrorism-related content */
  TERRORISM = 'terrorism',
  /** Counterfeit goods and documents */
  COUNTERFEIT = 'counterfeit',
  /** Malware, viruses, hacking tools */
  MALWARE = 'malware',
  /** Brand impersonation attempts */
  BRAND_IMPERSONATION = 'brand_impersonation',
  /** Prompt injection attempts */
  PROMPT_INJECTION = 'prompt_injection',
}

/**
 * Severity levels for detected issues.
 */
export enum Severity {
  /** Low severity - may be false positive */
  LOW = 'low',
  /** Medium severity - requires review */
  MEDIUM = 'medium',
  /** High severity - should be blocked */
  HIGH = 'high',
  /** Critical severity - must be blocked immediately */
  CRITICAL = 'critical',
}

/**
 * A single flagged item found during moderation.
 */
export interface ModerationFlag {
  /** The category of the violation */
  category: BlockedCategory;
  /** Severity level of the violation */
  severity: Severity;
  /** Human-readable description of the issue */
  description: string;
  /** The specific text or pattern that triggered the flag */
  matchedText: string;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Optional metadata about the detection */
  metadata?: Record<string, unknown>;
}

/**
 * Input for content moderation.
 */
export interface ModerationInput {
  /** The text content to moderate */
  text: string;
  /** Optional context about where the content came from */
  source?: string;
  /** Optional user identifier for tracking */
  userId?: string;
  /** Optional categories to specifically check (defaults to all) */
  categories?: BlockedCategory[];
  /** Optional threshold for flagging (0-1, default 0.5) */
  threshold?: number;
}

/**
 * Result of content moderation.
 */
export interface ModerationResult {
  /** Whether the content passed moderation */
  passed: boolean;
  /** Overall risk score from 0 to 1 */
  riskScore: number;
  /** List of all flags found */
  flags: ModerationFlag[];
  /** The highest severity found, or null if clean */
  highestSeverity: Severity | null;
  /** Categories that were violated */
  violatedCategories: BlockedCategory[];
  /** Timestamp of the moderation */
  timestamp: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * A single issue found in code scanning.
 */
export interface CodeIssue {
  /** Type of security issue */
  type: string;
  /** Severity of the issue */
  severity: Severity;
  /** File where the issue was found */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Description of the issue */
  description: string;
  /** The code snippet that triggered the issue */
  snippet: string;
  /** Suggested fix or mitigation */
  suggestion?: string;
}

/**
 * Result of code scanning.
 */
export interface ScanResult {
  /** Whether the code passed security scanning */
  passed: boolean;
  /** Total number of issues found */
  totalIssues: number;
  /** Issues grouped by severity */
  issuesBySeverity: Record<Severity, number>;
  /** All issues found */
  issues: CodeIssue[];
  /** Files that were scanned */
  scannedFiles: string[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Dictionary entry for slang/code words.
 */
export interface SlangEntry {
  /** The slang term */
  term: string;
  /** Category this term belongs to */
  category: BlockedCategory;
  /** Weight/confidence for this term (0-1) */
  weight: number;
  /** Description or meaning of the term */
  meaning: string;
  /** Whether this requires additional context to flag */
  contextRequired: boolean;
}
