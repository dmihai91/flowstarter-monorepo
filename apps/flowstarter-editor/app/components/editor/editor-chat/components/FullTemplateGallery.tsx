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
import { Search, LayoutGrid, X } from 'lucide-react';
import type { Template } from '~/components/editor/editor-chat/types';
import { TemplateCard } from './TemplateCard';
import { GalleryLoadingState, GalleryErrorState } from './gallery-states';

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
    return <GalleryLoadingState isDark={isDark} />;
  }

  if (templatesError) {
    return <GalleryErrorState isDark={isDark} error={templatesError} onRetry={onRetry} />;
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
                onClick={() => handleSelect(template)}
                onPreview={(e) => { e.stopPropagation(); onPreview(template); }}
                onThumbnailError={() => handleThumbnailError(template.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default FullTemplateGallery;
