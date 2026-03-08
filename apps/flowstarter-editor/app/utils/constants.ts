import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'flowstarter_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-sonnet-4-6';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

export const TOOL_EXECUTION_APPROVAL = {
  APPROVE: 'tool_execution_approved',
  REJECT: 'tool_execution_rejected',
};
export const TOOL_EXECUTION_DENIED = 'tool_execution_denied';
export const TOOL_EXECUTION_ERROR = 'tool_execution_error';
export const TOOL_NO_EXECUTE_FUNCTION = 'tool_no_execute_function';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Next.js',
    label: 'Next.js',
    description: 'Next.js shadcn starter template using the App Router for building modern React applications',
    githubRepo: 'flowstarter/nextjs-starter',
    icon: 'i-flowstarter:nextjs',
  },
  {
    name: 'Expo',
    label: 'Expo',
    description: 'Expo starter template for building cross-platform mobile apps with native code access',
    githubRepo: 'flowstarter/expo-starter',
    icon: 'i-flowstarter:expo',
  },
  {
    name: 'shadcn/ui Vite React',
    label: 'Vite + React + shadcn/ui',
    description: 'Vite React starter with shadcn/ui components for fast development',
    githubRepo: 'flowstarter/vite-shadcn',
    icon: 'i-flowstarter:shadcn',
  },
  {
    name: 'Astro',
    label: 'Astro',
    description: 'Astro starter template for building fast, content-focused websites',
    githubRepo: 'flowstarter/astro-starter',
    icon: 'i-flowstarter:astro',
  },
  {
    name: 'Typescript',
    label: 'Typescript',
    description: 'Typescript starter template for building fast, efficient web applications',
    githubRepo: 'flowstarter/typescript-starter',
    icon: 'i-flowstarter:typescript',
  },
  {
    name: 'Vite React TS',
    label: 'Vite + React + TypeScript',
    description: 'Vite React TypeScript starter for fast development experience',
    githubRepo: 'flowstarter/vite-react-ts-starter',
    icon: 'i-flowstarter:vite',
  },
  {
    name: 'Angular',
    label: 'Angular',
    description: 'Modern Angular starter with standalone components and TypeScript',
    githubRepo: 'flowstarter/angular-starter',
    icon: 'i-flowstarter:angular',
  },
  {
    name: 'Qwik',
    label: 'Qwik',
    description: 'Modern Qwik starter with standalone components and TypeScript',
    githubRepo: 'flowstarter/qwik-starter',
    icon: 'i-flowstarter:qwik',
  },
];

