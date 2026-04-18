export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export const MOCK_BUILD_CONVERSATION_ID = 'a123456789build';
export const MOCK_READY_CONVERSATION_ID = 'a123456789ready';
export const MOCK_READY_PROJECT_ID = 'p123456789mockready';

type MockEditorShellMode = 'build' | 'ready';

export function buildMockEditorShellUrl(shell: MockEditorShellMode): string {
  const conversationId = shell === 'build' ? MOCK_BUILD_CONVERSATION_ID : MOCK_READY_CONVERSATION_ID;
  return `${BASE_URL}/project/${conversationId}?handoff=test&e2eShell=${shell}`;
}

export function buildSSEStream(events: Array<{ event?: string; data: object }>): string {
  return events.map(({ event, data }) => `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`).join('');
}
