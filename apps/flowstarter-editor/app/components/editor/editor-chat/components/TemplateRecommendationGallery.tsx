import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import { getCategoryColors } from '~/components/editor/editor-chat/constants';
import type { TemplateRecommendation, Template } from '~/components/editor/template-preview/types';

interface TemplateRecommendationGalleryProps {
  recommendations: TemplateRecommendation[];
  isLoading: boolean;
  error: string | null;
  isDark: boolean;
  onSelect: (recommendation: TemplateRecommendation) => void;
  onPreview: (recommendation: TemplateRecommendation) => void;
  onRetry: () => void;
}

// Skeleton loading card
const SkeletonCard = ({ isDark, index }: { isDark: boolean; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="rounded-xl overflow-hidden"
    style={{
      background: isDark ? '#14141e' : '#ffffff',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
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
    <div className="p-4 space-y-2">
      <div
        className="h-4 w-2/3 rounded animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      />
      <div
        className="h-3 w-full rounded animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
      />
      <div
        className="h-3 w-3/4 rounded animate-pulse"
        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
      />
    </div>
  </motion.div>
);

export function TemplateRecommendationGallery({
  recommendations,
  isLoading,
  error,
  isDark,
  onSelect,
  onPreview,
  onRetry,
}: TemplateRecommendationGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());

  const handleThumbnailError = (templateId: string) => {
    setThumbnailErrors((prev) => new Set(prev).add(templateId));
  };

  // Show all recommendations that passed the score threshold (no hard cap)
  const displayRecommendations = recommendations;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
            Finding the best templates for your business...
          </span>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} isDark={isDark} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl"
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
              Couldn't find recommendations
            </h4>
            <p className="text-xs mb-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
              {error}
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
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (displayRecommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl text-center"
        style={{
          background: isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.06)',
          border: isDark ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(251, 191, 36, 0.15)',
        }}
      >
        <span className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
          No matching templates found. Please try a different description.
        </span>
      </motion.div>
    );
  }

  const handleSelect = (recommendation: TemplateRecommendation) => {
    setSelectedId(recommendation.template.id);
    setTimeout(() => {
      onSelect(recommendation);
    }, 200);
  };

  return (
    <div className="space-y-4" data-testid="template-gallery">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span
          className="text-sm font-medium"
          data-testid="template-gallery-header"
          style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }}
        >
          {displayRecommendations.length === 1
            ? 'Best template for your business'
            : `Top ${displayRecommendations.length} recommendations for your business`}
        </span>
      </motion.div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 gap-4" data-testid="template-grid">
        <AnimatePresence>
          {displayRecommendations.map((rec, index) => {
            const { template } = rec;

            // Use index in key to handle duplicate templates in recommendations
            const uniqueKey = `${template.id}-${index}`;
            const colors = getCategoryColors(template.category || 'default');
            const thumbnailUrl = template.thumbnail || getTemplateThumbnailUrl(template.id, isDark ? 'dark' : 'light');
            const hasThumbnailError = thumbnailErrors.has(template.id);
            const isSelected = selectedId === template.id;
            const isHovered = hoveredId === uniqueKey;
            const isTopPick = index === 0;

            return (
              <motion.div
                key={uniqueKey}
                data-testid={`template-card-${template.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredId(uniqueKey)}
                onMouseLeave={() => setHoveredId(null)}
                className="group rounded-xl overflow-hidden cursor-pointer relative"
                style={{
                  background: isDark ? '#1a1a2e' : '#ffffff',
                  border: isSelected
                    ? '2px solid #6366f1'
                    : isHovered
                      ? isDark
                        ? '2px solid rgba(255, 255, 255, 0.15)'
                        : '2px solid rgba(0, 0, 0, 0.12)'
                      : isDark
                        ? '2px solid rgba(255, 255, 255, 0.06)'
                        : '2px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(99, 102, 241, 0.2)'
                    : isHovered
                      ? isDark
                        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                        : '0 8px 24px rgba(0, 0, 0, 0.1)'
                      : isDark
                        ? '0 2px 12px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transform: isHovered && !isSelected ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.2s ease-out',
                }}
                onClick={() => handleSelect(rec)}
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
                      onError={() => handleThumbnailError(template.id)}
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
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md capitalize"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {template.category?.replace('-', ' ') || 'Template'}
                  </motion.span>

                  {/* Match score - removed */}
                  {/* <MatchScoreBadge score={rec.matchScore} isDark={isDark} isBestMatch={isTopPick} /> */}

                  {/* Preview button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(rec);
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isHovered ? 1 : 0.6,
                      scale: isHovered ? 1.05 : 1,
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                    title="Preview template"
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
                <div className="p-4">
                  <h4
                    className="text-sm font-semibold mb-1 transition-colors duration-200"
                    style={{
                      color: isHovered ? (isDark ? '#818cf8' : '#4338ca') : isDark ? '#fff' : '#1a1a2e',
                    }}
                  >
                    {template.name}
                  </h4>
                  <p
                    className="text-[11px] line-clamp-2 mb-2"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {rec.reasoning}
                  </p>

                  {/* Palette preview */}
                  {rec.palettes && rec.palettes.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {rec.palettes.slice(0, 5).map((palette) => (
                        <div
                          key={palette.id}
                          className="w-5 h-5 rounded-full"
                          style={{
                            background: palette.colors.primary,
                            border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          }}
                          title={palette.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
