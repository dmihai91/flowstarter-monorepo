import type { InitialChatState } from '~/components/editor/editor-chat/types';

const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1']);
const READY_SHELL_PROJECT_ID = 'p123456789mockready';

type MockEditorShellMode = 'build' | 'ready';

function isMockEditorShellMode(value: string | null): value is MockEditorShellMode {
  return value === 'build' || value === 'ready';
}

function createBaseState(conversationId: string): InitialChatState {
  return {
    step: 'creating',
    projectDescription: 'Build a premium consulting site with a clear CTA and trust-driven sections.',
    selectedTemplateId: 'mock-template',
    selectedTemplateName: 'Mock Template',
    selectedPalette: {
      id: 'mock-palette',
      name: 'Mock Palette',
      colors: ['#0f172a', '#1d4ed8', '#f59e0b', '#f8fafc', '#111827'],
    },
    selectedFont: {
      id: 'mock-font',
      name: 'Mock Font',
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    projectUrlId: 'mock-site',
    buildPhase: 'idle',
    projectName: 'Mock Editor Project',
    businessInfo: {
      description: 'Strategic consulting for founders who need sharper positioning and faster launches.',
      quickProfile: {
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'professional',
      },
      targetAudience: 'Startup founders and small business operators',
      uvp: 'Clear positioning and launch support without agency bloat',
      industry: 'consulting',
    },
    integrations: [],
    messages: [],
    conversationId,
    convexProjectId: null,
  };
}

export function resolveMockEditorShellState(
  hostname: string,
  searchParams: URLSearchParams,
  conversationId: string,
): { initialState: InitialChatState; disablePreviewAutoStart: boolean; isMockShell: true } | null {
  if (!LOCALHOST_NAMES.has(hostname)) {
    return null;
  }

  const shell = searchParams.get('e2eShell');

  if (!isMockEditorShellMode(shell)) {
    return null;
  }

  const baseState = createBaseState(conversationId);

  if (shell === 'build') {
    return {
      initialState: baseState,
      disablePreviewAutoStart: true,
      isMockShell: true,
    };
  }

  return {
    initialState: {
      ...baseState,
      step: 'ready',
      convexProjectId: READY_SHELL_PROJECT_ID,
      messages: [
        {
          id: 'assistant-ready-message',
          role: 'assistant',
          content: 'Your site is ready. Tell me what you want to change next.',
          createdAt: Date.now(),
        },
      ],
    },
    disablePreviewAutoStart: true,
    isMockShell: true,
  };
}
