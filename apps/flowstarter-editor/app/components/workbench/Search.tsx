import { useState } from 'react';

/**
 * Search component - currently disabled in Daytona mode
 *
 * Text search is not yet implemented for Daytona cloud sandboxes.
 * This component shows a placeholder message directing users to alternative search methods.
 */

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-flowstarter-elements-background-depth-2">
      {/* Search Bar */}
      <div className="flex items-center py-3 px-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full px-2 py-1 rounded-md bg-flowstarter-elements-background-depth-3 text-flowstarter-elements-textPrimary placeholder-flowstarter-elements-textTertiary focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Results - Search not available in Daytona mode */}
      <div className="flex-1 overflow-auto py-2">
        <div className="flex flex-col items-center justify-center h-32 text-flowstarter-elements-textTertiary px-4 text-center">
          <div className="i-ph:magnifying-glass text-2xl mb-2 opacity-50" />
          <p className="text-sm">Search is not available in cloud sandbox mode.</p>
          <p className="text-xs mt-1 opacity-75">Use your editor's search or Ctrl+F in the file view.</p>
        </div>
      </div>
    </div>
  );
}
