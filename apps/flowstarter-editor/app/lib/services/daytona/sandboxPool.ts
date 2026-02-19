/**
 * Sandbox Pool Manager
 * 
 * Maintains a pool of pre-warmed sandboxes ready for instant use.
 * Sandboxes are pre-configured with bun and common dependencies.
 */

import type { Daytona } from '@daytonaio/sdk';
import { createLogger } from '~/lib/utils/logger';
import { checkBunAvailable, installBun } from './bunService';
import type { DaytonaEnv } from './types';
import { getClient } from './client';

const log = createLogger('SandboxPool');

interface PooledSandbox {
  sandbox: Awaited<ReturnType<Daytona['create']>>;
  workDir: string;
  createdAt: number;
  hasBun: boolean;
}

// Pool configuration
const POOL_SIZE = 2;
const SANDBOX_TTL_MS = 30 * 60 * 1000; // 30 minutes max age
const WARMUP_INTERVAL_MS = 60 * 1000; // Check pool every minute

// The pool
const warmPool: PooledSandbox[] = [];
let poolInitialized = false;
let warmupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get a pre-warmed sandbox from the pool, or null if empty
 */
export async function getWarmSandbox(client: Daytona): Promise<PooledSandbox | null> {
  cleanExpiredSandboxes();
  
  const pooled = warmPool.shift();
  if (pooled) {
    log.debug(`Got pre-warmed sandbox from pool (${warmPool.length} remaining)`);
    queueMicrotask(() => refillPool(client));
    return pooled;
  }
  
  log.debug('Pool empty, will create new sandbox');
  return null;
}

/**
 * Initialize the pool with pre-warmed sandboxes
 */
export async function initializePool(env?: DaytonaEnv): Promise<void> {
  if (poolInitialized) return;
  poolInitialized = true;
  
  log.debug('Initializing sandbox pool...');
  
  try {
    const client = getClient(env);
    
    // Warm up initial sandboxes in parallel
    const warmupPromises = Array(POOL_SIZE).fill(null).map(() => 
      createWarmSandbox(client).catch(e => {
        log.warn('Failed to pre-warm sandbox:', e);
        return null;
      })
    );
    
    const results = await Promise.all(warmupPromises);
    results.forEach(pooled => {
      if (pooled) warmPool.push(pooled);
    });
    
    log.debug(`Pool initialized with ${warmPool.length} sandboxes`);
    startBackgroundWarmup(env);
  } catch (e) {
    log.error('Failed to initialize pool:', e);
  }
}

/**
 * Create a warm sandbox with bun installed
 */
async function createWarmSandbox(client: Daytona): Promise<PooledSandbox | null> {
  try {
    log.debug('Creating warm sandbox...');
    const sandbox = await client.create();
    const workDir = await sandbox.getWorkDir() || '/home/daytona';
    
    let hasBun = await checkBunAvailable(sandbox, workDir);
    if (!hasBun) {
      hasBun = await installBun(sandbox, workDir);
    }
    
    return { sandbox, workDir, createdAt: Date.now(), hasBun };
  } catch (e) {
    log.error('Failed to create warm sandbox:', e);
    return null;
  }
}

/**
 * Refill the pool if below target size
 */
async function refillPool(client: Daytona): Promise<void> {
  cleanExpiredSandboxes();
  
  const needed = POOL_SIZE - warmPool.length;
  if (needed <= 0) return;
  
  log.debug(`Refilling pool: need ${needed} sandboxes`);
  
  for (let i = 0; i < needed; i++) {
    const pooled = await createWarmSandbox(client);
    if (pooled) warmPool.push(pooled);
  }
}

function startBackgroundWarmup(env?: DaytonaEnv): void {
  if (warmupInterval) return;
  
  warmupInterval = setInterval(async () => {
    try {
      const client = getClient(env);
      await refillPool(client);
    } catch (e) {
      log.warn('Background warmup failed:', e);
    }
  }, WARMUP_INTERVAL_MS);
}

export function stopPool(): void {
  if (warmupInterval) {
    clearInterval(warmupInterval);
    warmupInterval = null;
  }
  poolInitialized = false;
}

function cleanExpiredSandboxes(): void {
  const now = Date.now();
  for (let i = warmPool.length - 1; i >= 0; i--) {
    if (now - warmPool[i].createdAt > SANDBOX_TTL_MS) {
      const removed = warmPool.splice(i, 1)[0];
      log.debug('Removed expired sandbox from pool');
      removed.sandbox.delete?.().catch(() => {});
    }
  }
}

export function getPoolStats(): { size: number; maxSize: number } {
  return { size: warmPool.length, maxSize: POOL_SIZE };
}

