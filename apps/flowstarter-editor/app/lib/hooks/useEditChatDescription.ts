/**
 * useEditChatDescription Hook
 *
 * Note: This is a stub. Chat descriptions are now managed via Convex.
 */

import { useState } from 'react';

export interface UseEditChatDescriptionReturn {
  editing: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  currentDescription: string;
  toggleEditMode: () => void;
}

export function useEditChatDescription({
  initialDescription = '',
  customChatId,
  syncWithGlobalStore = true,
}: {
  initialDescription?: string;
  customChatId?: string;
  syncWithGlobalStore?: boolean;
} = {}): UseEditChatDescriptionReturn {
  const [editing, setEditing] = useState(false);
  const [currentDescription, setCurrentDescription] = useState(initialDescription);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDescription(event.target.value);
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setEditing(false);
    console.log('Description update:', { customChatId, currentDescription, syncWithGlobalStore });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setEditing(false);
      setCurrentDescription(initialDescription);
    }
  };

  const toggleEditMode = () => {
    setEditing(!editing);
  };

  return {
    editing,
    handleChange,
    handleBlur,
    handleSubmit,
    handleKeyDown,
    currentDescription,
    toggleEditMode,
  };
}

export default useEditChatDescription;

