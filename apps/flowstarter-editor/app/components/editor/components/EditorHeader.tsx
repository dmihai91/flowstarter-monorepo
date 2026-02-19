import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { MenuButton } from './MenuButton';
import { Logo } from './Logo';
import { ProjectNameEditor } from './ProjectNameEditor';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { PublishButton } from './PublishButton';
import { ThemeToggle } from './ThemeToggle';
import { UserAvatar } from './UserAvatar';
import { Separator } from './Separator';

interface EditorHeaderProps {
  projectName: string;
  viewMode: ViewMode;
  isPublishEnabled: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onProjectNameChange?: (name: string) => void;
  onPublish?: () => void;
  onMenuClick?: () => void;
}

export function EditorHeader({
  projectName,
  viewMode,
  isPublishEnabled,
  onViewModeChange,
  onProjectNameChange,
  onPublish,
  onMenuClick,
}: EditorHeaderProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        padding: '0 20px',
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
      </div>

      {/* CENTER: View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <PublishButton isEnabled={isPublishEnabled} onClick={onPublish} />
        <Separator />
        <ThemeToggle />
        <UserAvatar />
      </div>
    </header>
  );
}
