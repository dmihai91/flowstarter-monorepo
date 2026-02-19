'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Dialog as BaseDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export interface ModalProps extends React.ComponentProps<typeof BaseDialog> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  footer?: React.ReactNode;
}

function Modal({
  children,
  title,
  description,
  contentClassName,
  headerClassName,
  footer,
  ...props
}: ModalProps) {
  return (
    <BaseDialog {...props}>
      <DialogContent className={cn('p-0', contentClassName)}>
        {(title || description) && (
          <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between">
            <DialogHeader className={cn('w-full', headerClassName)}>
              {title && (
                <DialogTitle className="text-lg font-semibold">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-sm">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
        )}

        <div className="px-6 py-6">{children}</div>

        {footer !== undefined && (
          <DialogFooter className="gap-4 p-6 pt-0">{footer}</DialogFooter>
        )}
      </DialogContent>
    </BaseDialog>
  );
}

Modal.Trigger = DialogTrigger;
Modal.Title = DialogTitle;
Modal.Description = DialogDescription;
Modal.Header = DialogHeader;
Modal.Footer = DialogFooter;
Modal.Close = DialogClose;

export { Modal };
