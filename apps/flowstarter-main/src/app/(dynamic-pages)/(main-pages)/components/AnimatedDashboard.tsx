'use client';

import {
  BarChart3,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function AnimatedDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="relative w-full h-full flex flex-col p-6 gap-4"
      style={{ backgroundColor: 'var(--surface-1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--copy-headlines)' }}
        >
          Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
            style={{ backgroundColor: 'var(--surface-2)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--purple)' }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: FileText,
            value: '12',
            label: 'Projects',
            color: 'var(--purple)',
          },
          { icon: Users, value: '1.2k', label: 'Users', color: 'var(--blue)' },
          {
            icon: TrendingUp,
            value: '+24%',
            label: 'Growth',
            color: 'var(--green)',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg backdrop-blur-xl border border-white dark:border-white/40 animate-fade-in"
            style={{
              backgroundColor: 'var(--surface-2)',
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface-1)' }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: 'var(--copy-headlines)' }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--copy-labels)' }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div
        className="flex-1 rounded-lg backdrop-blur-xl border border-white dark:border-white/40 p-4 animate-fade-in"
        style={{ backgroundColor: 'var(--surface-2)', animationDelay: '0.3s' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--copy-headlines)' }}
          >
            Analytics
          </h3>
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--purple)' }} />
        </div>
        <div className="flex items-end gap-2 h-32">
          {[40, 60, 45, 80, 55, 70, 65].map((height, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t transition-all duration-500 animate-fade-in"
              style={{
                height: `${height}%`,
                backgroundColor:
                  idx % 2 === 0 ? 'var(--purple)' : 'var(--blue)',
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: `${0.4 + idx * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-lg backdrop-blur-xl border border-white dark:border-white/40 p-4 animate-fade-in"
        style={{ backgroundColor: 'var(--surface-2)', animationDelay: '0.5s' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center animate-spin"
            style={{ backgroundColor: 'var(--surface-1)' }}
          >
            <Zap className="w-4 h-4" style={{ color: 'var(--green)' }} />
          </div>
          <div className="flex-1">
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--copy-headlines)' }}
            >
              Generating your site...
            </div>
            <div className="text-xs" style={{ color: 'var(--copy-labels)' }}>
              AI is creating your perfect website
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
