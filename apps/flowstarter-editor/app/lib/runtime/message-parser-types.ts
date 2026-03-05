/**
 * Types, constants, and element factories for StreamingMessageParser.
 */

import type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction } from '~/types/actions';
import type { FlowstarterArtifactData, ThinkingArtifactData } from '~/types/artifact';
import type { ThinkingData } from '~/types/thinking';

// Tag constants
export const ARTIFACT_TAG_OPEN = '<flowstarterArtifact';
export const ARTIFACT_TAG_CLOSE = '</flowstarterArtifact>';
export const ARTIFACT_ACTION_TAG_OPEN = '<flowstarterAction';
export const ARTIFACT_ACTION_TAG_CLOSE = '</flowstarterAction>';

// Legacy Flowstarter tags (backward compatibility)
export const FLOWSTARTER_ARTIFACT_TAG_OPEN = '<FlowstarterArtifact';
export const FLOWSTARTER_ARTIFACT_TAG_CLOSE = '</FlowstarterArtifact>';
export const FLOWSTARTER_ACTION_TAG_OPEN = '<FlowstarterAction';
export const FLOWSTARTER_ACTION_TAG_CLOSE = '</FlowstarterAction>';

// Thinking tags
export const THINKING_TAG_OPEN = '<flowstarterThinking';
export const THINKING_TAG_CLOSE = '</flowstarterThinking>';
export const THINKING_ARTIFACT_TAG_OPEN = '<thinkingArtifact';
export const THINKING_ARTIFACT_TAG_CLOSE = '</thinkingArtifact>';

export const MAX_FILE_CHUNK_SIZE = 1024 * 1024;

export const MAX_TAG_LENGTH = Math.max(
  ARTIFACT_TAG_OPEN.length,
  FLOWSTARTER_ARTIFACT_TAG_OPEN.length,
  THINKING_TAG_OPEN.length,
  THINKING_ARTIFACT_TAG_OPEN.length,
);

// Callback data types
export interface ArtifactCallbackData extends FlowstarterArtifactData {
  messageId: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

export interface ThinkingCallbackData extends ThinkingData {
  messageId: string;
}

export interface ThinkingArtifactCallbackData extends ThinkingArtifactData {
  messageId: string;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;
export type ThinkingCallback = (data: ThinkingCallbackData) => void;
export type ThinkingArtifactCallback = (data: ThinkingArtifactCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
  onThinkingOpen?: ThinkingCallback;
  onThinkingClose?: ThinkingCallback;
  onThinkingArtifactOpen?: ThinkingArtifactCallback;
  onThinkingArtifactClose?: ThinkingArtifactCallback;
}

interface ElementFactoryProps {
  messageId: string;
}

export type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
  thinkingArtifactElement?: ElementFactory;
}

export interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  insideThinking: boolean;
  insideThinkingArtifact: boolean;
  actionId: number;
  currentArtifact?: FlowstarterArtifactData;
  currentAction?: BoltActionData;
  currentThinking?: ThinkingData;
  currentThinkingArtifact?: ThinkingArtifactData;
}

// Re-export action types for the parser
export type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction };
export type { FlowstarterArtifactData, ThinkingArtifactData, ThinkingData };

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export const createArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__flowstarterArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];
  return `<div ${elementProps.join(' ')}></div>`;
};

export const createThinkingArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__thinkingArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];
  return `<div ${elementProps.join(' ')}></div>`;
};

export function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```[\w-]*\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = content.match(codeBlockRegex);
  if (match) return match[1].trim();

  const multilineCodeBlockRegex = /```[\w-]*\s*\n([\s\S]*?)```/g;
  let cleaned = content.replace(multilineCodeBlockRegex, (_match, code) => code.trim());

  const inlineCodeBlockRegex = /^```[\w-]*\s*\n?|```\s*$/gm;
  cleaned = cleaned.replace(inlineCodeBlockRegex, '');

  return cleaned.trim() !== content.trim() ? cleaned.trim() : content;
}

export function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
