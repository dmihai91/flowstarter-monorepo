// Re-export all message components from the new modular structure
export {
  EditorUserMessage,
  EditorAssistantMessage,
  EditorMessageWrapper,
  MessageAvatar,
  MessageBubble,
  MessageTimestamp,
  MessageContent,
  StreamingIndicator,
  useMessageStyles,
  useBubbleStyles,
  formatDateTime,
} from './editor-message';

export type { MessageStyleConfig, MessageStyles, BubbleStyleConfig, BubbleStyles } from './editor-message';
