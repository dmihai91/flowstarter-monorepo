/**
 * BuildActivityFeed — Lovable/Bolt-style live build activity panel.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityEvent } from './AgentActivityLog';

interface BuildActivityFeedProps {
  events: ActivityEvent[];
  isDark: boolean;
  buildPhase?: string;
  progress?: number;
  currentStep?: string;
}

function fileColour(path: string): string {
  if (path.endsWith('.astro')) return '#e879f9';
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return '#60a5fa';
  if (path.endsWith('.css') || path.endsWith('.scss')) return '#34d399';
  if (path.endsWith('.json')) return '#fbbf24';
  if (path.endsWith('.mjs') || path.endsWith('.js')) return '#facc15';
  return '#a1a1aa';
}

function fileIcon(path: string): string {
  if (path.endsWith('.astro')) return '🚀';
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return '⬡';
  if (path.endsWith('.css') || path.endsWith('.scss')) return '◈';
  if (path.endsWith('.json')) return '{}';
  if (path.endsWith('.mjs') || path.endsWith('.js')) return '⚡';
  return '◻';
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Preparing',
  generating: 'AI is crafting your site',
  deploying: 'Uploading to sandbox',
  'deploying-upload': 'Uploading files',
  'deploying-install': 'Installing dependencies',
  'deploying-server': 'Starting dev server',
  'deploying-waiting': 'Launching preview',
  fixing: 'Auto-fixing errors',
  'fixing-retry': 'Retrying build',
  complete: 'Build complete',
  'complete-healed': 'Build complete',
  error: 'Build failed',
};

const PHASE_COLOUR: Record<string, string> = {
  generating: '#818cf8',
  deploying: '#34d399',
  'deploying-upload': '#34d399',
  'deploying-install': '#34d399',
  'deploying-server': '#34d399',
  'deploying-waiting': '#34d399',
  fixing: '#fbbf24',
  'fixing-retry': '#fbbf24',
  complete: '#4ade80',
  'complete-healed': '#4ade80',
  error: '#f87171',
};

function TypewriterText({ text, isDark }: { text: string; isDark: boolean }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, idxRef.current + 1));
        idxRef.current++;
      } else clearInterval(iv);
    }, 10);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span style={{ color: isDark ? 'rgba(165,180,252,0.9)' : '#4338ca' }}>
      {displayed}
      <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.65 }}
        style={{ display:'inline-block', width:'1px', height:'0.7em', background:'currentColor', verticalAlign:'middle', marginLeft:'1px' }} />
    </span>
  );
}

export function BuildActivityFeed({ events, isDark, buildPhase = 'generating', progress = 0, currentStep }: BuildActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const isActive = !['complete','complete-healed','error','idle'].includes(buildPhase);
  const label = PHASE_LABELS[buildPhase] || 'Building';
  const colour = PHASE_COLOUR[buildPhase] || '#818cf8';
  const pct = Math.round(progress ?? 0);

  const bg = isDark ? 'rgba(10,10,16,0.97)' : 'rgba(250,250,253,0.98)';
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const muted = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)';
  const body = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.78)';

  const visible = showAll ? events : events.slice(-22);
  const hidden = events.length - visible.length;
  const fileCount = events.filter(e => e.type === 'tool_call' && 'action' in e && (e.action === 'create' || e.action === 'edit')).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="ml-10 my-3 overflow-hidden"
      style={{ background: bg, border: `1px solid ${borderCol}`, borderRadius: '14px', maxWidth: '360px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${borderCol}` }}>
        <div className="flex items-center gap-2">
          <div className="relative w-3.5 h-3.5 flex items-center justify-center">
            {isActive && (
              <motion.div className="absolute w-3.5 h-3.5 rounded-full" style={{ background: colour, opacity: 0.2 }}
                animate={{ scale: [1, 2, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} />
            )}
            <div className="w-2 h-2 rounded-full" style={{ background: colour }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: colour, letterSpacing: '0.01em' }}>{label}</span>
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: muted }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${colour}70, ${colour}dd)` }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>

      {/* Log */}
      <div ref={scrollRef} style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px 0' }}>
        {hidden > 0 && (
          <button onClick={() => setShowAll(true)} className="w-full text-center py-1 text-xs hover:opacity-70 transition-opacity" style={{ color: muted }}>
            ↑ {hidden} earlier
          </button>
        )}
        <AnimatePresence initial={false}>
          {visible.map((ev, i) => {
            const isLast = i === visible.length - 1;
            if (ev.type === 'thinking' && 'text' in ev && ev.text) return (
              <motion.div key={ev.id} initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} className="flex items-start gap-2 px-4 py-1">
                <span className="text-xs mt-0.5 shrink-0" style={{ color: muted }}>✦</span>
                <span className="text-xs leading-relaxed">
                  {isLast && isActive ? <TypewriterText text={ev.text} isDark={isDark} /> : <span style={{ color: muted }}>{ev.text}</span>}
                </span>
              </motion.div>
            );
            if (ev.type === 'tool_call' && 'path' in ev && (ev.action === 'create' || ev.action === 'edit')) {
              const col = fileColour(ev.path);
              const icon = fileIcon(ev.path);
              const filename = ev.path.split('/').pop() ?? ev.path;
              const dir = ev.path.includes('/') ? ev.path.slice(0, ev.path.lastIndexOf('/') + 1) : '';
              return (
                <motion.div key={ev.id} initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} className="flex items-center gap-2 px-4 py-0.5">
                  <span className="text-xs shrink-0 w-4 text-center" style={{ color: col }}>{icon}</span>
                  <span className="text-xs font-mono truncate" style={{ maxWidth:'270px' }}>
                    <span style={{ color: muted }}>{dir}</span>
                    <span style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight:500 }}>{filename}</span>
                  </span>
                  {isLast && isActive && (
                    <motion.span className="ml-auto text-xs shrink-0" animate={{ opacity:[0.3,1,0.3] }} transition={{ repeat:Infinity, duration:1.1 }} style={{ color: col }}>···</motion.span>
                  )}
                </motion.div>
              );
            }
            if (ev.type === 'fix' && 'reasoning' in ev) return (
              <motion.div key={ev.id} initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} className="flex items-center gap-2 px-4 py-1">
                <span className="text-xs shrink-0" style={{ color: colour }}>→</span>
                <span className="text-xs" style={{ color: body }}>{'reasoning' in ev ? ev.reasoning : ''}</span>
              </motion.div>
            );
            return null;
          })}
        </AnimatePresence>
        {isActive && currentStep && (
          <motion.div className="flex items-center gap-2 px-4 py-1" animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.5 }}>
            <span className="text-xs font-mono" style={{ color: muted }}>$</span>
            <span className="text-xs font-mono" style={{ color: isDark ? '#a5b4fc' : '#4338ca' }}>{currentStep}</span>
          </motion.div>
        )}
        {events.length === 0 && (
          <div className="px-4 py-2 flex items-center gap-2">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: colour }} animate={{ opacity:[0.3,1,0.3] }} transition={{ repeat:Infinity, duration:1 }} />
            <span className="text-xs font-mono" style={{ color: muted }}>Initializing...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {fileCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderTop: `1px solid ${borderCol}` }}>
          <motion.div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colour }}
            animate={isActive ? { opacity:[0.4,1,0.4] } : { opacity:1 }} transition={isActive ? { repeat:Infinity, duration:1.2 } : {}} />
          <span className="text-xs font-mono" style={{ color: muted }}>{fileCount} file{fileCount !== 1 ? 's' : ''} written</span>
        </div>
      )}
    </motion.div>
  );
}
