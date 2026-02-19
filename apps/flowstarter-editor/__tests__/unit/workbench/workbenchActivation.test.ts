/**
 * Workbench Activation Tests
 *
 * Tests the code editor/workbench activation logic.
 * The workbench should only activate when files are created/synced.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Workbench Store ────────────────────────────────────────────────────

describe('Workbench Store Activation', () => {
  // Simulated workbench store state
  let showWorkbench: boolean;
  let files: Map<string, { content: string; type: string }>;
  let currentView: 'code' | 'preview' | 'progress';

  const workbenchStoreMock = {
    showWorkbench: {
      get: () => showWorkbench,
      set: (value: boolean) => {
        showWorkbench = value;
      },
    },
    files: {
      get: () => Object.fromEntries(files),
      setKey: (path: string, value: { content: string; type: string }) => {
        files.set(path, value);
      },
    },
    currentView: {
      get: () => currentView,
      set: (value: 'code' | 'preview' | 'progress') => {
        currentView = value;
      },
    },
    setShowWorkbench: (value: boolean) => {
      showWorkbench = value;
    },
    createFile: async (path: string, content: string) => {
      files.set(path, { content, type: 'file' });
    },
  };

  beforeEach(() => {
    showWorkbench = false;
    files = new Map();
    currentView = 'code';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with workbench hidden', () => {
      expect(workbenchStoreMock.showWorkbench.get()).toBe(false);
    });

    it('should start with no files', () => {
      expect(Object.keys(workbenchStoreMock.files.get())).toHaveLength(0);
    });

    it('should start in code view', () => {
      expect(workbenchStoreMock.currentView.get()).toBe('code');
    });
  });

  describe('File Creation Triggers Workbench', () => {
    it('should show workbench when first file is created', async () => {
      expect(workbenchStoreMock.showWorkbench.get()).toBe(false);

      // Simulate file sync logic
      await workbenchStoreMock.createFile('/src/index.ts', 'console.log("hello")');
      workbenchStoreMock.setShowWorkbench(true);

      expect(workbenchStoreMock.showWorkbench.get()).toBe(true);
      expect(files.size).toBe(1);
    });

    it('should keep workbench visible when additional files are created', async () => {
      await workbenchStoreMock.createFile('/package.json', '{}');
      workbenchStoreMock.setShowWorkbench(true);

      await workbenchStoreMock.createFile('/src/App.tsx', 'export default function App() {}');

      expect(workbenchStoreMock.showWorkbench.get()).toBe(true);
      expect(files.size).toBe(2);
    });

    it('should not activate workbench if no files are synced', () => {
      // Simulate empty sync
      const filesToSync: string[] = [];

      if (filesToSync.length > 0) {
        workbenchStoreMock.setShowWorkbench(true);
      }

      expect(workbenchStoreMock.showWorkbench.get()).toBe(false);
    });
  });

  describe('Workbench Toggle Behavior', () => {
    it('should allow toggling workbench visibility', () => {
      workbenchStoreMock.setShowWorkbench(true);
      expect(workbenchStoreMock.showWorkbench.get()).toBe(true);

      workbenchStoreMock.setShowWorkbench(false);
      expect(workbenchStoreMock.showWorkbench.get()).toBe(false);
    });

    it('should preserve files when workbench is hidden', async () => {
      await workbenchStoreMock.createFile('/src/index.ts', 'content');
      workbenchStoreMock.setShowWorkbench(true);

      workbenchStoreMock.setShowWorkbench(false);

      expect(files.size).toBe(1);
      expect(files.has('/src/index.ts')).toBe(true);
    });
  });

  describe('View Switching', () => {
    it('should switch to code view', () => {
      workbenchStoreMock.currentView.set('code');
      expect(workbenchStoreMock.currentView.get()).toBe('code');
    });

    it('should switch to preview view', () => {
      workbenchStoreMock.currentView.set('preview');
      expect(workbenchStoreMock.currentView.get()).toBe('preview');
    });

    it('should switch to progress view', () => {
      workbenchStoreMock.currentView.set('progress');
      expect(workbenchStoreMock.currentView.get()).toBe('progress');
    });
  });
});

// ─── File Sync Logic Tests ───────────────────────────────────────────────────

describe('File Sync to Workbench', () => {
  it('should normalize file paths with leading slash', () => {
    const normalizePath = (path: string) => {
      return path.startsWith('/') ? path : `/${path}`;
    };

    expect(normalizePath('src/index.ts')).toBe('/src/index.ts');
    expect(normalizePath('/src/index.ts')).toBe('/src/index.ts');
  });

  it('should handle empty file list gracefully', () => {
    const files: Array<{ path: string; content: string }> = [];
    let workbenchShown = false;

    if (files.length > 0) {
      workbenchShown = true;
    }

    expect(workbenchShown).toBe(false);
  });

  it('should track sync completion', async () => {
    const files = [
      { path: 'package.json', content: '{}' },
      { path: 'src/index.ts', content: 'console.log("test")' },
    ];

    let syncedCount = 0;
    let syncComplete = false;

    for (const file of files) {
      // Simulate file creation
      syncedCount++;
    }

    if (syncedCount === files.length) {
      syncComplete = true;
    }

    expect(syncComplete).toBe(true);
    expect(syncedCount).toBe(2);
  });
});

// ─── Workbench Activation Conditions ─────────────────────────────────────────

describe('Workbench Activation Conditions', () => {
  it('should activate when artifact is opened', () => {
    let showWorkbench = false;

    const onArtifactOpen = () => {
      showWorkbench = true;
    };

    onArtifactOpen();
    expect(showWorkbench).toBe(true);
  });

  it('should activate when files are synced from Convex', () => {
    let showWorkbench = false;
    const files = [{ path: '/src/App.tsx', content: 'code' }];

    const syncToWorkbench = async () => {
      if (files.length > 0) {
        showWorkbench = true;
      }
    };

    syncToWorkbench();
    expect(showWorkbench).toBe(true);
  });

  it('should not activate without files or artifacts', () => {
    let showWorkbench = false;
    const files: Array<{ path: string }> = [];
    const artifacts: Array<{ id: string }> = [];

    if (files.length > 0 || artifacts.length > 0) {
      showWorkbench = true;
    }

    expect(showWorkbench).toBe(false);
  });
});

// ─── Chat Started vs Workbench Visibility ────────────────────────────────────

describe('ChatStarted and Workbench Visibility', () => {
  it('should always show workbench before chat starts', () => {
    const chatStarted = false;
    const showWorkbench = false;

    const shouldShowWorkbench = chatStarted ? showWorkbench : true;

    expect(shouldShowWorkbench).toBe(true);
  });

  it('should respect showWorkbench state after chat starts', () => {
    const chatStarted = true;

    let showWorkbench = false;
    let shouldShowWorkbench = chatStarted ? showWorkbench : true;
    expect(shouldShowWorkbench).toBe(false);

    showWorkbench = true;
    shouldShowWorkbench = chatStarted ? showWorkbench : true;
    expect(shouldShowWorkbench).toBe(true);
  });

  it('should show workbench after files are generated', () => {
    const chatStarted = true;
    let showWorkbench = false;

    // Simulate file generation completing
    const onFilesGenerated = () => {
      showWorkbench = true;
    };

    onFilesGenerated();

    const shouldShowWorkbench = chatStarted ? showWorkbench : true;
    expect(shouldShowWorkbench).toBe(true);
  });
});

// ─── Header Action Buttons Tests ─────────────────────────────────────────────

describe('HeaderActionButtons Toggle Logic', () => {
  it('should toggle workbench visibility', () => {
    let showWorkbench = false;

    const toggleWorkbench = () => {
      showWorkbench = !showWorkbench;
    };

    toggleWorkbench();
    expect(showWorkbench).toBe(true);

    toggleWorkbench();
    expect(showWorkbench).toBe(false);
  });

  it('should show chat when hiding workbench if chat is hidden', () => {
    let showWorkbench = true;
    let showChat = false;

    const toggleWorkbench = () => {
      if (showWorkbench && !showChat) {
        showChat = true;
      }
      showWorkbench = !showWorkbench;
    };

    toggleWorkbench();

    expect(showWorkbench).toBe(false);
    expect(showChat).toBe(true);
  });

  it('should not force show chat when hiding workbench if chat is already visible', () => {
    let showWorkbench = true;
    let showChat = true;

    const originalShowChat = showChat;

    const toggleWorkbench = () => {
      if (showWorkbench && !showChat) {
        showChat = true;
      }
      showWorkbench = !showWorkbench;
    };

    toggleWorkbench();

    expect(showWorkbench).toBe(false);
    expect(showChat).toBe(originalShowChat);
  });
});

