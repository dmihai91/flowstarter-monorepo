/**
 * Daytona Integration Tests
 *
 * Tests for Daytona workspace management, file operations, and deployment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Types ─────────────────────────────────────────────────────────────

interface WorkspaceInfo {
  id: string;
  name: string;
  image: string;
  state: 'creating' | 'running' | 'stopped' | 'error';
  previewUrl?: string;
  createdAt: number;
}

interface FileContent {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

// ─── Mock DaytonaClient ─────────────────────────────────────────────────────

class MockDaytonaClient {
  private workspaces: Map<string, WorkspaceInfo> = new Map();
  private workspaceFiles: Map<string, Map<string, string>> = new Map();

  async createWorkspace(name: string, image: string): Promise<WorkspaceInfo> {
    const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const workspace: WorkspaceInfo = {
      id,
      name,
      image,
      state: 'creating',
      createdAt: Date.now(),
    };
    this.workspaces.set(id, workspace);
    this.workspaceFiles.set(id, new Map());

    // Simulate async creation
    setTimeout(() => {
      const ws = this.workspaces.get(id);
      if (ws) {
        ws.state = 'running';
        ws.previewUrl = `https://${id}.preview.daytona.local:8080`;
      }
    }, 100);

    return workspace;
  }

  async getWorkspace(id: string): Promise<WorkspaceInfo | null> {
    return this.workspaces.get(id) || null;
  }

  async destroyWorkspace(id: string): Promise<boolean> {
    if (!this.workspaces.has(id)) {
      return false;
    }
    this.workspaces.delete(id);
    this.workspaceFiles.delete(id);
    return true;
  }

  async writeFile(workspaceId: string, path: string, content: string): Promise<void> {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    files.set(path, content);
  }

  async readFile(workspaceId: string, path: string): Promise<string | null> {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    return files.get(path) || null;
  }

  async listFiles(workspaceId: string, directory: string = '/'): Promise<string[]> {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    return Array.from(files.keys()).filter((path) =>
      path.startsWith(directory === '/' ? '' : directory)
    );
  }

  async exec(workspaceId: string, command: string): Promise<ExecResult> {
    if (!this.workspaces.has(workspaceId)) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Simulate some common commands
    if (command.includes('npm run build')) {
      return { exitCode: 0, stdout: 'Build successful', stderr: '' };
    }
    if (command.includes('npm install')) {
      return { exitCode: 0, stdout: 'Dependencies installed', stderr: '' };
    }
    if (command.includes('npm start')) {
      return { exitCode: 0, stdout: 'Server started on port 8080', stderr: '' };
    }

    return { exitCode: 0, stdout: '', stderr: '' };
  }
}

// ─── Workspace Management Tests ─────────────────────────────────────────────

describe('Daytona Workspace Management', () => {
  let client: MockDaytonaClient;

  beforeEach(() => {
    client = new MockDaytonaClient();
  });

  describe('createWorkspace', () => {
    it('should create a workspace with unique ID', async () => {
      const ws = await client.createWorkspace('test-project', 'node:20');

      expect(ws.id).toBeDefined();
      expect(ws.id).toMatch(/^ws_/);
      expect(ws.name).toBe('test-project');
      expect(ws.image).toBe('node:20');
    });

    it('should set initial state to creating', async () => {
      const ws = await client.createWorkspace('test-project', 'node:20');
      expect(ws.state).toBe('creating');
    });

    it('should record creation timestamp', async () => {
      const before = Date.now();
      const ws = await client.createWorkspace('test-project', 'node:20');
      const after = Date.now();

      expect(ws.createdAt).toBeGreaterThanOrEqual(before);
      expect(ws.createdAt).toBeLessThanOrEqual(after);
    });

    it('should generate preview URL after creation', async () => {
      const ws = await client.createWorkspace('test-project', 'node:20');

      // Wait for async state change
      await new Promise((resolve) => setTimeout(resolve, 150));

      const updated = await client.getWorkspace(ws.id);
      expect(updated?.state).toBe('running');
      expect(updated?.previewUrl).toContain(ws.id);
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace by ID', async () => {
      const created = await client.createWorkspace('test', 'node:20');
      const retrieved = await client.getWorkspace(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent workspace', async () => {
      const result = await client.getWorkspace('ws_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('destroyWorkspace', () => {
    it('should destroy existing workspace', async () => {
      const ws = await client.createWorkspace('test', 'node:20');
      const result = await client.destroyWorkspace(ws.id);

      expect(result).toBe(true);
      expect(await client.getWorkspace(ws.id)).toBeNull();
    });

    it('should return false for non-existent workspace', async () => {
      const result = await client.destroyWorkspace('ws_nonexistent');
      expect(result).toBe(false);
    });

    it('should clean up workspace files', async () => {
      const ws = await client.createWorkspace('test', 'node:20');
      await client.writeFile(ws.id, '/src/index.ts', 'content');
      await client.destroyWorkspace(ws.id);

      // Attempting to access files should throw
      await expect(client.readFile(ws.id, '/src/index.ts')).rejects.toThrow();
    });
  });
});

// ─── File Operations Tests ──────────────────────────────────────────────────

describe('Daytona File Operations', () => {
  let client: MockDaytonaClient;
  let workspaceId: string;

  beforeEach(async () => {
    client = new MockDaytonaClient();
    const ws = await client.createWorkspace('test', 'node:20');
    workspaceId = ws.id;
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      await client.writeFile(workspaceId, '/src/index.ts', 'export const x = 1;');
      const content = await client.readFile(workspaceId, '/src/index.ts');
      expect(content).toBe('export const x = 1;');
    });

    it('should overwrite existing file', async () => {
      await client.writeFile(workspaceId, '/src/index.ts', 'old content');
      await client.writeFile(workspaceId, '/src/index.ts', 'new content');
      const content = await client.readFile(workspaceId, '/src/index.ts');
      expect(content).toBe('new content');
    });

    it('should throw for non-existent workspace', async () => {
      await expect(
        client.writeFile('ws_nonexistent', '/test.ts', 'content')
      ).rejects.toThrow('Workspace not found');
    });
  });

  describe('readFile', () => {
    it('should read existing file', async () => {
      await client.writeFile(workspaceId, '/package.json', '{"name": "test"}');
      const content = await client.readFile(workspaceId, '/package.json');
      expect(content).toBe('{"name": "test"}');
    });

    it('should return null for non-existent file', async () => {
      const content = await client.readFile(workspaceId, '/nonexistent.ts');
      expect(content).toBeNull();
    });
  });

  describe('listFiles', () => {
    it('should list all files in workspace', async () => {
      await client.writeFile(workspaceId, '/src/index.ts', '');
      await client.writeFile(workspaceId, '/src/utils.ts', '');
      await client.writeFile(workspaceId, '/package.json', '');

      const files = await client.listFiles(workspaceId);
      expect(files).toHaveLength(3);
    });

    it('should filter by directory', async () => {
      await client.writeFile(workspaceId, '/src/index.ts', '');
      await client.writeFile(workspaceId, '/src/utils.ts', '');
      await client.writeFile(workspaceId, '/package.json', '');

      const files = await client.listFiles(workspaceId, '/src');
      expect(files).toHaveLength(2);
      expect(files.every((f) => f.startsWith('/src'))).toBe(true);
    });
  });
});

// ─── Command Execution Tests ────────────────────────────────────────────────

describe('Daytona Command Execution', () => {
  let client: MockDaytonaClient;
  let workspaceId: string;

  beforeEach(async () => {
    client = new MockDaytonaClient();
    const ws = await client.createWorkspace('test', 'node:20');
    workspaceId = ws.id;
  });

  describe('exec', () => {
    it('should execute npm install', async () => {
      const result = await client.exec(workspaceId, 'npm install');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dependencies installed');
    });

    it('should execute npm run build', async () => {
      const result = await client.exec(workspaceId, 'npm run build');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Build successful');
    });

    it('should throw for non-existent workspace', async () => {
      await expect(
        client.exec('ws_nonexistent', 'npm install')
      ).rejects.toThrow('Workspace not found');
    });
  });
});

// ─── File Sync Tests ────────────────────────────────────────────────────────

describe('Daytona File Sync', () => {
  let client: MockDaytonaClient;
  let workspaceId: string;

  beforeEach(async () => {
    client = new MockDaytonaClient();
    const ws = await client.createWorkspace('test', 'node:20');
    workspaceId = ws.id;
  });

  it('should sync multiple files', async () => {
    const files: Record<string, string> = {
      '/src/index.ts': 'export const main = () => {}',
      '/src/utils.ts': 'export const helper = () => {}',
      '/package.json': '{"name": "test-app"}',
      '/tsconfig.json': '{"compilerOptions": {}}',
    };

    for (const [path, content] of Object.entries(files)) {
      await client.writeFile(workspaceId, path, content);
    }

    const fileList = await client.listFiles(workspaceId);
    expect(fileList).toHaveLength(4);

    for (const [path, expectedContent] of Object.entries(files)) {
      const content = await client.readFile(workspaceId, path);
      expect(content).toBe(expectedContent);
    }
  });

  it('should handle large files', async () => {
    const largeContent = 'x'.repeat(1_000_000); // 1MB
    await client.writeFile(workspaceId, '/large.txt', largeContent);

    const content = await client.readFile(workspaceId, '/large.txt');
    expect(content).toHaveLength(1_000_000);
  });

  it('should handle special characters in content', async () => {
    const specialContent = 'const emoji = "🚀"; const quote = "it\'s"; const html = "<div>";';
    await client.writeFile(workspaceId, '/special.ts', specialContent);

    const content = await client.readFile(workspaceId, '/special.ts');
    expect(content).toBe(specialContent);
  });
});

// ─── Build Process Tests ────────────────────────────────────────────────────

describe('Daytona Build Process', () => {
  let client: MockDaytonaClient;
  let workspaceId: string;

  beforeEach(async () => {
    client = new MockDaytonaClient();
    const ws = await client.createWorkspace('test', 'node:20');
    workspaceId = ws.id;
  });

  it('should run full build pipeline', async () => {
    // 1. Install dependencies
    const installResult = await client.exec(workspaceId, 'npm install');
    expect(installResult.exitCode).toBe(0);

    // 2. Run build
    const buildResult = await client.exec(workspaceId, 'npm run build');
    expect(buildResult.exitCode).toBe(0);

    // 3. Start dev server
    const startResult = await client.exec(workspaceId, 'npm start');
    expect(startResult.exitCode).toBe(0);
    expect(startResult.stdout).toContain('8080');
  });
});

// ─── Preview URL Tests ──────────────────────────────────────────────────────

describe('Daytona Preview URL', () => {
  let client: MockDaytonaClient;

  beforeEach(() => {
    client = new MockDaytonaClient();
  });

  it('should generate preview URL with workspace ID', async () => {
    const ws = await client.createWorkspace('test', 'node:20');

    // Wait for state to become running
    await new Promise((resolve) => setTimeout(resolve, 150));

    const updated = await client.getWorkspace(ws.id);
    expect(updated?.previewUrl).toMatch(/^https:\/\//);
    expect(updated?.previewUrl).toContain(ws.id);
  });

  it('should include port in preview URL', async () => {
    const ws = await client.createWorkspace('test', 'node:20');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const updated = await client.getWorkspace(ws.id);
    expect(updated?.previewUrl).toContain('8080');
  });
});

// ─── Error Handling Tests ───────────────────────────────────────────────────

describe('Daytona Error Handling', () => {
  let client: MockDaytonaClient;

  beforeEach(() => {
    client = new MockDaytonaClient();
  });

  it('should handle workspace not found gracefully', async () => {
    const result = await client.getWorkspace('ws_invalid');
    expect(result).toBeNull();
  });

  it('should throw on file operations with invalid workspace', async () => {
    await expect(
      client.writeFile('ws_invalid', '/test.ts', 'content')
    ).rejects.toThrow();

    await expect(
      client.readFile('ws_invalid', '/test.ts')
    ).rejects.toThrow();
  });

  it('should handle destroy of non-existent workspace', async () => {
    const result = await client.destroyWorkspace('ws_nonexistent');
    expect(result).toBe(false);
  });
});

// ─── Concurrent Operations Tests ────────────────────────────────────────────

describe('Daytona Concurrent Operations', () => {
  let client: MockDaytonaClient;

  beforeEach(() => {
    client = new MockDaytonaClient();
  });

  it('should handle multiple workspace creations', async () => {
    const promises = [
      client.createWorkspace('project-1', 'node:20'),
      client.createWorkspace('project-2', 'node:20'),
      client.createWorkspace('project-3', 'node:20'),
    ];

    const workspaces = await Promise.all(promises);

    expect(workspaces).toHaveLength(3);
    const ids = workspaces.map((ws) => ws.id);
    expect(new Set(ids).size).toBe(3); // All unique IDs
  });

  it('should handle concurrent file writes', async () => {
    const ws = await client.createWorkspace('test', 'node:20');

    const writes = [
      client.writeFile(ws.id, '/file1.ts', 'content1'),
      client.writeFile(ws.id, '/file2.ts', 'content2'),
      client.writeFile(ws.id, '/file3.ts', 'content3'),
    ];

    await Promise.all(writes);

    const files = await client.listFiles(ws.id);
    expect(files).toHaveLength(3);
  });
});

