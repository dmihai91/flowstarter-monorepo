import { describe, it, expect, beforeEach } from 'vitest';
import { useDraftStore } from '../draft-store';

describe('useDraftStore', () => {
  beforeEach(() => {
    useDraftStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useDraftStore.getState();
    expect(state.draft).toBeNull();
    expect(state.hasLoadedOnce).toBe(false);
  });

  describe('setDraft', () => {
    it('sets a draft object', () => {
      useDraftStore.getState().setDraft({ id: '123', chat: 'hello' });
      expect(useDraftStore.getState().draft).toEqual({ id: '123', chat: 'hello' });
    });

    it('sets draft to null', () => {
      useDraftStore.getState().setDraft({ id: '1' });
      useDraftStore.getState().setDraft(null);
      expect(useDraftStore.getState().draft).toBeNull();
    });

    it('replaces the full draft object', () => {
      useDraftStore.getState().setDraft({ id: '1', chat: 'first' });
      useDraftStore.getState().setDraft({ id: '2', template_id: 'tpl-1' });
      expect(useDraftStore.getState().draft).toEqual({ id: '2', template_id: 'tpl-1' });
    });
  });

  describe('setEntryMode', () => {
    it('sets entry_mode on an empty draft', () => {
      useDraftStore.getState().setEntryMode('ai');
      expect(useDraftStore.getState().draft).toEqual({ entry_mode: 'ai' });
    });

    it('sets entry_mode preserving existing draft fields', () => {
      useDraftStore.getState().setDraft({ id: '1', chat: 'hello' });
      useDraftStore.getState().setEntryMode('manual');
      const draft = useDraftStore.getState().draft;
      expect(draft?.entry_mode).toBe('manual');
      expect(draft?.id).toBe('1');
      expect(draft?.chat).toBe('hello');
    });

    it('overrides existing entry_mode', () => {
      useDraftStore.getState().setEntryMode('ai');
      useDraftStore.getState().setEntryMode('manual');
      expect(useDraftStore.getState().draft?.entry_mode).toBe('manual');
    });
  });

  describe('markLoaded', () => {
    it('sets hasLoadedOnce to true', () => {
      useDraftStore.getState().markLoaded();
      expect(useDraftStore.getState().hasLoadedOnce).toBe(true);
    });

    it('remains true after multiple calls', () => {
      useDraftStore.getState().markLoaded();
      useDraftStore.getState().markLoaded();
      expect(useDraftStore.getState().hasLoadedOnce).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears draft and hasLoadedOnce', () => {
      useDraftStore.getState().setDraft({ id: '1' });
      useDraftStore.getState().markLoaded();
      useDraftStore.getState().reset();
      expect(useDraftStore.getState().draft).toBeNull();
      expect(useDraftStore.getState().hasLoadedOnce).toBe(false);
    });
  });
});
