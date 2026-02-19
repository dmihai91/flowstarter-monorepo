# Backend Skill

Guidelines for building backend services and APIs in Flowstarter Editor.

## Tech Stack

- **Runtime:** Node.js (Express server for Claude Agent SDK)
- **Framework:** Remix (API routes)
- **Database:** Convex (real-time serverless backend)
- **Sandboxes:** Daytona (cloud code execution)
- **AI Integration:** OpenRouter, Anthropic Claude SDK, Groq

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React/Remix)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTES (Remix)                         │
│  /api/gretly-generate  /api/editor-chat  /api/daytona.*     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   CONVEX        │  │   DAYTONA       │  │   LLM SERVICES  │
│   (Database)    │  │   (Sandboxes)   │  │   (OpenRouter)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## API Route Pattern

### Standard Route Template

```typescript
// app/routes/api.feature-name.ts
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { createScopedLogger } from '~/utils/logger';
import { z } from 'zod';

const logger = createScopedLogger('api.feature-name');

// Input validation schema
const RequestSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(['create', 'update', 'delete']),
  data: z.record(z.unknown()).optional(),
});

// GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return json({ error: 'Missing projectId parameter' }, { status: 400 });
  }

  try {
    const result = await fetchData(projectId);
    return json({ success: true, data: result });
  } catch (error) {
    logger.error('[loader] Failed:', error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST/PUT/DELETE requests
export async function action({ request }: ActionFunctionArgs) {
  // Validate method
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse and validate input
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    // Process request
    const result = await processAction(validated);

    return json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    logger.error('[action] Failed:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Streaming Response (SSE)

```typescript
// app/routes/api.stream-feature.ts
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.stream-feature');

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (type: string, data: unknown) => {
        const event = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      try {
        // Send progress events
        sendEvent('progress', { message: 'Starting...', progress: 0 });

        // Process in steps
        for (let i = 0; i < steps.length; i++) {
          await processStep(steps[i]);
          sendEvent('progress', {
            message: `Step ${i + 1} complete`,
            progress: ((i + 1) / steps.length) * 100,
          });
        }

        // Send completion
        sendEvent('complete', { result: finalResult });
      } catch (error) {
        logger.error('[stream] Error:', error);
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

## Convex Backend

### Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    daytonaWorkspaceId: v.optional(v.string()),
    status: v.union(
      v.literal('creating'),
      v.literal('ready'),
      v.literal('building'),
      v.literal('error')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  files: defineTable({
    projectId: v.id('projects'),
    path: v.string(),
    content: v.string(),
    encoding: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_path', ['projectId', 'path']),
});
```

### Query Functions

```typescript
// convex/projects.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const listUserProjects = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});
```

### Mutation Functions

```typescript
// convex/projects.ts
export const createProject = mutation({
  args: {
    name: v.string(),
    userId: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      userId: args.userId,
      description: args.description,
      status: 'creating',
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

export const updateProjectStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(
      v.literal('creating'),
      v.literal('ready'),
      v.literal('building'),
      v.literal('error')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
```

### Using Convex in Frontend

```typescript
// In React components
import { useQuery, useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';

function ProjectList({ userId }) {
  // Query is reactive - auto-updates when data changes
  const projects = useQuery(api.projects.listUserProjects, { userId });

  // Mutation for creating new projects
  const createProject = useMutation(api.projects.createProject);

  const handleCreate = async () => {
    await createProject({
      name: 'New Project',
      userId,
    });
  };

  if (!projects) return <Loading />;

  return (
    <div>
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
      <button onClick={handleCreate}>Create Project</button>
    </div>
  );
}
```

## Service Layer

### Service Class Pattern

```typescript
// app/lib/services/featureService.server.ts
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FeatureService');

export interface FeatureServiceConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export class FeatureService {
  #config: Required<FeatureServiceConfig>;

  constructor(config: FeatureServiceConfig) {
    this.#config = {
      timeout: 30000,
      ...config,
    };
  }

  async performAction(input: ActionInput): Promise<ActionResult> {
    logger.debug('Performing action', { input });

    try {
      const response = await fetch(`${this.#config.baseUrl}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#config.apiKey}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(this.#config.timeout),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('Action completed', { result });

      return result;
    } catch (error) {
      logger.error('Action failed', { error });
      throw error;
    }
  }
}

// Singleton instance
let serviceInstance: FeatureService | null = null;

export function getFeatureService(): FeatureService {
  if (!serviceInstance) {
    serviceInstance = new FeatureService({
      apiKey: process.env.FEATURE_API_KEY!,
      baseUrl: process.env.FEATURE_API_URL!,
    });
  }
  return serviceInstance;
}
```

## Daytona Integration

### Workspace Operations

```typescript
// app/lib/services/daytonaService.server.ts
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DaytonaService');

export interface WorkspaceConfig {
  projectId: string;
  template?: string;
}

export interface FileUpload {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export async function createWorkspace(config: WorkspaceConfig): Promise<string> {
  logger.info('Creating workspace', { projectId: config.projectId });

  const response = await fetch(`${DAYTONA_API_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAYTONA_API_KEY}`,
    },
    body: JSON.stringify({
      projectId: config.projectId,
      template: config.template || 'node-18',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workspace: ${response.statusText}`);
  }

  const { workspaceId } = await response.json();
  logger.info('Workspace created', { workspaceId });

  return workspaceId;
}

export async function uploadFiles(
  workspaceId: string,
  files: FileUpload[]
): Promise<void> {
  logger.debug('Uploading files', { workspaceId, count: files.length });

  await fetch(`${DAYTONA_API_URL}/workspaces/${workspaceId}/files`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAYTONA_API_KEY}`,
    },
    body: JSON.stringify({ files }),
  });
}

export async function executeCommand(
  workspaceId: string,
  command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  logger.debug('Executing command', { workspaceId, command });

  const response = await fetch(`${DAYTONA_API_URL}/workspaces/${workspaceId}/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAYTONA_API_KEY}`,
    },
    body: JSON.stringify({ command }),
  });

  return response.json();
}
```

## LLM Integration

### OpenRouter Client

```typescript
// app/lib/services/llm.ts
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LLMService');

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCompletion(
  messages: Message[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
      'HTTP-Referer': 'https://flowstarter.app',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('LLM request failed', { error });
    throw new Error(`LLM error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function* streamCompletion(
  messages: Message[],
  config: LLMConfig
): AsyncGenerator<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = JSON.parse(line.slice(6));
        const content = data.choices[0]?.delta?.content;
        if (content) yield content;
      }
    }
  }
}
```

## Error Handling

### Result Type Pattern

```typescript
// app/types/result.ts
export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E = Error> {
  success: false;
  error: E;
}

export type Result<T, E = Error> = Success<T> | Failure<E>;

// Helper functions
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

export function failure<E = Error>(error: E): Failure<E> {
  return { success: false, error };
}

// Usage
async function processData(input: Input): Promise<Result<Output>> {
  try {
    const output = await doProcessing(input);
    return success(output);
  } catch (error) {
    logger.error('[processData] Failed:', error);
    return failure(error instanceof Error ? error : new Error('Unknown error'));
  }
}
```

### API Error Response

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const error: APIError = { code, message, details };
  return json(error, { status });
}

// Usage
if (!user) {
  return createErrorResponse('USER_NOT_FOUND', 'User does not exist', 404);
}

if (!hasPermission) {
  return createErrorResponse('FORBIDDEN', 'Insufficient permissions', 403);
}
```

## Input Validation

### Zod Schemas

```typescript
import { z } from 'zod';

// Define schemas
export const ProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z.enum(['react-vite', 'next-app', 'vanilla-ts']).optional(),
  settings: z
    .object({
      private: z.boolean().default(false),
      features: z.array(z.string()).default([]),
    })
    .optional(),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;

// Validate in API route
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();

  const parseResult = ProjectInputSchema.safeParse(body);

  if (!parseResult.success) {
    return json(
      {
        error: 'Validation failed',
        issues: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  const validatedInput = parseResult.data;
  // Process with type-safe input...
}
```

## Environment Variables

### Loading and Validation

```typescript
// app/lib/config/env.server.ts
import { z } from 'zod';

const EnvSchema = z.object({
  // Required
  OPEN_ROUTER_API_KEY: z.string().min(1),
  CONVEX_URL: z.string().url(),
  DAYTONA_API_URL: z.string().url(),
  DAYTONA_API_KEY: z.string().min(1),

  // Optional with defaults
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (!env) {
    const result = EnvSchema.safeParse(process.env);

    if (!result.success) {
      console.error('Invalid environment variables:', result.error.issues);
      throw new Error('Invalid environment configuration');
    }

    env = result.data;
  }

  return env;
}
```

## Backend Checklist

Before deploying backend changes:

- [ ] Input validated with Zod schemas
- [ ] Errors properly caught and logged
- [ ] API returns consistent error format
- [ ] Sensitive data not logged
- [ ] Environment variables validated
- [ ] Convex mutations are idempotent where possible
- [ ] Streaming endpoints send proper headers
- [ ] Rate limiting considered for public endpoints
- [ ] API route follows naming convention (api.feature-name)
- [ ] Service functions are testable (no direct env access)
