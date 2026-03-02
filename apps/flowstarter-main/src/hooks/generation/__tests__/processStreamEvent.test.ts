import { describe, expect, it, vi } from 'vitest';
import { processStreamEvent } from '../processStreamEvent';

function createMockHandlers() {
  return {
    setResult: vi.fn(),
    setPreviewUrl: vi.fn(),
    setProgress: vi.fn(),
    updateStep: vi.fn(),
    updateStepMessage: vi.fn(),
    setCurrentStep: vi.fn(),
  };
}

describe('processStreamEvent', () => {
  it('returns continue for null events', () => {
    expect(processStreamEvent(null, createMockHandlers())).toBe('continue');
  });

  it('handles done event', () => {
    const h = createMockHandlers();
    expect(processStreamEvent({ status: 'done', data: { files: [] } }, h)).toBe('done');
    expect(h.setResult).toHaveBeenCalledWith({ files: [] });
  });

  it('throws on error', () => {
    expect(() => processStreamEvent({ status: 'error', message: 'Failed' }, createMockHandlers())).toThrow('Failed');
  });

  it('handles preview URL', () => {
    const h = createMockHandlers();
    processStreamEvent({ type: 'preview_updated', preview_url: 'http://test' }, h);
    expect(h.setPreviewUrl).toHaveBeenCalledWith('http://test');
  });

  it('handles step progress', () => {
    const h = createMockHandlers();
    processStreamEvent({ step: 2, name: 'Build', stage: 'processing', message: 'Working' }, h);
    expect(h.setCurrentStep).toHaveBeenCalledWith(2);
    expect(h.updateStep).toHaveBeenCalledWith('2', expect.objectContaining({ name: 'Build', status: 'in-progress' }));
  });

  it('marks completed steps', () => {
    const h = createMockHandlers();
    processStreamEvent({ step: 1, name: 'Setup', stage: 'complete' }, h);
    expect(h.updateStep).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'completed' }));
  });

  it('handles generic progress', () => {
    const h = createMockHandlers();
    processStreamEvent({ stage: 'init', message: 'Starting' }, h);
    expect(h.setProgress).toHaveBeenCalledWith({ stage: 'init', message: 'Starting' });
  });
});
