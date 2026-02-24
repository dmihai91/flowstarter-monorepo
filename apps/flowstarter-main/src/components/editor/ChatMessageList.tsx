'use client';

import { ErrorMessage } from '@/components/assistant/ErrorMessage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponseStream } from '@/components/ui/response-stream/response-stream';
import type { GenerationStep } from '@/hooks/useStreamingWebsiteGeneration';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import NextImage from 'next/image';
import { useEffect, useRef } from 'react';
import type { ChatMessage } from './CodingAgentEditor';

// Local icon assets
const assistantIconDark = '/assets/icons/assistant-dark.svg';
const checkmarkIcon = '/assets/icons/checkmark.svg';

// Polished success message component
function SuccessMessage({ content }: { content: string }) {
  // Remove the "success:" prefix and any extra newlines at the start
  const cleanContent = content.replace(/^success:/, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Success Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-5 shadow-xl shadow-green-500/20">
        {/* Animated sparkles background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                opacity: 0,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Sparkles className="h-3 w-3 text-white/40" />
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative flex items-start gap-4">
          {/* Icon */}
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: 0.2,
            }}
            className="flex-shrink-0 p-2 bg-white/20 rounded-xl backdrop-blur-sm"
          >
            <PartyPopper className="h-6 w-6 text-white" />
          </motion.div>

          {/* Text */}
          <div className="flex-1">
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white font-semibold text-lg mb-1"
            >
              Your website is ready! 🎉
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-sm leading-relaxed"
            >
              Check out your preview on the right. Feel free to ask me to make
              any changes or improvements!
            </motion.p>
          </div>

          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25,
              delay: 0.5,
            }}
            className="flex-shrink-0"
          >
            <CheckCircle2 className="h-8 w-8 text-white" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Component to render message content with color swatches
function MessageContent({ content }: { content: string }) {
  // Parse content and replace [color:hexcode] with visual color swatch
  const parts = content.split(/(\[color:[^\]]+\])/g);

  return (
    <>
      {parts.map((part, index) => {
        const colorMatch = part.match(/\[color:(#[0-9A-Fa-f]{6})\]/);
        if (colorMatch) {
          const color = colorMatch[1];
          return (
            <span key={index} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-4 h-4 rounded border-2 border-white shadow-[0px_0px_0px_1px_#c7c7c7]"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-sm">{color}</span>
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Animated working robot component
function WorkingRobot() {
  return (
    <motion.div
      className="relative w-16 h-16 flex-shrink-0"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Robot body */}
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Glow effect behind robot */}
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="url(#robotGlow)"
          strokeWidth="2"
          opacity="0.3"
          animate={{
            r: [26, 30, 26],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Define gradients */}
        <defs>
          <linearGradient id="robotGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="robotBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="robotHead" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* Robot antenna */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '32px 14px' }}
        >
          <line
            x1="32"
            y1="14"
            x2="32"
            y2="8"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.circle
            cx="32"
            cy="6"
            r="3"
            fill="#f59e0b"
            animate={{
              fill: ['#f59e0b', '#fbbf24', '#f59e0b'],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.g>

        {/* Robot head */}
        <rect
          x="20"
          y="14"
          width="24"
          height="18"
          rx="4"
          fill="url(#robotHead)"
        />

        {/* Robot eyes */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          style={{ transformOrigin: '32px 22px' }}
        >
          <circle cx="26" cy="22" r="3" fill="#1e3a5f" />
          <circle cx="38" cy="22" r="3" fill="#1e3a5f" />
          {/* Eye shine */}
          <circle cx="27" cy="21" r="1" fill="white" opacity="0.8" />
          <circle cx="39" cy="21" r="1" fill="white" opacity="0.8" />
        </motion.g>

        {/* Robot mouth - smile */}
        <motion.path
          d="M 26 27 Q 32 31 38 27"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            d: [
              'M 26 27 Q 32 31 38 27',
              'M 26 28 Q 32 30 38 28',
              'M 26 27 Q 32 31 38 27',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Robot body */}
        <rect
          x="18"
          y="34"
          width="28"
          height="20"
          rx="4"
          fill="url(#robotBody)"
        />

        {/* Robot chest light */}
        <motion.circle
          cx="32"
          cy="42"
          r="4"
          fill="#10b981"
          animate={{
            fill: ['#10b981', '#34d399', '#10b981'],
            boxShadow: [
              '0 0 0px #10b981',
              '0 0 10px #10b981',
              '0 0 0px #10b981',
            ],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.circle
          cx="32"
          cy="42"
          r="6"
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.5"
          animate={{ r: [4, 8, 4], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Left arm - typing animation */}
        <motion.g
          animate={{ rotate: [0, -15, 0, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '16px 38px' }}
        >
          <rect x="8" y="36" width="10" height="6" rx="2" fill="#60a5fa" />
          <circle cx="8" cy="39" r="3" fill="#93c5fd" />
        </motion.g>

        {/* Right arm - typing animation */}
        <motion.g
          animate={{ rotate: [0, 15, 0, 10, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.15,
          }}
          style={{ transformOrigin: '48px 38px' }}
        >
          <rect x="46" y="36" width="10" height="6" rx="2" fill="#60a5fa" />
          <circle cx="56" cy="39" r="3" fill="#93c5fd" />
        </motion.g>

        {/* Code/spark particles */}
        {[0, 1, 2].map((i) => (
          <motion.text
            key={i}
            x={24 + i * 8}
            y={58}
            fontSize="6"
            fill="#3b82f6"
            initial={{ opacity: 0, y: 58 }}
            animate={{
              opacity: [0, 1, 0],
              y: [58, 50, 42],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          >
            {['</', '{ }', '/>'][i]}
          </motion.text>
        ))}
      </svg>
    </motion.div>
  );
}

// Inline progress display component
function InlineProgressDisplay({ steps }: { steps: GenerationStep[] }) {
  // Show only the last 4 steps to keep it compact
  const recentSteps = steps.slice(-4);

  if (recentSteps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Getting started...</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <AnimatePresence mode="popLayout">
        {recentSteps.map((step, index) => (
          <motion.div
            key={`${step.name}-${step.id || index}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              duration: 0.35,
              delay: index * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={cn(
              'flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm transition-all',
              step.status === 'completed' &&
                'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20',
              step.status === 'in-progress' &&
                'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20',
              step.status === 'error' &&
                'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20',
              step.status === 'pending' && 'text-gray-400 dark:text-gray-500'
            )}
          >
            {/* Status icon with animation */}
            <div className="flex-shrink-0">
              {step.status === 'completed' ? (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </motion.div>
              ) : step.status === 'in-progress' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step.status === 'error' ? (
                <Circle className="h-4 w-4" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Step name and message */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="font-medium truncate">{step.name}</span>
              {step.status === 'in-progress' && step.message && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs opacity-70 truncate hidden sm:block"
                >
                  • {step.message}
                </motion.span>
              )}
            </div>

            {/* Completion indicator */}
            {step.status === 'completed' && (
              <motion.span
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-medium"
              >
                ✓
              </motion.span>
            )}

            {/* In-progress dots animation */}
            {step.status === 'in-progress' && (
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-current opacity-60"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onRetry?: () => void;
  steps?: GenerationStep[]; // Add steps for inline progress display
}

export function ChatMessageList({
  messages,
  isGenerating,
  onRetry,
  steps = [],
}: ChatMessageListProps) {
  const { t } = useTranslations();
  const { user } = useUser();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getUserName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) return user.firstName;
    return 'User';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div
      className="flex flex-col gap-6 items-start relative shrink-0 w-full overflow-y-auto flex-1 messages-scroll"
      style={{ gap: '24px' }}
    >
      <style jsx>{`
        .messages-scroll {
          overflow-y: auto !important;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .messages-scroll::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

      <div className="flex flex-col gap-6 w-full">
        {/* Welcome message */}
        {messages.length === 0 && !isGenerating && (
          <div className="w-full">
            <p
              className="font-normal leading-normal not-italic text-base"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#a1a1af',
              }}
            >
              Start a conversation with Flowstarter Assistant
            </p>
          </div>
        )}
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;

          return (
            <div
              key={index}
              className="flex flex-col items-start w-full"
              style={{ gap: '16px' }}
            >
              {message.role === 'user' ? (
                <>
                  {/* User message */}
                  <div
                    className="flex flex-col items-start w-full"
                    style={{ gap: '16px' }}
                  >
                    {/* Author */}
                    <div
                      className="flex items-center w-full"
                      style={{ gap: '12px' }}
                    >
                      <Avatar className="size-7 rounded-full shrink-0">
                        {user?.imageUrl ? (
                          <AvatarImage
                            src={user.imageUrl}
                            alt={getUserName()}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[var(--purple)] to-[var(--purple)] text-white text-sm font-medium">
                            {getUserInitials()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <p
                        className="font-medium leading-normal not-italic text-right"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '18px',
                          color: '#bfbfc8',
                        }}
                      >
                        {getUserName()}
                      </p>
                    </div>

                    {/* Message bubble */}
                    <div
                      className="glass-3d flex flex-col items-start rounded-[16px] shrink-0 w-full backdrop-blur-xl border border-gray-300/60 dark:border-white/15 bg-white/50 dark:bg-[rgba(58,58,74,0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]"
                      style={{
                        padding: '12px 16px',
                        gap: '12px',
                      }}
                    >
                      {message.imageUrl && (
                        <NextImage
                          src={message.imageUrl}
                          alt={t('editor.attachedImageAlt')}
                          className="max-w-full h-auto rounded-xl mb-2 max-h-64 object-contain"
                        />
                      )}
                      <p
                        className="font-normal leading-normal not-italic w-full whitespace-pre-wrap dark:text-white text-gray-900"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '16px',
                        }}
                      >
                        {message.content}
                      </p>

                      {/* Timestamp with checkmark */}
                      <div className="flex gap-1 items-center justify-end w-full">
                        <p
                          className="font-normal leading-[11px] text-sm text-right dark:text-[#bfbfc8] text-gray-500"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontVariationSettings: "'wdth' 100",
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="size-3.5 shrink-0 relative overflow-clip">
                          <img
                            src={checkmarkIcon}
                            alt="Sent"
                            className="size-3.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : message.content.startsWith('error:') ? (
                <div className="mb-2 w-full">
                  <ErrorMessage
                    message={message.content.replace('error:', '')}
                    onRetry={onRetry}
                    retrying={isGenerating}
                  />
                </div>
              ) : message.content.startsWith('success:') ? (
                <div className="mb-2 w-full">
                  <SuccessMessage content={message.content} />
                </div>
              ) : (
                <>
                  {/* AI message */}
                  <div
                    className="flex flex-col items-start w-full"
                    style={{ gap: '16px' }}
                  >
                    {/* Flowstarter Assistant label */}
                    <div
                      className="flex items-center w-full"
                      style={{ gap: '12px' }}
                    >
                      <div className="h-7 w-[29px] shrink-0 relative flex items-center">
                        <img
                          src={assistantIconDark}
                          alt="Flowstarter Assistant"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p
                        className="flex-1 font-medium leading-normal min-h-px min-w-px not-italic whitespace-pre-wrap dark:text-[#bfbfc8] text-gray-600"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '16px',
                        }}
                      >
                        Flowstarter Assistant
                      </p>
                    </div>

                    {/* Message bubble */}
                    <div
                      className="glass-3d flex flex-col items-start rounded-[16px] shrink-0 w-full whitespace-pre-wrap backdrop-blur-xl border border-gray-300/60 dark:border-white/15 dark:text-white text-gray-900 bg-white/50 dark:bg-[rgba(58,58,74,0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        lineHeight: '24px',
                        padding: '12px 16px',
                        gap: '12px',
                      }}
                    >
                      {isLastMessage &&
                      message.role === 'assistant' &&
                      isGenerating ? (
                        <ResponseStream
                          textStream={message.content}
                          mode="typewriter"
                          speed={20}
                          as="span"
                        />
                      ) : (
                        <MessageContent content={message.content} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Inline progress display when generating */}
        {isGenerating && steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full mt-4"
          >
            <div
              className="flex flex-col items-start w-full"
              style={{ gap: '16px' }}
            >
              {/* Flowstarter Assistant label */}
              <div className="flex items-center w-full" style={{ gap: '12px' }}>
                <div className="h-7 w-[29px] shrink-0 relative flex items-center">
                  <img
                    src="/assets/icons/assistant-dark.svg"
                    alt="Flowstarter Assistant"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className="font-medium leading-normal min-h-px min-w-px not-italic dark:text-[#bfbfc8] text-gray-600"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                    }}
                  >
                    Building your website
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress tasks bubble with robot */}
              <div
                className="glass-3d flex items-start gap-4 rounded-[16px] shrink-0 w-full backdrop-blur-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-[rgba(59,130,246,0.08)] shadow-[0_8px_32px_rgba(59,130,246,0.08),0_2px_8px_rgba(59,130,246,0.05),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_2px_6px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(59,130,246,0.1),0_2px_8px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.03),inset_0_2px_6px_rgba(0,0,0,0.05)]"
                style={{
                  padding: '16px',
                }}
              >
                {/* Animated robot */}
                <WorkingRobot />

                {/* Tasks list */}
                <div className="flex-1 min-w-0">
                  <InlineProgressDisplay steps={steps} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
