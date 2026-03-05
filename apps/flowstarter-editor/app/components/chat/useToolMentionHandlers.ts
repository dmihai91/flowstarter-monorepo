/**
 * Hook for tool/file mention insertion in the chat textarea.
 * Extracted from Chatbox.tsx for SRP compliance.
 */

import type React from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { useToolMentionAutocomplete } from '~/lib/hooks/useToolMentionAutocomplete';
import { insertToolMention, insertFileReference } from '~/utils/toolMentionParser';

interface UseToolMentionHandlersOptions {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null> | undefined;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function useToolMentionHandlers({ input, textareaRef, handleInputChange }: UseToolMentionHandlersOptions) {
  const files = useStore(workbenchStore.files);

  const applyTextInsertion = (newText: string, newCursorPos: number) => {
    if (!textareaRef?.current || !handleInputChange) {
      return;
    }

    const textarea = textareaRef.current;
    textarea.value = newText;

    const syntheticEvent = {
      target: textarea,
      currentTarget: textarea,
    } as React.ChangeEvent<HTMLTextAreaElement>;

    handleInputChange(syntheticEvent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleToolSelected = (toolName: string) => {
    if (!textareaRef?.current) {
      return;
    }

    const currentCursor = textareaRef.current.selectionStart || 0;
    const { newText, newCursorPos } = insertToolMention(input, currentCursor, toolName);
    applyTextInsertion(newText, newCursorPos);
  };

  const handleFileSelected = (filePath: string) => {
    if (!textareaRef?.current) {
      return;
    }

    const currentCursor = textareaRef.current.selectionStart || 0;
    const { newText, newCursorPos } = insertFileReference(input, currentCursor, filePath);
    applyTextInsertion(newText, newCursorPos);
  };

  const autocomplete = useToolMentionAutocomplete({
    input,
    textareaRef,
    onToolSelected: handleToolSelected,
    onFileSelected: handleFileSelected,
    files,
  });

  return { autocomplete, files };
}
