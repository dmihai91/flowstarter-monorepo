'use client';

import { useCallback, useMemo } from 'react';

export interface AssistantValidationResult {
  isGibberish: boolean;
  phraseCount: number;
  wordCount: number;
  meetsPhraseRequirement: boolean;
  meetsContentRequirement: boolean;
  isValid: boolean;
  hasContent: boolean;
}

/**
 * Shared validation hook for assistant input across the app.
 * Used in both dashboard assistant and project wizard assistant.
 */
export function useAssistantValidation(
  text: string
): AssistantValidationResult {
  const isGibberish = useCallback((input: string): boolean => {
    const cleaned = (input || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return true;

    const words = cleaned.split(' ');
    const alphaWords = words.filter((w) => /[a-z]/i.test(w));
    const vowelWords = alphaWords.filter((w) => /[aeiou]/i.test(w));
    const nonAlphaCount = (cleaned.match(/[^a-z0-9\s.,!?'"-]/gi) || []).length;
    const repeatedChars = /(.)\1{3,}/.test(cleaned);
    const hasFiller = /\b(lorem ipsum|asdf|qwerty|test|xxx|bla)\b/i.test(
      cleaned
    );
    const tooFewWords = alphaWords.length < 3;
    const lowVowelRatio =
      alphaWords.length > 0 && vowelWords.length / alphaWords.length < 0.4;
    const highSymbolRatio = nonAlphaCount / cleaned.length > 0.25;

    return (
      tooFewWords ||
      lowVowelRatio ||
      highSymbolRatio ||
      repeatedChars ||
      hasFiller
    );
  }, []);

  const countPhrases = useCallback((input: string): number => {
    const cleaned = (input || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 0;

    // Split on sentence enders or new lines, then filter empties
    const parts = cleaned
      .split(/[.!?]+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // If no punctuation-delimited parts, treat as a single phrase
    return parts.length > 0 ? parts.length : 1;
  }, []);

  const countWords = useCallback((input: string): number => {
    const cleaned = (input || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 0;

    // Split by whitespace and count meaningful words (with letters)
    const words = cleaned.split(' ').filter((w) => /[a-z]/i.test(w));
    return words.length;
  }, []);

  const result = useMemo(() => {
    const trimmed = (text || '').trim();
    const hasContent = trimmed.length > 0;
    const gibberish = isGibberish(trimmed);
    const phrases = countPhrases(trimmed);
    const words = countWords(trimmed);
    const meetsPhraseRequirement = phrases >= 2 && phrases <= 4;
    const meetsContentRequirement = words >= 15; // At least 15 meaningful words
    const isValid = hasContent && !gibberish && meetsContentRequirement;

    return {
      isGibberish: gibberish,
      phraseCount: phrases,
      wordCount: words,
      meetsPhraseRequirement,
      meetsContentRequirement,
      isValid,
      hasContent,
    };
  }, [text, isGibberish, countPhrases, countWords]);

  return result;
}
