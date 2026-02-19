/**
 * Orchestrator State Hook Tests
 *
 * Tests for orchestrator state management and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrchestratorState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'BUILDING'
  | 'REVIEWING'
  | 'REFINING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'FAILED';

interface OrchestratorStatus {
  state: OrchestratorState;
  progress: number;
  message: string;
  error?: string;
  previewUrl?: string;
  deployedUrl?: string;
}

interface TaskProgress {
  taskId: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

interface OrchestratorEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

// ─── Mock State Manager ─────────────────────────────────────────────────────

class OrchestratorStateManager {
  private state: OrchestratorState = 'IDLE';
  private listeners: Set<(status: OrchestratorStatus) => void> = new Set();
  private eventLog: OrchestratorEvent[] = [];
  private tasks: Map<string, TaskProgress> = new Map();
  private previewUrl?: string;
  private deployedUrl?: string;
  private error?: string;

  getState(): OrchestratorState {
    return this.state;
  }

  getStatus(): OrchestratorStatus {
    return {
      state: this.state,
      progress: this.calculateProgress(),
      message: this.getStateMessage(),
      error: this.error,
      previewUrl: this.previewUrl,
      deployedUrl: this.deployedUrl,
    };
  }

  private calculateProgress(): number {
    const stateProgress: Record<OrchestratorState, number> = {
      IDLE: 0,
      INITIALIZING: 5,
      PLANNING: 15,
      EXECUTING: 50,
      BUILDING: 70,
      REVIEWING: 85,
      REFINING: 90,
      DEPLOYING: 95,
      COMPLETED: 100,
      FAILED: 0,
    };

    return stateProgress[this.state];
  }

  private getStateMessage(): string {
    const messages: Record<OrchestratorState, string> = {
      IDLE: 'Ready to start',
      INITIALIZING: 'Initializing workspace...',
      PLANNING: 'Creating site plan...',
      EXECUTING: 'Generating site files...',
      BUILDING: 'Building project...',
      REVIEWING: 'Reviewing generated site...',
      REFINING: 'Applying refinements...',
      DEPLOYING: 'Deploying to preview...',
      COMPLETED: 'Site generation complete!',
      FAILED: this.error || 'Generation failed',
    };

    return messages[this.state];
  }

  subscribe(listener: (status: OrchestratorStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private logEvent(type: string, data: unknown): void {
    this.eventLog.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }

  setState(newState: OrchestratorState): void {
    const oldState = this.state;
    this.state = newState;
    this.logEvent('state_change', { from: oldState, to: newState });
    this.notifyListeners();
  }

  setError(error: string): void {
    this.error = error;
    this.setState('FAILED');
  }

  setPreviewUrl(url: string): void {
    this.previewUrl = url;
    this.notifyListeners();
  }

  setDeployedUrl(url: string): void {
    this.deployedUrl = url;
    this.notifyListeners();
  }

  addTask(task: TaskProgress): void {
    this.tasks.set(task.taskId, task);
    this.logEvent('task_added', task);
  }

  updateTask(taskId: string, updates: Partial<TaskProgress>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.logEvent('task_updated', { taskId, updates });
      this.notifyListeners();
    }
  }

  getTasks(): TaskProgress[] {
    return Array.from(this.tasks.values());
  }

  getEventLog(): OrchestratorEvent[] {
    return [...this.eventLog];
  }

  reset(): void {
    this.state = 'IDLE';
    this.error = undefined;
    this.previewUrl = undefined;
    this.deployedUrl = undefined;
    this.tasks.clear();
    this.eventLog = [];
    this.notifyListeners();
  }
}

// ─── State Transitions Tests ────────────────────────────────────────────────

describe('Orchestrator State Transitions', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should start in IDLE state', () => {
    expect(manager.getState()).toBe('IDLE');
  });

  it('should transition through all states', () => {
    const states: OrchestratorState[] = [
      'INITIALIZING',
      'PLANNING',
      'EXECUTING',
      'BUILDING',
      'REVIEWING',
      'DEPLOYING',
      'COMPLETED',
    ];

    states.forEach((state) => {
      manager.setState(state);
      expect(manager.getState()).toBe(state);
    });
  });

  it('should allow transition to FAILED from any state', () => {
    const states: OrchestratorState[] = ['INITIALIZING', 'PLANNING', 'EXECUTING', 'BUILDING'];

    states.forEach((state) => {
      manager.reset();
      manager.setState(state);
      manager.setError('Test error');
      expect(manager.getState()).toBe('FAILED');
    });
  });

  it('should reset to IDLE state', () => {
    manager.setState('EXECUTING');
    manager.reset();
    expect(manager.getState()).toBe('IDLE');
  });
});

// ─── Progress Calculation Tests ─────────────────────────────────────────────

describe('Progress Calculation', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should report 0% progress in IDLE state', () => {
    expect(manager.getStatus().progress).toBe(0);
  });

  it('should report 100% progress in COMPLETED state', () => {
    manager.setState('COMPLETED');
    expect(manager.getStatus().progress).toBe(100);
  });

  it('should report progressive values through states', () => {
    const states: OrchestratorState[] = [
      'INITIALIZING',
      'PLANNING',
      'EXECUTING',
      'BUILDING',
      'REVIEWING',
      'DEPLOYING',
    ];

    let lastProgress = 0;
    states.forEach((state) => {
      manager.setState(state);
      const progress = manager.getStatus().progress;
      expect(progress).toBeGreaterThan(lastProgress);
      lastProgress = progress;
    });
  });

  it('should report 0% progress in FAILED state', () => {
    manager.setState('EXECUTING');
    manager.setError('Test error');
    expect(manager.getStatus().progress).toBe(0);
  });
});

// ─── Message Generation Tests ───────────────────────────────────────────────

describe('Message Generation', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should return appropriate message for each state', () => {
    manager.setState('INITIALIZING');
    expect(manager.getStatus().message).toContain('Initializing');

    manager.setState('PLANNING');
    expect(manager.getStatus().message).toContain('plan');

    manager.setState('EXECUTING');
    expect(manager.getStatus().message).toContain('Generating');

    manager.setState('BUILDING');
    expect(manager.getStatus().message).toContain('Building');

    manager.setState('REVIEWING');
    expect(manager.getStatus().message).toContain('Reviewing');
  });

  it('should include error message in FAILED state', () => {
    manager.setError('Network timeout');
    expect(manager.getStatus().message).toContain('Network timeout');
  });

  it('should return success message in COMPLETED state', () => {
    manager.setState('COMPLETED');
    expect(manager.getStatus().message).toContain('complete');
  });
});

// ─── Event Subscription Tests ───────────────────────────────────────────────

describe('Event Subscription', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should notify subscribers on state change', () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.setState('PLANNING');

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'PLANNING' })
    );
  });

  it('should notify multiple subscribers', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    manager.subscribe(listener1);
    manager.subscribe(listener2);

    manager.setState('EXECUTING');

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });

  it('should allow unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    unsubscribe();
    manager.setState('PLANNING');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should notify on preview URL change', () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.setPreviewUrl('https://preview.test.com');

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ previewUrl: 'https://preview.test.com' })
    );
  });
});

// ─── Task Management Tests ──────────────────────────────────────────────────

describe('Task Management', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should add tasks', () => {
    manager.addTask({
      taskId: 'task_001',
      title: 'Create home page',
      status: 'pending',
      progress: 0,
    });

    const tasks = manager.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskId).toBe('task_001');
  });

  it('should update task status', () => {
    manager.addTask({
      taskId: 'task_001',
      title: 'Create home page',
      status: 'pending',
      progress: 0,
    });

    manager.updateTask('task_001', { status: 'running', progress: 50 });

    const tasks = manager.getTasks();
    expect(tasks[0].status).toBe('running');
    expect(tasks[0].progress).toBe(50);
  });

  it('should notify on task update', () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.addTask({
      taskId: 'task_001',
      title: 'Create home page',
      status: 'pending',
      progress: 0,
    });

    manager.updateTask('task_001', { status: 'completed' });

    expect(listener).toHaveBeenCalled();
  });

  it('should handle multiple tasks', () => {
    manager.addTask({ taskId: 't1', title: 'Task 1', status: 'pending', progress: 0 });
    manager.addTask({ taskId: 't2', title: 'Task 2', status: 'pending', progress: 0 });
    manager.addTask({ taskId: 't3', title: 'Task 3', status: 'pending', progress: 0 });

    const tasks = manager.getTasks();
    expect(tasks).toHaveLength(3);
  });
});

// ─── Event Logging Tests ────────────────────────────────────────────────────

describe('Event Logging', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should log state changes', () => {
    manager.setState('PLANNING');
    manager.setState('EXECUTING');

    const log = manager.getEventLog();
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe('state_change');
    expect(log[0].data).toEqual({ from: 'IDLE', to: 'PLANNING' });
  });

  it('should log task additions', () => {
    manager.addTask({
      taskId: 'task_001',
      title: 'Test Task',
      status: 'pending',
      progress: 0,
    });

    const log = manager.getEventLog();
    expect(log.some((e) => e.type === 'task_added')).toBe(true);
  });

  it('should include timestamps', () => {
    const before = Date.now();
    manager.setState('PLANNING');
    const after = Date.now();

    const log = manager.getEventLog();
    expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(log[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('should clear log on reset', () => {
    manager.setState('PLANNING');
    manager.setState('EXECUTING');
    manager.reset();

    const log = manager.getEventLog();
    expect(log).toHaveLength(0);
  });
});

// ─── URL Management Tests ───────────────────────────────────────────────────

describe('URL Management', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should store preview URL', () => {
    manager.setPreviewUrl('https://preview.example.com');
    expect(manager.getStatus().previewUrl).toBe('https://preview.example.com');
  });

  it('should store deployed URL', () => {
    manager.setDeployedUrl('https://deployed.example.com');
    expect(manager.getStatus().deployedUrl).toBe('https://deployed.example.com');
  });

  it('should clear URLs on reset', () => {
    manager.setPreviewUrl('https://preview.example.com');
    manager.setDeployedUrl('https://deployed.example.com');
    manager.reset();

    const status = manager.getStatus();
    expect(status.previewUrl).toBeUndefined();
    expect(status.deployedUrl).toBeUndefined();
  });
});

// ─── Error Handling Tests ───────────────────────────────────────────────────

describe('Error Handling', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should store error message', () => {
    manager.setError('Build failed: missing dependencies');
    expect(manager.getStatus().error).toBe('Build failed: missing dependencies');
  });

  it('should transition to FAILED state on error', () => {
    manager.setState('BUILDING');
    manager.setError('Compilation error');
    expect(manager.getState()).toBe('FAILED');
  });

  it('should clear error on reset', () => {
    manager.setError('Test error');
    manager.reset();
    expect(manager.getStatus().error).toBeUndefined();
  });

  it('should include error in status message', () => {
    manager.setError('API timeout');
    expect(manager.getStatus().message).toContain('API timeout');
  });
});

// ─── Integration Flow Tests ─────────────────────────────────────────────────

describe('Integration Flow', () => {
  let manager: OrchestratorStateManager;

  beforeEach(() => {
    manager = new OrchestratorStateManager();
  });

  it('should complete full successful flow', () => {
    const states: OrchestratorState[] = [
      'INITIALIZING',
      'PLANNING',
      'EXECUTING',
      'BUILDING',
      'REVIEWING',
      'DEPLOYING',
      'COMPLETED',
    ];

    states.forEach((state) => manager.setState(state));

    manager.setPreviewUrl('https://preview.test.com');
    manager.setDeployedUrl('https://deployed.test.com');

    const status = manager.getStatus();
    expect(status.state).toBe('COMPLETED');
    expect(status.progress).toBe(100);
    expect(status.previewUrl).toBeDefined();
    expect(status.deployedUrl).toBeDefined();
  });

  it('should handle failure during execution', () => {
    manager.setState('INITIALIZING');
    manager.setState('PLANNING');
    manager.setState('EXECUTING');
    manager.setError('Task execution failed');

    const status = manager.getStatus();
    expect(status.state).toBe('FAILED');
    expect(status.error).toBe('Task execution failed');
    expect(status.progress).toBe(0);
  });

  it('should track tasks through execution', () => {
    manager.setState('EXECUTING');

    manager.addTask({ taskId: 't1', title: 'Task 1', status: 'running', progress: 0 });
    manager.updateTask('t1', { progress: 50 });
    manager.updateTask('t1', { progress: 100, status: 'completed' });

    manager.addTask({ taskId: 't2', title: 'Task 2', status: 'running', progress: 0 });
    manager.updateTask('t2', { progress: 100, status: 'completed' });

    const tasks = manager.getTasks();
    expect(tasks.every((t) => t.status === 'completed')).toBe(true);
  });
});

