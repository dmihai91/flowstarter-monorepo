/**
 * useMessagePagination Hook
 *
 * Provides infinite scrolling for conversation messages.
 * Loads the most recent messages first, then fetches older batches
 * when the user scrolls to the top of the chat container.
 *
 * Uses Convex's getMessages query with offset/limit for pagination
 * and getMessageCount for total count tracking.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';

export interface PaginatedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  component?: string;
  metadata?: string;
}

interface UseMessagePaginationProps {
  conversationId: Id<'conversations'> | null;
  /** Number of messages to load per batch. Default: 30 */
  pageSize?: number;
  /** Whether pagination is enabled. When false, returns empty state. */
  enabled?: boolean;
}

interface UseMessagePaginationReturn {
  /** All loaded messages (oldest first) */
  messages: PaginatedMessage[];
  /** Whether there are older messages to load */
  hasMore: boolean;
  /** Whether we're currently loading more messages */
  isLoadingMore: boolean;
  /** Total message count in the conversation */
  totalCount: number;
  /** Call this when user scrolls to the top to load more */
  loadMoreMessages: () => void;
  /** Ref to attach to the scroll container div */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  /** Whether initial messages have loaded */
  isInitialLoad: boolean;
}

export function useMessagePagination({
  conversationId,
  pageSize = 30,
  enabled = true,
}: UseMessagePaginationProps): UseMessagePaginationReturn {
  // How many messages we've loaded so far (from the end)
  const [loadedCount, setLoadedCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null!);
  const prevScrollHeightRef = useRef<number>(0);
  const isRestoringScrollRef = useRef(false);

  // Query total message count
  const totalCount = useQuery(
    api.conversations.getMessageCount,
    conversationId && enabled ? { conversationId } : 'skip',
  );

  // Query messages with current pagination window
  // We request the last `loadedCount` messages (offset=0 means from the end)
  const rawMessages = useQuery(
    api.conversations.getMessages,
    conversationId && enabled
      ? {
          conversationId,
          limit: loadedCount,
          offset: 0,
        }
      : 'skip',
  );

  // Transform to our format
  const messages: PaginatedMessage[] = (rawMessages || []).map((m, i) => ({
    id: m.id || `page-${i}-${Date.now()}`,
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    timestamp: m.createdAt,
    component: m.component,
    metadata: m.metadata,
  }));

  const hasMore = totalCount !== undefined && totalCount !== null && messages.length < totalCount;
  const isInitialLoad = rawMessages === undefined;

  // Load more messages (older ones)
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || isLoadingMore || !totalCount) return;

    setIsLoadingMore(true);

    // Save current scroll height before new messages are prepended
    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      isRestoringScrollRef.current = true;
    }

    // Increase the window to load more messages
    setLoadedCount((prev) => Math.min(prev + pageSize, totalCount));
  }, [hasMore, isLoadingMore, totalCount, pageSize]);

  // Restore scroll position after new messages are prepended
  useEffect(() => {
    if (isRestoringScrollRef.current && scrollContainerRef.current && rawMessages) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;

      if (heightDiff > 0) {
        container.scrollTop = heightDiff;
      }

      isRestoringScrollRef.current = false;
      setIsLoadingMore(false);
    }
  }, [rawMessages]);

  // Scroll detection — load more when user scrolls near the top
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !enabled) return;

    const handleScroll = () => {
      // When scrolled within 100px of the top and we have more to load
      if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enabled, hasMore, isLoadingMore, loadMoreMessages]);

  // Reset pagination when conversation changes
  useEffect(() => {
    setLoadedCount(pageSize);
    setIsLoadingMore(false);
  }, [conversationId, pageSize]);

  return {
    messages,
    hasMore,
    isLoadingMore,
    totalCount: totalCount ?? 0,
    loadMoreMessages,
    scrollContainerRef,
    isInitialLoad,
  };
}

