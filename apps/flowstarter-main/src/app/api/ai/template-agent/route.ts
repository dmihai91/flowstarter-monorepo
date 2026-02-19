import { auditAiEvent } from '@/lib/ai/audit';
import { parseCodeblocks } from '@/lib/ai/codeblock-parser';
import { retrieveTemplateExamples } from '@/lib/ai/template-retrieval';
import {
  downloadTemplate,
  getRepoTemplates,
  saveTemplateFiles,
  TemplateFile,
} from '@/lib/local-template-service';
import { models } from '@/lib/ai/openrouter-client';
import { auth } from '@clerk/nextjs/server';
import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  templateData: z.object({
    name: z.string().min(1),
    description: z.string().default(''),
    category: z.string().default(''),
    tech_stack: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    github_url: z.string().optional(),
    demo_url: z.string().optional(),
  }),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .default([]),
  message: z.string().min(1),
  projectId: z.string().optional(),
  save: z.boolean().optional(),
});

// Schema for validating the AI's JSON output
const TemplateFileSchema = z.object({
  path: z.string().min(1, 'file.path required'),
  language: z.string().min(1, 'file.language required'),
  content: z.string().min(1, 'file.content required'),
});

const TemplateJsonSchema = z.object({
  description: z.string().min(1, 'description required'),
  files: z.array(TemplateFileSchema).min(1, 'at least one file required'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { templateData, messages, message, projectId, save } = parsed.data;

    // Pull a lightweight list of predefined templates to bias the model toward our catalog
    const repoTemplates = await getRepoTemplates().catch(() => []);

    const systemPrompt = `Generate Next.js website as JSON. Template: ${templateData.name} (${templateData.category})

JSON format:
{
  "description": "Brief description",
  "files": [
    {"path": "/package.json", "language": "json", "content": "minimal package.json"},
    {"path": "/app/layout.tsx", "language": "typescript", "content": "layout with nav"},
    {"path": "/app/page.tsx", "language": "typescript", "content": "landing page"},
    {"path": "/app/globals.css", "language": "css", "content": "@tailwind base; @tailwind components; @tailwind utilities;"},
    {"path": "/tailwind.config.js", "language": "javascript", "content": "basic tailwind config"},
    {"path": "/postcss.config.js", "language": "javascript", "content": "basic postcss config"},
    {"path": "/preview.html", "language": "html", "content": "HTML preview with Tailwind CDN"}
  ]
}

Make files functional but concise. Include ALL 7 files. Escape quotes. JSON only.`;

    // Retrieve relevant examples from local templates to ground the model
    const retrieval = await retrieveTemplateExamples({
      templateData,
      userQuery: message,
      maxFiles: 6,
      maxCharsPerFile: 1400,
    });

    // Inject a random template example from our local library to diversify context
    let randomTemplateContext = '';
    try {
      if (repoTemplates.length) {
        const rand =
          repoTemplates[Math.floor(Math.random() * repoTemplates.length)];
        const tmplFiles = await downloadTemplate(rand.id).catch(
          () => [] as TemplateFile[]
        );
        // Include all key template files for complete context
        const preferPaths = [
          'app/page.tsx',
          'app/layout.tsx',
          'app/globals.css',
          'tailwind.config.js',
          'package.json',
          'README.md',
        ];

        // Also include any TSX/JSX component files from components directories
        const componentFiles = tmplFiles.filter(
          (f) =>
            f.type === 'file' &&
            (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
            (f.path.includes('/components/') || f.path.includes('/ui/'))
        );
        const filesToShow: TemplateFile[] = [];

        const findByPath = (p: string) =>
          tmplFiles.find(
            (f) => f.path.replace(/^\//, '') === p || f.path === p
          );

        // Get preferred files first
        for (const p of preferPaths) {
          const f = findByPath(p);
          if (f && f.type === 'file') filesToShow.push(f);
        }

        // Add all component files for complete template structure
        filesToShow.push(...componentFiles);

        // If we still don't have enough files, include any available files
        if (filesToShow.length < 3) {
          const remainingFiles = tmplFiles.filter(
            (f) =>
              f.type === 'file' &&
              !filesToShow.find((existing) => existing.path === f.path) &&
              (f.path.endsWith('.tsx') ||
                f.path.endsWith('.jsx') ||
                f.path.endsWith('.ts') ||
                f.path.endsWith('.js') ||
                f.path.endsWith('.css') ||
                f.path.endsWith('.json'))
          );
          filesToShow.push(...remainingFiles.slice(0, 8));
        }

        // Load complete file content without truncation for full AI context
        const sections = filesToShow.map((f) =>
          [
            `// FULL TEMPLATE EXAMPLE (${rand.id}): ${f.path}`,
            f.content, // Full content, no truncation
            '// END OF FILE',
            '',
          ].join('\n')
        );
        randomTemplateContext = sections.join('\n');
      }
    } catch {
      // best-effort only
    }

    // Use OpenRouter with Claude Sonnet 4 for template generation
    const model = models.templateAgent;

    // Generate with validation-and-retry loop
    const baseMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
      // Provide grounding context from local templates when available
      ...(retrieval.contextText || randomTemplateContext
        ? ([
            {
              role: 'user' as const,
              content: `REFERENCE CONTEXT FROM LOCAL TEMPLATES (do not echo back, use only as guidance):\n\n${
                retrieval.contextText || ''
              }\n${randomTemplateContext || ''}`,
            },
          ] as Array<{ role: 'user'; content: string }>)
        : ([] as Array<{ role: 'user'; content: string }>)),
      { role: 'user' as const, content: message },
    ];

    let lastTotalTokens: number | undefined = undefined;
    let parsedFiles: Array<{
      path: string;
      language: string;
      content: string;
    }> = [];
    let description = '';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const go: any = generateObject as any;
      const { object, usage } = (await go({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: TemplateJsonSchema as any,
        mode: 'json',
        temperature: 0.6,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: baseMessages as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as { object: any; usage?: { totalTokens?: number } };

      lastTotalTokens = usage?.totalTokens;
      description = object.description;
      parsedFiles = object.files.map((file) => ({
        path: file.path.startsWith('/') ? file.path : '/' + file.path,
        language: file.language || 'text',
        content: file.content,
      }));
      console.log('✅ Valid JSON with', parsedFiles.length, 'files');
    } catch (e) {
      console.log(
        '❌ Object generation failed, falling back to markdown parsing:',
        (e as Error).message
      );
      const fallbackText = '';
      parsedFiles = parseCodeblocks(fallbackText);
      description = '';
    }

    let saved = 0;
    if (save && projectId && parsedFiles.length) {
      const filesToSave: TemplateFile[] = parsedFiles.map((f) => ({
        path: f.path.replace(/^\//, ''),
        content: f.content,
        type: 'file',
      }));
      await saveTemplateFiles(projectId, filesToSave);
      saved = filesToSave.length;
    }

    await auditAiEvent({
      req: request,
      userId,
      sessionClaims,
      route: '/api/ai/template-agent',
      agent: 'template-agent',
      action: 'chat',
      context: {
        templateName: templateData.name,
        files: parsedFiles.length,
        save,
        projectId,
      },
      result: { tokens: lastTotalTokens },
      status: 'ok',
    });

    // Return structured response with separate description and files
    return NextResponse.json({
      message: description || 'Template generated successfully',
      files: parsedFiles,
      saved,
      isStructured: !!description, // Flag to indicate if response was JSON structured
    });
  } catch (error: unknown) {
    console.error('Template Agent API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
