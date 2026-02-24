'use client';

import { ArrowUpRight, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AnimatedBenefitsVisual() {
  const [mounted, setMounted] = useState(false);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setAnimatedValues([
        Math.floor(Math.random() * 26) + 40, // 40-65%
        Math.floor(Math.random() * 26) + 45, // 45-70%
        Math.floor(Math.random() * 26) + 50, // 50-75%
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="flex flex-col gap-4 w-full">
        {[
          {
            icon: Zap,
            label: 'Time Saved',
            value: `${animatedValues[0]}%`,
            color: 'var(--green)',
            delay: '0s',
          },
          {
            icon: TrendingUp,
            label: 'Efficiency',
            value: `${animatedValues[1]}%`,
            color: 'var(--blue)',
            delay: '0.2s',
          },
          {
            icon: ArrowUpRight,
            label: 'Growth',
            value: `${animatedValues[2]}%`,
            color: 'var(--purple)',
            delay: '0.4s',
          },
        ].map((benefit, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-xl border border-white dark:border-white/40 animate-fade-in bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-lg"
            style={{
              animationDelay: benefit.delay,
            }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(243,243,243,0.5)] dark:bg-[rgba(58,58,74,0.5)]">
              <benefit.icon
                className="w-5 h-5"
                style={{ color: benefit.color }}
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {benefit.label}
              </div>
              <div
                className="text-xl font-bold transition-all duration-500"
                style={{ color: benefit.color }}
              >
                {benefit.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
