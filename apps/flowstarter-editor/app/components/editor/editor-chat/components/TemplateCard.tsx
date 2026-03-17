import { motion, AnimatePresence } from 'framer-motion';
import { getTemplateThumbnailUrl } from '~/lib/config/templates';
import { getCategoryColors } from '~/components/editor/editor-chat/constants';
import type { Template } from '~/components/editor/editor-chat/types';

interface TemplateCardProps {
  template: Template;
  index: number;
  isDark: boolean;
  isSelected: boolean;
  isHovered: boolean;
  hasThumbnailError: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onPreview: (e: React.MouseEvent) => void;
  onThumbnailError: () => void;
  'data-testid'?: string;
}

export function TemplateCard({
  template, index, isDark, isSelected, isHovered,
  hasThumbnailError, onMouseEnter, onMouseLeave, onClick, onPreview, onThumbnailError,
  'data-testid': testId,
}: TemplateCardProps) {
  const colors = getCategoryColors(template.category || 'default');
  const thumbnailUrl = template.thumbnail || getTemplateThumbnailUrl(template.id, isDark ? 'dark' : 'light');

  const borderStyle = isSelected
    ? '2px solid rgba(99, 102, 241, 0.8)'
    : isHovered
      ? isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.8)'
      : isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)';

  const shadowStyle = isSelected
    ? '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)'
    : isHovered
      ? isDark ? '0 12px 40px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(0, 0, 0, 0.1)'
      : isDark ? '0 4px 24px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.06)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      data-testid={testId}
      className="group rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(24px)', border: borderStyle, boxShadow: shadowStyle,
        transform: isHovered && !isSelected ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease-out',
      }}
    >
      <div className="aspect-[16/10] relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`} style={{ opacity: hasThumbnailError ? 1 : 0.1 }} />
        {!hasThumbnailError ? (
          <img
            src={thumbnailUrl} alt={template.name}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ filter: isHovered ? 'brightness(1.05)' : 'brightness(1)', transform: isHovered ? 'scale(1.03)' : 'scale(1)' }}
            onError={onThumbnailError}
          />
        ) : (
          <div className="absolute inset-3 flex flex-col gap-1.5 opacity-60">
            <div className="h-2 rounded-sm w-1/2" style={{ background: colors.text, opacity: 0.5 }} />
            <div className="flex gap-1.5 flex-1">
              <div className="w-1/3 rounded-sm" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-1.5 rounded-full w-full" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
                <div className="h-1.5 rounded-full w-3/4" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{
          background: isDark ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 35%)',
        }} />

        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold rounded-md capitalize"
          style={{ background: colors.bg, color: colors.text, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
          {template.category?.replace('-', ' ') || 'Template'}
        </span>

        <motion.button
          onClick={onPreview}
          initial={{ opacity: 0.7 }} whileHover={{ opacity: 1, scale: 1.1 }} whileTap={{ scale: 0.95 }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}
          title="Preview template"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </motion.button>

        <AnimatePresence>
          {isHovered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }}
              className="absolute bottom-2.5 right-2.5 left-2.5 flex justify-center">
              <span className="px-4 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md flex items-center gap-1.5"
                style={{ background: 'rgba(99, 102, 241, 0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
                Use this template
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSelected && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(99, 102, 241, 0.3)', backdropFilter: 'blur(4px)' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(99, 102, 241, 1)', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)' }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3.5">
        <h4 className="text-sm font-semibold mb-0.5 transition-colors duration-200"
          style={{ color: isHovered ? (isDark ? '#818cf8' : '#4338ca') : isDark ? '#fff' : '#1a1a2e' }}>
          {template.name}
        </h4>
        {template.description && (
          <p className="text-[11px] line-clamp-2" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
            {template.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
