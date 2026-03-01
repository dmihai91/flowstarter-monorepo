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
const SparklesIcon = ({ size }: { size: number }) => (
  <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main sparkle */}
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="white" fillOpacity="0.95" />
    {/* Small sparkle top-right */}
    <path d="M19 2L19.75 4.25L22 5L19.75 5.75L19 8L18.25 5.75L16 5L18.25 4.25L19 2Z" fill="white" fillOpacity="0.75" />
    {/* Small sparkle bottom-left */}
    <path d="M5 16L5.75 18.25L8 19L5.75 19.75L5 22L4.25 19.75L2 19L4.25 18.25L5 16Z" fill="white" fillOpacity="0.75" />
  </svg>
);

export const MessageAvatar = memo((props: MessageAvatarProps) => {
  const size = props.size ?? 32;

  if (props.variant === 'assistant') {
    return (
      <div
        className="rounded-full flex items-center justify-center shrink-0 relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, hsl(233, 65%, 58%) 0%, hsl(187, 96%, 42%) 100%)',
          boxShadow: '0 2px 8px rgba(77, 93, 217, 0.25)',
        }}
      >
        {/* Subtle glass overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        <SparklesIcon size={size} />
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
