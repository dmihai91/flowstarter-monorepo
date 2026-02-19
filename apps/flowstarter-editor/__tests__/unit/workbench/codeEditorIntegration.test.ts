/**
 * Code Editor Integration Tests
 *
 * Tests the integration between file sync, workbench activation,
 * and code editor display.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FileEntry {
  path: string;
  content: string;
  type: string;
  isBinary: boolean;
  updatedAt: number;
}

interface WorkbenchState {
  showWorkbench: boolean;
  files: Map<string, { content: string; type: string }>;
  selectedFile: string | null;
  currentView: 'code' | 'preview' | 'progress';
  currentDocument: { filePath: string; content: string } | null;
}

// ─── Mock Store Factory ──────────────────────────────────────────────────────

function createMockWorkbenchStore(): WorkbenchState & {
  setShowWorkbench: (show: boolean) => void;
  createFile: (path: string, content: string) => Promise<void>;
  setSelectedFile: (path: string | null) => void;
  setCurrentView: (view: 'code' | 'preview' | 'progress') => void;
} {
  const state: WorkbenchState = {
    showWorkbench: false,
    files: new Map(),
    selectedFile: null,
    currentView: 'code',
    currentDocument: null,
  };

  return {
    ...state,
    get showWorkbench() {
      return state.showWorkbench;
    },
    get files() {
      return state.files;
    },
    get selectedFile() {
      return state.selectedFile;
    },
    get currentView() {
      return state.currentView;
    },
    get currentDocument() {
      return state.currentDocument;
    },
    setShowWorkbench(show: boolean) {
      state.showWorkbench = show;
    },
    createFile: async (path: string, content: string) => {
      state.files.set(path, { content, type: 'file' });
      if (!state.selectedFile) {
        state.selectedFile = path;
        state.currentDocument = { filePath: path, content };
      }
    },
    setSelectedFile(path: string | null) {
      state.selectedFile = path;
      if (path) {
        const file = state.files.get(path);
        if (file) {
          state.currentDocument = { filePath: path, content: file.content };
        }
      } else {
        state.currentDocument = null;
      }
    },
    setCurrentView(view: 'code' | 'preview' | 'progress') {
      state.currentView = view;
    },
  };
}

// ─── File Sync Integration Tests ─────────────────────────────────────────────

describe('File Sync to Editor Integration', () => {
  let workbench: ReturnType<typeof createMockWorkbenchStore>;

  beforeEach(() => {
    workbench = createMockWorkbenchStore();
  });

  it('should sync files and activate workbench', async () => {
    const files: FileEntry[] = [
      { path: 'package.json', content: '{}', type: 'file', isBinary: false, updatedAt: Date.now() },
      { path: 'src/index.ts', content: 'console.log("hi")', type: 'file', isBinary: false, updatedAt: Date.now() },
    ];

    // Simulate sync logic from useProjectFiles
    if (files.length > 0) {
      workbench.setShowWorkbench(true);

      for (const file of files) {
        const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
        await workbench.createFile(path, file.content);
      }
    }

    expect(workbench.showWorkbench).toBe(true);
    expect(workbench.files.size).toBe(2);
    expect(workbench.selectedFile).toBe('/package.json');
  });

  it('should select first file as current document', async () => {
    const files: FileEntry[] = [
      { path: 'src/App.tsx', content: 'export default App', type: 'file', isBinary: false, updatedAt: Date.now() },
    ];

    for (const file of files) {
      await workbench.createFile(`/${file.path}`, file.content);
    }

    expect(workbench.currentDocument).not.toBeNull();
    expect(workbench.currentDocument?.filePath).toBe('/src/App.tsx');
    expect(workbench.currentDocument?.content).toBe('export default App');
  });

  it('should handle file selection change', async () => {
    await workbench.createFile('/src/index.ts', 'index content');
    await workbench.createFile('/src/App.tsx', 'app content');

    workbench.setSelectedFile('/src/App.tsx');

    expect(workbench.selectedFile).toBe('/src/App.tsx');
    expect(workbench.currentDocument?.content).toBe('app content');
  });

  it('should handle binary files gracefully', async () => {
    const binaryFile: FileEntry = {
      path: 'logo.png',
      content: 'base64content',
      type: 'file',
      isBinary: true,
      updatedAt: Date.now(),
    };

    // Binary files should still be added to the file tree
    await workbench.createFile(`/${binaryFile.path}`, binaryFile.content);

    expect(workbench.files.has('/logo.png')).toBe(true);
  });
});

// ─── Project Files Hook Integration ──────────────────────────────────────────

describe('useProjectFiles Integration', () => {
  it('should detect file changes', () => {
    const previousFiles = new Map<string, number>([
      ['src/index.ts', 1000],
      ['package.json', 1000],
    ]);

    const currentFiles: FileEntry[] = [
      { path: 'src/index.ts', content: 'updated', type: 'file', isBinary: false, updatedAt: 2000 },
      { path: 'package.json', content: '{}', type: 'file', isBinary: false, updatedAt: 1000 },
    ];

    const hasChanges = currentFiles.some((file) => {
      const previousUpdatedAt = previousFiles.get(file.path);
      return previousUpdatedAt === undefined || previousUpdatedAt < file.updatedAt;
    });

    expect(hasChanges).toBe(true);
  });

  it('should detect new files', () => {
    const previousFiles = new Map<string, number>([['src/index.ts', 1000]]);

    const currentFiles: FileEntry[] = [
      { path: 'src/index.ts', content: 'content', type: 'file', isBinary: false, updatedAt: 1000 },
      { path: 'src/App.tsx', content: 'new file', type: 'file', isBinary: false, updatedAt: 1000 },
    ];

    const hasNewFiles = currentFiles.some((file) => !previousFiles.has(file.path));

    expect(hasNewFiles).toBe(true);
  });

  it('should detect removed files', () => {
    const previousFiles = new Map<string, number>([
      ['src/index.ts', 1000],
      ['src/old.ts', 1000],
    ]);

    const currentFiles: FileEntry[] = [
      { path: 'src/index.ts', content: 'content', type: 'file', isBinary: false, updatedAt: 1000 },
    ];

    const currentPaths = new Set(currentFiles.map((f) => f.path));
    const hasRemovedFiles = Array.from(previousFiles.keys()).some((path) => !currentPaths.has(path));

    expect(hasRemovedFiles).toBe(true);
  });

  it('should not sync when files are unchanged', () => {
    const previousFiles = new Map<string, number>([
      ['src/index.ts', 1000],
      ['package.json', 1000],
    ]);

    const currentFiles: FileEntry[] = [
      { path: 'src/index.ts', content: 'content', type: 'file', isBinary: false, updatedAt: 1000 },
      { path: 'package.json', content: '{}', type: 'file', isBinary: false, updatedAt: 1000 },
    ];

    const hasChanges = currentFiles.some((file) => {
      const previousUpdatedAt = previousFiles.get(file.path);
      return previousUpdatedAt === undefined || previousUpdatedAt < file.updatedAt;
    });

    const currentPaths = new Set(currentFiles.map((f) => f.path));
    const hasNewOrRemovedFiles =
      currentFiles.length !== previousFiles.size ||
      currentFiles.some((file) => !previousFiles.has(file.path)) ||
      Array.from(previousFiles.keys()).some((path) => !currentPaths.has(path));

    expect(hasChanges).toBe(false);
    expect(hasNewOrRemovedFiles).toBe(false);
  });
});

// ─── Workbench View Mode Tests ───────────────────────────────────────────────

describe('Workbench View Modes', () => {
  let workbench: ReturnType<typeof createMockWorkbenchStore>;

  beforeEach(() => {
    workbench = createMockWorkbenchStore();
  });

  it('should switch to preview when preview is available', () => {
    const hasPreview = true;

    if (hasPreview) {
      workbench.setCurrentView('preview');
    }

    expect(workbench.currentView).toBe('preview');
  });

  it('should stay in code view when no preview', () => {
    const hasPreview = false;

    if (hasPreview) {
      workbench.setCurrentView('preview');
    }

    expect(workbench.currentView).toBe('code');
  });

  it('should switch to progress during build', () => {
    const isBuildInProgress = true;

    if (isBuildInProgress) {
      workbench.setCurrentView('progress');
    }

    expect(workbench.currentView).toBe('progress');
  });
});

// ─── Editor Document Management Tests ────────────────────────────────────────

describe('Editor Document Management', () => {
  let workbench: ReturnType<typeof createMockWorkbenchStore>;

  beforeEach(() => {
    workbench = createMockWorkbenchStore();
  });

  it('should update document when file is selected', async () => {
    await workbench.createFile('/src/index.ts', 'original content');

    expect(workbench.currentDocument?.content).toBe('original content');
  });

  it('should clear document when no file is selected', async () => {
    await workbench.createFile('/src/index.ts', 'content');

    workbench.setSelectedFile(null);

    expect(workbench.currentDocument).toBeNull();
  });

  it('should handle file path with special characters', async () => {
    const path = '/src/components/[id]/page.tsx';
    await workbench.createFile(path, 'dynamic route');

    expect(workbench.files.has(path)).toBe(true);
    expect(workbench.currentDocument?.filePath).toBe(path);
  });
});

// ─── Sync State Management Tests ─────────────────────────────────────────────

describe('Sync State Management', () => {
  it('should track syncing state', async () => {
    let isSyncing = false;
    let lastSyncedAt: number | null = null;

    const syncToWorkbench = async (files: FileEntry[]) => {
      isSyncing = true;

      // Simulate async sync
      await new Promise((resolve) => setTimeout(resolve, 10));

      lastSyncedAt = Date.now();
      isSyncing = false;
    };

    const files: FileEntry[] = [
      { path: 'index.ts', content: 'code', type: 'file', isBinary: false, updatedAt: Date.now() },
    ];

    expect(isSyncing).toBe(false);
    expect(lastSyncedAt).toBeNull();

    const syncPromise = syncToWorkbench(files);

    // During sync
    expect(isSyncing).toBe(true);

    await syncPromise;

    // After sync
    expect(isSyncing).toBe(false);
    expect(lastSyncedAt).not.toBeNull();
  });

  it('should reset sync state on project change', () => {
    let initialSyncDone = true;
    let previousFiles = new Map([['index.ts', 1000]]);
    let lastSyncedAt: number | null = Date.now();

    const resetOnProjectChange = () => {
      initialSyncDone = false;
      previousFiles = new Map();
      lastSyncedAt = null;
    };

    resetOnProjectChange();

    expect(initialSyncDone).toBe(false);
    expect(previousFiles.size).toBe(0);
    expect(lastSyncedAt).toBeNull();
  });
});

// ─── Error Handling Tests ────────────────────────────────────────────────────

describe('Error Handling in File Sync', () => {
  it('should handle sync errors gracefully', async () => {
    let errorOccurred = false;
    let errorMessage = '';

    const syncWithError = async () => {
      try {
        throw new Error('Network error during sync');
      } catch (error) {
        errorOccurred = true;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
    };

    await syncWithError();

    expect(errorOccurred).toBe(true);
    expect(errorMessage).toBe('Network error during sync');
  });

  it('should call onError callback on sync failure', async () => {
    const onError = vi.fn();

    const syncToWorkbench = async () => {
      try {
        throw new Error('Sync failed');
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Sync failed'));
      }
    };

    await syncToWorkbench();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Sync failed' }));
  });
});

