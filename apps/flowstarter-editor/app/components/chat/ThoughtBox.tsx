import { useState, type PropsWithChildren } from 'react';

const ThoughtBox = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        thought-box
        border border-flowstarter-elements-artifacts-borderColor 
        bg-flowstarter-elements-artifacts-background
        rounded-xl 
        shadow-sm
        overflow-hidden
        transition-all 
        duration-300
        ${isExpanded ? 'ring-1 ring-flowstarter-elements-borderColorActive' : ''}
      `}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-flowstarter-elements-artifacts-backgroundHover transition-colors"
      >
        <div
          className={`p-1.5 rounded-md ${isExpanded ? 'bg-flowstarter-elements-button-primary-background text-flowstarter-elements-button-primary-text' : 'bg-flowstarter-elements-artifacts-inlineCode-background text-flowstarter-elements-textSecondary'}`}
        >
          <div className="i-ph:brain-thin text-lg" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-flowstarter-elements-textPrimary">{title}</div>
          {!isExpanded && (
            <div className="text-xs text-flowstarter-elements-textTertiary mt-0.5">Click to view reasoning</div>
          )}
        </div>
        <div
          className={`text-flowstarter-elements-textTertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <div className="i-ph:caret-down-bold" />
        </div>
      </button>

      <div
        className={`
          transition-all 
          duration-300
          ease-out
          overflow-hidden
          ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-flowstarter-elements-artifacts-borderColor' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="p-4 text-sm text-flowstarter-elements-textSecondary bg-flowstarter-elements-actions-background leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ThoughtBox;
