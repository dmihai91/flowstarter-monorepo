'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

// Editor URL - configure in environment
const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export function NewProjectMenuContent() {
  const { t } = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenEditor = async () => {
    setIsLoading(true);
    try {
      // Create a handoff to the editor with interactive mode
      const response = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'interactive',
          projectConfig: {
            name: '',
            description: '',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to editor with handoff token
        window.location.href = data.editorUrl;
      } else {
        console.error('Failed to create handoff');
        // Fallback to editor without token
        window.location.href = EDITOR_URL;
      }
    } catch (error) {
      console.error('Handoff error:', error);
      // Fallback to editor without token
      window.location.href = EDITOR_URL;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleOpenEditor}
      disabled={isLoading}
      className="flex items-start gap-3 p-4 cursor-pointer"
    >
      <MessageCircle className="h-5 w-5 text-[var(--purple)] mt-0.5" />
      <div className="flex-1 cursor-pointer">
        <div className="font-semibold text-sm mb-1">
          {t('newProject.dropdown.interactive.title')}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {t('newProject.dropdown.interactive.description')}
        </div>
      </div>
    </DropdownMenuItem>
  );
}
