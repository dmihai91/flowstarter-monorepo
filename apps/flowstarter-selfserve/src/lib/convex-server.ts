// Server-side Convex writer for live agent/build state. Uses string-based
// function references so the app typechecks before `npx convex dev` has
// generated the convex/_generated bindings. No-ops when Convex is unconfigured.
import 'server-only';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import type { BuildEvent } from '@flowstarter/build-engine';

const upsertBuild = makeFunctionReference<'mutation'>('builds:upsert');
const appendEvent = makeFunctionReference<'mutation'>('builds:appendEvent');
const upsertTask = makeFunctionReference<'mutation'>('tasks:upsert');

let client: ConvexHttpClient | null | undefined;

function getConvex(): ConvexHttpClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  client = url ? new ConvexHttpClient(url) : null;
  if (!client) {
    console.warn('[selfserve] NEXT_PUBLIC_CONVEX_URL unset — live state falls back to HTTP polling');
  }
  return client;
}

export async function convexUpsertBuild(args: {
  buildId: string;
  projectId: string;
  status: string;
  progress: number;
  error?: string;
}) {
  const c = getConvex();
  if (!c) return;
  await c.mutation(upsertBuild, args).catch((e) => console.error('[convex] upsert build', e));
}

export async function convexAppendEvent(buildId: string, seq: number, event: BuildEvent) {
  const c = getConvex();
  if (!c) return;
  await c.mutation(appendEvent, { buildId, seq, event }).catch((e) => console.error('[convex] append', e));
}

export async function convexUpsertTask(args: {
  buildId: string;
  taskId: string;
  description: string;
  agentRole: string;
  capability: string;
  status: string;
  dependsOn: string[];
  output?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}) {
  const c = getConvex();
  if (!c) return;
  await c.mutation(upsertTask, args).catch((e) => console.error('[convex] upsert task', e));
}
