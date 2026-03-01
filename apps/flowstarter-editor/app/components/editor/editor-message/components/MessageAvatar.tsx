import { Wand2 } from 'lucide-react';
import { memo } from 'react';

interface BaseAvatarProps {
  size?: number;
}

interface UserAvatarProps extends BaseAvatarProps {
  variant: 'user';
  name: string;
  imageUrl?: string;
  isDark: boolean;
}

interface AssistantAvatarProps extends BaseAvatarProps {
  variant: 'assistant';
  isDark?: boolean;
}

type MessageAvatarProps = UserAvatarProps | AssistantAvatarProps;

/**
 * Sparkles/AI icon for the assistant avatar
 */


export const MessageAvatar = memo((props: MessageAvatarProps) => {
  const size = props.size ?? 32;

  if (props.variant === 'assistant') {
    return (
      <div
        className="rounded-full flex items-center justify-center shrink-0 relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
        }}
      >
        {/* Subtle glass overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        <Wand2 size={size * 0.5} color="white" strokeWidth={2} />
      </div>
    );
  }

  const { name, imageUrl, isDark } = props;

  if (imageUrl) {
    return (
      <div
        className="rounded-full shrink-0 relative overflow-hidden"
        style={{
          width: size,
          height: size,
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-sm font-semibold shrink-0 relative overflow-hidden"
      style={{
        width: size,
        height: size,
        background: isDark
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 100%)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        boxShadow: isDark
          ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Glass overlay for user avatar */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      />
      <span className="relative z-10">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
});

MessageAvatar.displayName = 'MessageAvatar';
