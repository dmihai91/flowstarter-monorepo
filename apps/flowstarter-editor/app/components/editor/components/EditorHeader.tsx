import React, { useState, useEffect } from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { MenuButton } from './MenuButton';
import { Logo } from './Logo';
import { ProjectNameEditor } from './ProjectNameEditor';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { PublishButton } from './PublishButton';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';
import { Separator } from './Separator';
import { MagicLinkButton } from './MagicLinkButton';
import { isTeamMode, getModeCapabilities, getUserMode } from '~/lib/team-auth';
import type { Id } from '../../../../convex/_generated/dataModel';

interface EditorHeaderProps {
  projectName: string;
  projectId?: Id<'projects'> | null;
  viewMode: ViewMode;
  isPublishEnabled: boolean;
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
}: EditorHeaderProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  // Client-side only mode detection
  const [isTeam, setIsTeam] = useState(false);
  const [canGenerateMagicLink, setCanGenerateMagicLink] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mode = getUserMode();
    setIsTeam(mode === 'team');
    const caps = getModeCapabilities(mode);
    setCanGenerateMagicLink(caps.canGenerateMagicLink);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: isMobile ? '52px' : '64px',
        padding: isMobile ? '0 12px' : '0 20px',
        flexShrink: 0,
        background: colors.bgHeader,
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: isDark
          ? '0 4px 30px rgba(0, 0, 0, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 30px rgba(0, 0, 0, 0.04), inset 0 -1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* LEFT: Menu + Logo + Project Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <MenuButton onClick={onMenuClick} />
        <Logo />
        {!isMobile && (
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
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} isMobile={isMobile} />
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
        {/* Team mode indicator - hide text on mobile */}
        {isTeam && !isMobile && (
          <span
            style={{
              padding: '4px 10px',
              backgroundColor: isDark ? 'rgba(77, 93, 217, 0.15)' : 'rgba(77, 93, 217, 0.1)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(77, 93, 217, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Team
          </span>
        )}

        {/* Magic Link button - Team only, hide on mobile */}
        {canGenerateMagicLink && !isMobile && (
          <MagicLinkButton projectId={projectId ?? null} />
        )}

        {!isMobile && <PublishButton isEnabled={isPublishEnabled} onClick={onPublish} />}
        {!isMobile && <Separator />}
        <ThemeToggle />
        <UserAvatar />
      </div>
    </header>
  );
}
