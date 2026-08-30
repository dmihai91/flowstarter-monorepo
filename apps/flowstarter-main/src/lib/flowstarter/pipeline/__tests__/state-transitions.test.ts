/**
 * The transition map is the one thing standing between an operator override
 * and a project that reached LIVE_SUBSCRIPTION without a deposit, a build or a
 * QA pass. These cases pin the invariant rather than the literal table, so a
 * future edit that adds a shortcut fails here and not in production.
 */
import { describe, expect, it } from 'vitest';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import {
  ALLOWED_STATE_TRANSITIONS,
  PROJECT_STATE_ORDER,
  allowedNextStates,
  asProjectState,
  describeRejectedTransition,
  isAllowedTransition,
} from '../state-transitions';

describe('the allowed transition map', () => {
  it('covers every state exactly once, in lifecycle order', () => {
    expect(Object.keys(ALLOWED_STATE_TRANSITIONS).sort()).toEqual(
      Object.values(ProjectState).sort()
    );
    expect(PROJECT_STATE_ORDER).toEqual(Object.values(ProjectState));
  });

  it('never allows a move that skips a lifecycle step', () => {
    for (const [from, targets] of Object.entries(ALLOWED_STATE_TRANSITIONS)) {
      const fromIndex = PROJECT_STATE_ORDER.indexOf(from as ProjectState);
      for (const to of targets) {
        const distance = Math.abs(PROJECT_STATE_ORDER.indexOf(to) - fromIndex);
        expect(distance, `${from} -> ${to}`).toBe(1);
      }
    }
  });

  it('has no self-transitions', () => {
    for (const [from, targets] of Object.entries(ALLOWED_STATE_TRANSITIONS)) {
      expect(targets).not.toContain(from);
    }
  });

  it('refuses the jump that skips the deposit', () => {
    expect(
      isAllowedTransition(ProjectState.INTAKE, ProjectState.LIVE_SUBSCRIPTION)
    ).toBe(false);
    expect(
      isAllowedTransition(
        ProjectState.PREVIEW_READY,
        ProjectState.AGENTS_WORKING
      )
    ).toBe(false);
  });

  it('allows one step forward and one step back', () => {
    expect(
      isAllowedTransition(
        ProjectState.DEPOSIT_PAID,
        ProjectState.AGENTS_WORKING
      )
    ).toBe(true);
    expect(
      isAllowedTransition(ProjectState.DEPOSIT_PAID, ProjectState.PREVIEW_READY)
    ).toBe(true);
  });

  it('tells the operator what they may do instead', () => {
    const message = describeRejectedTransition(
      ProjectState.INTAKE,
      ProjectState.HUMAN_QA
    );
    expect(message).toContain('PREVIEW_READY');
    expect(
      describeRejectedTransition(ProjectState.INTAKE, ProjectState.INTAKE)
    ).toMatch(/already in INTAKE/);
  });

  it('offers no moves out of a state it does not recognise', () => {
    expect(allowedNextStates('NONSENSE' as ProjectState)).toEqual([]);
  });
});

describe('asProjectState', () => {
  it('accepts the real states and rejects everything else', () => {
    expect(asProjectState('DEPOSIT_PAID')).toBe(ProjectState.DEPOSIT_PAID);
    expect(asProjectState('deposit_paid')).toBeNull();
    expect(asProjectState('')).toBeNull();
    expect(asProjectState(null)).toBeNull();
    expect(asProjectState(undefined)).toBeNull();
  });
});
