import React, { useState, useEffect } from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { MenuButton } from './MenuButton';
import { Logo, LogoIcon } from './Logo';
import { ProjectNameEditor } from './ProjectNameEditor';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { PublishButton } from './PublishButton';
import { EditorUserMenu } from './EditorUserMenu';
import { ThemeToggle } from './ThemeToggle';
import { Separator } from './Separator';
import { MagicLinkButton } from './MagicLinkButton';
import { isTeamMode, getModeCapabilities, getUserMode } from '~/lib/team-auth';
import type { Id } from '../../../../convex/_generated/dataModel';

interface EditorHeaderProps {
  terminalErrorCount?: number;
  hasTerminalActivity?: boolean;
  projectName: string;
  projectId?: Id<'projects'> | null;
  viewMode: ViewMode;
  isPublishEnabled: boolean;
  terminalOpen?: boolean;
  onTerminalToggle?: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onProjectNameChange?: (name: string) => void;
  onPublish?: () => void;
  onMenuClick?: () => void;
}

export function EditorHeader({
  projectName,
  projectId,
  viewMode,
  isPublishEnabled,
  onViewModeChange,
  onProjectNameChange,
  onPublish,
  onMenuClick,
  terminalErrorCount = 0,
  hasTerminalActivity = false,
  terminalOpen = false,
  onTerminalToggle,
}: EditorHeaderProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  // Client-side only mode detection
  const [isTeam, setIsTeam] = useState(false);
  const [canGenerateMagicLink, setCanGenerateMagicLink] = useState(false);

  // Responsive detection
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mode = getUserMode();
    setIsTeam(mode === 'team');
    const caps = getModeCapabilities(mode);
    setCanGenerateMagicLink(caps.canGenerateMagicLink);
  }, []);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsCompact(window.innerWidth < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: isMobile ? '44px' : isCompact ? '52px' : '64px',
        padding: isMobile ? '0 8px' : isCompact ? '0 12px' : '0 20px',
        flexShrink: 0,
        position: 'relative' as const,
        zIndex: 10,
        background: isCompact ? (isDark ? '#0a0a0c' : '#ffffff') : colors.bgHeader,
        borderBottom: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)'
          : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* LEFT: Menu + Logo + Team Badge + Project Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : isCompact ? '8px' : '12px',
          flexShrink: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <MenuButton onClick={onMenuClick} />
        {!isMobile && <Logo size="xs" />}
        {isTeam && !isMobile && (
          <span
            style={{
              padding: '3px 8px',
              backgroundColor: isDark ? 'rgba(77, 93, 217, 0.15)' : 'rgba(77, 93, 217, 0.1)',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(77, 93, 217, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexShrink: 0,
            }}
          >
            Team
          </span>
        )}
        {/* Project name pill — visible on compact/tablet when full editor is hidden */}
        {isCompact && !isMobile && projectName && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px 4px 8px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.72)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 1,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.09)',
              letterSpacing: '-0.01em',
            }}
          >
            {/* Folder icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.6 }}>
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            {projectName}
          </span>
        )}
        {!isCompact && (
          <>
            <Separator />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <ProjectNameEditor projectName={projectName} onNameChange={onProjectNameChange} />
            </div>
          </>
        )}
      </div>

      {/* CENTER: View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} isMobile={isMobile} terminalErrorCount={terminalErrorCount} hasTerminalActivity={hasTerminalActivity} />
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : isCompact ? '12px' : '12px' }}>
        {/* Magic Link button - Team only, hide on mobile */}
        {canGenerateMagicLink && !isCompact && (
          <MagicLinkButton projectId={projectId ?? null} />
        )}

        {/* Terminal toggle — only in editor mode, shown as >_ button */}
        {viewMode === 'editor' && onTerminalToggle && (
          <button
            onClick={onTerminalToggle}
            title={terminalOpen ? 'Close terminal' : 'Open terminal'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'monospace',
              background: terminalOpen
                ? (isDark ? 'rgba(77,93,217,0.18)' : 'rgba(77,93,217,0.1)')
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
              color: terminalOpen
                ? 'rgba(77,93,217,0.9)'
                : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
              transition: 'all 0.15s',
            }}
          >
            {'>_'}
          </button>
        )}
        {!isCompact && <PublishButton isEnabled={isPublishEnabled} onClick={onPublish} />}
        {!isCompact && <Separator />}
        {!isMobile && <div style={{ marginLeft: '8px' }}><ThemeToggle /></div>}
        <EditorUserMenu />
      </div>
    </header>
  );
}
