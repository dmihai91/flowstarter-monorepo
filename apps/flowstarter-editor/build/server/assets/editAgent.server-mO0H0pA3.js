import process from 'vite-plugin-node-polyfills/shims/process';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { rm, mkdir, writeFile, readdir, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { t as trackLLMUsage, k as syncCostsToSupabase, l as extractToolPath, m as extractToolCommand } from './server-build-58eiE3Ew.js';
import 'react/jsx-runtime';
import '@remix-run/react';
import 'isbot';
import 'react-dom/server';
import 'node:stream';
import 'remix-island';
import '@nanostores/react';
import '@remix-run/cloudflare';
import 'nanostores';
import 'js-cookie';
import 'chalk';
import 'react';
import '@radix-ui/react-slot';
import 'tailwind-merge';
import 'remix-utils/client-only';
import 'react-toastify';
import 'convex/react';
import '@tanstack/react-query';
import '@clerk/remix';
import '@clerk/remix/ssr.server';
import '@supabase/supabase-js';
import '@openrouter/ai-sdk-provider';
import '@ai-sdk/openai';
import 'ai';
import '@remix-run/node';
import 'convex/server';
import 'vite-plugin-node-polyfills/shims/buffer';
import '@daytonaio/sdk';
import 'crypto';
import 'convex/browser';
import 'node:path';
import 'path-browserify';
import 'jszip';
import 'file-saver';
import 'diff';
import 'framer-motion';
import '@radix-ui/react-dialog';
import 'lucide-react';
import '@radix-ui/react-dropdown-menu';
import 'class-variance-authority';
import 'react-markdown';
import '@modelcontextprotocol/sdk/client/streamableHttp.js';
import 'rehype-sanitize';
import 'ignore';

const MODEL = "claude-sonnet-4-6";
const MAX_TURNS = 5;
const MAX_BUDGET_USD = 0.5;
function emitToolLifecycleEvent(emit, toolName, input) {
  if (!toolName) {
    return;
  }
  const nextInput = input ?? {};
  const path = extractToolPath(nextInput);
  const command = extractToolCommand(nextInput);
  if ((toolName === "Write" || toolName === "Edit") && path) {
    emit({ type: "file_write", path });
    return;
  }
  if (toolName === "Read" && path) {
    emit({ type: "file_read", path });
    return;
  }
  if (toolName === "Bash" && command) {
    emit({ type: "command", cmd: command });
    return;
  }
  emit({ type: "tool_call", name: toolName, input: nextInput });
}
async function setupWorkDir(files) {
  const workDir = join(tmpdir(), `fs-edit-${Date.now()}`);
  await mkdir(workDir, { recursive: true });
  for (const file of files) {
    const fullPath = join(workDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, "utf-8");
  }
  return workDir;
}
async function collectFiles(dir, base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(full, rel));
    } else {
      files.push({ path: rel, content: await readFile(full, "utf-8").catch(() => "") });
    }
  }
  return files;
}
async function runEditAgent(editPrompt, currentFiles, supabaseProjectId, onEvent) {
  const emit = onEvent ?? (() => {
  });
  const startedAt = Date.now();
  const workDir = await setupWorkDir(currentFiles);
  emit({ type: "text", content: `Loaded ${currentFiles.length} files into workspace` });
  try {
    emit({ type: "text", content: "Agent editing files..." });
    const abortController = new AbortController();
    let turns = 0;
    let totalCostUsd = 0;
    const result = query({
      prompt: editPrompt,
      options: {
        cwd: workDir,
        model: MODEL,
        maxTurns: MAX_TURNS,
        maxBudgetUsd: MAX_BUDGET_USD,
        systemPrompt: `You are editing an Astro website. The files are in the current directory.
Make the requested changes precisely. Do not rewrite entire files unless necessary.
Use the Edit tool for targeted changes. Use Write for new files only.
Keep all content in the original language. Preserve existing styles and structure.`,
        tools: ["Read", "Edit", "Write", "Glob", "Grep"],
        allowedTools: ["Read", "Edit", "Write", "Glob", "Grep"],
        persistSession: false,
        abortController,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ""
        }
      }
    });
    for await (const rawMessage of result) {
      const message = rawMessage;
      switch (message.type) {
        case "assistant":
          turns++;
          for (const block of message.message.content) {
            if (block.type === "text") {
              emit({ type: "text", content: block.text });
            }
          }
          break;
        case "tool_use":
          emitToolLifecycleEvent(emit, message.tool_name, message.input);
          break;
        case "tool_result":
          emitToolLifecycleEvent(emit, message.tool_name, message.input);
          break;
        case "result":
          if (message.subtype === "success") {
            emit({ type: "text", content: `Edit complete: ${message.result}` });
          } else if (message.subtype === "error_max_turns") {
            emit({ type: "error", message: "Reached max turns without completing" });
          } else if (message.subtype === "error_max_budget_usd") {
            emit({ type: "error", message: "Reached budget limit" });
          }
          if ("cost_usd" in message) {
            totalCostUsd = message.cost_usd || 0;
          }
          break;
        case "usage":
          const usage = message;
          if (usage.input_tokens || usage.output_tokens) {
            trackLLMUsage(supabaseProjectId, MODEL, "site_modification", {
              promptTokens: usage.input_tokens || 0,
              completionTokens: usage.output_tokens || 0
            });
          }
          break;
      }
    }
    const modifiedFiles = await collectFiles(workDir);
    emit({
      type: "done",
      duration_ms: Date.now() - startedAt,
      turns,
      cost_usd: totalCostUsd,
      input_tokens: 0,
      output_tokens: 0
    });
    syncCostsToSupabase(supabaseProjectId).catch(() => {
    });
    return {
      success: true,
      files: modifiedFiles,
      turns,
      costUsd: totalCostUsd
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Edit agent failed";
    emit({ type: "error", message });
    return { success: false, files: [], error: message };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {
    });
  }
}

export { runEditAgent };
