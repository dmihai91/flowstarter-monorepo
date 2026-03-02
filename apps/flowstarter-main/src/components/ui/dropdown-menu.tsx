'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  // Use non-modal dropdowns by default so they never trap pointer events
  // outside the menu (especially after theme switches/rerenders).
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn(
        // Remove focus ring styles for triggers
        'outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  hideArrow,
  align = 'center',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  hideArrow?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'glass-3d bg-white/30 dark:bg-[var(--surface-2)]/30 backdrop-blur-xl text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-[200] max-h-(--radix-dropdown-menu-content-available-height) min-w-40 origin-(--radix-dropdown-menu-content-transform-origin) overflow-visible rounded-xl md:rounded-xl border border-white/60 dark:border-white/15 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]',
          className
        )}
        {...props}
      >
        {!hideArrow && (
          <div
            className={cn(
              'absolute -top-[6px] w-3 h-3 rotate-45 rounded-tl-[2px]',
              'bg-white/70 dark:bg-[rgba(40,40,55,0.65)] backdrop-blur-2xl border-l border-t border-white/50 dark:border-white/[0.12]',
              align === 'end' && 'right-3.5',
              align === 'start' && 'left-3.5',
              align === 'center' && 'left-1/2 -translate-x-1/2'
            )}
          />
        )}
        {props.children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-hidden select-none transition-colors cursor-pointer',
        'focus:bg-gray-200 dark:focus:bg-white/30 focus:text-gray-700 dark:focus:text-white',
        '[@media(hover:hover)]:hover:bg-gray-200 dark:[@media(hover:hover)]:hover:bg-white/30 [@media(hover:hover)]:hover:text-gray-700 dark:[@media(hover:hover)]:hover:text-white',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        'data-[variant=destructive]:text-red-600 dark:data-[variant=destructive]:text-red-400',
        'data-[variant=destructive]:focus:bg-red-100 dark:data-[variant=destructive]:focus:bg-red-500/20 data-[variant=destructive]:focus:text-red-700 dark:data-[variant=destructive]:focus:text-red-300',
        'data-[variant=destructive]:[@media(hover:hover)]:hover:bg-red-100 dark:data-[variant=destructive]:[@media(hover:hover)]:hover:bg-red-500/20 data-[variant=destructive]:[@media(hover:hover)]:hover:text-red-700 dark:data-[variant=destructive]:[@media(hover:hover)]:hover:text-red-300',
        'data-[variant=destructive]:[&_svg]:text-red-600! dark:data-[variant=destructive]:[&_svg]:text-red-400!',
        'data-[variant=destructive]:focus:[&_svg]:text-red-700! dark:data-[variant=destructive]:focus:[&_svg]:text-red-300!',
        'data-[variant=destructive]:[@media(hover:hover)]:hover:[&_svg]:text-red-700! dark:data-[variant=destructive]:[@media(hover:hover)]:hover:[&_svg]:text-red-300!',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        'data-inset:pl-8',
        className
      )}
      style={{ cursor: 'pointer' }}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-gray-200 dark:focus:bg-white/30 focus:text-gray-700 dark:focus:text-white [@media(hover:hover)]:hover:bg-gray-200 dark:[@media(hover:hover)]:hover:bg-white/30 [@media(hover:hover)]:hover:text-gray-700 dark:[@media(hover:hover)]:hover:text-white relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-colors",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-gray-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white [@media(hover:hover)]:hover:bg-gray-100 dark:[@media(hover:hover)]:hover:bg-white/10 [@media(hover:hover)]:hover:text-gray-700 dark:[@media(hover:hover)]:hover:text-white relative flex cursor-pointer items-center gap-2 rounded-md py-2 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-colors",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-2 py-1.5 text-sm font-medium data-inset:pl-8',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border dark:bg-gray-700 -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-normal opacity-60',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'focus:bg-gray-200 dark:focus:bg-white/30 focus:text-gray-700 dark:focus:text-white [@media(hover:hover)]:hover:bg-gray-200 dark:[@media(hover:hover)]:hover:bg-white/30 [@media(hover:hover)]:hover:text-gray-700 dark:[@media(hover:hover)]:hover:text-white data-[state=open]:bg-gray-200 dark:data-[state=open]:bg-white/30 data-[state=open]:text-gray-700 dark:data-[state=open]:text-white flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8 transition-colors',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-3 opacity-50" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'glass-3d bg-white/30 dark:bg-[var(--surface-2)]/30 backdrop-blur-xl text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 top-0 z-[200] min-w-40 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl md:rounded-xl border border-white/60 dark:border-white/15 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]',
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
