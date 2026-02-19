// Main message components
export { EditorUserMessage } from './EditorUserMessage';
export { EditorAssistantMessage } from './EditorAssistantMessage';
export { EditorMessageWrapper } from './EditorMessageWrapper';

// Reusable sub-components
export { MessageAvatar, MessageBubble, MessageTimestamp, MessageContent, StreamingIndicator } from './components';

// Hooks
export { useMessageStyles, useBubbleStyles } from './hooks';
export type { MessageStyleConfig, MessageStyles, BubbleStyleConfig, BubbleStyles } from './hooks';

// Utils
export { formatDateTime } from './utils/formatDateTime';

