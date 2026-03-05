import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction,
  FlowstarterArtifactData, ThinkingArtifactData, ThinkingData,
  MessageState, StreamingMessageParserOptions } from './message-parser-types';
import {
  ARTIFACT_TAG_OPEN, ARTIFACT_TAG_CLOSE, ARTIFACT_ACTION_TAG_OPEN,
  ARTIFACT_ACTION_TAG_CLOSE, FLOWSTARTER_ARTIFACT_TAG_OPEN,
  FLOWSTARTER_ARTIFACT_TAG_CLOSE, FLOWSTARTER_ACTION_TAG_OPEN,
  FLOWSTARTER_ACTION_TAG_CLOSE, THINKING_TAG_OPEN, THINKING_TAG_CLOSE,
  THINKING_ARTIFACT_TAG_OPEN, THINKING_ARTIFACT_TAG_CLOSE,
  MAX_FILE_CHUNK_SIZE, MAX_TAG_LENGTH, createArtifactElement,
  createThinkingArtifactElement, cleanoutMarkdownSyntax, cleanEscapedTags,
} from './message-parser-types';

const logger = createScopedLogger('MessageParser');
export interface ParseResult { output: string; position: number; done: boolean; earlyBreak?: boolean }

export const extractAttribute = (tag: string, name: string) =>
  tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];

export function parseActionTag(input: string, openIdx: number, endIdx: number): FileAction | ShellAction {
  const tag = input.slice(openIdx, endIdx + 1);
  const type = extractAttribute(tag, 'type') as ActionType;
  const attrs: BoltActionData = { type, content: '' };
  if (type === 'file') {
    const filePath = extractAttribute(tag, 'filePath') as string;
    if (!filePath) logger.debug('File path not specified');
    (attrs as FileAction).filePath = filePath;
  } else if (!['shell', 'start'].includes(type)) {
    logger.warn(`Unknown action type '${type}'`);
  }
  return attrs as FileAction | ShellAction;
}

export function handleActionContent(
  input: string, state: MessageState, opts: StreamingMessageParserOptions,
  messageId: string, i: number,
): ParseResult {
  const artifact = state.currentArtifact;
  if (artifact === undefined) unreachable('Artifact not initialized');
  let closeIdx = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);
  if (closeIdx === -1) closeIdx = input.indexOf(FLOWSTARTER_ACTION_TAG_CLOSE, i);
  const action = state.currentAction;
  if (!action) return { output: '', position: i, done: true };
  if (closeIdx !== -1) {
    action.content += input.slice(i, closeIdx);
    let content = action.content.trim();
    if ('type' in action && action.type === 'file') {
      if (!action.filePath.endsWith('.md')) {
        content = cleanoutMarkdownSyntax(content);
        content = cleanEscapedTags(content);
      }
      content += '\n';
    }
    action.content = content;
    opts.callbacks?.onActionClose?.({
      artifactId: artifact.id, messageId,
      actionId: String(state.actionId - 1), action: action as BoltAction,
    });
    state.insideAction = false;
    state.currentAction = { content: '' };
    const len = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i) === closeIdx
      ? ARTIFACT_ACTION_TAG_CLOSE.length : FLOWSTARTER_ACTION_TAG_CLOSE.length;
    return { output: '', position: closeIdx + len, done: false };
  }
  if ('type' in action && action.type === 'file') {
    let content = input.slice(i);
    if (content.length > MAX_FILE_CHUNK_SIZE) {
      content = content.slice(0, MAX_FILE_CHUNK_SIZE);
      logger.warn('File content exceeds 1MB limit, truncating');
    }
    if (!action.filePath.endsWith('.md')) {
      content = cleanoutMarkdownSyntax(content);
      content = cleanEscapedTags(content);
    }
    opts.callbacks?.onActionStream?.({
      artifactId: artifact.id, messageId,
      actionId: String(state.actionId - 1),
      action: { ...(action as FileAction), content, filePath: action.filePath },
    });
  }
  return { output: '', position: i, done: true };
}

export function handleArtifactContent(
  input: string, state: MessageState, opts: StreamingMessageParserOptions,
  messageId: string, i: number,
): ParseResult {
  const artifact = state.currentArtifact;
  if (artifact === undefined) unreachable('Artifact not initialized');
  let actionIdx = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
  let closeIdx = input.indexOf(ARTIFACT_TAG_CLOSE, i);
  const thinkCloseIdx = input.indexOf(THINKING_ARTIFACT_TAG_CLOSE, i);
  const fsActionIdx = input.indexOf(FLOWSTARTER_ACTION_TAG_OPEN, i);
  const fsCloseIdx = input.indexOf(FLOWSTARTER_ARTIFACT_TAG_CLOSE, i);
  if (fsActionIdx !== -1 && (actionIdx === -1 || fsActionIdx < actionIdx)) actionIdx = fsActionIdx;
  if (fsCloseIdx !== -1 && (closeIdx === -1 || fsCloseIdx < closeIdx)) closeIdx = fsCloseIdx;
  if (thinkCloseIdx !== -1 && (closeIdx === -1 || thinkCloseIdx < closeIdx)) closeIdx = thinkCloseIdx;
  if (actionIdx !== -1 && (closeIdx === -1 || actionIdx < closeIdx)) {
    const endIdx = input.indexOf('>', actionIdx);
    if (endIdx === -1) return { output: '', position: i, done: true };
    state.insideAction = true;
    state.currentAction = parseActionTag(input, actionIdx, endIdx);
    opts.callbacks?.onActionOpen?.({
      artifactId: artifact.id, messageId,
      actionId: String(state.actionId++), action: state.currentAction as BoltAction,
    });
    return { output: '', position: endIdx + 1, done: false };
  }
  if (closeIdx !== -1) {
    if (state.currentArtifact) {
      opts.callbacks?.onArtifactClose?.({ messageId, ...state.currentArtifact });
      state.insideArtifact = false;
      state.currentArtifact = undefined;
    } else if (state.currentThinkingArtifact) {
      const steps = extractThinkingSteps(state.currentThinkingArtifact.content);
      opts.callbacks?.onThinkingArtifactClose?.({
        messageId, ...state.currentThinkingArtifact, steps,
      });
      state.insideThinkingArtifact = false;
      state.currentThinkingArtifact = undefined;
    }
    const len = input.indexOf(ARTIFACT_TAG_CLOSE, i) === closeIdx
      ? ARTIFACT_TAG_CLOSE.length
      : input.indexOf(FLOWSTARTER_ARTIFACT_TAG_CLOSE, i) === closeIdx
        ? FLOWSTARTER_ARTIFACT_TAG_CLOSE.length
        : THINKING_ARTIFACT_TAG_CLOSE.length;
    return { output: '', position: closeIdx + len, done: false };
  }
  return { output: '', position: i, done: true };
}

function extractThinkingSteps(content: string): string[] {
  const steps: string[] = [];
  content.split('\n').filter((line) => line.trim()).forEach((line) => {
    const trimmed = line.trim();
    const numbered = trimmed.match(/^\d+\.\s*(.+)$/);
    if (numbered) { steps.push(numbered[1]); return; }
    const bullet = trimmed.match(/^[-*]\s*(.+)$/);
    if (bullet) { steps.push(bullet[1]); return; }
    if (trimmed.length > 0) steps.push(trimmed);
  });
  return steps;
}
export function handleTagOpening(
  input: string, state: MessageState, opts: StreamingMessageParserOptions,
  messageId: string, i: number,
): ParseResult {
  let j = i;
  let potentialTag = '';
  while (j < input.length && potentialTag.length < MAX_TAG_LENGTH) {
    potentialTag += input[j];
    if (potentialTag === THINKING_TAG_OPEN) {
      return openTag(input, state, opts, messageId, i, j, 'thinking');
    }
    if (potentialTag === THINKING_ARTIFACT_TAG_OPEN) {
      return openTag(input, state, opts, messageId, i, j, 'thinkingArtifact');
    }
    if (potentialTag === ARTIFACT_TAG_OPEN || potentialTag === FLOWSTARTER_ARTIFACT_TAG_OPEN) {
      return openTag(input, state, opts, messageId, i, j, 'artifact');
    }
    if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag) &&
      !FLOWSTARTER_ARTIFACT_TAG_OPEN.startsWith(potentialTag) &&
      !THINKING_TAG_OPEN.startsWith(potentialTag) &&
      !THINKING_ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
      return { output: input.slice(i, j + 1), position: j + 1, done: false };
    }
    j++;
  }
  if (j === input.length &&
    (ARTIFACT_TAG_OPEN.startsWith(potentialTag) || FLOWSTARTER_ARTIFACT_TAG_OPEN.startsWith(potentialTag) ||
      THINKING_TAG_OPEN.startsWith(potentialTag) || THINKING_ARTIFACT_TAG_OPEN.startsWith(potentialTag))) {
    return { output: '', position: i, done: true };
  }
  return { output: input.slice(i, j + 1), position: j + 1, done: false };
}
type TagKind = 'thinking' | 'thinkingArtifact' | 'artifact';
function openTag(
  input: string, state: MessageState, opts: StreamingMessageParserOptions,
  messageId: string, i: number, j: number, kind: TagKind,
): ParseResult {
  const next = input[j + 1];
  if (next && next !== '>' && next !== ' ') {
    return { output: input.slice(i, j + 1), position: j + 1, done: false };
  }
  const end = input.indexOf('>', j);
  if (end === -1) return { output: '', position: i, done: true, earlyBreak: true };
  const tag = input.slice(i, end + 1);
  if (kind === 'thinking') {
    const id = extractAttribute(tag, 'id');
    state.insideThinking = true;
    const current = { id: id || `thinking-${Date.now()}`, content: '' } satisfies ThinkingData;
    state.currentThinking = current;
    opts.callbacks?.onThinkingOpen?.({ messageId, ...current });
    return { output: '', position: end + 1, done: false };
  }
  if (kind === 'thinkingArtifact') {
    const title = extractAttribute(tag, 'title') as string;
    const id = extractAttribute(tag, 'id') as string;
    if (!title) logger.warn('Thinking artifact title missing');
    if (!id) logger.warn('Thinking artifact id missing');
    state.insideThinkingArtifact = true;
    const current = { id, title, type: 'thinking' as const, steps: [], content: '' } satisfies ThinkingArtifactData;
    state.currentThinkingArtifact = current;
    opts.callbacks?.onThinkingArtifactOpen?.({ messageId, ...current });
    const factory = opts.thinkingArtifactElement ?? createThinkingArtifactElement;
    return { output: factory({ messageId }), position: end + 1, done: false };
  }
  const title = extractAttribute(tag, 'title') as string;
  const type = extractAttribute(tag, 'type') as string;
  const id = extractAttribute(tag, 'id') as string;
  if (!title) logger.warn('Artifact title missing');
  if (!id) logger.warn('Artifact id missing');
  state.insideArtifact = true;
  const current = { id, title, type } satisfies FlowstarterArtifactData;
  state.currentArtifact = current;
  opts.callbacks?.onArtifactOpen?.({ messageId, ...current });
  const factory = opts.artifactElement ?? createArtifactElement;
  return { output: factory({ messageId }), position: end + 1, done: false };
}

export function handleThinkingContent(
  input: string, state: MessageState, opts: StreamingMessageParserOptions,
  messageId: string, i: number,
): ParseResult {
  const closeIdx = input.indexOf(THINKING_TAG_CLOSE, i);
  if (closeIdx !== -1) {
    if (state.currentThinking) {
      state.currentThinking.content += input.slice(i, closeIdx);
      const output = `<div class="__flowstarterThinking__" data-message-id="${messageId}">${state.currentThinking.content}</div>`;
      opts.callbacks?.onThinkingClose?.({ messageId, ...state.currentThinking });
      state.insideThinking = false;
      state.currentThinking = undefined;
      return { output, position: closeIdx + THINKING_TAG_CLOSE.length, done: false };
    }
    return { output: input[i], position: i + 1, done: false };
  }
  if (state.insideThinkingArtifact) {
    const taCloseIdx = input.indexOf(THINKING_ARTIFACT_TAG_CLOSE, i);
    if (taCloseIdx !== -1) {
      if (state.currentThinkingArtifact) state.currentThinkingArtifact.content += input.slice(i, taCloseIdx);
      return { output: '', position: taCloseIdx, done: false };
    }
    if (state.currentThinkingArtifact) state.currentThinkingArtifact.content += input.slice(i);
    return { output: '', position: i, done: true };
  }
  if (state.currentThinking) state.currentThinking.content += input.slice(i);
  return { output: '', position: i, done: true };
}
