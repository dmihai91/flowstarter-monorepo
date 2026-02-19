'use client';
import { CustomUserButton } from '@/components/CustomUserButton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTranslations } from '@/lib/i18n';
import { Check } from 'lucide-react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { WizardNavbarState } from './hooks';
import { WizardMobileDropdown } from './MobileActionsDropdown';

interface WizardNavControlsProps {
  isCompact: boolean;
  wizardState: WizardNavbarState;
}

function DraftIndicator({
  projectName,
  templateName,
  showTemplateName,
  autosaveElement,
}: {
  projectName: string;
  templateName: string | undefined;
  showTemplateName: boolean;
  autosaveElement?: React.ReactNode;
}) {
  return (
    <div className="hidden lg:flex items-center gap-3">
      {projectName?.trim() && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-medium text-foreground">
            {projectName.trim()}
          </span>
        </div>
      )}
      {showTemplateName && templateName && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">•</span>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{
              backgroundColor: 'var(--purple-bg)',
              border: '1px solid var(--purple)',
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              style={{ color: 'var(--purple)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--purple)' }}
            >
              {templateName}
            </span>
          </div>
        </div>
      )}
      {autosaveElement && (
        <span className="text-xs text-muted-foreground">{autosaveElement}</span>
      )}
    </div>
  );
}

function WizardActionButtons({
  onCancel,
  onPublish,
  canPublish,
}: {
  onCancel: () => void;
  onPublish?: () => void;
  canPublish?: boolean;
}) {
  const { t } = useTranslations();

  return (
    <div className="hidden sm:flex items-center gap-4">
      <button
        className="flex items-center justify-center rounded-xl border-2 dark:border-white border-gray-900 transition-all duration-200 dark:hover:bg-white/10 hover:bg-gray-100 active:scale-95"
        style={{
          padding: '8px 16px',
          gap: '6px',
        }}
        onClick={onCancel}
        type="button"
      >
        <div
          className="relative shrink-0 flex"
          style={{ width: '16px', height: '16px', gap: '8px' }}
        >
          <NextImage
            src="/assets/icons/close.svg"
            alt="Cancel"
            width={16}
            height={16}
            className="w-full h-full dark:brightness-0 dark:invert brightness-0"
          />
        </div>
        <span className="font-medium leading-normal not-italic dark:text-white text-gray-900">
          {t('app.cancel')}
        </span>
      </button>
      <button
        className="flex items-center justify-center rounded-xl transition-all duration-200 dark:bg-white bg-gray-900 text-white dark:hover:bg-gray-100 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:dark:hover:bg-white gap-4"
        style={{
          padding: '10px 16px',
        }}
        onClick={() => onPublish?.()}
        disabled={!onPublish || !canPublish}
        type="button"
      >
        <div className="relative shrink-0 w-5 h-5">
          <Check className="dark:text-[#1b1b25] text-white" />
        </div>
        <span className="font-medium leading-normal dark:text-[#1b1b25] text-white">
          {t('app.publish')}
        </span>
      </button>
    </div>
  );
}

export function WizardNavControls({
  isCompact,
  wizardState,
}: WizardNavControlsProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const {
    projectName,
    templateName,
    showTemplateName,
    wizardActions,
    setIsDiscarding,
  } = wizardState;

  const handleCancel = () => setIsCancelDialogOpen(true);

  const handleConfirmCancel = () => {
    setIsCancelDialogOpen(false);
    // Set discarding state immediately to show loading screen
    setIsDiscarding(true);
    queueMicrotask(() => {
      if (wizardActions?.onCancel) {
        wizardActions.onCancel();
      } else {
        router.push('/dashboard');
      }
    });
  };

  return (
    <nav
      className={`flex items-center py-2 ${
        isCompact ? 'gap-3 md:gap-4' : 'gap-3 sm:gap-5 md:gap-6'
      } min-w-0 overflow-x-auto no-scrollbar snap-x pl-2 pr-2 sm:pl-0`}
    >
      {/* Draft editing indicator + Autosave status - hide on review step */}
      {!isCompact && !showTemplateName && (
        <DraftIndicator
          projectName={projectName}
          templateName={templateName}
          showTemplateName={showTemplateName}
          autosaveElement={wizardActions?.autosaveElement}
        />
      )}

      {/* Mobile actions dropdown */}
      <WizardMobileDropdown
        onCancel={handleCancel}
        onPublish={wizardActions?.onPublish}
        canPublish={wizardActions?.canPublish}
      />

      {/* Show Cancel/Publish buttons on all steps including review */}
      <WizardActionButtons
        onCancel={handleCancel}
        onPublish={wizardActions?.onPublish}
        canPublish={wizardActions?.canPublish}
      />

      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChangeAction={setIsCancelDialogOpen}
        title={t('draft.discardProgressTitle')}
        description={t('draft.discardProgressDesc')}
        cancelLabel={t('app.keepEditing')}
        confirmLabel={t('app.discardDraft')}
        confirmVariant="destructive"
        onConfirmAction={handleConfirmCancel}
      />

      {!isCompact && (
        <div className="hidden sm:block h-6 w-px bg-border mx-1" />
      )}

      <ThemeToggle className="hidden sm:inline-flex h-9" />
      {/* Profile button - show on mobile too */}
      <CustomUserButton />
    </nav>
  );
}
