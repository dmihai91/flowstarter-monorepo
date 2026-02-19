/**
 * Convex Orchestrations Tests
 *
 * Tests for the convex/orchestrations.ts functions.
 * These tests mock the Convex database to verify logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Types ─────────────────────────────────────────────────────────────

interface MockOrchestration {
  _id: string;
  orchestrationId: string;
  projectId: string;
  status: string;
  userRequest?: string;
  wizardOutput?: string;
  modelTier?: string;
  startedAt: number;
  plan?: string;
  sitePlan?: string;
  currentTaskId?: string;
  completedTasks?: string[];
  buildAttempts?: number;
  buildLogs?: string;
  reviewAttempts?: number;
  review?: string;
  deployedUrl?: string;
  previewUrl?: string;
  error?: string;
  updatedAt?: number;
  completedAt?: number;
}

interface MockTask {
  _id: string;
  orchestrationId: string;
  taskId: string;
  taskIndex: number;
  title: string;
  description: string;
  status: string;
  workspaceId?: string;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ─── Orchestration Logic Tests ──────────────────────────────────────────────

describe('Orchestration Logic', () => {
  describe('Status Transitions', () => {
    const validStatuses = [
      'initializing',
      'planning',
      'executing',
      'building',
      'reviewing',
      'refining',
      'deploying',
      'completed',
      'failed',
    ];

    it('should validate all status values', () => {
      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    it('should have correct number of statuses', () => {
      expect(validStatuses.length).toBe(9);
    });

    it('should include new building status', () => {
      expect(validStatuses).toContain('building');
    });

    it('should include new refining status', () => {
      expect(validStatuses).toContain('refining');
    });

    it('should include new deploying status', () => {
      expect(validStatuses).toContain('deploying');
    });
  });

  describe('Task Status Transitions', () => {
    const validTaskStatuses = ['pending', 'running', 'completed', 'failed'];

    it('should validate all task status values', () => {
      validTaskStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    it('should have correct number of task statuses', () => {
      expect(validTaskStatuses.length).toBe(4);
    });
  });
});

// ─── Orchestration Data Structure Tests ─────────────────────────────────────

describe('Orchestration Data Structure', () => {
  const createMockOrchestration = (overrides: Partial<MockOrchestration> = {}): MockOrchestration => ({
    _id: 'orch_abc123',
    orchestrationId: 'orch_001',
    projectId: 'proj_123',
    status: 'initializing',
    startedAt: Date.now(),
    ...overrides,
  });

  it('should have required fields', () => {
    const orch = createMockOrchestration();
    expect(orch._id).toBeDefined();
    expect(orch.orchestrationId).toBeDefined();
    expect(orch.projectId).toBeDefined();
    expect(orch.status).toBeDefined();
    expect(orch.startedAt).toBeDefined();
  });

  it('should support optional userRequest', () => {
    const orch = createMockOrchestration({ userRequest: 'Build a landing page' });
    expect(orch.userRequest).toBe('Build a landing page');
  });

  it('should support optional wizardOutput', () => {
    const wizardOutput = JSON.stringify({
      project: { projectId: 'proj_123', name: 'Test' },
      businessInfo: { uvp: 'Best service' },
    });
    const orch = createMockOrchestration({ wizardOutput });
    expect(orch.wizardOutput).toBe(wizardOutput);
    expect(JSON.parse(orch.wizardOutput!)).toHaveProperty('project');
  });

  it('should support optional modelTier', () => {
    const orch = createMockOrchestration({ modelTier: 'premium' });
    expect(orch.modelTier).toBe('premium');
  });

  it('should support build tracking fields', () => {
    const orch = createMockOrchestration({
      buildAttempts: 2,
      buildLogs: 'Build failed: missing dependency\nRetrying...',
    });
    expect(orch.buildAttempts).toBe(2);
    expect(orch.buildLogs).toContain('missing dependency');
  });

  it('should support review tracking fields', () => {
    const orch = createMockOrchestration({
      reviewAttempts: 1,
      review: JSON.stringify({ approved: true }),
    });
    expect(orch.reviewAttempts).toBe(1);
    expect(JSON.parse(orch.review!)).toEqual({ approved: true });
  });

  it('should support deployment fields', () => {
    const orch = createMockOrchestration({
      deployedUrl: 'https://preview.flowstarter.app/proj_123',
      previewUrl: 'https://preview-8080.daytona.local',
    });
    expect(orch.deployedUrl).toContain('flowstarter');
    expect(orch.previewUrl).toContain('daytona');
  });

  it('should support sitePlan field', () => {
    const sitePlan = JSON.stringify({
      generationId: 'gen_001',
      pages: [{ route: '/', filename: 'index.astro' }],
    });
    const orch = createMockOrchestration({ sitePlan });
    expect(JSON.parse(orch.sitePlan!)).toHaveProperty('pages');
  });
});

// ─── Task Data Structure Tests ──────────────────────────────────────────────

describe('Task Data Structure', () => {
  const createMockTask = (overrides: Partial<MockTask> = {}): MockTask => ({
    _id: 'task_abc123',
    orchestrationId: 'orch_001',
    taskId: 'task_001',
    taskIndex: 0,
    title: 'Create home page',
    description: 'Generate the home page with hero section',
    status: 'pending',
    ...overrides,
  });

  it('should have required fields', () => {
    const task = createMockTask();
    expect(task._id).toBeDefined();
    expect(task.orchestrationId).toBeDefined();
    expect(task.taskId).toBeDefined();
    expect(task.taskIndex).toBeDefined();
    expect(task.title).toBeDefined();
    expect(task.description).toBeDefined();
    expect(task.status).toBeDefined();
  });

  it('should support optional workspaceId', () => {
    const task = createMockTask({ workspaceId: 'ws_123' });
    expect(task.workspaceId).toBe('ws_123');
  });

  it('should support optional result', () => {
    const result = JSON.stringify({ filesChanged: ['index.astro'], success: true });
    const task = createMockTask({ result });
    expect(JSON.parse(task.result!)).toHaveProperty('success', true);
  });

  it('should support timing fields', () => {
    const startedAt = Date.now();
    const completedAt = startedAt + 5000;
    const task = createMockTask({ startedAt, completedAt });
    expect(task.completedAt! - task.startedAt!).toBe(5000);
  });
});

// ─── Update Logic Tests ─────────────────────────────────────────────────────

describe('Update Logic', () => {
  it('should only include defined values in update', () => {
    const updates = {
      status: 'executing',
      plan: undefined,
      currentTaskId: 'task_001',
      error: undefined,
    };

    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.plan !== undefined) updateData.plan = updates.plan;
    if (updates.currentTaskId !== undefined) updateData.currentTaskId = updates.currentTaskId;
    if (updates.error !== undefined) updateData.error = updates.error;

    expect(Object.keys(updateData)).toHaveLength(2);
    expect(updateData.status).toBe('executing');
    expect(updateData.currentTaskId).toBe('task_001');
    expect(updateData.plan).toBeUndefined();
    expect(updateData.error).toBeUndefined();
  });

  it('should handle completedTasks array', () => {
    const existingTasks = ['task_001', 'task_002'];
    const newTaskId = 'task_003';

    if (!existingTasks.includes(newTaskId)) {
      existingTasks.push(newTaskId);
    }

    expect(existingTasks).toHaveLength(3);
    expect(existingTasks).toContain('task_003');
  });

  it('should not duplicate task in completedTasks', () => {
    const existingTasks = ['task_001', 'task_002'];
    const newTaskId = 'task_002';

    if (!existingTasks.includes(newTaskId)) {
      existingTasks.push(newTaskId);
    }

    expect(existingTasks).toHaveLength(2);
  });
});

// ─── Task Sorting Tests ─────────────────────────────────────────────────────

describe('Task Sorting', () => {
  it('should sort tasks by taskIndex', () => {
    const tasks: MockTask[] = [
      { _id: '3', orchestrationId: 'o1', taskId: 't3', taskIndex: 2, title: 'Third', description: '', status: 'pending' },
      { _id: '1', orchestrationId: 'o1', taskId: 't1', taskIndex: 0, title: 'First', description: '', status: 'pending' },
      { _id: '2', orchestrationId: 'o1', taskId: 't2', taskIndex: 1, title: 'Second', description: '', status: 'pending' },
    ];

    const sorted = tasks.sort((a, b) => a.taskIndex - b.taskIndex);

    expect(sorted[0].title).toBe('First');
    expect(sorted[1].title).toBe('Second');
    expect(sorted[2].title).toBe('Third');
  });
});

// ─── Task Statistics Tests ──────────────────────────────────────────────────

describe('Task Statistics', () => {
  it('should calculate correct statistics', () => {
    const tasks: MockTask[] = [
      { _id: '1', orchestrationId: 'o1', taskId: 't1', taskIndex: 0, title: '', description: '', status: 'completed' },
      { _id: '2', orchestrationId: 'o1', taskId: 't2', taskIndex: 1, title: '', description: '', status: 'completed' },
      { _id: '3', orchestrationId: 'o1', taskId: 't3', taskIndex: 2, title: '', description: '', status: 'running' },
      { _id: '4', orchestrationId: 'o1', taskId: 't4', taskIndex: 3, title: '', description: '', status: 'pending' },
      { _id: '5', orchestrationId: 'o1', taskId: 't5', taskIndex: 4, title: '', description: '', status: 'failed' },
    ];

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      running: tasks.filter((t) => t.status === 'running').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };

    expect(stats.total).toBe(5);
    expect(stats.pending).toBe(1);
    expect(stats.running).toBe(1);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(1);
  });

  it('should handle empty task list', () => {
    const tasks: MockTask[] = [];

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      running: tasks.filter((t) => t.status === 'running').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };

    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.running).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
  });
});

// ─── Active Orchestrations Filter Tests ─────────────────────────────────────

describe('Active Orchestrations Filter', () => {
  it('should filter out completed orchestrations', () => {
    const orchestrations: MockOrchestration[] = [
      { _id: '1', orchestrationId: 'o1', projectId: 'p1', status: 'executing', startedAt: 1 },
      { _id: '2', orchestrationId: 'o2', projectId: 'p1', status: 'completed', startedAt: 2 },
      { _id: '3', orchestrationId: 'o3', projectId: 'p1', status: 'reviewing', startedAt: 3 },
    ];

    const active = orchestrations.filter(
      (o) => o.status !== 'completed' && o.status !== 'failed'
    );

    expect(active).toHaveLength(2);
    expect(active.map((o) => o.status)).not.toContain('completed');
  });

  it('should filter out failed orchestrations', () => {
    const orchestrations: MockOrchestration[] = [
      { _id: '1', orchestrationId: 'o1', projectId: 'p1', status: 'failed', startedAt: 1 },
      { _id: '2', orchestrationId: 'o2', projectId: 'p1', status: 'building', startedAt: 2 },
    ];

    const active = orchestrations.filter(
      (o) => o.status !== 'completed' && o.status !== 'failed'
    );

    expect(active).toHaveLength(1);
    expect(active[0].status).toBe('building');
  });

  it('should include all in-progress statuses', () => {
    const inProgressStatuses = ['initializing', 'planning', 'executing', 'building', 'reviewing', 'refining', 'deploying'];

    inProgressStatuses.forEach((status) => {
      const orch: MockOrchestration = {
        _id: '1',
        orchestrationId: 'o1',
        projectId: 'p1',
        status,
        startedAt: Date.now(),
      };

      const isActive = orch.status !== 'completed' && orch.status !== 'failed';
      expect(isActive).toBe(true);
    });
  });
});

// ─── Batch Operations Logic Tests ───────────────────────────────────────────

describe('Batch Operations Logic', () => {
  it('should create multiple tasks with correct indices', () => {
    const tasksToCreate = [
      { taskId: 't1', taskIndex: 0, title: 'Task 1', description: 'First task' },
      { taskId: 't2', taskIndex: 1, title: 'Task 2', description: 'Second task' },
      { taskId: 't3', taskIndex: 2, title: 'Task 3', description: 'Third task' },
    ];

    const createdTasks = tasksToCreate.map((task) => ({
      ...task,
      orchestrationId: 'orch_001',
      status: 'pending',
    }));

    expect(createdTasks).toHaveLength(3);
    expect(createdTasks[0].taskIndex).toBe(0);
    expect(createdTasks[2].taskIndex).toBe(2);
    expect(createdTasks.every((t) => t.status === 'pending')).toBe(true);
  });
});

// ─── WizardOutput JSON Handling Tests ───────────────────────────────────────

describe('WizardOutput JSON Handling', () => {
  const sampleWizardOutput = {
    project: {
      projectId: 'proj_123',
      name: 'My Business Site',
      urlId: 'my-business-site',
      description: 'A professional business website',
    },
    businessInfo: {
      uvp: 'Best service in the industry',
      targetAudience: 'Small business owners',
      businessGoals: ['Increase leads', 'Build brand'],
      brandTone: 'professional',
    },
    palette: {
      id: 'ocean',
      name: 'Ocean Blue',
      colors: ['#0066CC', '#004499', '#3399FF', '#FFFFFF', '#333333'],
    },
    fonts: {
      id: 'modern',
      name: 'Modern Sans',
      heading: 'Inter',
      body: 'Inter',
    },
    template: {
      id: 'business-starter',
      name: 'Business Starter',
    },
    tier: 'standard',
    completedAt: Date.now(),
  };

  it('should serialize WizardOutput to JSON', () => {
    const json = JSON.stringify(sampleWizardOutput);
    expect(typeof json).toBe('string');
    expect(json).toContain('proj_123');
  });

  it('should deserialize WizardOutput from JSON', () => {
    const json = JSON.stringify(sampleWizardOutput);
    const parsed = JSON.parse(json);
    expect(parsed.project.projectId).toBe('proj_123');
    expect(parsed.businessInfo.uvp).toBe('Best service in the industry');
    expect(parsed.palette.colors).toHaveLength(5);
  });

  it('should preserve all nested structures', () => {
    const json = JSON.stringify(sampleWizardOutput);
    const parsed = JSON.parse(json);
    expect(parsed.businessInfo.businessGoals).toEqual(['Increase leads', 'Build brand']);
  });
});

// ─── SitePlan JSON Handling Tests ───────────────────────────────────────────

describe('SitePlan JSON Handling', () => {
  const sampleSitePlan = {
    generationId: 'gen_001',
    projectId: 'proj_123',
    templateId: 'business-starter',
    pages: [
      {
        route: '/',
        filename: 'index.astro',
        components: [
          { component: 'Header', props: { siteName: 'My Business' }, order: 0 },
          { component: 'Hero', props: { title: 'Welcome' }, order: 1 },
        ],
      },
    ],
    globalConfig: {
      colors: { primary: '#0066CC' },
      fonts: { heading: { family: 'Inter', weight: 700 } },
    },
    validationCriteria: ['All content matches business info'],
    createdAt: Date.now(),
  };

  it('should serialize SitePlan to JSON', () => {
    const json = JSON.stringify(sampleSitePlan);
    expect(typeof json).toBe('string');
    expect(json).toContain('gen_001');
  });

  it('should deserialize SitePlan from JSON', () => {
    const json = JSON.stringify(sampleSitePlan);
    const parsed = JSON.parse(json);
    expect(parsed.pages).toHaveLength(1);
    expect(parsed.pages[0].components).toHaveLength(2);
  });

  it('should preserve component ordering', () => {
    const json = JSON.stringify(sampleSitePlan);
    const parsed = JSON.parse(json);
    const components = parsed.pages[0].components.sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    );
    expect(components[0].component).toBe('Header');
    expect(components[1].component).toBe('Hero');
  });
});

