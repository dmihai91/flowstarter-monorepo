/**
 * FullTemplateGallery Component
 * 
 * Displays ALL available templates in a grid for manual selection.
 * Used in the internal flow (concierge) where the user picks their own template.
 * 
 * Features:
 * - Grid layout showing all templates
 * - Search/filter by category
 * - Preview on hover/click
 * - Responsive design (2-3 columns)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, LayoutGrid, X } from 'lucide-react';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import { getCategoryColors } from '~/components/editor/editor-chat/constants';
import type { Template } from '~/components/editor/editor-chat/types';

interface FullTemplateGalleryProps {
  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;
  isDark: boolean;
  onTemplateSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  onRetry: () => void;
}

// Category labels for filter
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Templates',
  'health-wellness': 'Health & Wellness',
  'health-fitness': 'Fitness',
  'beauty-wellness': 'Beauty',
  'personal-brand': 'Personal Brand',
  'local-business': 'Local Business',
  education: 'Education',
  creative: 'Creative',
};

// Skeleton loading card
const SkeletonCard = ({ isDark, index }: { isDark: boolean; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="rounded-2xl overflow-hidden"
    style={{
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(24px)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
    }}
  >
    <div className="aspect-[16/10] relative overflow-hidden">
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(77, 93, 217, 0.05) 0%, rgba(6, 182, 212, 0.04) 100%)',
        }}
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

export function FullTemplateGallery({
  templates,
  templatesLoading,
  templatesError,
  isDark,
  onTemplateSelect,
  onPreview,
  onRetry,
}: FullTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());

  // Get unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return ['all', ...Array.from(cats)];
  }, [templates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.category?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleThumbnailError = (templateId: string) => {
    setThumbnailErrors(prev => new Set(prev).add(templateId));
  };

  const handleSelect = (template: Template) => {
    setSelectedId(template.id);
    setTimeout(() => {
      onTemplateSelect(template);
    }, 200);
  };

  if (templatesLoading) {
    return (
      <div className="space-y-4 mt-4">
        {/* Header skeleton */}
        <div className="flex gap-2 mb-4">
          <div
            className="h-10 flex-1 rounded-xl animate-pulse"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} isDark={isDark} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-5 rounded-xl"
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
            <X className="w-5 h-5" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
              Failed to load templates
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
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
          />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDark ? '#fff' : '#1a1a2e',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X
                className="w-4 h-4"
                style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
              />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.slice(0, 5).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background:
                  selectedCategory === category
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.3)'
                      : 'rgba(99, 102, 241, 0.15)'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.8)',
                border:
                  selectedCategory === category
                    ? '1px solid rgba(99, 102, 241, 0.5)'
                    : isDark
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                color:
                  selectedCategory === category
                    ? isDark
                      ? '#a5b4fc'
                      : '#4338ca'
                    : isDark
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.7)',
              }}
            >
              {CATEGORY_LABELS[category] || category.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs"
          style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
        >
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center"
        >
          <LayoutGrid
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
          />
          <p
            className="text-sm"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
          >
            No templates match your search
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 text-xs font-medium"
            style={{ color: isDark ? '#818cf8' : '#4338ca' }}
          >
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, index) => {
              const colors = getCategoryColors(template.category || 'default');
              const thumbnailUrl = template.thumbnail || getTemplateThumbnailUrl(template.id, isDark ? 'dark' : 'light');
              const hasThumbnailError = thumbnailErrors.has(template.id);
              const isSelected = selectedId === template.id;
              const isHovered = hoveredId === template.id;

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(template)}
                  className="group rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(24px)',
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
                      ? '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)'
                      : isHovered
                        ? isDark
                          ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                          : '0 12px 40px rgba(0, 0, 0, 0.1)'
                        : isDark
                          ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.06)',
                    transform: isHovered && !isSelected ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.25s ease-out',
                  }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`}
                      style={{ opacity: hasThumbnailError ? 1 : 0.1 }}
                    />
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
                    <span
                      className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold rounded-md capitalize"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      {template.category?.replace('-', ' ') || 'Template'}
                    </span>

                    {/* Preview button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template);
                      }}
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      title="Preview template"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </motion.button>

                    {/* Use template button on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-2.5 right-2.5 left-2.5 flex justify-center"
                        >
                          <span
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md flex items-center gap-1.5"
                            style={{
                              background: 'rgba(99, 102, 241, 0.9)',
                              color: '#fff',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                            }}
                          >
                            Use this template
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
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
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
                        className="text-[11px] line-clamp-2"
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
      )}
    </div>
  );
}

export default FullTemplateGallery;
