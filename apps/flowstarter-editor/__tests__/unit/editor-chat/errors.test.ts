/**
 * Editor Chat Error Handling Tests
 */

import { describe, it, expect } from 'vitest';
import {
  BUILD_ERRORS,
  NAME_GENERATION_ERRORS,
  BUSINESS_INFO_ERRORS,
  TEMPLATE_ERRORS,
  AGENT_ERRORS,
  FILE_ERRORS,
  NETWORK_ERRORS,
  formatErrorForUser,
  getUserFriendlyError,
  getErrorSuggestions,
} from '~/components/editor/editor-chat/errors';

describe('Error Constants', () => {
  describe('BUILD_ERRORS', () => {
    it('should have all required error types', () => {
      expect(BUILD_ERRORS.MISSING_TEMPLATE).toBeDefined();
      expect(BUILD_ERRORS.MISSING_PALETTE).toBeDefined();
      expect(BUILD_ERRORS.CLONE_FAILED).toBeDefined();
      expect(BUILD_ERRORS.ORCHESTRATION_FAILED).toBeDefined();
      expect(BUILD_ERRORS.PREVIEW_FAILED).toBeDefined();
      expect(BUILD_ERRORS.SNAPSHOT_FAILED).toBeDefined();
    });

    it('should have message and recoverable properties', () => {
      for (const error of Object.values(BUILD_ERRORS)) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(10);
        expect(error.recoverable).toBe(true);
      }
    });

    it('should have helpful suggestions', () => {
      for (const error of Object.values(BUILD_ERRORS)) {
        expect(error.suggestions).toBeDefined();
        expect(Array.isArray(error.suggestions)).toBe(true);
        expect(error.suggestions!.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('NETWORK_ERRORS', () => {
    it('should cover common network issues', () => {
      expect(NETWORK_ERRORS.CONNECTION_LOST).toBeDefined();
      expect(NETWORK_ERRORS.TIMEOUT).toBeDefined();
      expect(NETWORK_ERRORS.SERVER_ERROR).toBeDefined();
    });
  });

  describe('AGENT_ERRORS', () => {
    it('should have execution and task errors', () => {
      expect(AGENT_ERRORS.EXECUTION_FAILED).toBeDefined();
      expect(AGENT_ERRORS.TASK_FAILED).toBeDefined();
    });
  });
});

describe('formatErrorForUser', () => {
  it('should format error message with suggestions', () => {
    const error = BUILD_ERRORS.MISSING_TEMPLATE;
    const formatted = formatErrorForUser(error);

    expect(formatted).toContain(error.message);
    expect(formatted).toContain('What you can do:');
    expect(formatted).toContain(error.suggestions![0]);
  });

  it('should handle errors without suggestions', () => {
    const error = {
      message: 'Test error',
      recoverable: true,
    };
    const formatted = formatErrorForUser(error);

    expect(formatted).toBe('Test error');
    expect(formatted).not.toContain('What you can do:');
  });

  it('should format suggestions as bullet points', () => {
    const error = {
      message: 'Error',
      suggestions: ['First option', 'Second option'],
      recoverable: true,
    };
    const formatted = formatErrorForUser(error);

    expect(formatted).toContain('- First option');
    expect(formatted).toContain('- Second option');
  });
});

describe('getUserFriendlyError', () => {
  describe('network errors', () => {
    it('should identify network/fetch errors', () => {
      const result = getUserFriendlyError(new Error('Network request failed'));
      expect(result).toEqual(NETWORK_ERRORS.CONNECTION_LOST);
    });

    it('should identify fetch errors', () => {
      const result = getUserFriendlyError(new Error('fetch failed'));
      expect(result).toEqual(NETWORK_ERRORS.CONNECTION_LOST);
    });

    it('should identify timeout errors', () => {
      const result = getUserFriendlyError(new Error('Request timeout'));
      expect(result).toEqual(NETWORK_ERRORS.TIMEOUT);
    });

    it('should identify server errors (500)', () => {
      const result = getUserFriendlyError(new Error('Server error: 500'));
      expect(result).toEqual(NETWORK_ERRORS.SERVER_ERROR);
    });

    it('should identify server errors (502)', () => {
      const result = getUserFriendlyError(new Error('502 Bad Gateway'));
      expect(result).toEqual(NETWORK_ERRORS.SERVER_ERROR);
    });

    it('should identify server errors (503)', () => {
      const result = getUserFriendlyError(new Error('503 Service Unavailable'));
      expect(result).toEqual(NETWORK_ERRORS.SERVER_ERROR);
    });
  });

  describe('template errors', () => {
    it('should identify missing template errors', () => {
      const result = getUserFriendlyError(new Error('Template not found'));
      expect(result).toEqual(BUILD_ERRORS.MISSING_TEMPLATE);
    });
  });

  describe('build errors', () => {
    it('should identify clone errors', () => {
      const result = getUserFriendlyError(new Error('Failed to clone template'));
      expect(result).toEqual(BUILD_ERRORS.CLONE_FAILED);
    });

    it('should identify orchestration errors', () => {
      const result = getUserFriendlyError(new Error('Orchestration failed'));
      expect(result).toEqual(BUILD_ERRORS.ORCHESTRATION_FAILED);
    });

    it('should identify customization errors', () => {
      const result = getUserFriendlyError(new Error('Customization error'));
      expect(result).toEqual(BUILD_ERRORS.ORCHESTRATION_FAILED);
    });

    it('should identify preview errors', () => {
      const result = getUserFriendlyError(new Error('Preview sandbox failed'));
      expect(result).toEqual(BUILD_ERRORS.PREVIEW_FAILED);
    });

    it('should identify daytona errors as preview errors', () => {
      const result = getUserFriendlyError(new Error('Daytona workspace error'));
      expect(result).toEqual(BUILD_ERRORS.PREVIEW_FAILED);
    });
  });

  describe('fallback', () => {
    it('should return generic error for unknown errors', () => {
      const result = getUserFriendlyError(new Error('Some random error'));
      expect(result.message).toContain('Something unexpected happened');
      expect(result.recoverable).toBe(true);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle non-Error objects', () => {
      const result = getUserFriendlyError('string error');
      expect(result.recoverable).toBe(true);
    });

    it('should handle null/undefined', () => {
      const result = getUserFriendlyError(null);
      expect(result.recoverable).toBe(true);
    });
  });
});

describe('getErrorSuggestions', () => {
  it('should return build suggestions', () => {
    const suggestions = getErrorSuggestions('build');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.find((s) => s.id === 'retry-build')).toBeDefined();
  });

  it('should return name suggestions', () => {
    const suggestions = getErrorSuggestions('name');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.find((s) => s.id === 'retry-name')).toBeDefined();
    expect(suggestions.find((s) => s.id === 'own-name')).toBeDefined();
  });

  it('should return template suggestions', () => {
    const suggestions = getErrorSuggestions('template');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.find((s) => s.id === 'retry-templates')).toBeDefined();
  });

  it('should return agent suggestions', () => {
    const suggestions = getErrorSuggestions('agent');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.find((s) => s.id === 'retry-request')).toBeDefined();
  });

  it('should return generic suggestions as fallback', () => {
    const suggestions = getErrorSuggestions('generic');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.find((s) => s.id === 'retry')).toBeDefined();
  });

  it('should have id and text for each suggestion', () => {
    const errorTypes = ['build', 'name', 'template', 'agent', 'generic'] as const;
    for (const type of errorTypes) {
      const suggestions = getErrorSuggestions(type);
      for (const suggestion of suggestions) {
        expect(suggestion.id).toBeDefined();
        expect(suggestion.text).toBeDefined();
        expect(suggestion.text.length).toBeGreaterThan(3);
      }
    }
  });
});

