# FlowOps Skill

Guidelines for building agents using the FlowOps framework in Flowstarter Editor.

## Overview

FlowOps is a generic, type-safe agent framework for orchestrating multi-agent workflows. It provides:

- **Type Safety:** Zod validation at agent boundaries
- **Context Propagation:** Trace IDs across agent calls
- **Error Categorization:** Structured error handling
- **Streaming Support:** For long-running operations
- **Registry Pattern:** Central agent discovery

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FLOWOPS FRAMEWORK                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent 1   │  │   Agent 2   │  │   Agent 3   │         │
│  │  (Planner)  │→→│ (Generator) │→→│  (Fixer)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ↓                ↓                ↓                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FlowOps Protocol (JSON)                 │   │
│  │  - Input/Output Validation                           │   │
│  │  - Context Propagation                               │   │
│  │  - Error Handling                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/lib/flowops/             # Generic framework (open-sourceable)
├── agent.ts                 # Base FlowOpsAgent class
├── base-tool.ts             # Base tool class
├── registry.ts              # Agent registry
├── schema.ts                # Zod schemas
├── types.ts                 # TypeScript types
└── index.ts                 # Public exports

app/lib/flowstarter/agents/  # Application-specific agents
├── planner/
│   ├── index.ts             # PlannerAgent implementation
│   ├── prompts.ts           # Agent prompts
│   └── types.ts             # Agent-specific types
├── generator/
│   └── ...
└── fixer/
    └── ...
```

## Core Types

### FlowOpsResult

```typescript
interface FlowOpsResult<T> {
  status: 'success' | 'error' | 'streaming';
  schemaVersion: string;
  data?: T;
  error?: FlowOpsError;
  streamId?: string;
  context: FlowOpsContext;
}

interface FlowOpsContext {
  traceId: string;
  requestId: string;
  timestamp: number;
  parentAgentId?: string;
  metadata?: Record<string, unknown>;
}

interface FlowOpsError {
  code: FlowOpsErrorCode;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

type FlowOpsErrorCode =
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'LLM_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';
```

### FlowOpsAgentConfig

```typescript
interface FlowOpsAgentConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  timeout?: number;         // Default: 60000ms
  retryAttempts?: number;   // Default: 0
  retryDelay?: number;      // Default: 1000ms
}
```

## Creating an Agent

### 1. Define Types

```typescript
// app/lib/flowstarter/agents/analyzer/types.ts
import { z } from 'zod';

export const AnalyzerInputSchema = z.object({
  code: z.string(),
  language: z.enum(['typescript', 'javascript', 'python']),
  options: z.object({
    checkStyle: z.boolean().default(true),
    checkSecurity: z.boolean().default(true),
  }).optional(),
});

export const AnalyzerOutputSchema = z.object({
  issues: z.array(z.object({
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    line: z.number(),
    column: z.number().optional(),
  })),
  summary: z.string(),
  score: z.number().min(0).max(100),
});

export type AnalyzerInput = z.infer<typeof AnalyzerInputSchema>;
export type AnalyzerOutput = z.infer<typeof AnalyzerOutputSchema>;
```

### 2. Implement Agent

```typescript
// app/lib/flowstarter/agents/analyzer/index.ts
import { FlowOpsAgent, type FlowOpsContext } from '~/lib/flowops';
import { createScopedLogger } from '~/utils/logger';
import { generateCompletion } from '~/lib/services/llm';
import {
  AnalyzerInputSchema,
  AnalyzerOutputSchema,
  type AnalyzerInput,
  type AnalyzerOutput,
} from './types';
import { ANALYZER_SYSTEM_PROMPT } from './prompts';

const logger = createScopedLogger('AnalyzerAgent');

interface AnalyzerState {
  analysisCount: number;
}

export class AnalyzerAgent extends FlowOpsAgent<
  AnalyzerInput,
  AnalyzerOutput,
  AnalyzerState
> {
  readonly config = {
    id: 'analyzer',
    name: 'Code Analyzer',
    version: '1.0.0',
    description: 'Analyzes code for issues and best practices',
    timeout: 30000,
    retryAttempts: 2,
  };

  readonly inputSchema = AnalyzerInputSchema;
  readonly outputSchema = AnalyzerOutputSchema;

  protected getDefaultState(): AnalyzerState {
    return { analysisCount: 0 };
  }

  protected async execute(
    input: AnalyzerInput,
    context: FlowOpsContext
  ): Promise<AnalyzerOutput> {
    logger.debug('Analyzing code', {
      traceId: context.traceId,
      language: input.language,
      codeLength: input.code.length,
    });

    // Build prompt
    const userPrompt = this.buildUserPrompt(input);

    // Call LLM
    const response = await generateCompletion(
      [
        { role: 'system', content: ANALYZER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { model: 'anthropic/claude-sonnet-4-20250514', temperature: 0.3 }
    );

    // Parse response
    const result = this.parseResponse(response);

    // Update state
    this.state.analysisCount++;

    logger.info('Analysis complete', {
      traceId: context.traceId,
      issueCount: result.issues.length,
      score: result.score,
    });

    return result;
  }

  private buildUserPrompt(input: AnalyzerInput): string {
    return `Analyze the following ${input.language} code:

\`\`\`${input.language}
${input.code}
\`\`\`

${input.options?.checkStyle ? 'Check for style issues.' : ''}
${input.options?.checkSecurity ? 'Check for security vulnerabilities.' : ''}

Respond with a JSON object containing:
- issues: array of {severity, message, line, column?}
- summary: brief description of findings
- score: quality score from 0-100`;
  }

  private parseResponse(response: string): AnalyzerOutput {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse LLM response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return this.outputSchema.parse(parsed);
  }
}

// Export singleton
export const analyzerAgent = new AnalyzerAgent();
```

### 3. Define Prompts

```typescript
// app/lib/flowstarter/agents/analyzer/prompts.ts
export const ANALYZER_SYSTEM_PROMPT = `You are an expert code analyzer.
Your job is to analyze code for:
- Bugs and logic errors
- Security vulnerabilities
- Code style issues
- Performance problems
- Best practice violations

Be specific about line numbers and provide actionable feedback.
Always respond with valid JSON matching the required schema.`;
```

## Using Agents

### Direct Invocation

```typescript
import { analyzerAgent } from '~/lib/flowstarter/agents/analyzer';

async function analyzeCode(code: string) {
  const result = await analyzerAgent.invoke({
    code,
    language: 'typescript',
    options: { checkStyle: true, checkSecurity: true },
  });

  if (result.status === 'error') {
    console.error('Analysis failed:', result.error.message);
    return null;
  }

  return result.data;
}
```

### With Context Propagation

```typescript
import { analyzerAgent } from '~/lib/flowstarter/agents/analyzer';
import { v4 as uuid } from 'uuid';

async function analyzeWithContext(code: string, parentContext?: FlowOpsContext) {
  const result = await analyzerAgent.invoke(
    { code, language: 'typescript' },
    {
      traceId: parentContext?.traceId ?? uuid(),
      requestId: uuid(),
      parentAgentId: parentContext?.requestId,
      metadata: { source: 'editor' },
    }
  );

  return result;
}
```

### Chaining Agents

```typescript
import { plannerAgent } from '~/lib/flowstarter/agents/planner';
import { generatorAgent } from '~/lib/flowstarter/agents/generator';
import { fixerAgent } from '~/lib/flowstarter/agents/fixer';

async function generateCode(requirements: string, traceId: string) {
  // Step 1: Plan
  const planResult = await plannerAgent.invoke(
    { requirements },
    { traceId, requestId: uuid() }
  );

  if (planResult.status === 'error') {
    throw new Error(`Planning failed: ${planResult.error.message}`);
  }

  // Step 2: Generate
  const genResult = await generatorAgent.invoke(
    { plan: planResult.data },
    { traceId, requestId: uuid(), parentAgentId: planResult.context.requestId }
  );

  if (genResult.status === 'error') {
    throw new Error(`Generation failed: ${genResult.error.message}`);
  }

  // Step 3: Fix if needed
  if (genResult.data.hasErrors) {
    const fixResult = await fixerAgent.invoke(
      { code: genResult.data.code, errors: genResult.data.errors },
      { traceId, requestId: uuid(), parentAgentId: genResult.context.requestId }
    );

    return fixResult;
  }

  return genResult;
}
```

## Agent Registry

### Registering Agents

```typescript
// app/lib/flowstarter/registry.ts
import { FlowOpsRegistry } from '~/lib/flowops';
import { analyzerAgent } from './agents/analyzer';
import { plannerAgent } from './agents/planner';
import { generatorAgent } from './agents/generator';

export const agentRegistry = new FlowOpsRegistry();

// Register all agents
agentRegistry.register(analyzerAgent);
agentRegistry.register(plannerAgent);
agentRegistry.register(generatorAgent);
```

### Using Registry

```typescript
import { agentRegistry } from '~/lib/flowstarter/registry';

// Get agent by ID
const analyzer = agentRegistry.get('analyzer');
const result = await analyzer.invoke(input);

// List all agents
const agents = agentRegistry.list();
console.log(agents.map(a => a.config.name));

// Check if agent exists
if (agentRegistry.has('custom-agent')) {
  // ...
}
```

## Error Handling

### Catching Agent Errors

```typescript
import { analyzerAgent } from '~/lib/flowstarter/agents/analyzer';

async function safeAnalyze(code: string) {
  const result = await analyzerAgent.invoke({ code, language: 'typescript' });

  switch (result.status) {
    case 'success':
      return result.data;

    case 'error':
      switch (result.error.code) {
        case 'VALIDATION_ERROR':
          console.error('Invalid input:', result.error.details);
          break;
        case 'LLM_ERROR':
          console.error('LLM failed:', result.error.message);
          break;
        case 'TIMEOUT_ERROR':
          console.error('Agent timed out');
          break;
        default:
          console.error('Unknown error:', result.error.message);
      }
      return null;

    case 'streaming':
      // Handle streaming case if applicable
      return null;
  }
}
```

### Custom Error Handling in Agent

```typescript
protected async execute(
  input: MyInput,
  context: FlowOpsContext
): Promise<MyOutput> {
  try {
    const response = await callExternalService(input);
    return this.processResponse(response);
  } catch (error) {
    // Re-throw with FlowOps error code
    throw this.createError('EXECUTION_ERROR', 'External service failed', {
      originalError: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

private createError(
  code: FlowOpsErrorCode,
  message: string,
  details?: Record<string, unknown>
): FlowOpsError {
  return { code, message, details };
}
```

## Streaming Agents

### Implementing Streaming

```typescript
export class StreamingAgent extends FlowOpsAgent<Input, Output, State> {
  // ... config, schemas ...

  async *executeStream(
    input: Input,
    context: FlowOpsContext
  ): AsyncGenerator<StreamChunk, Output> {
    // Emit progress events
    yield { type: 'progress', message: 'Starting...', progress: 0 };

    // Stream from LLM
    for await (const chunk of streamLLM(input)) {
      yield { type: 'content', content: chunk };
    }

    yield { type: 'progress', message: 'Processing...', progress: 50 };

    // Final result
    const result = await this.processResults();

    yield { type: 'progress', message: 'Complete', progress: 100 };

    return result;
  }
}
```

### Consuming Streams

```typescript
async function streamAnalysis(code: string) {
  const stream = streamingAgent.invokeStream({ code });

  for await (const chunk of stream) {
    switch (chunk.type) {
      case 'progress':
        updateProgressUI(chunk.progress, chunk.message);
        break;
      case 'content':
        appendContent(chunk.content);
        break;
    }
  }

  // Stream returns final result
  const result = stream.return;
}
```

## Testing Agents

### Unit Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzerAgent } from './index';

describe('AnalyzerAgent', () => {
  let agent: AnalyzerAgent;

  beforeEach(() => {
    agent = new AnalyzerAgent();
  });

  it('validates input correctly', async () => {
    const result = await agent.invoke({
      code: '',  // Invalid: empty code
      language: 'typescript',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('analyzes valid code', async () => {
    vi.mock('~/lib/services/llm', () => ({
      generateCompletion: vi.fn().mockResolvedValue(JSON.stringify({
        issues: [],
        summary: 'Clean code',
        score: 95,
      })),
    }));

    const result = await agent.invoke({
      code: 'const x = 1;',
      language: 'typescript',
    });

    expect(result.status).toBe('success');
    expect(result.data?.score).toBe(95);
  });

  it('propagates context correctly', async () => {
    const result = await agent.invoke(
      { code: 'const x = 1;', language: 'typescript' },
      { traceId: 'test-trace', requestId: 'test-request' }
    );

    expect(result.context.traceId).toBe('test-trace');
    expect(result.context.requestId).toBe('test-request');
  });
});
```

## Best Practices

### 1. Single Responsibility

Each agent should do one thing well:

```typescript
// GOOD: Focused agents
class PlannerAgent { /* Creates plans */ }
class GeneratorAgent { /* Generates code */ }
class FixerAgent { /* Fixes errors */ }

// BAD: Monolithic agent
class DoEverythingAgent { /* Plans, generates, fixes, reviews... */ }
```

### 2. Validate Everything

Always use Zod schemas for input/output:

```typescript
// Input validation happens automatically
const result = await agent.invoke(untrustedInput);

// Output validation ensures LLM responses match expected format
protected async execute(input: Input): Promise<Output> {
  const llmResponse = await callLLM(input);
  return this.outputSchema.parse(JSON.parse(llmResponse));
}
```

### 3. Propagate Context

Always pass context for observability:

```typescript
// Generate trace ID at entry point
const traceId = uuid();

// Pass to all agents in the chain
await agent1.invoke(input, { traceId, requestId: uuid() });
await agent2.invoke(input, { traceId, requestId: uuid(), parentAgentId: 'agent1' });
```

### 4. Handle Timeouts

Configure appropriate timeouts:

```typescript
readonly config = {
  id: 'slow-agent',
  timeout: 120000,  // 2 minutes for complex operations
  retryAttempts: 2,
  retryDelay: 5000,
};
```

## FlowOps Checklist

Before deploying an agent:

- [ ] Input schema validates all required fields
- [ ] Output schema matches LLM response format
- [ ] Error handling covers all error codes
- [ ] Context propagation is implemented
- [ ] Logging uses scoped logger with traceId
- [ ] Timeout is configured appropriately
- [ ] Agent is registered in registry
- [ ] Unit tests cover happy path and error cases
- [ ] Agent follows single responsibility principle
