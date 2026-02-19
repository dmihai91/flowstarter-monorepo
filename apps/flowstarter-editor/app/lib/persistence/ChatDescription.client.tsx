import { useStore } from '@nanostores/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import WithTooltip from '~/components/ui/Tooltip';
import { useEditChatDescription } from '~/lib/hooks';
import { description as descriptionStore } from '~/lib/persistence';

export function ChatDescription() {
  const initialDescription = useStore(descriptionStore)!;

  const { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode } =
    useEditChatDescription({
      initialDescription,
      syncWithGlobalStore: true,
    });

  if (!initialDescription) {
    // doing this to prevent showing edit button until chat description is set
    return null;
  }

  return (
    <div className="flex items-center max-w-full overflow-hidden">
      {editing ? (
        <form onSubmit={handleSubmit} className="flex items-center max-w-full overflow-hidden">
          <input
            type="text"
            className="bg-flowstarter-elements-background-depth-1 text-flowstarter-elements-textPrimary rounded px-2 mr-2 min-w-0 w-[120px] sm:w-[180px] md:w-auto md:flex-1"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <TooltipProvider>
            <WithTooltip tooltip="Save title">
              <div className="flex shrink-0 justify-between items-center p-2 rounded-md bg-flowstarter-elements-item-backgroundAccent">
                <button
                  type="submit"
                  className="i-ph:check-bold scale-110 hover:text-flowstarter-elements-item-contentAccent"
                  onMouseDown={handleSubmit}
                />
              </div>
            </WithTooltip>
          </TooltipProvider>
        </form>
      ) : (
        <>
          {currentDescription}
          <TooltipProvider>
            <WithTooltip tooltip="Rename chat">
              <div className="flex justify-between items-center p-2 rounded-md bg-flowstarter-elements-item-backgroundAccent ml-2">
                <button
                  type="button"
                  className="i-ph:pencil-fill scale-110 hover:text-flowstarter-elements-item-contentAccent"
                  onClick={(event) => {
                    event.preventDefault();
                    toggleEditMode();
                  }}
                />
              </div>
            </WithTooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
