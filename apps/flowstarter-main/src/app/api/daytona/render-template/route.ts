import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
      language: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  // Return early if Daytona is not configured to avoid dynamic import issues
  if (!process.env.DAYTONA_API_KEY) {
    return NextResponse.json(
      { error: 'Daytona not configured' },
      { status: 503 }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { files } = parsed.data;

    // Import Daytona SDK dynamically
    const { Daytona } = await import('@daytonaio/sdk');

    console.log('🚀 [Daytona] Initializing Daytona client...');
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });

    console.log('📦 [Daytona] Creating TypeScript sandbox...');
    // Create a TypeScript sandbox
    const sandbox = await daytona.create({
      language: 'typescript',
    });
    console.log(`✅ [Daytona] Sandbox created: ${sandbox.id}`);

    try {
      // Upload all files to the sandbox
      console.log(`📤 [Daytona] Uploading ${files.length} files to sandbox...`);
      for (const file of files) {
        const filePath = file.path.startsWith('/')
          ? file.path.slice(1)
          : file.path;
        const fullPath = `/home/daytona/${filePath}`;

        console.log(`   → ${filePath}`);
        await sandbox.fs.uploadFile(
          Buffer.from(file.content, 'utf-8'),
          fullPath
        );
      }
      console.log('✅ [Daytona] All files uploaded successfully');

      // Install dependencies
      console.log('📦 [Daytona] Installing dependencies (npm install)...');
      const installResult = await sandbox.process.codeRun(
        'cd /home/daytona && npm install'
      );

      if (installResult.exitCode !== 0) {
        console.error('❌ [Daytona] npm install failed:', installResult.result);
        return NextResponse.json(
          {
            error: 'Failed to install dependencies',
            details: installResult.result,
          },
          { status: 500 }
        );
      }
      console.log('✅ [Daytona] Dependencies installed successfully');

      // Build the Next.js app
      console.log('🔨 [Daytona] Building Next.js app (npm run build)...');
      const buildResult = await sandbox.process.codeRun(
        'cd /home/daytona && npm run build'
      );

      if (buildResult.exitCode !== 0) {
        console.error('❌ [Daytona] npm run build failed:', buildResult.result);
        return NextResponse.json(
          {
            error: 'Failed to build template',
            details: buildResult.result,
          },
          { status: 500 }
        );
      }
      console.log('✅ [Daytona] Build completed successfully');

      // Start the Next.js server
      console.log('🚀 [Daytona] Starting Next.js server...');
      sandbox.process
        .codeRun('cd /home/daytona && npm start')
        .catch(console.error); // Run in background

      // Wait a moment for the server to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get preview link for the app running on port 3000
      console.log('🔗 [Daytona] Getting preview link...');
      const previewLink = await sandbox.getPreviewLink(3000);
      const previewUrl =
        previewLink?.url || `https://${sandbox.id}.daytona.app:3000`;

      console.log(`✅ [Daytona] Template deployed! URL: ${previewUrl}`);

      // Return sandbox info
      return NextResponse.json({
        success: true,
        sandboxId: sandbox.id,
        message: 'Template deployed to Daytona sandbox',
        previewUrl,
        steps: [
          '✅ Sandbox created',
          `✅ ${files.length} files uploaded`,
          '✅ Dependencies installed',
          '✅ Build completed',
          '✅ Server started',
        ],
      });
    } finally {
      // Clean up: remove sandbox after preview session
      setTimeout(() => {
        daytona.delete(sandbox).catch(console.error);
      }, 300000); // 5 minutes
    }
  } catch (error: unknown) {
    console.error('Daytona render error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
