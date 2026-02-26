import type { Conversation } from '~/lib/hooks/useConversations';
import type { Id } from '~/convex/_generated/dataModel';
import type { getColors } from '~/components/editor/hooks';

export interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  hasProject?: boolean;
  projectName?: string | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
  onSelect: () => void;
  onRename: (title: string) => void;
  onProjectNameChange?: (name: string) => void;
  onDelete: () => void | Promise<void>;
}

export interface ConversationSidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId?: Id<'conversations'>;
  isLoading?: boolean;
  onClose: () => void;
  onSelectConversation: (id: Id<'conversations'>) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: Id<'conversations'>, title: string) => void;
  onProjectNameChange?: (id: Id<'conversations'>, name: string) => void;
  onDeleteConversation: (id: Id<'conversations'>) => void | Promise<void>;
}

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}
