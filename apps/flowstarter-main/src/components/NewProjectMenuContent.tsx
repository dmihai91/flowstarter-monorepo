'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import { MessageCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// Editor URL - configure in environment
const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export function NewProjectMenuContent() {
  const { t } = useTranslations();

  const handoffMutation = useMutation({
    mutationFn: async () => {
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
        return data as { editorUrl: string };
      }
      throw new Error('Failed to create handoff');
    },
    onSuccess: (data) => {
      window.location.href = data.editorUrl;
    },
    onError: () => {
      // Fallback to editor without token
      window.location.href = EDITOR_URL;
    },
  });

  return (
    <DropdownMenuItem
      onClick={() => handoffMutation.mutate()}
      disabled={handoffMutation.isPending}
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
