# Testing Skill

Guidelines for writing tests in Flowstarter Editor.

## Tech Stack

- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Coverage:** vitest/coverage-v8
- **Mocking:** Vitest built-in mocks

## Directory Structure

```
flowstarter-editor/
├── __tests__/
│   ├── unit/
│   │   ├── flowops/
│   │   │   └── agents.test.ts
│   │   ├── gretly/
│   │   │   └── gretlyEngine.test.ts
│   │   ├── components/
│   │   │   └── Button.test.tsx
│   │   └── utils/
│   │       └── formatters.test.ts
│   └── integration/
│       └── api/
│           └── gretly-generate.test.ts
├── e2e/
│   ├── onboarding.spec.ts
│   ├── editor.spec.ts
│   └── fixtures/
│       └── test-project.json
└── vitest.config.ts
```

## Running Tests

```bash
# Unit tests
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report

# E2E tests
pnpm test:e2e          # Run Playwright tests
pnpm test:e2e:ui       # Playwright UI mode
pnpm test:e2e:debug    # Debug mode
```

## Unit Testing

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('FeatureName', () => {
  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Cleanup after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('methodName', () => {
    it('should handle the happy path', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle edge cases', () => {
      const result = methodName(null);
      expect(result).toBeNull();
    });

    it('should throw on invalid input', () => {
      expect(() => methodName(invalidInput)).toThrow('Expected error message');
    });
  });
});
```

### Testing Pure Functions

```typescript
// utils/formatters.ts
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// __tests__/unit/utils/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '~/utils/formatters';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
  });
});
```

### Testing Async Functions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchUser } from '~/lib/services/userService';

describe('fetchUser', () => {
  it('returns user data on success', async () => {
    // Mock fetch
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Test User' }),
    } as Response);

    const result = await fetchUser('1');

    expect(result).toEqual({ id: '1', name: 'Test User' });
  });

  it('throws on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchUser('1')).rejects.toThrow('Network error');
  });

  it('throws on 404', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchUser('1')).rejects.toThrow('User not found');
  });
});
```

### Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '~/components/ui/Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Testing Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from '~/lib/hooks/useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

### Testing Nanostores

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { files, addFile, removeFile } from '~/lib/stores/files';

describe('files store', () => {
  beforeEach(() => {
    // Reset store before each test
    files.set({});
  });

  it('starts empty', () => {
    expect(files.get()).toEqual({});
  });

  it('adds a file', () => {
    addFile('src/index.ts', 'console.log("hello")');

    const state = files.get();
    expect(state['src/index.ts']).toBeDefined();
    expect(state['src/index.ts'].content).toBe('console.log("hello")');
  });

  it('removes a file', () => {
    addFile('src/index.ts', 'content');
    removeFile('src/index.ts');

    expect(files.get()['src/index.ts']).toBeUndefined();
  });
});
```

### Mocking

#### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('~/lib/services/llm', () => ({
  generateCompletion: vi.fn().mockResolvedValue('Mocked response'),
  streamCompletion: vi.fn().mockImplementation(async function* () {
    yield 'chunk1';
    yield 'chunk2';
  }),
}));

// Mock specific exports
vi.mock('~/lib/services/daytona', async () => {
  const actual = await vi.importActual('~/lib/services/daytona');
  return {
    ...actual,
    createWorkspace: vi.fn().mockResolvedValue({ id: 'mock-workspace' }),
  };
});
```

#### Mocking Environment Variables

```typescript
import { vi } from 'vitest';

describe('with environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses API key from environment', async () => {
    process.env.API_KEY = 'test-key';

    const { getApiKey } = await import('~/lib/config');
    expect(getApiKey()).toBe('test-key');
  });
});
```

#### Mocking Timers

```typescript
import { vi } from 'vitest';

describe('with timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces function calls', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    debounced();
    debounced();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

## FlowOps Agent Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzerAgent } from '~/lib/flowstarter/agents/analyzer';

// Mock LLM service
vi.mock('~/lib/services/llm', () => ({
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from '~/lib/services/llm';

describe('AnalyzerAgent', () => {
  let agent: AnalyzerAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new AnalyzerAgent();
  });

  describe('input validation', () => {
    it('rejects empty code', async () => {
      const result = await agent.invoke({
        code: '',
        language: 'typescript',
      });

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid language', async () => {
      const result = await agent.invoke({
        code: 'const x = 1;',
        language: 'invalid' as any,
      });

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('execution', () => {
    it('returns analysis for valid code', async () => {
      vi.mocked(generateCompletion).mockResolvedValueOnce(
        JSON.stringify({
          issues: [{ severity: 'warning', message: 'Unused variable', line: 1 }],
          summary: 'Minor issues found',
          score: 85,
        })
      );

      const result = await agent.invoke({
        code: 'const x = 1;',
        language: 'typescript',
      });

      expect(result.status).toBe('success');
      expect(result.data?.score).toBe(85);
      expect(result.data?.issues).toHaveLength(1);
    });

    it('handles LLM errors gracefully', async () => {
      vi.mocked(generateCompletion).mockRejectedValueOnce(
        new Error('Rate limited')
      );

      const result = await agent.invoke({
        code: 'const x = 1;',
        language: 'typescript',
      });

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('LLM_ERROR');
    });
  });

  describe('context propagation', () => {
    it('preserves trace ID', async () => {
      vi.mocked(generateCompletion).mockResolvedValueOnce(
        JSON.stringify({ issues: [], summary: 'Clean', score: 100 })
      );

      const result = await agent.invoke(
        { code: 'const x = 1;', language: 'typescript' },
        { traceId: 'test-trace', requestId: 'test-request' }
      );

      expect(result.context.traceId).toBe('test-trace');
      expect(result.context.requestId).toBe('test-request');
    });
  });
});
```

## Gretly Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGretly } from '~/lib/gretly';

// Mock agents
vi.mock('~/lib/flowstarter/agents/planner', () => ({
  plannerAgent: {
    invoke: vi.fn(),
  },
}));

vi.mock('~/lib/flowstarter/agents/generator', () => ({
  generatorAgent: {
    invoke: vi.fn(),
  },
}));

import { plannerAgent } from '~/lib/flowstarter/agents/planner';
import { generatorAgent } from '~/lib/flowstarter/agents/generator';

describe('GretlyEngine', () => {
  let mockBuild: ReturnType<typeof vi.fn>;
  let mockPublish: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuild = vi.fn();
    mockPublish = vi.fn();
  });

  const validInput = {
    projectId: 'test-project',
    businessInfo: { name: 'Test Business' },
    template: { slug: 'test-template', name: 'Test' },
    design: { primaryColor: '#000' },
  };

  it('runs complete pipeline successfully', async () => {
    // Mock planner
    vi.mocked(plannerAgent.invoke).mockResolvedValueOnce({
      status: 'success',
      data: { modifications: [], summary: 'Plan created' },
      context: { traceId: '1', requestId: '1', timestamp: Date.now() },
    });

    // Mock generator
    vi.mocked(generatorAgent.invoke).mockResolvedValueOnce({
      status: 'success',
      data: { files: [{ path: 'index.html', content: '<html>' }], summary: 'Generated' },
      context: { traceId: '1', requestId: '2', timestamp: Date.now() },
    });

    // Mock build success
    mockBuild.mockResolvedValueOnce({ success: true, previewUrl: 'http://preview' });

    const gretly = createGretly({ skipReview: true });
    const result = await gretly.run(validInput, mockBuild, mockPublish);

    expect(result.success).toBe(true);
    expect(mockPublish).toHaveBeenCalled();
  });

  it('retries on build failure', async () => {
    vi.mocked(plannerAgent.invoke).mockResolvedValue({
      status: 'success',
      data: { modifications: [], summary: 'Plan' },
      context: { traceId: '1', requestId: '1', timestamp: Date.now() },
    });

    vi.mocked(generatorAgent.invoke).mockResolvedValue({
      status: 'success',
      data: { files: [{ path: 'index.html', content: '<html>' }], summary: 'Generated' },
      context: { traceId: '1', requestId: '2', timestamp: Date.now() },
    });

    // First build fails, second succeeds
    mockBuild
      .mockResolvedValueOnce({ success: false, errors: ['Error'] })
      .mockResolvedValueOnce({ success: true });

    const gretly = createGretly({ maxFixAttempts: 2, skipReview: true });
    const result = await gretly.run(validInput, mockBuild, mockPublish);

    expect(result.success).toBe(true);
    expect(mockBuild).toHaveBeenCalledTimes(2);
  });

  it('calls progress callbacks', async () => {
    const onProgress = vi.fn();
    const onPhaseChange = vi.fn();

    vi.mocked(plannerAgent.invoke).mockResolvedValueOnce({
      status: 'success',
      data: { modifications: [], summary: 'Plan' },
      context: { traceId: '1', requestId: '1', timestamp: Date.now() },
    });

    vi.mocked(generatorAgent.invoke).mockResolvedValueOnce({
      status: 'success',
      data: { files: [], summary: 'Generated' },
      context: { traceId: '1', requestId: '2', timestamp: Date.now() },
    });

    mockBuild.mockResolvedValueOnce({ success: true });

    const gretly = createGretly({ onProgress, onPhaseChange, skipReview: true });
    await gretly.run(validInput, mockBuild, mockPublish);

    expect(onPhaseChange).toHaveBeenCalledWith('planning');
    expect(onPhaseChange).toHaveBeenCalledWith('generating');
    expect(onPhaseChange).toHaveBeenCalledWith('building');
    expect(onProgress).toHaveBeenCalled();
  });
});
```

## E2E Testing with Playwright

### Page Object Pattern

```typescript
// e2e/pages/EditorPage.ts
import { Page, Locator } from '@playwright/test';

export class EditorPage {
  readonly page: Page;
  readonly fileTree: Locator;
  readonly codeEditor: Locator;
  readonly terminal: Locator;
  readonly preview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fileTree = page.locator('[data-testid="file-tree"]');
    this.codeEditor = page.locator('[data-testid="code-editor"]');
    this.terminal = page.locator('[data-testid="terminal"]');
    this.preview = page.locator('[data-testid="preview-frame"]');
  }

  async goto(projectId: string) {
    await this.page.goto(`/editor/${projectId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openFile(path: string) {
    await this.fileTree.getByText(path).click();
    await this.page.waitForTimeout(500); // Wait for editor to load
  }

  async typeInEditor(text: string) {
    await this.codeEditor.click();
    await this.page.keyboard.type(text);
  }

  async runCommand(command: string) {
    await this.terminal.click();
    await this.page.keyboard.type(command);
    await this.page.keyboard.press('Enter');
  }

  async waitForBuild() {
    await this.page.waitForSelector('[data-testid="build-complete"]', {
      timeout: 60000,
    });
  }

  async getPreviewContent() {
    const frame = this.preview.frameLocator('iframe');
    return frame.locator('body').innerHTML();
  }
}
```

### E2E Test Example

```typescript
// e2e/editor.spec.ts
import { test, expect } from '@playwright/test';
import { EditorPage } from './pages/EditorPage';

test.describe('Editor', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto('test-project');
  });

  test('opens file from file tree', async () => {
    await editor.openFile('src/App.tsx');
    await expect(editor.codeEditor).toContainText('function App');
  });

  test('edits file and saves', async () => {
    await editor.openFile('src/App.tsx');
    await editor.typeInEditor('// Comment added\n');

    // Save with Ctrl+S
    await editor.page.keyboard.press('Control+s');

    // Verify save indicator
    await expect(editor.page.locator('[data-testid="save-indicator"]')).toHaveText('Saved');
  });

  test('runs build command', async () => {
    await editor.runCommand('npm run build');
    await editor.waitForBuild();

    await expect(editor.terminal).toContainText('Build completed');
  });

  test('shows preview after build', async () => {
    await editor.runCommand('npm run dev');
    await editor.waitForBuild();

    const previewContent = await editor.getPreviewContent();
    expect(previewContent).toContain('Welcome');
  });
});
```

### Testing SSE Endpoints

```typescript
// e2e/gretly-generate.spec.ts
import { test, expect } from '@playwright/test';

test('streams progress events', async ({ request }) => {
  const response = await request.post('/api/gretly-generate', {
    data: {
      projectId: 'test-project',
      businessInfo: { name: 'Test' },
      template: { slug: 'minimal' },
      design: { primaryColor: '#000' },
    },
  });

  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toBe('text/event-stream');

  const body = await response.text();
  const events = body
    .split('\n\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)));

  // Verify progress events
  const progressEvents = events.filter((e) => e.type === 'progress');
  expect(progressEvents.length).toBeGreaterThan(0);

  // Verify phases
  const phaseEvents = events.filter((e) => e.type === 'phase');
  expect(phaseEvents.map((e) => e.phase)).toContain('planning');
  expect(phaseEvents.map((e) => e.phase)).toContain('generating');

  // Verify completion
  const completeEvent = events.find((e) => e.type === 'complete');
  expect(completeEvent).toBeDefined();
});
```

## Test Data Factories

```typescript
// __tests__/factories/index.ts
import { faker } from '@faker-js/faker';

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    status: 'ready',
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function createBusinessInfo(overrides: Partial<BusinessInfo> = {}): BusinessInfo {
  return {
    name: faker.company.name(),
    description: faker.company.catchPhrase(),
    industry: faker.commerce.department(),
    goals: [faker.lorem.sentence(), faker.lorem.sentence()],
    ...overrides,
  };
}
```

## Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
```

## Testing Checklist

Before merging:

- [ ] Unit tests for all new functions
- [ ] Component tests for new UI components
- [ ] Hook tests for custom hooks
- [ ] Store tests for new nanostores
- [ ] Agent tests for FlowOps agents
- [ ] E2E tests for user flows
- [ ] Mocks use vi.mock (not manual stubs)
- [ ] Async tests use async/await
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Coverage thresholds met
- [ ] No flaky tests (retry logic where needed)
