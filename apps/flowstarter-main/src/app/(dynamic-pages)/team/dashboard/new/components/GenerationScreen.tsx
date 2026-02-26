'use client';

import { Sparkles, Check } from 'lucide-react';
import { generationSteps, cardClass } from '../constants';

interface GenerationScreenProps {
  currentStep: string;
}

export function GenerationScreen({ currentStep }: GenerationScreenProps) {
  const currentIdx = generationSteps.findIndex((gs) => gs.id === currentStep);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--purple)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xl mx-auto px-6">
        <div className={`${cardClass} w-full p-6`}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/25">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              {/* Spinning ring */}
              <div className="absolute inset-0 -m-1">
                <svg className="w-16 h-16 animate-spin" style={{ animationDuration: '3s' }}>
                  <circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray="60 140"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--purple)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Creating Your Project</h1>
              <p className="text-sm text-gray-500 dark:text-white/50">AI is generating your business profile...</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {generationSteps.map((gs, idx) => {
              const isComplete = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div
                  key={gs.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[var(--purple)]/10 border border-[var(--purple)]/20'
                      : isComplete
                      ? 'bg-green-500/5'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-[var(--purple)] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-[var(--purple)]'
                        : isComplete
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {gs.label}
                  </span>
                  {isCurrent && (
                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--purple)] animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
