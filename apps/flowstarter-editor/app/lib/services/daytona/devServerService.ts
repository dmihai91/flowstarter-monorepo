/**
 * Dev Server Service
 *
 * Handles development server startup, health checks, and port detection.
 * Enhanced with smarter startup detection and log monitoring.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { log } from './client';
import { getBunPathSetup } from './bunService';
import { extractPort, extractBuildErrorFromLog } from './errorParser';
import type { BuildErrorInfo } from './types';

/**
 * Wait for dev server to respond with health checks.
 * Also monitors /tmp/dev.log for early error detection.
 * Returns { ready: true } if server is up, or { ready: false, buildError } if errors found in logs.
 */
export async function waitForDevServer(
  previewUrl: string,
  maxWaitMs: number = 60000,
  options?: {
    sandbox?: Sandbox;
    workDir?: string;
    /** Check dev log for errors every N HTTP checks */
    logCheckInterval?: number;
  },
): Promise<{ ready: boolean; buildError?: BuildErrorInfo }> {
  const startTime = Date.now();
  let attempts = 0;
  const logCheckInterval = options?.logCheckInterval ?? 4;

  log.debug(` Checking if dev server is ready at ${previewUrl}`);

  while (Date.now() - startTime < maxWaitMs) {
    attempts++;

    // Periodically check dev logs for errors (faster than waiting for HTTP timeout)
    if (options?.sandbox && options.workDir && attempts % logCheckInterval === 0) {
      try {
        const logResult = await options.sandbox.process.executeCommand(
          'tail -50 /tmp/dev.log 2>/dev/null || echo ""',
          options.workDir,
          undefined,
          5,
        );
        const logContent = logResult.result || '';

        if (logContent.length > 20) {
          const buildError = extractBuildErrorFromLog(logContent);
          if (buildError) {
            log.debug(` Dev log shows build error: ${buildError.message.slice(0, 100)}`);
            return { ready: false, buildError };
          }
        }
      } catch {
        // Log check failed, that's ok — continue with HTTP polling
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(previewUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      /*
       * Any response (even error pages) means the server is up
       * 502/503/504 means proxy is up but server isn't ready yet
       * Also check for Daytona's "Preview Server Starting" page which returns 200
       * but means the workspace dev server isn't actually running yet
       */
      if (response.status !== 502 && response.status !== 503 && response.status !== 504) {
        // Read body to check if this is Daytona's startup placeholder page or an Astro error page
        const body = await response.text().catch(() => '');
        const isDaytonaStartupPage = body.includes('Preview Server Starting') || body.includes('preview server is still initializing');

        if (isDaytonaStartupPage) {
          if (attempts <= 3) {
            log.debug(` Got Daytona startup page (not actual app), attempt ${attempts}...`);
          }
        } else if (response.status === 500) {
          // 500 from dev server means a runtime/build error in the generated code
          // Extract the error type from the response (Astro returns <title>ErrorType</title>)
          const errorMatch = body.match(/<title>([^<]+)<\/title>/);
          const errorType = errorMatch?.[1] || 'Unknown Error';
          const elapsed = Date.now() - startTime;
          log.debug(` Dev server returned 500 (${errorType}) after ${elapsed}ms — treating as build error`);
          // Try to extract file path from Astro error page
          let file = '';
          let line = '0';
          
          // Astro error page often contains file path in pre or code tags
          const fileMatch = body.match(/(?:\/home\/daytona\/|file:\/\/)?(?:src\/[a-zA-Z0-9_.\-\/]+\.(?:astro|tsx?|jsx?))(?::(\d+))?/);
          if (fileMatch) {
            file = fileMatch[0].replace(/^(?:\/home\/daytona\/|file:\/\/)/, '').split(':')[0];
            line = fileMatch[1] || '0';
          }
          
          // Also try FailedToLoadModuleSSR pattern
          const moduleMatch = body.match(/Failed to load url ([^\s<]+)/);
          if (moduleMatch) {
            file = moduleMatch[1].replace(/^(?:\/home\/daytona\/|file:\/\/)/, '');
          }
          
          log.warn(`Astro error page (file=${file}, line=${line}): ${body.slice(0, 300)}`);
          
          return {
            ready: false,
            buildError: {
              file,
              line,
              message: `Runtime ${errorType}: The dev server is running but the page fails to render with a ${errorType}. This is likely a code generation issue in the Astro components.`,
              fullOutput: body.slice(0, 1000),
            },
          };
        } else {
          const elapsed = Date.now() - startTime;
          log.debug(` Dev server responded with status ${response.status} after ${elapsed}ms (${attempts} attempts)`);
          return { ready: true };
        }
      }

      if (attempts <= 3) {
        log.debug(` Dev server not ready yet (status ${response.status}), attempt ${attempts}...`);
      }
    } catch (e) {
      if (attempts <= 3) {
        log.debug(` Dev server not reachable yet (attempt ${attempts}): ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    const interval = getPollingInterval(attempts);
    await new Promise((r) => setTimeout(r, interval));
  }

  // Timeout — do one final log check for error details
  if (options?.sandbox && options.workDir) {
    try {
      const logResult = await options.sandbox.process.executeCommand(
        'tail -80 /tmp/dev.log 2>/dev/null || echo ""',
        options.workDir,
        undefined,
        5,
      );
      const logContent = logResult.result || '';
      const buildError = extractBuildErrorFromLog(logContent);
      if (buildError) {
        log.debug(` Final log check found build error: ${buildError.message.slice(0, 100)}`);
        return { ready: false, buildError };
      }
    } catch {
      // ignore
    }
  }

  log.debug(` Dev server health check timed out after ${attempts} attempts`);
  return { ready: false };
}

/**
 * Get polling interval based on attempt count (adaptive backoff)
 */
function getPollingInterval(attemptCount: number): number {
  if (attemptCount < 5) return 500;
  if (attemptCount < 10) return 1000;
  return 2000;
}

/**
 * Kill any existing dev server processes
 */
export async function killExistingDevServers(sandbox: Sandbox, workDir: string): Promise<void> {
  log.debug(' Killing any existing dev server processes...');
  await sandbox.process.executeCommand(
    'pkill -f "bun run dev" 2>/dev/null || true; pkill -f "astro dev" 2>/dev/null || true; pkill -f "vite" 2>/dev/null || true; sleep 1',
    workDir,
    undefined,
    10,
  );
}

/**
 * Start dev server in test mode (brief run to check for immediate errors).
 * Uses a 25s timeout to allow Astro compilation time.
 * Exits early if it detects success or error signals.
 */
export async function startDevServerTest(
  sandbox: Sandbox,
  workDir: string,
): Promise<{ output: string; exitCode: number }> {
  const bunPathSetup = getBunPathSetup();

  // 25s timeout — enough for Astro to compile most templates
  // The || true prevents a non-zero exit from killing the pipeline
  const devCommand = `${bunPathSetup}timeout 25 bun run dev --host 0.0.0.0 2>&1 || true`;

  log.debug(' Starting dev server test run (25s max)...');

  const devResult = await sandbox.process.executeCommand(devCommand, workDir, undefined, 30);
  const output = devResult.result || '';

  log.debug(` Dev server test output: exit=${devResult.exitCode}, len=${output.length}, snippet=${output.slice(0, 500)}`);

  return { output, exitCode: devResult.exitCode };
}

/**
 * Start dev server in background
 */
export async function startDevServerBackground(sandbox: Sandbox, workDir: string): Promise<void> {
  const bunPathSetup = getBunPathSetup();

  // Clear previous log, then start fresh
  const bgCommand = `rm -f /tmp/dev.log && ${bunPathSetup}nohup bun run dev --host 0.0.0.0 > /tmp/dev.log 2>&1 &`;

  sandbox.process.executeCommand(bgCommand, workDir, undefined, 5).catch(() => {
    // Expected - background process
  });
}

/**
 * Get preview URL from sandbox, trying multiple ports
 */
export async function getPreviewUrl(
  sandbox: Sandbox,
  detectedPort: number | null,
): Promise<{ url: string; port: number } | null> {
  const portsToTry = detectedPort ? [detectedPort, 4321, 5173, 3000] : [4321, 5173, 3000];

  log.debug(` Detected port from output: ${detectedPort}, will try ports: ${portsToTry.join(', ')}`);

  for (const port of portsToTry) {
    try {
      log.debug(` Trying port ${port}...`);
      const previewLink = await sandbox.getPreviewLink(port);
      log.debug(` Got preview URL for port ${port}: ${previewLink.url}`);
      return { url: previewLink.url, port };
    } catch {
      log.debug(` Port ${port} failed, trying next...`);
    }
  }

  return null;
}

/**
 * Check dev log for actual running port
 */
export async function checkDevLogForPort(sandbox: Sandbox, workDir: string): Promise<number | null> {
  const logCheck = await sandbox.process.executeCommand(
    'tail -30 /tmp/dev.log 2>/dev/null || echo "No log yet"',
    workDir,
    undefined,
    5,
  );
  const devLogContent = logCheck.result || '';

  if (devLogContent.length > 50) {
    log.debug(` Dev log check: ${devLogContent.slice(0, 200)}...`);
  }

  return extractPort(devLogContent);
}

/**
 * Read the full dev log content for error analysis
 */
export async function readDevLog(sandbox: Sandbox, workDir: string, lines: number = 100): Promise<string> {
  try {
    const result = await sandbox.process.executeCommand(
      `tail -${lines} /tmp/dev.log 2>/dev/null || echo ""`,
      workDir,
      undefined,
      5,
    );
    return result.result || '';
  } catch {
    return '';
  }
}

// Re-export error parsing utilities
/**
 * Run astro check in the sandbox to catch type/syntax errors before preview
 */
export async function runAstroCheck(
  sandbox: Sandbox,
  workDir: string,
): Promise<{ success: boolean; errors: Array<{ file: string; line: string; message: string; fullOutput: string }> }> {
  try {
    log.info(' Running astro check...');
    
    // Run astro check with timeout
    const result = await sandbox.process.executeCommand(
      'bun add -D @astrojs/check typescript 2>/dev/null; timeout 60 bunx astro check 2>&1 || true',
      workDir,
      undefined,
      90,
    );
    
    const output = result.result || '';
    log.info(` Astro check output: ${output.slice(0, 500)}`);
    
    // Strip ANSI codes for easier parsing
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[\d+m/g, '');
    
    // Parse errors from astro check output - multiple formats supported
    const errors: Array<{ file: string; line: string; message: string; fullOutput: string }> = [];
    
    // Format 1: "file:line:col - error TS2307: message" (TypeScript style)
    const tsPattern = /([a-zA-Z0-9_.\-\/]+\.(?:astro|ts|tsx|js|jsx)):(\d+):(\d+)\s*-?\s*(?:error|Error)\s*[A-Z0-9]*:?\s*(.+)/g;
    let match;
    while ((match = tsPattern.exec(cleanOutput)) !== null) {
      errors.push({
        file: match[1],
        line: match[2],
        message: match[4].trim(),
        fullOutput: output.slice(Math.max(0, match.index - 100), match.index + 200),
      });
    }
    
    // Format 2: Astro check format - file on one line, error details below
    // Look for file paths followed by error info
    if (errors.length === 0) {
      const filePattern = /(src\/[a-zA-Z0-9_.\-\/]+\.(?:astro|ts|tsx))/g;
      const files = new Set<string>();
      while ((match = filePattern.exec(cleanOutput)) !== null) {
        files.add(match[1]);
      }
      
      // If we found files and there are errors mentioned
      if (files.size > 0 && cleanOutput.includes('error')) {
        for (const filePath of files) {
          errors.push({
            file: filePath,
            line: '0',
            message: 'Type/syntax error detected by astro check',
            fullOutput: output.slice(0, 800),
          });
        }
      }
    }
    
    // Format 3: General error fallback
    if (errors.length === 0 && (cleanOutput.toLowerCase().includes('error') || cleanOutput.includes('Error'))) {
      const generalError = cleanOutput.match(/(?:error|Error)[:\s]+(.+)/);
      if (generalError) {
        errors.push({
          file: 'unknown',
          line: '0',
          message: generalError[1].split('\n')[0].trim(),
          fullOutput: output.slice(0, 500),
        });
      }
    }
    
    log.info(` Astro check found ${errors.length} errors`);
    
    return {
      success: errors.length === 0,
      errors,
    };
  } catch (e) {
    log.error(' Astro check failed:', e);
    return {
      success: false,
      errors: [{
        file: 'unknown',
        line: '0',
        message: e instanceof Error ? e.message : 'Unknown error during astro check',
        fullOutput: '',
      }],
    };
  }
}

export { parseErrorDetails, parseAllErrors, hasFatalError, checkServerStarted, extractPort, createBuildError, extractBuildErrorFromLog } from './errorParser';

