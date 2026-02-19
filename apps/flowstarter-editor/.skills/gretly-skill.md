# Gretly Skill

Guidelines for working with the Gretly orchestration engine in Flowstarter Editor.

## Overview

Gretly is the master orchestrator for AI-powered site generation. It uses a three-tier agent architecture to transform business requirements into working websites.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GRETLY ENGINE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PLANNER AGENT (Claude Opus 4.5)                     │    │
│  │  - Creates modification plan from business info      │    │
│  │  - Reviews generated output against requirements     │    │
│  │  - Handles escalation when fixes fail               │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↓                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CODE GENERATOR AGENT (Kimi K2 on Groq)             │    │
│  │  - Generates initial files from template + plan     │    │
│  │  - Refines files based on review feedback          │    │
│  │  - Fast execution optimized for throughput         │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↓                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FIXER AGENT (Claude Sonnet 4)                      │    │
│  │  - Analyzes build errors                            │    │
│  │  - Generates fixes with fresh perspective          │    │
│  │  - Escalates if unable to fix                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Pipeline Flow

```
START
  │
  ▼
┌─────────────┐
│  PLANNING   │ → PlannerAgent creates modification plan
└─────────────┘
       │
       ▼
┌─────────────┐
│ GENERATING  │ → CodeGeneratorAgent generates files
└─────────────┘
       │
       ▼
┌─────────────┐
│  BUILDING   │ → Daytona builds the project
└─────────────┘
       │
       ▼
   Build OK? ─────────────────────┐
       │ NO                       │ YES
       ▼                          ▼
┌─────────────┐           ┌─────────────┐
│   FIXING    │           │  REVIEWING  │ → PlannerAgent reviews output
└─────────────┘           └─────────────┘
       │                          │
   Max retries?              Approved?
       │ YES                      │ NO
       ▼                          ▼
┌─────────────┐           ┌─────────────┐
│ ESCALATING  │           │  REFINING   │ → CodeGeneratorAgent refines
└─────────────┘           └─────────────┘
       │                          │
       ▼                          │ (loop back to BUILDING)
┌─────────────┐                   │
│ PUBLISHING  │ ←─────────────────┘
└─────────────┘
       │
       ▼
   COMPLETE
```

## Phases

| Phase | Description | Agent |
|-------|-------------|-------|
| `idle` | Initial state | - |
| `planning` | Creating modification plan | PlannerAgent |
| `generating` | Generating files from plan | CodeGeneratorAgent |
| `building` | Building project in Daytona | - |
| `fixing` | Fixing build errors | FixerAgent |
| `reviewing` | Reviewing output quality | PlannerAgent |
| `refining` | Iterating based on feedback | CodeGeneratorAgent |
| `escalating` | User intervention needed | - |
| `publishing` | Saving to database | - |
| `complete` | Successfully finished | - |
| `failed` | Error occurred | - |

## Configuration

```typescript
interface GretlyConfig {
  // Retry settings
  maxFixAttempts?: number;      // Default: 3
  maxRefineIterations?: number; // Default: 2

  // Quality threshold (1-10)
  approvalThreshold?: number;   // Default: 7

  // Skip review for testing
  skipReview?: boolean;         // Default: false

  // Progress callbacks
  onProgress?: (phase: GretlyPhase, message: string, progress: number) => void;
  onPhaseChange?: (phase: GretlyPhase) => void;

  // Optional data source
  dataFetcher?: GretlyDataFetcher;
}
```

## Usage

### Creating a Gretly Instance

```typescript
import { createGretly } from '~/lib/gretly';

const gretly = createGretly({
  maxFixAttempts: 3,
  maxRefineIterations: 2,
  approvalThreshold: 7,
  onProgress: (phase, message, progress) => {
    console.log(`[${phase}] ${message} (${progress}%)`);
    // Update UI progress bar
  },
  onPhaseChange: (phase) => {
    console.log(`Phase changed to: ${phase}`);
    // Update UI phase indicator
  },
});
```

### Running Gretly

```typescript
interface GretlyInput {
  projectId: string;
  businessInfo: BusinessInfo;
  template: TemplateInfo;
  design: DesignConfig;
}

interface BuildResult {
  success: boolean;
  errors?: string[];
  previewUrl?: string;
}

// Build function called by Gretly
async function buildProject(
  projectId: string,
  files: GeneratedFile[]
): Promise<BuildResult> {
  // Upload files to Daytona
  await daytonaService.uploadFiles(projectId, files);

  // Run build
  const result = await daytonaService.build(projectId);

  return {
    success: result.exitCode === 0,
    errors: result.exitCode !== 0 ? parseErrors(result.stderr) : undefined,
    previewUrl: result.previewUrl,
  };
}

// Publish function called by Gretly
async function publishProject(
  projectId: string,
  files: GeneratedFile[]
): Promise<void> {
  // Save to Convex
  await convex.mutation(api.files.saveProjectFiles, {
    projectId,
    files,
  });
}

// Run the pipeline
const result = await gretly.run(
  {
    projectId: 'proj_123',
    businessInfo: {
      name: 'Acme Corp',
      description: 'Widget manufacturer',
      industry: 'manufacturing',
      goals: ['showcase products', 'generate leads'],
    },
    template: {
      slug: 'corporate-minimal',
      name: 'Corporate Minimal',
    },
    design: {
      primaryColor: '#3B82F6',
      font: 'Inter',
      style: 'modern',
    },
  },
  buildProject,
  publishProject
);

if (result.success) {
  console.log('Site generated:', result.previewUrl);
} else {
  console.error('Generation failed:', result.error);
}
```

## API Endpoint

### SSE Streaming Endpoint

```typescript
// app/routes/api.gretly-generate.ts
import { createGretly } from '~/lib/gretly';

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { projectId, businessInfo, template, design } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (type: string, data: unknown) => {
        const event = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      const gretly = createGretly({
        onProgress: (phase, message, progress) => {
          sendEvent('progress', { phase, message, progress });
        },
        onPhaseChange: (phase) => {
          sendEvent('phase', { phase });
        },
      });

      try {
        const result = await gretly.run(
          { projectId, businessInfo, template, design },
          buildProject,
          publishProject
        );

        if (result.success) {
          sendEvent('complete', {
            previewUrl: result.previewUrl,
            files: result.files,
          });
        } else {
          sendEvent('error', { message: result.error });
        }
      } catch (error) {
        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Frontend Consumption

```typescript
async function generateSite(input: GretlyInput) {
  const response = await fetch('/api/gretly-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));

        switch (event.type) {
          case 'progress':
            updateProgressBar(event.progress);
            updateStatusMessage(event.message);
            break;
          case 'phase':
            updatePhaseIndicator(event.phase);
            break;
          case 'complete':
            showPreview(event.previewUrl);
            break;
          case 'error':
            showError(event.message);
            break;
        }
      }
    }
  }
}
```

## Agent Interfaces

### PlannerAgent

```typescript
interface PlannerInput {
  businessInfo: BusinessInfo;
  template: TemplateInfo;
  design: DesignConfig;
}

interface PlannerOutput {
  modifications: Modification[];
  summary: string;
}

interface Modification {
  file: string;
  action: 'create' | 'modify' | 'delete';
  description: string;
  priority: number;
}

// Review input/output
interface ReviewInput {
  generatedFiles: GeneratedFile[];
  requirements: string[];
  businessInfo: BusinessInfo;
}

interface ReviewOutput {
  approved: boolean;
  score: number;  // 1-10
  feedback: string[];
  suggestedChanges?: string[];
}
```

### CodeGeneratorAgent

```typescript
interface GeneratorInput {
  plan: PlannerOutput;
  template: TemplateInfo;
  templateFiles: TemplateFile[];
}

interface GeneratorOutput {
  files: GeneratedFile[];
  summary: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  action: 'create' | 'modify';
}

// Refine input/output
interface RefineInput {
  files: GeneratedFile[];
  feedback: string[];
  suggestedChanges: string[];
}

interface RefineOutput {
  files: GeneratedFile[];
  changesApplied: string[];
}
```

### FixerAgent

```typescript
interface FixerInput {
  file: GeneratedFile;
  errors: BuildError[];
  context: string;
}

interface FixerOutput {
  fixedContent: string;
  summary: string;
  confidence: number;  // 0-1
}

interface BuildError {
  file: string;
  line?: number;
  message: string;
  type: 'syntax' | 'type' | 'runtime' | 'unknown';
}
```

## Error Handling

### Escalation Flow

When FixerAgent fails after max attempts:

```typescript
// In Gretly engine
if (fixAttempts >= maxFixAttempts) {
  this.setPhase('escalating');

  // Notify user
  this.onProgress('escalating', 'Unable to fix automatically', 0);

  // Return with escalation info
  return {
    success: false,
    requiresIntervention: true,
    errors: remainingErrors,
    suggestedActions: [
      'Review the error messages',
      'Check if dependencies are installed',
      'Verify template compatibility',
    ],
  };
}
```

### Recovery Strategies

```typescript
// 1. Retry with different model
if (generatorError) {
  const result = await retryWithFallbackModel(input);
}

// 2. Simplify requirements
if (complexityError) {
  const simplified = simplifyPlan(plan);
  const result = await generator.invoke(simplified);
}

// 3. Partial success
if (someFilesSucceeded) {
  return {
    success: true,
    partial: true,
    files: successfulFiles,
    failed: failedFiles,
  };
}
```

## Testing

### Unit Testing Gretly

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createGretly } from './gretlyEngine';

describe('GretlyEngine', () => {
  it('completes successfully with valid input', async () => {
    const mockBuild = vi.fn().mockResolvedValue({ success: true });
    const mockPublish = vi.fn().mockResolvedValue(undefined);

    const gretly = createGretly({ skipReview: true });

    const result = await gretly.run(
      validInput,
      mockBuild,
      mockPublish
    );

    expect(result.success).toBe(true);
    expect(mockPublish).toHaveBeenCalled();
  });

  it('retries on build failure', async () => {
    const mockBuild = vi.fn()
      .mockResolvedValueOnce({ success: false, errors: ['Error 1'] })
      .mockResolvedValueOnce({ success: true });

    const gretly = createGretly({ maxFixAttempts: 3 });

    const result = await gretly.run(
      validInput,
      mockBuild,
      mockPublish
    );

    expect(mockBuild).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  it('escalates after max fix attempts', async () => {
    const mockBuild = vi.fn().mockResolvedValue({
      success: false,
      errors: ['Unfixable error'],
    });

    const gretly = createGretly({ maxFixAttempts: 2 });

    const result = await gretly.run(
      validInput,
      mockBuild,
      mockPublish
    );

    expect(result.success).toBe(false);
    expect(result.requiresIntervention).toBe(true);
    expect(mockBuild).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('calls progress callbacks', async () => {
    const onProgress = vi.fn();
    const onPhaseChange = vi.fn();

    const gretly = createGretly({
      onProgress,
      onPhaseChange,
      skipReview: true,
    });

    await gretly.run(validInput, mockBuild, mockPublish);

    expect(onPhaseChange).toHaveBeenCalledWith('planning');
    expect(onPhaseChange).toHaveBeenCalledWith('generating');
    expect(onPhaseChange).toHaveBeenCalledWith('building');
    expect(onPhaseChange).toHaveBeenCalledWith('complete');
    expect(onProgress).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe('Gretly Integration', () => {
  it('generates a real site end-to-end', async () => {
    // Use real Daytona workspace
    const workspace = await daytonaService.createWorkspace('test-project');

    const gretly = createGretly({ maxFixAttempts: 3 });

    const result = await gretly.run(
      {
        projectId: workspace.id,
        businessInfo: testBusinessInfo,
        template: testTemplate,
        design: testDesign,
      },
      async (projectId, files) => {
        await daytonaService.uploadFiles(projectId, files);
        return daytonaService.build(projectId);
      },
      async () => {} // Skip publish for test
    );

    expect(result.success).toBe(true);
    expect(result.previewUrl).toBeDefined();

    // Cleanup
    await daytonaService.deleteWorkspace(workspace.id);
  }, 120000); // 2 minute timeout
});
```

## Best Practices

### 1. Progress Reporting

Always provide meaningful progress updates:

```typescript
onProgress: (phase, message, progress) => {
  // Be specific about what's happening
  if (phase === 'fixing') {
    sendEvent('progress', {
      message: `Fixing error in ${currentFile}...`,
      progress,
      details: { attempt: currentAttempt, maxAttempts },
    });
  }
}
```

### 2. Error Context

Provide rich error context for debugging:

```typescript
if (!result.success) {
  return {
    success: false,
    error: {
      message: 'Build failed',
      phase: currentPhase,
      attempts: fixAttempts,
      lastErrors: buildErrors,
      filesGenerated: generatedFiles.map(f => f.path),
    },
  };
}
```

### 3. Graceful Degradation

Support partial success:

```typescript
// If some files succeed, return partial result
if (successfulFiles.length > 0) {
  return {
    success: true,
    partial: true,
    files: successfulFiles,
    warnings: [`${failedFiles.length} files failed to generate`],
  };
}
```

## Gretly Checklist

Before deploying Gretly changes:

- [ ] All three agents have proper input/output schemas
- [ ] Progress callbacks report meaningful status
- [ ] Max retry limits are configured
- [ ] Escalation path is implemented
- [ ] Error messages are user-friendly
- [ ] Build timeout is configured appropriately
- [ ] Integration tests pass with real Daytona
- [ ] SSE endpoint handles disconnects gracefully
- [ ] Cleanup runs on failure (workspace deletion)
