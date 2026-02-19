'use client';

import {
  DialogContent as BaseDialogContent,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import * as React from 'react';

export const AppDialog = Dialog;

export function AppDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialogContent>) {
  return (
    <BaseDialogContent
      className={cn(
        'rounded-2xl border-0',
        'bg-white dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl',
        'p-6',
        className
      )}
      {...props}
    />
  );
}

export function AppDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        'border-b border-(--border-subtle) dark:border-white/10 pb-3 mb-3',
        className
      )}
      {...props}
    />
  );
}
export const AppDialogTitle = DialogTitle;
export const AppDialogDescription = DialogDescription;
export function AppDialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        'border-t border-(--border-subtle) dark:border-white/10 p-3 mt-4',
        className
      )}
      {...props}
    >
      <div className="flex flex-col-reverse gap-6 sm:flex-row sm:justify-end">
        {children}
      </div>
    </DialogFooter>
  );
}
