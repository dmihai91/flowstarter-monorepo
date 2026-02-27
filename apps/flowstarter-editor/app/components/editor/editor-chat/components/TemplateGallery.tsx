import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import { getCategoryColors } from '~/components/editor/editor-chat/constants';
import type { Template } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface TemplateGalleryProps {
  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;
  thumbnailErrors: Set<string>;
  isDark: boolean;
  onTemplateSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  onRetry: () => void;
  onThumbnailError: (templateId: string) => void;
}

// Skeleton loading card
const SkeletonCard = ({ isDark, index }: { isDark: boolean; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="rounded-2xl overflow-hidden"
    style={{
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: isDark
        ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 4px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    }}
  >
    <div className="aspect-[16/10] relative overflow-hidden">
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        }}
      />
      <div
        className="absolute top-2 left-2 w-16 h-5 rounded-md animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      />
    </div>
    <div className="p-3 space-y-2">
      <div
        className="h-4 w-2/3 rounded animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      />
      <div
        className="h-3 w-full rounded animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
      />
    </div>
  </motion.div>
);

export function TemplateGallery({
  templates,
  templatesLoading,
  templatesError,
  thumbnailErrors,
  isDark,
  onTemplateSelect,
  onPreview,
  onRetry,
  onThumbnailError,
}: TemplateGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (templatesLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 mt-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} isDark={isDark} index={i} />
        ))}
      </div>
    );
  }

  if (templatesError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-5 rounded-xl"
        style={{
          background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
          border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.15)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: isDark ? '#f87171' : '#dc2626' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
              {t(EDITOR_LABEL_KEYS.TEMPLATE_UNAVAILABLE)}
            </h4>
            <p className="text-xs mb-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
              {templatesError}
            </p>
            <motion.button
              onClick={onRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-xs font-medium rounded-lg transition-colors"
              style={{
                background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                color: isDark ? '#fff' : '#dc2626',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {t(EDITOR_LABEL_KEYS.TEMPLATE_TRY_AGAIN)}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (templates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-5 rounded-xl"
        style={{
          background: isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.06)',
          border: isDark ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(251, 191, 36, 0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            style={{ color: isDark ? '#fbbf24' : '#d97706' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
            {t(EDITOR_LABEL_KEYS.TEMPLATE_NO_TEMPLATES)}
          </span>
        </div>
      </motion.div>
    );
  }

  const handleSelect = (template: Template) => {
    setSelectedId(template.id);

    // Brief delay to show selection state before proceeding
    setTimeout(() => {
      onTemplateSelect(template);
    }, 200);
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-3">
      <AnimatePresence>
        {templates.slice(0, 3).map((template, index) => {
          const colors = getCategoryColors(template.category || 'default');
          const thumbnailUrl = template.thumbnail || getTemplateThumbnailUrl(template.id, isDark ? 'dark' : 'light');
          const hasThumbnailError = thumbnailErrors.has(template.id);
          const isSelected = selectedId === template.id;
          const isHovered = hoveredId === template.id;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: isSelected
                  ? '2px solid rgba(99, 102, 241, 0.8)'
                  : isHovered
                    ? isDark
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.8)'
                    : isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isSelected
                  ? '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : isHovered
                    ? isDark
                      ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                    : isDark
                      ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : '0 4px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                transform: isHovered && !isSelected ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 0.25s ease-out',
              }}
              onClick={() => handleSelect(template)}
            >
              {/* Thumbnail */}
              <div className="aspect-[16/10] relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`}
                  style={{ opacity: hasThumbnailError ? 1 : 0.1 }}
                />
                {!hasThumbnailError ? (
                  <motion.img
                    src={thumbnailUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    style={{
                      filter: isHovered ? 'brightness(1.05)' : 'brightness(1)',
                      transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                      transition: 'all 0.3s ease-out',
                    }}
                    onError={() => onThumbnailError(template.id)}
                  />
                ) : (
                  <div className="absolute inset-3 flex flex-col gap-1.5 opacity-60">
                    <div className="h-2 rounded-sm w-1/2" style={{ background: colors.text, opacity: 0.5 }} />
                    <div className="flex gap-1.5 flex-1">
                      <div
                        className="w-1/3 rounded-sm"
                        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                      />
                      <div className="flex-1 flex flex-col gap-1">
                        <div
                          className="h-1.5 rounded-full w-full"
                          style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
                        />
                        <div
                          className="h-1.5 rounded-full w-3/4"
                          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                        />
                        <div
                          className="h-1.5 rounded-full w-1/2"
                          style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isDark
                      ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 35%)',
                  }}
                />

                {/* Category badge */}
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold rounded-md capitalize"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {template.category?.replace('-', ' ') || t(EDITOR_LABEL_KEYS.TEMPLATE_LABEL)}
                </motion.span>

                {/* Preview button - always visible with better styling */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(template);
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHovered ? 1 : 0.7,
                    scale: isHovered ? 1.05 : 1,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                  title={t(EDITOR_LABEL_KEYS.TEMPLATE_PREVIEW)}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </motion.button>

                {/* Use template button - prominent on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-2.5 right-2.5 left-2.5 flex justify-center"
                    >
                      <button
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md flex items-center gap-1.5"
                        style={{
                          background: 'rgba(99, 102, 241, 0.9)',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                        }}
                      >
                        {t(EDITOR_LABEL_KEYS.TEMPLATE_USE)}
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: 'rgba(99, 102, 241, 0.3)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(99, 102, 241, 1)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
                        }}
                      >
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Template info */}
              <div className="p-3.5">
                <h4
                  className="text-sm font-semibold mb-0.5 transition-colors duration-200"
                  style={{
                    color: isHovered ? (isDark ? '#818cf8' : '#4338ca') : isDark ? '#fff' : '#1a1a2e',
                  }}
                >
                  {template.name}
                </h4>
                {template.description && (
                  <p
                    className="text-[11px] line-clamp-1"
                    style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {template.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
