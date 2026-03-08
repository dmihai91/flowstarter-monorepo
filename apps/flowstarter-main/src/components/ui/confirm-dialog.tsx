'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ButtonVariant } from '@flowstarter/flow-design-system';
import * as React from 'react';

export function ConfirmDialog({
  open,
  onOpenChangeAction,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirmAction,
  confirmVariant = 'destructive',
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel: React.ReactNode;
  cancelLabel: React.ReactNode;
  onConfirmAction: () => void;
  confirmVariant?: ButtonVariant;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent className="sm:max-w-[520px]">
        <AlertDialogHeader className="mb-1.5">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-1 py-4 border-gray-400/30 dark:border-gray-600/30">
          <AlertDialogCancel className="w-full sm:w-32 h-10 mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            onClick={onConfirmAction}
            className="w-full sm:w-32 h-10"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
