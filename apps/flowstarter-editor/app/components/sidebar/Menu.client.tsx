import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DialogRoot } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { Button } from '~/components/ui/Button';
import { useChatHistory } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { useChatManagement } from './useChatManagement';
import { MenuDialogs } from './MenuDialogs';

const menuVariants = {
  closed: { opacity: 0, visibility: 'hidden', left: '-340px', transition: { duration: 0.2, ease: cubicEasingFn } },
  open: { opacity: 1, visibility: 'initial', left: 0, transition: { duration: 0.2, ease: cubicEasingFn } },
} satisfies Variants;

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-white/10 dark:border-white/5">
      <div className="h-4 w-4 i-ph:clock opacity-80" />
      <div className="flex gap-2">
        <span>{dateTime.toLocaleDateString()}</span>
        <span>{dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

export const Menu = () => {
  const { duplicateCurrentChat, exportChat } = useChatHistory();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profile = useStore(profileStore);

  const {
    list, loadEntries, dialogContent, closeDialog,
    selectionMode, toggleSelectionMode,
    selectedItems, toggleItemSelection, handleBulkDeleteClick,
    deleteItem, deleteSelectedItems,
    setDialogContentWithLogging,
  } = useChatManagement();

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const selectAll = useCallback(() => {
    const allFilteredIds = filteredList.map((item) => item.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      // Handled via toggle - would need setter exposed, keeping simple
      filteredList.forEach((item) => toggleItemSelection(item.id));
    } else {
      filteredList.filter((item) => !selectedItems.includes(item.id)).forEach((item) => toggleItemSelection(item.id));
    }
  }, [filteredList, selectedItems, toggleItemSelection]);

  useEffect(() => {
    if (open) { loadEntries(); }
  }, [open, loadEntries]);

  useEffect(() => {
    if (!open && selectionMode) {
      console.log('Sidebar closed, preserving selection state');
    }
  }, [open, selectionMode]);

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (isSettingsOpen) { return; }
      if (event.pageX < enterThreshold) { setOpen(true); }
      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) { setOpen(false); }
    }

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [isSettingsOpen]);

  const handleDuplicate = async (id: string) => {
    await duplicateCurrentChat(id);
    loadEntries();
  };

  const handleSettingsClick = () => { setIsSettingsOpen(true); setOpen(false); };
  const handleSettingsClose = () => setIsSettingsOpen(false);

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '300px' }}
        className={classNames(
          'flex selection-accent flex-col side-menu fixed top-0 left-0 h-full',
          'bg-white/50 dark:bg-[#12121a]/50 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/60 dark:border-white/10',
          'shadow-[2px_0_24px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_24px_rgba(0,0,0,0.3)] text-sm',
          isSettingsOpen ? 'z-40' : 'z-sidebar',
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/[0.03]">
          <div className="text-gray-900 dark:text-white font-medium"></div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {profile?.username || 'Guest User'}
            </span>
            <div className="flex items-center justify-center w-[32px] h-[32px] overflow-hidden bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-500 rounded-full shrink-0">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile?.username || 'User'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <div className="i-ph:user-fill text-lg" />
              )}
            </div>
          </div>
        </div>
        <CurrentDateTime />
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <a
                href="/"
                className="flex-1 flex gap-2 items-center bg-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-500/20 dark:to-blue-500/20 text-purple-700 dark:text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 dark:hover:from-purple-500/30 dark:hover:to-blue-500/30 backdrop-blur-xl border border-purple-500/20 dark:border-purple-500/30 rounded-xl px-4 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="inline-block i-ph:plus-circle h-4 w-4" />
                <span className="text-sm font-medium">Start new project</span>
              </a>
              <button
                onClick={toggleSelectionMode}
                className={classNames(
                  'flex gap-1 items-center rounded-xl px-3 py-2.5 transition-all duration-200 backdrop-blur-xl',
                  selectionMode
                    ? 'bg-purple-500 text-white border border-purple-500/50 shadow-lg shadow-purple-500/25'
                    : 'bg-white/40 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 border border-white/30 dark:border-white/10',
                )}
                aria-label={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
              >
                <span className={selectionMode ? 'i-ph:x h-4 w-4' : 'i-ph:check-square h-4 w-4'} />
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <span className="i-ph:magnifying-glass h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                className="w-full bg-white/50 dark:bg-white/[0.06] backdrop-blur-xl relative pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-500/20 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-white/30 dark:border-white/10 transition-all duration-200"
                type="search"
                placeholder="Search chats..."
                onChange={handleSearchChange}
                aria-label="Search chats"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm px-4 py-2">
            <div className="font-medium text-gray-600 dark:text-gray-400">Your Chats</div>
            {selectionMode && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedItems.length === filteredList.length ? 'Deselect all' : 'Select all'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  disabled={selectedItems.length === 0}
                >
                  Delete selected
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-3 pb-3">
            {filteredList.length === 0 && (
              <div className="px-4 text-gray-500 dark:text-gray-400 text-sm">
                {list.length === 0 ? 'No previous conversations' : 'No matches found'}
              </div>
            )}
            <DialogRoot open={dialogContent !== null}>
              {binDates(filteredList).map(({ category, items }) => (
                <div key={category} className="mt-2 first:mt-0 space-y-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 z-1 bg-white/70 dark:bg-[#12121a]/70 backdrop-blur-xl px-4 py-1.5 rounded-lg">
                    {category}
                  </div>
                  <div className="space-y-0.5 pr-1">
                    {items.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        exportChat={exportChat}
                        onDelete={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDialogContentWithLogging({ type: 'delete', item });
                        }}
                        onDuplicate={() => handleDuplicate(item.id)}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.includes(item.id)}
                        onToggleSelection={toggleItemSelection}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <MenuDialogs
                dialogContent={dialogContent}
                selectedItems={selectedItems}
                onClose={closeDialog}
                onDeleteItem={deleteItem}
                onDeleteSelected={deleteSelectedItems}
              />
            </DialogRoot>
          </div>
          <div className="flex items-center justify-between border-t border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/[0.03] px-4 py-3">
            <SettingsButton onClick={handleSettingsClick} />
            <ThemeSwitch />
          </div>
        </div>
      </motion.div>

    </>
  );
};
