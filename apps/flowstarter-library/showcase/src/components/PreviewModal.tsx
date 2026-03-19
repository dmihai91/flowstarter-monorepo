import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface PaletteColor {
  primary?: string;
  'primary-dark'?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  'text-muted'?: string;
}

export interface Palette {
  id: string;
  name: string;
  colors?: PaletteColor;
}

export interface Font {
  id: string;
  name: string;
  heading?: string;
  body?: string;
  googleFonts?: string;
}

interface Template {
  slug: string;
  name: string;
  palettes?: Palette[];
  fonts?: Font[];
}

interface PreviewModalProps {
  template: Template;
  darkMode: boolean;
  onClose: () => void;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

// Generate CSS overrides from palette colors — covers all Tailwind primary/accent variants
function buildPaletteCss(colors: PaletteColor): string {
  const p   = colors.primary          || '';
  const pd  = colors['primary-dark']  || p;
  const sec = colors.secondary        || '';
  const ac  = colors.accent           || p;
  const bg  = colors.background       || '';
  const sur = colors.surface          || bg;
  const txt = colors.text             || '';
  const muted = colors['text-muted']  || '';
  if (!p) return '';
  return `
    /* ── CSS variable override — use html selector with !important to beat html.dark { } specificity ── */
    html {
      ${p   ? `--color-primary: ${p} !important;` : ''}
      ${pd  ? `--color-primary-dark: ${pd} !important; --color-primary-light: ${pd} !important;` : ''}
      ${sec ? `--color-secondary: ${sec} !important;` : ''}
      ${ac  ? `--color-accent: ${ac} !important;` : ''}
      ${bg  ? `--color-background: ${bg} !important;` : ''}
      ${sur ? `--color-surface: ${sur} !important;` : ''}
      ${txt ? `--color-text: ${txt} !important;` : ''}
      ${muted ? `--color-text-muted: ${muted} !important;` : ''}
      ${bg  ? `background-color: ${bg} !important;` : ''}
      --pal-p: ${p}; --pal-pd: ${pd}; --pal-ac: ${ac};
    }
    body { ${bg ? `background-color: ${bg} !important;` : ''} ${txt ? `color: ${txt} !important;` : ''} }
    /* ── Tailwind utility class overrides ── */
    .bg-primary                { background-color: ${p}  !important }
    .bg-primary-dark           { background-color: ${pd} !important }
    .text-primary              { color:            ${p}  !important }
    .border-primary            { border-color:     ${p}  !important }
    .ring-primary              { --tw-ring-color:  ${p}  !important }
    .from-primary              { --tw-gradient-from: ${p} !important }
    .to-primary                { --tw-gradient-to:   ${p} !important }
    .text-accent               { color:            ${ac} !important }
    .bg-accent                 { background-color: ${ac} !important }
    .border-accent             { border-color:     ${ac} !important }
    .hover\\:bg-primary:hover      { background-color: ${p}  !important }
    .hover\\:bg-primary-dark:hover { background-color: ${pd} !important }
    .hover\\:text-primary:hover    { color:            ${p}  !important }
    .focus\\:border-primary:focus  { border-color:     ${p}  !important }
    .focus\\:ring-primary:focus    { --tw-ring-color:  ${p}  !important }
    .btn-primary  { background-color: ${p}  !important; border-color: ${p} !important }
    .btn-outline  { border-color: ${p} !important; color: ${p} !important }
    .btn-outline:hover { background-color: ${p} !important }

  `.trim();
}

function injectPalette(iframe: HTMLIFrameElement, palette: Palette | null): void {
  if (!iframe.contentWindow || !palette?.colors) return;
  // Use postMessage — iframe is cross-origin (port 4100 vs 2000), contentDocument throws SecurityError
  iframe.contentWindow.postMessage({
    source: 'fs-preview',
    type: 'setPalette',
    css: buildPaletteCss(palette.colors),
  }, '*');
}

function applyTheme(iframe: HTMLIFrameElement, dark: boolean): void {
  // Try direct DOM first (same-origin fast path), then postMessage fallback
  try {
    const html = iframe.contentDocument?.documentElement;
    if (html) {
      html.classList.toggle('dark', dark);
      try { iframe.contentWindow?.localStorage?.setItem('theme', dark ? 'dark' : 'light'); } catch(_) {}
      return;
    }
  } catch(_) {}
  iframe.contentWindow?.postMessage({ source: 'fs-preview', type: 'setTheme', value: dark ? 'dark' : 'light' }, '*');
}

function applyFont(iframe: HTMLIFrameElement, font: Font | null): void {
  if (!font) return;
  // Build Google Fonts URL from font config
  const families: string[] = [];
  if (font.heading) families.push(font.heading.replace(/ /g, '+') + ':wght@300;400;600;700');
  if (font.body && font.body !== font.heading) families.push(font.body.replace(/ /g, '+') + ':wght@400;500');
  const url = families.length > 0
    ? `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`
    : '';
  // Use postMessage — font injection always needs it since fonts are in <head>
  iframe.contentWindow?.postMessage({
    source: 'fs-preview',
    type: 'setFont',
    url,
    heading: font.heading ? `"${font.heading}", serif` : undefined,
    body:    font.body    ? `"${font.body}", sans-serif` : undefined,
  }, '*');
}

function MonitorIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}
function TabletIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
}
function PhoneIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
}
function XIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function MoonIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SunIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function ExternalIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}

const VIEW_MODES: { mode: ViewMode; icon: (p: { className?: string }) => React.ReactElement; label: string; width: string }[] = [
  { mode: 'desktop', icon: MonitorIcon,  label: 'Desktop', width: 'w-full' },
  { mode: 'tablet',  icon: TabletIcon,   label: 'Tablet',  width: 'mx-auto w-[768px]' },
  { mode: 'mobile',  icon: PhoneIcon,    label: 'Mobile',  width: 'mx-auto w-[390px]' },
];

export function PreviewModal({ template, darkMode, onClose }: PreviewModalProps): React.ReactElement {
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(template.palettes?.[0] || null);
  const [selectedFont,    setSelectedFont]    = useState<Font | null>(template.fonts?.[0] || null);
  const [userPickedPalette, setUserPickedPalette] = useState<Palette | null>(null);
  const [isDark, setIsDark] = useState<boolean>(darkMode); // independent dark toggle per preview
  const defaultView: ViewMode = typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop';
  const [viewMode,        setViewMode]        = useState<ViewMode>(defaultView);
  const [iframeReady,     setIframeReady]     = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Refs for stale-closure-safe access in handleLoad
  const darkModeRef = useRef(isDark);
  const selectedPaletteRef = useRef(selectedPalette);
  const selectedFontRef = useRef(selectedFont);
  useEffect(() => { darkModeRef.current = isDark; }, [isDark]);
  useEffect(() => { selectedPaletteRef.current = selectedPalette; }, [selectedPalette]);
  useEffect(() => { selectedFontRef.current = selectedFont; }, [selectedFont]);

  // Auto-switch to dark palette (palette-6) when dark mode is toggled
  useEffect(() => {
    if (!template.palettes?.length) return;
    if (userPickedPalette) return; // respect explicit user choice
    const idx = isDark ? template.palettes.length - 1 : 0; // palette-6 or palette-1
    setSelectedPalette(template.palettes[idx] || template.palettes[0]);
  }, [isDark, template.palettes, userPickedPalette]);

  const palettes = template.palettes || [];
  const fonts    = template.fonts    || [];

  // Reset when template changes
  useEffect(() => {
    const palettes = template.palettes || [];
    const defaultPalette = isDark && palettes.length > 1
      ? palettes[palettes.length - 1]  // palette-6 for dark mode
      : palettes[0] || null;
    setSelectedPalette(defaultPalette);
    setUserPickedPalette(null);
    setSelectedFont(template.fonts?.[0] || null);
    setViewMode(typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop');
    setIframeReady(false);
  }, [template.slug]);  // eslint-disable-line react-hooks/exhaustive-deps — isDark via ref

  // Keyboard + scroll lock
  const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [handleEscape]);

  // Listen for theme toggle messages from inside the template iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'fs-themeChanged') {
        // template toggled its own theme — we just let it, no need to sync back to parent
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // iframe src — only slug drives a reload; theme+palette+font all handled via postMessage/DOM
  const iframeSrc = useMemo(() => {
    return `/templates/${template.slug}/`;
  }, [template.slug]);

  // Pretty URL shown in the fake browser bar
  const prettyUrl = `${template.slug}.flowstarter.app`;

  // When iframe finishes loading: apply theme + palette + font
  const handleLoad = useCallback(() => {
    setIframeReady(true);
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Delay to let the iframe's own scripts + postMessage listener initialize
    setTimeout(() => {
      applyTheme(iframe, darkModeRef.current);
      injectPalette(iframe, selectedPaletteRef.current);
      applyFont(iframe, selectedFontRef.current);
    }, 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — uses refs, not stale closures

  // When darkMode changes: update theme + re-inject palette (colors depend on dark/light)
  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return;
    applyTheme(iframeRef.current, isDark);
    // small delay so html.dark class settles before palette vars override
    setTimeout(() => {
      if (iframeRef.current) injectPalette(iframeRef.current, selectedPaletteRef.current);
    }, 50);
  }, [isDark, iframeReady]);

  // When palette changes: inject CSS in-place (no reload)
  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return;
    injectPalette(iframeRef.current, selectedPalette);
  }, [selectedPalette, iframeReady]);

  // When font changes: send via postMessage (no reload)
  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return;
    applyFont(iframeRef.current, selectedFont);
  }, [selectedFont, iframeReady]);

  const currentWidth = VIEW_MODES.find(v => v.mode === viewMode)?.width || 'w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={onClose} aria-hidden />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white md:max-h-[96vh] md:rounded-3xl md:border md:border-neutral-200 dark:bg-neutral-900 dark:md:border-neutral-800"
        role="dialog" aria-modal="true" aria-labelledby="preview-title"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-500">Live Preview</p>
            <h2 id="preview-title" className="truncate font-display text-lg font-bold text-neutral-900 dark:text-white">{template.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${viewMode === mode ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
              <button
                onClick={() => setIsDark(d => !d)}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-yellow-300 shadow-sm' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </button>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" aria-label="Close">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Palette + Font row */}
        {(palettes.length > 0 || fonts.length > 0) && (
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 md:px-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {palettes.map((palette) => {
                const active = selectedPalette?.id === palette.id;
                return (
                  <button
                    key={palette.id}
                    onClick={() => {
                      setSelectedPalette(palette);
                      setUserPickedPalette(palette);
                      // sync dark mode to palette: palette-6 = dark, others = light
                      const isLastPalette = palettes.indexOf(palette) === palettes.length - 1;
                      setIsDark(isLastPalette);
                    }}
                    title={palette.name}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-all md:px-3 md:text-sm ${active ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'}`}
                  >
                    <span className="h-4 w-4 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: palette.colors?.primary || '#8b5cf6' }} />
                    <span className="hidden sm:inline">{palette.name}</span>
                  </button>
                );
              })}

              {palettes.length > 0 && fonts.length > 0 && (
                <div className="mx-1 h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700" />
              )}

              {fonts.map((font) => {
                const active = selectedFont?.id === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font)}
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm ${active ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'}`}
                  >
                    {font.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Browser chrome + iframe */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-3 dark:bg-neutral-950 md:p-5">
          <div className={`${currentWidth} transition-all duration-300`}>
            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="ml-3 flex min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  <span className="truncate">{prettyUrl}</span>
                  <ExternalIcon className="h-3 w-3 shrink-0" />
                </div>
              </div>

              <iframe
                ref={iframeRef}
                key={iframeSrc}
                title={`${template.name} preview`}
                src={iframeSrc}
                onLoad={handleLoad}
                className="h-[calc(100vh-180px)] w-full bg-white md:h-[calc(96vh-200px)]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 md:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {selectedPalette && (
              <span className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 dark:border-purple-500/30 dark:bg-purple-500/10">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedPalette.colors?.primary || '#8b5cf6' }} />
                <span className="font-semibold text-purple-700 dark:text-purple-300">{selectedPalette.name}</span>
              </span>
            )}
            {selectedFont && (
              <span className="rounded-full border border-neutral-200 px-3 py-1 font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                {selectedFont.name}
              </span>
            )}
          </div>
          <a
            href={`/templates/${template.slug}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-700"
          >
            Open full preview <ExternalIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
