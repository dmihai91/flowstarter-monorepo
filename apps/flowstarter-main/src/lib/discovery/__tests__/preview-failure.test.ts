import { describe, expect, it } from 'vitest';
import { isTransientPipelineFailure } from '../preview-failure';

describe('which preview failures get a restart', () => {
  it('restarts on the provider, the network and a preview server that never came up', () => {
    for (const message of [
      'Pi session failed: Provider finish_reason: error',
      'Pi agent timed out after 420000ms',
      'Pi session returned no output',
      'brand intelligence agent did not return JSON',
      'Preview personalization failed: your session ended without modifying any file',
    ]) {
      expect(isTransientPipelineFailure(new Error(message))).toBe(true);
    }
  });

  it('never restarts into a ceiling the operator set, or a rejected intake', () => {
    const budget = new Error(
      'Pi run budget exceeded during "preview_generate"'
    );
    budget.name = 'PiRunBudgetExceededError';
    expect(isTransientPipelineFailure(budget)).toBe(false);
    expect(
      isTransientPipelineFailure(
        new Error('Pi preview infrastructure is not configured')
      )
    ).toBe(false);
    expect(
      isTransientPipelineFailure(new Error('Intake contains a disallowed URL'))
    ).toBe(false);
    expect(isTransientPipelineFailure('not an error')).toBe(false);
    // A preview server that would not start is the workspace, not the weather.
    expect(
      isTransientPipelineFailure(
        new Error(
          'Invalid credentials; local fallback: Local preview server did not become ready: CSSSyntaxError'
        )
      )
    ).toBe(false);
    const deadline = new Error('Pi run deadline passed');
    deadline.name = 'PiRunDeadlineExceededError';
    expect(isTransientPipelineFailure(deadline)).toBe(false);
  });
});
