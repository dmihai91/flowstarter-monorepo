import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '~/lib/hooks/useTemplates';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import type { Template } from '~/components/onboarding';

interface StarterTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  landing: '#4D5DD9',
  'local-business': '#2563eb',
  portfolio: '#7c3aed',
  'personal-brand': '#ea580c',
  blog: '#16a34a',
  ecommerce: '#ca8a04',
  'saas-product': '#db2777',
};

const StarterTemplates: React.FC<StarterTemplatesProps> = ({ onSelectTemplate }) => {
  const { templates, isLoading } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(templates.map((t) => t.category))), [templates]);

  const filteredTemplates = useMemo(
    () => (selectedCategory ? templates.filter((t) => t.category === selectedCategory) : templates),
    [templates, selectedCategory],
  );

  const handleTemplateClick = (template: Template) => {
    onSelectTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--flowstarter-accent-purple)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-flowstarter-elements-textSecondary">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-flowstarter-elements-textPrimary mb-2">
          Choose a template to get started
        </h2>
        <p className="text-sm text-flowstarter-elements-textSecondary">
          Pick a starting point for your project, or describe what you want to build
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-[var(--flowstarter-accent-purple)] text-white'
                : 'bg-flowstarter-elements-background-depth-3 text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--flowstarter-accent-purple)] text-white'
                  : 'bg-flowstarter-elements-background-depth-3 text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleTemplateClick(template)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative overflow-hidden rounded-xl border border-flowstarter-elements-borderColor bg-flowstarter-elements-background-depth-2 hover:border-[var(--flowstarter-accent-purple)]/50 transition-all duration-200 text-left"
            >
              {/* Thumbnail */}
              <div className="aspect-[16/10] w-full bg-gradient-to-br from-flowstarter-elements-background-depth-3 to-flowstarter-elements-background-depth-4 relative overflow-hidden">
                <img
                  src={template.thumbnail || getTemplateThumbnailUrl(template.id)}
                  alt={template.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Category Badge */}
                <span
                  className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold text-white capitalize shadow-lg"
                  style={{
                    background: CATEGORY_COLORS[template.category] || '#4D5DD9',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {template.category}
                </span>

                {/* Hover Overlay */}
                <motion.div
                  initial={false}
                  animate={{ opacity: hoveredId === template.id ? 1 : 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <span className="px-4 py-2 rounded-lg bg-[var(--flowstarter-accent-purple)] text-white text-sm font-medium shadow-lg">
                    Use Template
                  </span>
                </motion.div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-flowstarter-elements-textPrimary group-hover:text-[#4338ca] dark:group-hover:text-[#818cf8] transition-colors truncate">
                  {template.name}
                </h3>
                <p className="text-xs text-flowstarter-elements-textSecondary line-clamp-2 mt-1">
                  {template.description}
                </p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-flowstarter-elements-background-depth-3 flex items-center justify-center mb-4">
            <div className="i-ph:files-duotone text-3xl text-flowstarter-elements-textTertiary" />
          </div>
          <p className="text-flowstarter-elements-textSecondary">No templates found</p>
        </div>
      )}

      {/* Or type prompt */}
      <div className="text-center mt-8 pt-6 border-t border-flowstarter-elements-borderColor">
        <p className="text-sm text-flowstarter-elements-textTertiary">
          Or describe what you want to build in the chat below
        </p>
      </div>
    </div>
  );
};

export default StarterTemplates;
