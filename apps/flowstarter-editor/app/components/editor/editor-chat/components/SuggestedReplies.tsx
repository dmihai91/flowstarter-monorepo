import { motion } from 'framer-motion';
import type { SuggestedReply, OnboardingStep } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { getSuggestionIcon } from './suggestion-icons';

interface SuggestedRepliesProps {
  suggestions: SuggestedReply[];
  step: OnboardingStep;
  isDark: boolean;
  onAccept: (suggestion: SuggestedReply) => void;
  onRefresh?: () => void;
}

export function SuggestedReplies({ suggestions, step, isDark, onAccept, onRefresh }: SuggestedRepliesProps) {
  if (suggestions.length === 0) {
    return null;
  }

  if (step === 'welcome' || step === 'describe') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
        data-testid="suggested-replies"
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
          >
            {t(EDITOR_LABEL_KEYS.SUGGESTIONS_LABEL)}
          </p>
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={onRefresh}
              className="p-1 rounded-full transition-colors"
              style={{
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                background: 'transparent',
              }}
              title={t(EDITOR_LABEL_KEYS.SUGGESTIONS_SHUFFLE)}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </motion.button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.03 }}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onAccept(suggestion)}
              data-testid={`suggestion-${suggestion.id}`}
              className="group px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <span
                className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity mt-0.5"
                style={{ color: isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)' }}
              >
                {getSuggestionIcon(suggestion)}
              </span>
              <span className="leading-snug line-clamp-2">{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (step === 'ready') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(77, 93, 217, 0.1) 0%, rgba(6, 182, 212, 0.06) 100%)',
            }}
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)'}
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
          >
            {t(EDITOR_LABEL_KEYS.SUGGESTIONS_CUSTOMIZE)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.04 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAccept(suggestion)}
              className="group px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 text-left"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.6) 100%)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(16px) saturate(150%)',
                WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(77, 93, 217, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
                  color: isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)',
                }}
              >
                {getSuggestionIcon(suggestion)}
              </span>
              <span className="flex-1 leading-tight">{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Name step and business-info step - show compact pill suggestions
  if (step === 'name' || step === 'business-summary') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
      >
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => {
            // Highlight the accept/confirm action
            const isPrimary = suggestion.id === 'accept-name' || suggestion.id === 'confirm';

            return (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, delay: index * 0.03 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.1 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.05 } }}
                onClick={() => onAccept(suggestion)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-100"
                style={{
                  background: isPrimary
                    ? (isDark ? 'rgba(77, 93, 217, 0.25)' : 'rgba(77, 93, 217, 0.12)')
                    : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                  border: isPrimary
                    ? (isDark ? '1px solid rgba(77, 93, 217, 0.4)' : '1px solid rgba(77, 93, 217, 0.3)')
                    : isDark
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isPrimary ? (isDark ? '#8B9FFF' : '#4D5DD9') : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                  boxShadow: 'none',
                }}
              >
                {suggestion.text}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
}
