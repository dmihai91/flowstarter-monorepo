import { memo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { IconButton } from '~/components/ui/IconButton';
import { PortDropdown } from './PortDropdown';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';
import type { PreviewInfo } from '~/lib/stores/previews';
import type { WindowSize } from '~/types/common';

interface PreviewHeaderProps {
  previews: PreviewInfo[];
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  displayPath: string;
  setDisplayPath: (path: string) => void;
  setIframeUrl: (url: string | undefined) => void;
  reloadPreview: () => void;
  setIsWindowSizeDropdownOpen: (open: boolean) => void;
  isWindowSizeDropdownOpen: boolean;
  openInNewTab: () => void;
  openInNewWindow: (size: WindowSize) => void;
  windowSizes: WindowSize[];
  selectedWindowSize: WindowSize;
  setSelectedWindowSize: (size: WindowSize) => void;
  showDeviceFrame: boolean;
  setShowDeviceFrame: (show: boolean) => void;
  isLandscape: boolean;
  setIsLandscape: (landscape: boolean) => void;
  setIsPushDialogOpen?: (open: boolean) => void;
}

export const PreviewHeader = memo(
  ({
    previews,
    activePreviewIndex,
    setActivePreviewIndex,
    displayPath,
    setDisplayPath,
    setIframeUrl: _setIframeUrl,
    reloadPreview,
    setIsWindowSizeDropdownOpen,
    isWindowSizeDropdownOpen,
    openInNewTab,
    openInNewWindow,
    windowSizes,
    selectedWindowSize,
    setSelectedWindowSize,
    showDeviceFrame,
    setShowDeviceFrame,
    isLandscape,
    setIsLandscape,
  }: PreviewHeaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);

    const activePreview = previews[activePreviewIndex];
    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    return (
      <div className="flex items-center justify-center gap-4 h-10 px-2 bg-flowstarter-elements-background-depth-2 border-b border-flowstarter-elements-borderColor">
        {/* Left: View Toggle Buttons */}
        <div className="flex items-center gap-1 bg-flowstarter-elements-background-depth-2 rounded-full p-0.5 border border-flowstarter-elements-borderColor">
          <IconButton
            icon="i-lucide:eye"
            className={classNames(
              'w-7 h-7 rounded-full transition-all icon-scale-90',
              activePreview
                ? 'bg-flowstarter-elements-item-backgroundAccent/10 text-flowstarter-elements-item-contentAccent'
                : 'bg-transparent text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary',
            )}
            title="Preview"
            onClick={() => setSelectedView('preview')}
          />
          <IconButton
            icon="i-lucide:code"
            className="w-7 h-7 rounded-full transition-all icon-scale-90 bg-transparent text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary"
            title="Code"
            onClick={() => setSelectedView('code')}
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <IconButton
                icon="i-lucide:settings"
                className="w-7 h-7 rounded-full transition-all icon-scale-90 bg-transparent text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary"
                title="More Options"
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="min-w-[240px] z-[999] bg-flowstarter-elements-background-depth-2 rounded-lg shadow-xl border border-flowstarter-elements-borderColor animate-in fade-in-0 zoom-in-95"
              sideOffset={5}
              align="start"
            >
              <DropdownMenu.Item
                className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-flowstarter-elements-textPrimary hover:bg-flowstarter-elements-item-backgroundActive gap-2 rounded-md group relative outline-none"
                onSelect={(e) => {
                  e.preventDefault();
                  reloadPreview();
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="i-lucide:rotate-cw text-current" />
                  <span>Reload Preview</span>
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {/* Center: Address Bar */}
        <div className="flex justify-center max-w-md w-full">
          <div className="w-full flex items-center gap-0 bg-flowstarter-elements-background-depth-2/50 backdrop-blur-md border border-flowstarter-elements-borderColor text-flowstarter-elements-textPrimary rounded-full h-8 hover:bg-flowstarter-elements-background-depth-2 hover:border-flowstarter-elements-borderColorActive focus-within:bg-flowstarter-elements-background-depth-2 focus-within:border-flowstarter-elements-borderColorActive transition-all duration-200 shadow-sm overflow-hidden">
            <div className="flex gap-1.5 w-full pl-3 pr-2 py-0.5 items-center">
              <PortDropdown
                activePreviewIndex={activePreviewIndex}
                setActivePreviewIndex={setActivePreviewIndex}
                isDropdownOpen={isPortDropdownOpen}
                setHasSelectedPreview={() => undefined}
                setIsDropdownOpen={setIsPortDropdownOpen}
                previews={previews}
              />
              <input
                ref={inputRef}
                className="w-full bg-transparent outline-none text-xs font-mono text-flowstarter-elements-textPrimary placeholder-flowstarter-elements-textTertiary"
                type="text"
                value={displayPath}
                onChange={(event) => {
                  setDisplayPath(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && activePreview) {
                    let targetPath = displayPath.trim();

                    if (!targetPath.startsWith('/')) {
                      targetPath = '/' + targetPath;
                    }

                    try {
                      const url = new URL(activePreview.baseUrl);
                      const fullUrl = url.origin + targetPath;
                      workbenchStore.updatePreviewUrl(activePreview.port, fullUrl);
                      setDisplayPath(targetPath);

                      if (inputRef.current) {
                        inputRef.current.blur();
                      }
                    } catch {
                      console.error('Invalid URL:', activePreview.baseUrl);
                    }
                  }
                }}
                disabled={!activePreview}
                placeholder="/"
              />
            </div>
            <div className="flex items-center border-l border-flowstarter-elements-borderColor h-full">
              <button
                onClick={reloadPreview}
                className="h-full px-2.5 text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary hover:bg-flowstarter-elements-item-backgroundHover transition-colors"
                disabled={!activePreview}
                title="Reload"
              >
                <div className="i-lucide:rotate-cw text-xs" />
              </button>
              <button
                onClick={() => setIsWindowSizeDropdownOpen(!isWindowSizeDropdownOpen)}
                className="h-full px-2.5 text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary hover:bg-flowstarter-elements-item-backgroundHover transition-colors"
                title="Window Size"
              >
                <div className="i-lucide:more-horizontal text-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 bg-flowstarter-elements-background-depth-2 rounded-full p-0.5 border border-flowstarter-elements-borderColor">
          <IconButton
            icon="i-lucide:external-link"
            onClick={openInNewTab}
            title="Open in new tab"
            className="w-7 h-7 rounded-full transition-all icon-scale-90 bg-transparent text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary"
          />
        </div>

        {/* Window Size Dropdown */}
        {isWindowSizeDropdownOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsWindowSizeDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-[999] min-w-[240px] max-h-[400px] overflow-y-auto bg-flowstarter-elements-background-depth-1 rounded-xl shadow-2xl border border-flowstarter-elements-borderColor overflow-hidden">
              <div className="p-3 border-b border-flowstarter-elements-borderColor">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-flowstarter-elements-textPrimary">Window Options</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="flex w-full justify-between items-center text-start bg-transparent text-xs text-flowstarter-elements-textTertiary hover:text-flowstarter-elements-textPrimary"
                    onClick={() => {
                      openInNewTab();
                    }}
                  >
                    <span>Open in new tab</span>
                    <span className="i-lucide:external-link h-5 w-4 text-current"></span>
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-flowstarter-elements-textTertiary">Show Device Frame</span>
                    <button
                      className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        showDeviceFrame
                          ? 'bg-flowstarter-elements-item-contentAccent'
                          : 'bg-flowstarter-elements-background-depth-3'
                      } relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeviceFrame(!showDeviceFrame);
                      }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-flowstarter-elements-background-depth-1 transition-transform duration-200 ${
                          showDeviceFrame ? 'transform translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-flowstarter-elements-textTertiary">Landscape Mode</span>
                    <button
                      className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        isLandscape
                          ? 'bg-flowstarter-elements-item-contentAccent'
                          : 'bg-flowstarter-elements-background-depth-3'
                      } relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLandscape(!isLandscape);
                      }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-flowstarter-elements-background-depth-1 transition-transform duration-200 ${
                          isLandscape ? 'transform translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              {windowSizes.map((size) => (
                <button
                  key={size.name}
                  className="w-full px-4 py-3.5 text-left text-flowstarter-elements-textPrimary text-sm whitespace-nowrap flex items-center gap-3 group hover:bg-flowstarter-elements-item-backgroundActive bg-flowstarter-elements-background-depth-1"
                  onClick={() => {
                    setSelectedWindowSize(size);
                    setIsWindowSizeDropdownOpen(false);
                    openInNewWindow(size);
                  }}
                >
                  <div
                    className={`${size.icon} w-5 h-5 text-current group-hover:text-flowstarter-elements-item-contentAccent transition-colors duration-200`}
                  />
                  <div className="flex-grow flex flex-col">
                    <span className="font-medium group-hover:text-flowstarter-elements-item-contentAccent transition-colors duration-200">
                      {size.name}
                    </span>
                    <span className="text-xs text-flowstarter-elements-textTertiary group-hover:text-flowstarter-elements-item-contentAccent transition-colors duration-200">
                      {isLandscape && (size.frameType === 'mobile' || size.frameType === 'tablet')
                        ? `${size.height} × ${size.width}`
                        : `${size.width} × ${size.height}`}
                      {size.hasFrame && showDeviceFrame ? ' (with frame)' : ''}
                    </span>
                  </div>
                  {selectedWindowSize.name === size.name && (
                    <div className="text-flowstarter-elements-item-contentAccent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  },
);
