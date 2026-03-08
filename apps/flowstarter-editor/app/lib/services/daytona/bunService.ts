/**
 * Bun Service
 *
 * Handles bun runtime detection, installation, and dependency management.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { log } from './client';

const BUN_PATH_SETUP = 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && ';

interface BunInstallResult {
  success: boolean;
  method?: string;
  version?: string;
  error?: string;
}

/**
 * Check if bun is available in the sandbox
 */
export async function checkBunAvailable(sandbox: Sandbox, workDir: string): Promise<boolean> {
  const bunCheck = await sandbox.process.executeCommand('bun --version 2>/dev/null || echo "bun not found"', workDir);

  return bunCheck.exitCode === 0 && !bunCheck.result?.includes('not found');
}

/**
 * Install bun in the sandbox using multiple methods in parallel
 * Returns true if installation succeeded
 */
export async function installBun(sandbox: Sandbox, workDir: string): Promise<boolean> {
  log.debug(' Bun not found, installing bun...');

  const installMethods = [
    {
      name: 'curl',
      command: 'curl -fsSL https://bun.sh/install | bash 2>&1 && ' + BUN_PATH_SETUP.slice(0, -4),
    },
    {
      name: 'wget',
      command: 'wget -qO- https://bun.sh/install | bash 2>&1 && ' + BUN_PATH_SETUP.slice(0, -4),
    },
    {
      name: 'direct-zip',
      command:
        'cd /tmp && curl -fsSL https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip -o bun.zip && unzip -q bun.zip && mkdir -p "$HOME/.bun/bin" && mv bun-linux-x64/bun "$HOME/.bun/bin/" && chmod +x "$HOME/.bun/bin/bun" && ' +
        BUN_PATH_SETUP.slice(0, -4),
    },
  ];

  log.debug(` Racing ${installMethods.length} installation methods in parallel...`);

  const startTime = Date.now();

  const installPromises = installMethods.map(async (method): Promise<BunInstallResult> => {
    try {
      const installResult = await sandbox.process.executeCommand(method.command, workDir, undefined, 90);

      if (installResult.exitCode === 0) {
        const verifyResult = await sandbox.process.executeCommand(
          BUN_PATH_SETUP + 'bun --version 2>/dev/null',
          workDir,
          undefined,
          10,
        );

        if (verifyResult.exitCode === 0 && verifyResult.result && !verifyResult.result.includes('not found')) {
          log.debug(` ${method.name} succeeded in ${Date.now() - startTime}ms: ${verifyResult.result.trim()}`);
          return { success: true, method: method.name, version: verifyResult.result.trim() };
        }
      }

      return { success: false, method: method.name };
    } catch (e) {
      return { success: false, method: method.name, error: e instanceof Error ? e.message : 'unknown' };
    }
  });

  const results = await Promise.all(installPromises);
  const successResult = results.find((r) => r.success);

  if (successResult) {
    log.debug(` Bun installed successfully via ${successResult.method} (${Date.now() - startTime}ms total)`);
    return true;
  }

  log.debug(
    ` All ${installMethods.length} installation methods failed:`,
    results.map((r) => `${r.method}: ${r.error || 'failed'}`).join(', '),
  );

  return false;
}

/**
 * Install dependencies using bun
 */
export async function bunInstall(
  sandbox: Sandbox,
  workDir: string,
  onOutput?: (line: string, stream: 'stdout' | 'stderr') => void,
): Promise<boolean> {
  log.debug(' Running bun install...');

  const installResult = await sandbox.process.executeCommand(`${BUN_PATH_SETUP}bun install`, workDir, undefined, 180);
  log.debug(` Install result: exit=${installResult.exitCode}, output=${installResult.result?.slice(0, 500)}`);

  // Emit output lines to the terminal panel
  if (onOutput && installResult.result) {
    const lines = installResult.result.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      onOutput(line, installResult.exitCode === 0 ? 'stdout' : 'stderr');
    }
  }

  if (installResult.exitCode !== 0) {
    log.error(' bun install failed:', installResult.result?.slice(0, 500));
    return false;
  }

  return true;
}

/**
 * Get the bun path setup command
 */
export function getBunPathSetup(): string {
  return BUN_PATH_SETUP;
}

