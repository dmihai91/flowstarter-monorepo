import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  getMilestoneStatuses,
  getTimeGreetingKey,
  useDashboardMilestones,
} from '../useDashboardMilestones';

describe('getMilestoneStatuses', () => {
  it('returns all completed when hasLiveProject is true', () => {
    expect(getMilestoneStatuses(true, true)).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
    ]);
  });

  it('returns all completed when hasLiveProject is true even if hasAnyProject is false', () => {
    // hasLiveProject takes precedence
    expect(getMilestoneStatuses(false, true)).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
    ]);
  });

  it('returns first completed, second active, rest locked when hasAnyProject only', () => {
    expect(getMilestoneStatuses(true, false)).toEqual([
      'completed',
      'active',
      'locked',
      'locked',
    ]);
  });

  it('returns first active, rest locked when no projects', () => {
    expect(getMilestoneStatuses(false, false)).toEqual([
      'active',
      'locked',
      'locked',
      'locked',
    ]);
  });
});

describe('getTimeGreetingKey', () => {
  it('returns morning for hours 5-11', () => {
    expect(getTimeGreetingKey(5)).toBe('dashboard.greeting.morning');
    expect(getTimeGreetingKey(8)).toBe('dashboard.greeting.morning');
    expect(getTimeGreetingKey(11)).toBe('dashboard.greeting.morning');
  });

  it('returns afternoon for hours 12-17', () => {
    expect(getTimeGreetingKey(12)).toBe('dashboard.greeting.afternoon');
    expect(getTimeGreetingKey(15)).toBe('dashboard.greeting.afternoon');
    expect(getTimeGreetingKey(17)).toBe('dashboard.greeting.afternoon');
  });

  it('returns evening for hours 18-21', () => {
    expect(getTimeGreetingKey(18)).toBe('dashboard.greeting.evening');
    expect(getTimeGreetingKey(20)).toBe('dashboard.greeting.evening');
    expect(getTimeGreetingKey(21)).toBe('dashboard.greeting.evening');
  });

  it('returns night for hours 22-4', () => {
    expect(getTimeGreetingKey(22)).toBe('dashboard.greeting.night');
    expect(getTimeGreetingKey(0)).toBe('dashboard.greeting.night');
    expect(getTimeGreetingKey(3)).toBe('dashboard.greeting.night');
    expect(getTimeGreetingKey(4)).toBe('dashboard.greeting.night');
  });

  it('handles boundary values correctly', () => {
    // 4 -> night, 5 -> morning
    expect(getTimeGreetingKey(4)).toBe('dashboard.greeting.night');
    expect(getTimeGreetingKey(5)).toBe('dashboard.greeting.morning');
    // 11 -> morning, 12 -> afternoon
    expect(getTimeGreetingKey(11)).toBe('dashboard.greeting.morning');
    expect(getTimeGreetingKey(12)).toBe('dashboard.greeting.afternoon');
    // 17 -> afternoon, 18 -> evening
    expect(getTimeGreetingKey(17)).toBe('dashboard.greeting.afternoon');
    expect(getTimeGreetingKey(18)).toBe('dashboard.greeting.evening');
    // 21 -> evening, 22 -> night
    expect(getTimeGreetingKey(21)).toBe('dashboard.greeting.evening');
    expect(getTimeGreetingKey(22)).toBe('dashboard.greeting.night');
  });
});

describe('useDashboardMilestones', () => {
  it('returns 0 completed and 0% when no projects exist', () => {
    const { result } = renderHook(() => useDashboardMilestones(false, false));
    expect(result.current.statuses).toEqual(['active', 'locked', 'locked', 'locked']);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.progressPercent).toBe(0);
  });

  it('returns 1 completed and 25% when hasAnyProject', () => {
    const { result } = renderHook(() => useDashboardMilestones(true, false));
    expect(result.current.statuses).toEqual(['completed', 'active', 'locked', 'locked']);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.progressPercent).toBe(25);
  });

  it('returns 4 completed and 100% when hasLiveProject', () => {
    const { result } = renderHook(() => useDashboardMilestones(true, true));
    expect(result.current.statuses).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
    ]);
    expect(result.current.completedCount).toBe(4);
    expect(result.current.progressPercent).toBe(100);
  });

  it('updates when props change', () => {
    const { result, rerender } = renderHook(
      ({ hasAny, hasLive }: { hasAny: boolean; hasLive: boolean }) =>
        useDashboardMilestones(hasAny, hasLive),
      { initialProps: { hasAny: false, hasLive: false } }
    );

    expect(result.current.progressPercent).toBe(0);

    rerender({ hasAny: true, hasLive: false });
    expect(result.current.progressPercent).toBe(25);

    rerender({ hasAny: true, hasLive: true });
    expect(result.current.progressPercent).toBe(100);
  });
});
