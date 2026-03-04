import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

import { useProjectCards } from '../useProjectCards';

// Minimal mock matching Table<'projects'> shape
function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    created_at: '2025-01-01',
    updated_at: null,
    generated_at: null,
    ...overrides,
  } as any;
}

describe('useProjectCards', () => {
  it('returns empty array for empty input', () => {
    const { result } = renderHook(() => useProjectCards([]));
    expect(result.current).toEqual([]);
  });

  it('transforms a project into a card', () => {
    const projects = [makeProject()];
    const { result } = renderHook(() => useProjectCards(projects));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('proj-1');
    expect(result.current[0].name).toBe('Test Project');
    expect(result.current[0].description).toBe('A test project');
    expect(result.current[0].status).toBe('active');
    expect(result.current[0].link).toBe('/projects/proj-1');
    expect(result.current[0].isDraft).toBe(false);
  });

  it('uses draft link for draft projects', () => {
    const projects = [makeProject({ is_draft: true })];
    const { result } = renderHook(() => useProjectCards(projects));

    expect(result.current[0].isDraft).toBe(true);
    expect(result.current[0].link).toBe('/wizard/project/proj-1');
  });

  it('uses placeholder name for non-string names', () => {
    const projects = [makeProject({ name: null })];
    const { result } = renderHook(() => useProjectCards(projects));

    expect(result.current[0].name).toBe('dashboard.projects.draftPlaceholderName');
  });

  it('maps known template_id strings to labels', () => {
    const cases = [
      { template_id: 'personal-brand', expected: 'Personal Brand' },
      { template_id: 'course-launch', expected: 'Course Launch' },
      { template_id: 'local-business', expected: 'Local Business' },
      { template_id: 'product-launch', expected: 'Product Launch' },
      { template_id: 'mini-ecommerce', expected: 'Mini E-commerce' },
    ];

    for (const { template_id, expected } of cases) {
      const projects = [makeProject({ template_id })];
      const { result } = renderHook(() => useProjectCards(projects));
      expect(result.current[0].templateLabel).toBe(expected);
    }
  });

  it('returns "Custom" for unknown template_id', () => {
    const projects = [makeProject({ template_id: '' })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].templateLabel).toBe('Custom');
  });

  it('extracts label from template_id object with name', () => {
    const projects = [makeProject({ template_id: { name: 'My Template' } })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].templateLabel).toBe('My Template');
  });

  it('extracts label from template_id object with id', () => {
    const projects = [makeProject({ template_id: { id: 'custom-template' } })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].templateLabel).toBe('Custom Template');
  });

  it('prefers updated_at over created_at for createdAt', () => {
    const projects = [makeProject({ updated_at: '2025-06-01', created_at: '2025-01-01' })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].createdAt).toBe('2025-06-01');
  });

  it('falls back to created_at when updated_at is null', () => {
    const projects = [makeProject({ updated_at: null, created_at: '2025-01-01' })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].createdAt).toBe('2025-01-01');
  });

  it('defaults status to draft for non-string status', () => {
    const projects = [makeProject({ status: null })];
    const { result } = renderHook(() => useProjectCards(projects));
    expect(result.current[0].status).toBe('draft');
  });
});
