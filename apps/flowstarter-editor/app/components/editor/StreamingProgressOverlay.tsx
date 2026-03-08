/**
 * StreamingProgressOverlay
 *
 * Shown over the preview panel while the agent is streaming files to the sandbox.
 * Disappears once streaming stops and the preview is available.
 * Uses flow design system CSS vars — same glass aesthetic as the rest of the editor.
 */

interface StreamingProgressOverlayProps {
  isStreaming: boolean;
  streamedFiles: string[];   // last 5 file paths
  streamedCount: number;
}

export function StreamingProgressOverlay({
  isStreaming,
  streamedFiles,
  streamedCount,
}: StreamingProgressOverlayProps) {
  if (!isStreaming) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(10, 10, 12, 0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-xl px-8 py-6 min-w-[280px]"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--glass-surface, #1a1a1f) 90%, transparent)',
          border: '1px solid transparent',
          borderTopColor: 'var(--glass-border-highlight, rgba(255,255,255,0.12))',
          borderLeftColor: 'var(--glass-border-highlight, rgba(255,255,255,0.12))',
          borderBottomColor: 'var(--glass-border-shadow, rgba(0,0,0,0.3))',
          borderRightColor: 'var(--glass-border-shadow, rgba(0,0,0,0.3))',
          boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.4))',
        }}
      >
        {/* Header */}
        <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#71717a] mb-4">
          Building your site...
        </p>

        {/* File list */}
        <div className="space-y-1 mb-4 min-h-[80px]">
          {streamedFiles.map((file, i) => (
            <p
              key={i}
              className={`text-[11px] font-mono truncate ${
                i === streamedFiles.length - 1
                  ? 'text-[#d4d4d8]'
                  : 'text-[#52525b]'
              }`}
            >
              {i === streamedFiles.length - 1 ? '→ ' : '  '}
              {file}
            </p>
          ))}
          {streamedFiles.length === 0 && (
            <p className="text-[11px] font-mono text-[#3f3f46]">Initializing agent...</p>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple,#4d5dd9)] animate-pulse shrink-0" />
          <span className="text-[10px] font-mono text-[#52525b]">
            {streamedCount} file{streamedCount !== 1 ? 's' : ''} written
          </span>
        </div>
      </div>
    </div>
  );
}
