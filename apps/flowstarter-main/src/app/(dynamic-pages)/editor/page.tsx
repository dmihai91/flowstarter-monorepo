'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
}

/**
 * Editor Home
 * 
 * A focused starting point: pick a template or start fresh.
 * Dark, atmospheric, with distinctive typography and subtle motion.
 */
export default function EditorHomePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/editor/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startProject = (template?: Template) => {
    const projectId = `proj_${Date.now()}`;
    if (template) {
      router.push(`/editor/${projectId}?template=${template.slug}&templateName=${encodeURIComponent(template.name)}`);
    } else {
      router.push(`/editor/${projectId}`);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 26 Q14 18, 20 22 Q26 26, 32 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <path d="M8 20 Q14 12, 20 16 Q26 20, 32 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
            Flowstarter
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/team/dashboard" 
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Hero section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-white">Build something </span>
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                exceptional
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              Choose a template crafted for your industry, or start with a blank canvas. 
              AI helps you customize every detail.
            </p>
          </div>

          {/* Start from scratch - prominent option */}
          <div className="mb-12">
            <button
              onClick={() => startProject()}
              className="group w-full max-w-md mx-auto flex items-center gap-5 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium mb-0.5">Start from scratch</div>
                <div className="text-white/40 text-sm">Describe your vision, AI builds it</div>
              </div>
              <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-12 max-w-4xl mx-auto">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="text-xs text-white/30 uppercase tracking-widest">or choose a template</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>

          {/* Templates grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <button
                  key={template.slug}
                  onClick={() => startProject(template)}
                  onMouseEnter={() => setHoveredTemplate(template.slug)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  className="group relative text-left rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden">
                    {template.thumbnailUrl ? (
                      <img 
                        src={template.thumbnailUrl} 
                        alt={template.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent transition-opacity duration-300 ${hoveredTemplate === template.slug ? 'opacity-90' : 'opacity-60'}`} />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-white/40 text-sm mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Category badge */}
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/[0.04] text-white/40 border border-white/[0.04]">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
