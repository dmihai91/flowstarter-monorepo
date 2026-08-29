/**
 * Pure path-building/validation for tenant storage objects. No bucket exists
 * yet, so these functions never touch Supabase Storage — everything here is
 * string logic, checked directly.
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_EXTENSIONS,
  StoragePathError,
  assertTenantPath,
  assetObjectPath,
  generatedAssetPath,
  previewArtifactPath,
} from '../storage-paths';

const WORKSPACE_A = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const WORKSPACE_B = 'a3b1c2d4-1111-4222-8333-444455556666';
const SHA256 = 'a'.repeat(64);

describe('assetObjectPath', () => {
  it('builds tenant/{workspaceId}/assets/{sha256}.{ext}', () => {
    expect(
      assetObjectPath({
        workspaceId: WORKSPACE_A,
        sha256: SHA256,
        extension: 'png',
      })
    ).toBe(`tenant/${WORKSPACE_A}/assets/${SHA256}.png`);
  });

  it('lowercases the sha256', () => {
    expect(
      assetObjectPath({
        workspaceId: WORKSPACE_A,
        sha256: SHA256.toUpperCase(),
        extension: 'png',
      })
    ).toBe(`tenant/${WORKSPACE_A}/assets/${SHA256}.png`);
  });

  it('accepts every allowed extension', () => {
    for (const extension of ALLOWED_EXTENSIONS) {
      expect(() =>
        assetObjectPath({ workspaceId: WORKSPACE_A, sha256: SHA256, extension })
      ).not.toThrow();
    }
  });

  it('rejects a disallowed extension', () => {
    expect(() =>
      assetObjectPath({
        workspaceId: WORKSPACE_A,
        sha256: SHA256,
        extension: 'exe',
      })
    ).toThrow(StoragePathError);
  });

  it('rejects a malformed sha256', () => {
    expect(() =>
      assetObjectPath({
        workspaceId: WORKSPACE_A,
        sha256: 'not-a-hash',
        extension: 'png',
      })
    ).toThrow(StoragePathError);
  });

  it('rejects a malformed workspace id', () => {
    expect(() =>
      assetObjectPath({
        workspaceId: 'not-a-uuid',
        sha256: SHA256,
        extension: 'png',
      })
    ).toThrow(StoragePathError);
  });
});

describe('generatedAssetPath', () => {
  it('builds tenant/{workspaceId}/generated/{name}.{ext}', () => {
    expect(
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: 'hero-variant-1',
        extension: 'webp',
      })
    ).toBe(`tenant/${WORKSPACE_A}/generated/hero-variant-1.webp`);
  });

  it('rejects a name containing a path separator', () => {
    expect(() =>
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: 'sub/dir',
        extension: 'webp',
      })
    ).toThrow(StoragePathError);
  });

  it('rejects a name containing traversal', () => {
    expect(() =>
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: '..',
        extension: 'webp',
      })
    ).toThrow(StoragePathError);
  });

  it('rejects an empty name', () => {
    expect(() =>
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: '',
        extension: 'webp',
      })
    ).toThrow(StoragePathError);
  });

  it('rejects a disallowed extension', () => {
    expect(() =>
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: 'hero',
        extension: 'exe',
      })
    ).toThrow(StoragePathError);
  });
});

describe('previewArtifactPath', () => {
  const PROJECT_ID = 'a1a1a1a1-1111-4111-8111-111111111111';

  it('builds tenant/{workspaceId}/previews/{projectId}/site.tar.gz', () => {
    expect(
      previewArtifactPath({ workspaceId: WORKSPACE_A, projectId: PROJECT_ID })
    ).toBe(`tenant/${WORKSPACE_A}/previews/${PROJECT_ID}/site.tar.gz`);
  });

  it('rejects a project id containing a path separator', () => {
    expect(() =>
      previewArtifactPath({ workspaceId: WORKSPACE_A, projectId: 'a/b' })
    ).toThrow(StoragePathError);
  });

  it('rejects a malformed workspace id', () => {
    expect(() =>
      previewArtifactPath({ workspaceId: 'not-a-uuid', projectId: PROJECT_ID })
    ).toThrow(StoragePathError);
  });
});

describe('assertTenantPath', () => {
  it('accepts a path scoped to the given workspace', () => {
    expect(() =>
      assertTenantPath(
        `tenant/${WORKSPACE_A}/assets/${SHA256}.png`,
        WORKSPACE_A
      )
    ).not.toThrow();
  });

  it('accepts every path this module builds, for the same workspace', () => {
    const paths = [
      assetObjectPath({
        workspaceId: WORKSPACE_A,
        sha256: SHA256,
        extension: 'png',
      }),
      generatedAssetPath({
        workspaceId: WORKSPACE_A,
        name: 'hero',
        extension: 'webp',
      }),
      previewArtifactPath({ workspaceId: WORKSPACE_A, projectId: 'proj-1' }),
    ];
    for (const path of paths) {
      expect(() => assertTenantPath(path, WORKSPACE_A)).not.toThrow();
    }
  });

  it('refuses a path scoped to a different workspace (cross-tenant)', () => {
    const pathForA = assetObjectPath({
      workspaceId: WORKSPACE_A,
      sha256: SHA256,
      extension: 'png',
    });
    expect(() => assertTenantPath(pathForA, WORKSPACE_B)).toThrow(
      StoragePathError
    );
  });

  it('refuses a path containing ".."', () => {
    expect(() =>
      assertTenantPath(
        `tenant/${WORKSPACE_A}/../${WORKSPACE_B}/assets/x.png`,
        WORKSPACE_A
      )
    ).toThrow(StoragePathError);
  });

  it('refuses a path with a leading slash', () => {
    expect(() =>
      assertTenantPath(`/tenant/${WORKSPACE_A}/assets/x.png`, WORKSPACE_A)
    ).toThrow(StoragePathError);
  });

  it('refuses a path containing a backslash', () => {
    expect(() =>
      assertTenantPath(`tenant/${WORKSPACE_A}\\assets\\x.png`, WORKSPACE_A)
    ).toThrow(StoragePathError);
  });

  it('refuses a path containing a NUL byte', () => {
    expect(() =>
      assertTenantPath(`tenant/${WORKSPACE_A}/assets/x.png\0`, WORKSPACE_A)
    ).toThrow(StoragePathError);
  });

  it('refuses an empty path', () => {
    expect(() => assertTenantPath('', WORKSPACE_A)).toThrow(StoragePathError);
  });

  it('refuses a path that is not under tenant/ at all', () => {
    expect(() =>
      assertTenantPath(`public/${WORKSPACE_A}/x.png`, WORKSPACE_A)
    ).toThrow(StoragePathError);
  });

  it('throws before path checks if workspaceId itself is malformed', () => {
    expect(() =>
      assertTenantPath(`tenant/not-a-uuid/assets/x.png`, 'not-a-uuid')
    ).toThrow(StoragePathError);
  });
});
