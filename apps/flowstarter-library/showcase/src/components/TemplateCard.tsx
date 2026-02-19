import React, { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';

export interface Palette {
  id: string;
  name: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
}

interface Template {
  slug: string;
  name: string;
  description: string;
  category?: string;
  color: string;
  thumbnail?: string;
  thumbnailLight?: string;
  thumbnailDark?: string;
  palettes?: Palette[];
  fonts?: Array<{ id: string; name: string; heading?: string; body?: string }>;
  features?: string[];
  tags?: string[];
}

interface TemplateCardProps {
  template: Template;
  darkMode: boolean;
  onPreview: (template: Template) => void;
}

const categoryColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  education: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300' },
  coaching: { bg: 'bg-teal-100', text: 'text-teal-700', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-300' },
  health: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-300' },
  creative: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  business: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
};

export function TemplateCard({ template, darkMode, onPreview }: TemplateCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const thumbnailUrl = darkMode 
    ? (template.thumbnailDark || template.thumbnail)
    : (template.thumbnailLight || template.thumbnail);

  const palettes = template.palettes || [];
  const primaryColor = palettes[0]?.colors?.primary || template.color || '#3b82f6';
  
  const categoryStyle = categoryColors[template.category || ''] || categoryColors.education;

  return (
    <article
      className="group relative bg-white dark:bg-surface-800/50 rounded-2xl overflow-hidden border border-surface-200/80 dark:border-surface-700/50 hover:border-brand-300/50 dark:hover:border-brand-600/30 transition-all duration-500 cursor-pointer hover:shadow-xl hover:shadow-surface-900/5 dark:hover:shadow-brand-500/5"
      onClick={() => onPreview(template)}
    >
      {/* Category badge */}
      {template.category && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBg} ${categoryStyle.darkText} backdrop-blur-sm`}>
            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100 dark:bg-surface-800">
        {/* Gradient placeholder */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%)`,
          }}
        />
        
        {!imageError && thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={template.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-[1.02] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {(imageError || !thumbnailUrl) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {template.name.charAt(0)}
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-surface-900/0 to-surface-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-90">
          <div className="w-14 h-14 rounded-full bg-white/95 dark:bg-surface-800/95 shadow-2xl flex items-center justify-center border border-surface-200/50 dark:border-surface-600/50">
            <Play className="w-6 h-6 text-brand-500 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {template.name}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-4 leading-relaxed">
          {template.description}
        </p>

        {/* Color palette swatches */}
        {palettes.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-surface-400 dark:text-surface-500">Palettes:</span>
            <div className="flex gap-1.5">
              {palettes.slice(0, 4).map((palette) => (
                <div
                  key={palette.id}
                  className="flex rounded-md overflow-hidden border border-surface-200 dark:border-surface-600 shadow-sm"
                  title={palette.name}
                >
                  {[palette.colors?.primary, palette.colors?.secondary].filter(Boolean).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features tags */}
        {template.features && template.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {template.features.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="px-2 py-0.5 text-xs rounded-md bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400"
              >
                {feature}
              </span>
            ))}
            {template.features.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-md bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-500">
                +{template.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(template);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-medium text-sm hover:bg-surface-800 dark:hover:bg-surface-100 transition-all duration-200 group/btn"
        >
          <span>View Demo</span>
          <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}

export function TemplateCardSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="bg-white dark:bg-surface-800/50 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700/50">
      <div className="aspect-[4/3] bg-surface-100 dark:bg-surface-800 animate-pulse" />
      <div className="p-5">
        <div className="h-6 w-3/4 rounded-lg bg-surface-200 dark:bg-surface-700 mb-3 animate-pulse" />
        <div className="h-4 w-full rounded-lg bg-surface-100 dark:bg-surface-800 mb-2 animate-pulse" />
        <div className="h-4 w-2/3 rounded-lg bg-surface-100 dark:bg-surface-800 mb-4 animate-pulse" />
        <div className="flex gap-1.5 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-16 rounded-md bg-surface-100 dark:bg-surface-800 animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-full rounded-xl bg-surface-200 dark:bg-surface-700 animate-pulse" />
      </div>
    </div>
  );
}
