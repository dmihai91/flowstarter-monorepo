import type { ProjectConfig } from '@/types/project-config';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCollectMode } from '../useCollectMode';

describe('useCollectMode', () => {
  const baseProjectConfig: ProjectConfig = {
    name: '',
    description: '',
    USP: '',
    targetUsers: '',
    businessGoals: '',
    designConfig: {
      businessInfo: {
        industry: '',
        targetAudience: '',
        brandValues: '',
        competitors: '',
        additionalNotes: '',
      },
    },
  } as ProjectConfig;

  it('should initialize at step 0 with empty mode when no data exists', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: '',
        userDescription: '',
      })
    );

    expect(result.current.collectStep).toBe(0);
    expect(result.current.collectMode).toBe('');
  });

  it('should initialize at step 1 with ai mode when industry exists', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: 'technology',
        userDescription: '',
      })
    );

    expect(result.current.collectStep).toBe(1);
    expect(result.current.collectMode).toBe('ai');
  });

  it('should initialize at step 2 when user description exists', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: 'technology',
        userDescription: 'My project description',
      })
    );

    expect(result.current.collectStep).toBe(2);
    expect(result.current.collectMode).toBe('ai');
  });

  it('should read industry from projectConfig.designConfig.businessInfo', () => {
    const projectConfigWithIndustry = {
      ...baseProjectConfig,
      designConfig: {
        businessInfo: {
          industry: 'finance',
          targetAudience: '',
          brandValues: '',
          competitors: '',
          additionalNotes: '',
        },
      },
    } as ProjectConfig;

    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: projectConfigWithIndustry,
        industry: '',
        userDescription: '',
      })
    );

    expect(result.current.collectStep).toBe(1);
    expect(result.current.collectMode).toBe('ai');
  });

  it('should prioritize userDescription prop over industry for step initialization', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: 'technology',
        userDescription: 'Description',
      })
    );

    expect(result.current.collectStep).toBe(2);
  });

  it('should auto-select ai mode when industry is added', () => {
    const { result, rerender } = renderHook(
      ({ industry }) =>
        useCollectMode({
          projectConfig: baseProjectConfig,
          industry,
          userDescription: '',
        }),
      { initialProps: { industry: '' } }
    );

    expect(result.current.collectMode).toBe('');

    rerender({ industry: 'technology' });

    expect(result.current.collectMode).toBe('ai');
  });

  it('should allow changing collect mode', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: 'technology',
        userDescription: '',
      })
    );

    expect(result.current.collectMode).toBe('ai');

    act(() => {
      result.current.setCollectMode('manual');
    });

    expect(result.current.collectMode).toBe('manual');
  });

  it('should allow changing collect step', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: 'technology',
        userDescription: '',
      })
    );

    expect(result.current.collectStep).toBe(1);

    act(() => {
      result.current.setCollectStep(2);
    });

    expect(result.current.collectStep).toBe(2);
  });

  it('should handle whitespace in industry and userDescription', () => {
    const { result } = renderHook(() =>
      useCollectMode({
        projectConfig: baseProjectConfig,
        industry: '   ',
        userDescription: '   ',
      })
    );

    expect(result.current.collectStep).toBe(0);
    expect(result.current.collectMode).toBe('');
  });

  it('should not auto-select ai mode if mode is already set to manual', () => {
    const { result, rerender } = renderHook(
      ({ industry }) =>
        useCollectMode({
          projectConfig: baseProjectConfig,
          industry,
          userDescription: '',
        }),
      { initialProps: { industry: 'technology' } }
    );

    act(() => {
      result.current.setCollectMode('manual');
    });

    rerender({ industry: 'finance' });

    expect(result.current.collectMode).toBe('manual');
  });
});
