import { useRef, useEffect, useCallback, useState } from 'react';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { PROMPT_COOKIE_KEY } from '~/utils/constants';

export interface UseChatInputOptions {
  input: string;
  chatStarted: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export interface UseChatInputReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  scrollTextArea: () => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  imageDataList: string[];
  setImageDataList: React.Dispatch<React.SetStateAction<string[]>>;
  clearInputState: () => void;
}

const TEXTAREA_MIN_HEIGHT = 140;
const TEXTAREA_MAX_HEIGHT_STARTED = 500;
const TEXTAREA_MAX_HEIGHT_INITIAL = 400;

/**
 * Hook to manage chat input state and textarea behavior
 */
export function useChatInput({ input, chatStarted, handleInputChange }: UseChatInputOptions): UseChatInputReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageDataList, setImageDataList] = useState<string[]>([]);

  const TEXTAREA_MAX_HEIGHT = chatStarted ? TEXTAREA_MAX_HEIGHT_STARTED : TEXTAREA_MAX_HEIGHT_INITIAL;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';

      if (!input || input.trim() === '') {
        textarea.scrollTop = 0;
        textarea.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
        textarea.style.overflowY = 'hidden';
      } else {
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }
  }, [input, TEXTAREA_MAX_HEIGHT]);

  const scrollTextArea = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, []);

  /**
   * Debounced function to cache the prompt in cookies
   */
  const debouncedCachePrompt = useCallback(
    debounce((event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const trimmedValue = event.target.value.trim();
      Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
    }, 1000),
    [],
  );

  const onTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(event);
      debouncedCachePrompt(event);
    },
    [handleInputChange, debouncedCachePrompt],
  );

  const clearInputState = useCallback(() => {
    setUploadedFiles([]);
    setImageDataList([]);
    Cookies.remove(PROMPT_COOKIE_KEY);
    textareaRef.current?.blur();
  }, []);

  return {
    textareaRef,
    onTextareaChange,
    scrollTextArea,
    uploadedFiles,
    setUploadedFiles,
    imageDataList,
    setImageDataList,
    clearInputState,
  };
}
