/**
 * @fileoverview Main entry point for @flowstarter/security module.
 * @module @flowstarter/security
 * 
 * This module provides comprehensive security utilities for the Flowstarter platform:
 * - Content moderation for detecting harmful content
 * - Prompt injection detection and sanitization
 * - Code scanning for malicious patterns
 * - Security system prompts for AI agents
 * 
 * @example
 * ```typescript
 * import { 
 *   ContentModerator, 
 *   PromptInjectionGuard, 
 *   CodeScanner,
 *   SECURITY_SYSTEM_PROMPT 
 * } from '@flowstarter/security';
 * 
 * // Moderate user content
 * const moderator = new ContentModerator();
 * const result = await moderator.moderate({ text: userInput });
 * 
 * // Check for prompt injection
 * const guard = new PromptInjectionGuard();
 * const sanitized = guard.sanitize(userInput);
 * 
 * // Scan generated code
 * const scanner = new CodeScanner();
 * const scanResult = scanner.scanContent(generatedCode);
 * ```
 */

// Types
export {
  BlockedCategory,
  Severity,
  type ModerationFlag,
  type ModerationInput,
  type ModerationResult,
  type CodeIssue,
  type ScanResult,
  type SlangEntry,
} from './types.js';

// Constants
export {
  BLOCKED_CATEGORIES,
  SECURITY_WEIGHTS,
  SEVERITY_THRESHOLDS,
  PROTECTED_BRANDS,
  DEFAULT_THRESHOLD,
  MAX_TEXT_LENGTH,
} from './constants.js';

// Slang Dictionary
export { SlangDictionary } from './slang-dictionary.js';

// Content Moderator
export { ContentModerator } from './content-moderator.js';

// Prompt Injection Guard
export {
  PromptInjectionGuard,
  InjectionType,
  type InjectionDetectionResult,
  type InjectionPattern,
} from './prompt-injection-guard.js';

// Code Scanner
export { CodeScanner } from './code-scanner.js';

// Security Prompts
export {
  SECURITY_SYSTEM_PROMPT,
  SECURITY_SYSTEM_PROMPT_COMPACT,
  SECURE_CODE_GENERATION_PROMPT,
  CONTENT_MODERATION_PROMPT,
  PRIVACY_AWARE_PROMPT,
  getAllSecurityPrompts,
  buildSecureSystemPrompt,
} from './prompts.js';
