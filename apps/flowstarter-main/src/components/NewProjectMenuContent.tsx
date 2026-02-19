'use client';

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';
import { useTranslations } from '@/lib/i18n';
import { Edit3, Layout, MessageCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

// Editor URL - configure in environment
const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export function NewProjectMenuContent() {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleInteractiveChat = async () => {
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

  const handleQuickForm = () => {
    router.push('/dashboard/new?mode=scratch&fresh=true');
  };

  const handleBrowseTemplates = () => {
    router.push('/dashboard/new?path=gallery');
  };

  const handleStartWithAI = () => {
    // If on dashboard, scroll to the assistant section
    if (pathname === '/dashboard') {
      const assistantElement = document.getElementById('flowstarter-assistant');
      if (assistantElement) {
        assistantElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    } else {
      // Otherwise, navigate to dashboard first
      router.push('/dashboard#flowstarter-assistant');
    }
  };

  return (
    <>
      <DropdownMenuItem
        onClick={handleInteractiveChat}
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
      <DropdownMenuItem
        onClick={handleQuickForm}
        className="flex items-start gap-3 p-4 cursor-pointer"
      >
        <Edit3 className="h-5 w-5 text-[var(--green)] mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm mb-1">
            {t('newProject.dropdown.quickForm.title')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {t('newProject.dropdown.quickForm.description')}
          </div>
        </div>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem
        onClick={handleBrowseTemplates}
        className="flex items-start gap-3 p-4 cursor-pointer"
      >
        <Layout className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm mb-1">
            {t('newProject.dropdown.template.title')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {t('newProject.dropdown.template.description')}
          </div>
        </div>
      </DropdownMenuItem>
    </>
  );
}
