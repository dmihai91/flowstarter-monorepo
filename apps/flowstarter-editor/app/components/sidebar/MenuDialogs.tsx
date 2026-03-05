/**
 * Delete confirmation dialog content for single and bulk chat deletion.
 * Extracted from Menu.client.tsx for SRP compliance.
 */

import { Dialog, DialogButton, DialogDescription, DialogTitle } from '~/components/ui/Dialog';
import type { DialogContent } from './useChatManagement';
import type { ChatHistoryItem } from '~/lib/persistence';

interface MenuDialogsProps {
  dialogContent: DialogContent;
  selectedItems: string[];
  onClose: () => void;
  onDeleteItem: (event: React.UIEvent, item: ChatHistoryItem) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export function MenuDialogs({ dialogContent, selectedItems, onClose, onDeleteItem, onDeleteSelected }: MenuDialogsProps) {
  return (
    <Dialog onBackdrop={onClose} onClose={onClose}>
      {dialogContent?.type === 'delete' && (
        <>
          <div className="p-6">
            <DialogTitle className="text-gray-900 dark:text-white">Delete Chat?</DialogTitle>
            <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
              <p>
                You are about to delete{' '}
                <span className="font-medium text-gray-900 dark:text-white">{dialogContent.item.description}</span>
              </p>
              <p className="mt-2">Are you sure you want to delete this chat?</p>
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-white/50 dark:bg-white/[0.02] border-t border-white/20 dark:border-white/5">
            <DialogButton type="secondary" onClick={onClose}>Cancel</DialogButton>
            <DialogButton
              type="danger"
              onClick={(event) => {
                console.log('Dialog delete button clicked for item:', dialogContent.item);
                onDeleteItem(event, dialogContent.item);
                onClose();
              }}
            >
              Delete
            </DialogButton>
          </div>
        </>
      )}
      {dialogContent?.type === 'bulkDelete' && (
        <>
          <div className="p-6">
            <DialogTitle className="text-gray-900 dark:text-white">Delete Selected Chats?</DialogTitle>
            <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
              <p>
                You are about to delete {dialogContent.items.length}{' '}
                {dialogContent.items.length === 1 ? 'chat' : 'chats'}:
              </p>
              <div className="mt-2 max-h-32 overflow-auto border border-white/20 dark:border-white/10 rounded-xl bg-white/30 dark:bg-white/[0.03] p-3">
                <ul className="list-disc pl-5 space-y-1">
                  {dialogContent.items.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3">Are you sure you want to delete these chats?</p>
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-white/50 dark:bg-white/[0.02] border-t border-white/20 dark:border-white/5">
            <DialogButton type="secondary" onClick={onClose}>Cancel</DialogButton>
            <DialogButton
              type="danger"
              onClick={() => {
                const itemsToDeleteNow = [...selectedItems];
                console.log('Bulk delete confirmed for', itemsToDeleteNow.length, 'items', itemsToDeleteNow);
                onDeleteSelected(itemsToDeleteNow);
                onClose();
              }}
            >
              Delete
            </DialogButton>
          </div>
        </>
      )}
    </Dialog>
  );
}
