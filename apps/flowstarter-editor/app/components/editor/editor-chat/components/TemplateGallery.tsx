/**
 * TemplateGallery Component (Unified)
 *
 * Replaces TemplateRecommendationGallery + FullTemplateGallery.
 * Two sections: "Recommended for You" (AI picks) and "All Templates" (full catalog with filters).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, X, Star } from 'lucide-react';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import { getCategoryColors } from '~/components/editor/editor-chat/constants';
import type { Template } from '~/components/editor/editor-chat/types';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import { TemplateCard } from './TemplateCard';
import { GalleryLoadingState, GalleryErrorState } from './gallery-states';

interface UnifiedTemplateGalleryProps {
  // Recommendations (AI picks)
  recommendations: TemplateRecommendation[];
  recommendationsLoading: boolean;
  recommendationsError: string | null;
  onRecommendationSelect: (recommendation: TemplateRecommendation) => void;
  onPreviewRecommendation: (recommendation: TemplateRecommendation) => void;
  onRetryRecommendations: () => void;
  // Full catalog
  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;
  onTemplateSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  onRetryTemplates: () => void;
  // Common
  isDark: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  'health-wellness': 'Health & Wellness',
  'health-fitness': 'Fitness',
  'beauty-wellness': 'Beauty',
  'personal-brand': 'Personal Brand',
  'local-business': 'Local Business',
  education: 'Education',
  creative: 'Creative',
};

export function TemplateGallery({
  recommendations,
  recommendationsLoading,
  recommendationsError,
  onRecommendationSelect,
  onPreviewRecommendation,
  onRetryRecommendations,
  templates,
  templatesLoading,
  templatesError,
  onTemplateSelect,
  onPreview,
  onRetryTemplates,
  isDark,
}: UnifiedTemplateGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleThumbnailError = (templateId: string) => {
    setThumbnailErrors(prev => new Set(prev).add(templateId));
  };

  const handleRecommendationClick = (rec: TemplateRecommendation) => {
    setSelectedId(rec.template.id);
    setTimeout(() => onRecommendationSelect(rec), 200);
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedId(template.id);
    setTimeout(() => onTemplateSelect(template), 200);
  };

  // Unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => { if (t.category) cats.add(t.category); });
    return ['all', ...Array.from(cats)];
  }, [templates]);

  // Exclude recommended template IDs from the "All Templates" section
  const recommendedIds = useMemo(
    () => new Set(recommendations.map(r => r.template.id)),
    [recommendations],
  );

  // Filtered full catalog
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(q) ||
          template.description?.toLowerCase().includes(q) ||
          template.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, searchQuery, selectedCategory]);

  const c = {
    text: isDark ? '#fafafa' : '#111827',
    textSec: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    textTer: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    accent: isDark ? '#818cf8' : '#4338ca',
    accentBg: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
    accentBorder: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)',
    recBg: isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.04)',
    recBorder: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mt-2"
      data-testid="template-gallery"
    >
      {/* ── Recommended for You ── */}
      {(recommendationsLoading || recommendations.length > 0 || recommendationsError) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: c.accent }} />
            <span
              className="text-sm font-semibold"
              data-testid="template-gallery-header"
              style={{ color: c.text }}
            >
              Recommended for You
            </span>
            {recommendations.length > 0 && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: c.accentBg, color: c.accent }}
              >
                AI picks
              </span>
            )}
          </div>

          {recommendationsLoading && (
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2].map(i => <RecommendationSkeleton key={i} isDark={isDark} index={i} />)}
            </div>
          )}

          {recommendationsError && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}`,
                color: isDark ? '#f87171' : '#dc2626',
              }}
            >
              <p className="mb-2">Could not load recommendations.</p>
              <button
                onClick={onRetryRecommendations}
                className="text-xs font-medium underline"
              >
                Try again
              </button>
            </div>
          )}

          {!recommendationsLoading && recommendations.length > 0 && (
            <div className="grid grid-cols-2 gap-4" data-testid="template-grid">
              <AnimatePresence>
                {recommendations.map((rec, index) => {
                  const { template } = rec;
                  const uniqueKey = `rec-${template.id}-${index}`;
                  const colors = getCategoryColors(template.category || 'default');
                  const thumbnailUrl = template.thumbnail || getTemplateThumbnailUrl(template.id, isDark ? 'dark' : 'light');
                  const hasThumbnailError = thumbnailErrors.has(template.id);
                  const isSelected = selectedId === template.id;
                  const isHovered = hoveredId === uniqueKey;

                  return (
                    <motion.div
                      key={uniqueKey}
                      data-testid={`template-card-${template.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onMouseEnter={() => setHoveredId(uniqueKey)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleRecommendationClick(rec)}
                      className="group rounded-xl overflow-hidden cursor-pointer relative"
                      style={{
                        background: isDark ? '#1a1a2e' : '#ffffff',
                        border: isSelected
                          ? '2px solid #6366f1'
                          : isHovered
                            ? isDark ? '2px solid rgba(255,255,255,0.15)' : '2px solid rgba(0,0,0,0.12)'
                            : `2px solid ${c.recBorder}`,
                        boxShadow: isSelected
                          ? '0 0 0 3px rgba(99, 102, 241, 0.2)'
                          : isHovered
                            ? isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)'
                            : isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                        transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.2s ease-out',
                      }}
                    >
                      {/* Match score badge */}
                      {rec.matchScore >= 80 && (
                        <div
                          className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            background: isDark ? 'rgba(34, 197, 94, 0.9)' : 'rgba(22, 163, 74, 0.9)',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          {rec.matchScore}% match
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`} style={{ opacity: hasThumbnailError ? 1 : 0.1 }} />
                        {!hasThumbnailError ? (
                          <img
                            src={thumbnailUrl}
                            alt={template.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                            style={{
                              filter: isHovered ? 'brightness(1.05)' : 'brightness(1)',
                              transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                            }}
                            onError={() => handleThumbnailError(template.id)}
                          />
                        ) : (
                          <div className="absolute inset-3 flex flex-col gap-1.5 opacity-60">
                            <div className="h-2 rounded-sm w-1/2" style={{ background: colors.text, opacity: 0.5 }} />
                          </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: isDark ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' : 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 35%)',
                        }} />
                        {/* Category badge */}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md capitalize"
                          style={{ background: colors.bg, color: colors.text, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                          {template.category?.replace('-', ' ') || 'Template'}
                        </span>
                        {/* Preview button */}
                        <motion.button
                          onClick={e => { e.stopPropagation(); onPreviewRecommendation(rec); }}
                          initial={{ opacity: 0.6 }}
                          whileHover={{ opacity: 1, scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}
                          title="Preview template"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                              style={{ background: 'rgba(99, 102, 241, 0.3)', backdropFilter: 'blur(4px)' }}
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: '#6366f1', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)' }}
                              >
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Info */}
                      <div className="p-3.5">
                        <h4 className="text-sm font-semibold mb-1 transition-colors duration-200"
                          style={{ color: isHovered ? c.accent : c.text }}>
                          {template.name}
                        </h4>
                        <p className="text-[11px] line-clamp-2" style={{ color: c.textSec }}>
                          {rec.reasoning}
                        </p>
                        {/* Palette dots */}
                        {rec.palettes && rec.palettes.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {rec.palettes.slice(0, 5).map(palette => (
                              <div
                                key={palette.id}
                                className="w-4 h-4 rounded-full"
                                style={{
                                  background: palette.colors.primary,
                                  border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.08)',
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
          )}
        </div>
      )}

      {/* ── Separator ── */}
      {recommendations.length > 0 && templates.length > 0 && (
        <div
          className="h-px"
          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        />
      )}

      {/* ── All Templates ── */}
      {(templatesLoading || templates.length > 0 || templatesError) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid size={14} style={{ color: c.textSec }} />
            <span className="text-sm font-semibold" style={{ color: c.text }}>
              All Templates
            </span>
            {!templatesLoading && (
              <span className="text-[11px]" style={{ color: c.textTer }}>
                {filteredTemplates.length} available
              </span>
            )}
          </div>

          {templatesLoading && <GalleryLoadingState isDark={isDark} />}

          {templatesError && <GalleryErrorState isDark={isDark} error={templatesError} onRetry={onRetryTemplates} />}

          {!templatesLoading && !templatesError && (
            <>
              {/* Search + Category Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textTer }} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4" style={{ color: c.textTer }} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.slice(0, 6).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                      style={{
                        background: selectedCategory === category ? c.accentBg : c.inputBg,
                        border: selectedCategory === category ? `1px solid ${c.accentBorder}` : `1px solid ${c.border}`,
                        color: selectedCategory === category ? c.accent : c.textSec,
                      }}
                    >
                      {CATEGORY_LABELS[category] || category.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="py-12 text-center">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-3" style={{ color: c.textTer }} />
                  <p className="text-sm" style={{ color: c.textSec }}>No templates match your search</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="mt-2 text-xs font-medium"
                    style={{ color: c.accent }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index}
                        isDark={isDark}
                        isSelected={selectedId === template.id}
                        isHovered={hoveredId === template.id}
                        hasThumbnailError={thumbnailErrors.has(template.id)}
                        onMouseEnter={() => setHoveredId(template.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleTemplateClick(template)}
                        onPreview={e => { e.stopPropagation(); onPreview(template); }}
                        onThumbnailError={() => handleThumbnailError(template.id)}
                        data-testid={`all-template-card-${template.id}`}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** Skeleton for recommendation cards */
function RecommendationSkeleton({ isDark, index }: { isDark: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: isDark ? '#14141e' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div className="aspect-[16/10] relative overflow-hidden">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.06) 0%, rgba(77, 93, 217, 0.06) 100%)'
              : 'linear-gradient(135deg, rgba(77, 93, 217, 0.05) 0%, rgba(139, 92, 246, 0.08) 100%)',
          }}
        />
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        <div className="h-3 w-full rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }} />
      </div>
    </motion.div>
  );
}
