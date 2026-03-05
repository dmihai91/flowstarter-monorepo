/**
 * Gallery state components: loading skeletons and error display.
 * Extracted from FullTemplateGallery for SRP compliance.
 */

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SkeletonCardProps {
  isDark: boolean;
  index: number;
}

export const SkeletonCard = ({ isDark, index }: SkeletonCardProps) => (
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

interface GalleryLoadingStateProps {
  isDark: boolean;
}

export function GalleryLoadingState({ isDark }: GalleryLoadingStateProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2 mb-4">
        <div
          className="h-10 flex-1 rounded-xl animate-pulse"
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} isDark={isDark} index={i} />
        ))}
      </div>
    </div>
  );
}

interface GalleryErrorStateProps {
  isDark: boolean;
  error: string;
  onRetry: () => void;
}

export function GalleryErrorState({ isDark, error, onRetry }: GalleryErrorStateProps) {
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
