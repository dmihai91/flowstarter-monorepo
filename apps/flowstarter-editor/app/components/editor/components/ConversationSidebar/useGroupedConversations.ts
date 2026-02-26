import { useMemo } from 'react';
import type { Conversation } from '~/lib/hooks/useConversations';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import type { ConversationGroup } from './types';

export function useGroupedConversations(conversations: Conversation[]): ConversationGroup[] {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;

    const groups: ConversationGroup[] = [
      { label: t(EDITOR_LABEL_KEYS.TIME_TODAY), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_YESTERDAY), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_PREVIOUS_7_DAYS), conversations: [] },
      { label: t(EDITOR_LABEL_KEYS.TIME_OLDER), conversations: [] },
    ];

    for (const conv of conversations) {
      if (conv.updatedAt >= today) {
        groups[0].conversations.push(conv);
      } else if (conv.updatedAt >= yesterday) {
        groups[1].conversations.push(conv);
      } else if (conv.updatedAt >= weekAgo) {
        groups[2].conversations.push(conv);
      } else {
        groups[3].conversations.push(conv);
      }
    }

    return groups.filter((g) => g.conversations.length > 0);
  }, [conversations]);
}
