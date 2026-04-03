/**
 * DesignSchemePreview Component
 *
 * Renders a live preview of the design scheme with hero, stats, pricing, and FAQ sections.
 */

import React from 'react';
import type { PaletteState } from './useDesignSchemeState';

interface DesignSchemePreviewProps {
  palette: PaletteState;
  mode: 'light' | 'dark';
  font: string[];
  features: string[];
  getBorderRadius: () => string;
  getBoxShadow: () => string;
  getSpacingPixels: (key: string) => string;
  spacing: string;
}

export const DesignSchemePreview: React.FC<DesignSchemePreviewProps> = ({
  palette,
  mode,
  font,
  features,
  getBorderRadius,
  getBoxShadow,
  getSpacingPixels,
  spacing,
}) => {
  const fontFamily = font.join(', ');
  const currentPalette = palette[mode];
  const borderRadius = getBorderRadius();
  const boxShadow = getBoxShadow();
  const spacingPx = getSpacingPixels(spacing);

  return (
    <div
      className="h-full w-full overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: currentPalette.background,
        color: currentPalette.text,
        fontFamily,
        padding: spacingPx,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacingPx }}>
        {/* Hero Section */}
        <HeroSection
          palette={currentPalette}
          fontFamily={fontFamily}
          features={features}
          borderRadius={borderRadius}
          boxShadow={boxShadow}
        />

        {/* Stats Section */}
        <StatsSection palette={currentPalette} fontFamily={fontFamily} />

        {/* Pricing Cards */}
        <PricingSection
          palette={currentPalette}
          fontFamily={fontFamily}
          features={features}
          borderRadius={borderRadius}
          boxShadow={boxShadow}
        />

        {/* FAQ Section */}
        <FAQSection palette={currentPalette} fontFamily={fontFamily} />
      </div>
    </div>
  );
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

interface SectionProps {
  palette: Record<string, string>;
  fontFamily: string;
  features?: string[];
  borderRadius?: string;
  boxShadow?: string;
}

const HeroSection: React.FC<SectionProps> = ({ palette, fontFamily, features = [], borderRadius, boxShadow }) => (
  <div
    className="p-8 text-center"
    style={{
      borderRadius,
      border: features.includes('border') ? `1px solid ${palette.accent}` : 'none',
      backgroundColor: palette.background,
      color: palette.text,
    }}
  >
    <h1 className="text-3xl font-bold" style={{ color: palette.text, fontFamily }}>
      Ship faster with modern tools
    </h1>
    <p className="text-base mt-3" style={{ color: palette.text, opacity: 0.7, fontFamily }}>
      Build beautiful products that your users will love
    </p>
    <div className="mt-4 flex justify-center gap-4">
      <button
        className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
        style={{
          backgroundColor: palette.primary,
          color: '#ffffff',
          borderRadius,
          boxShadow,
        }}
      >
        Get started
      </button>
      <button
        className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
        style={{
          backgroundColor: 'transparent',
          color: palette.primary,
          borderRadius,
          border: `2px solid ${palette.primary}`,
        }}
      >
        View demo
      </button>
    </div>
  </div>
);

const StatsSection: React.FC<SectionProps> = ({ palette, fontFamily }) => {
  const stats = [
    { value: '50K+', label: 'Active users' },
    { value: '99%', label: 'Customer satisfaction' },
    { value: '24/7', label: 'Support available' },
    { value: '150+', label: 'Countries served' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-bold" style={{ color: palette.text, fontFamily }}>
          Trusted by teams everywhere
        </h2>
        <p className="text-sm" style={{ color: palette.text, opacity: 0.7, fontFamily }}>
          Join thousands of companies building better products faster
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-1 text-center">
            <div className="text-2xl font-bold" style={{ color: palette.primary, fontFamily }}>
              {stat.value}
            </div>
            <p className="text-xs" style={{ color: palette.text, opacity: 0.7, fontFamily }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingSection: React.FC<SectionProps> = ({ palette, fontFamily, features = [], borderRadius, boxShadow }) => {
  const plans = [
    {
      name: 'Starter',
      price: '$19',
      desc: 'Perfect for individuals and small projects',
      features: ['10 projects', '5GB storage', 'Basic analytics', 'Community support', 'API access'],
    },
    {
      name: 'Professional',
      price: '$79',
      desc: 'Advanced features for growing teams',
      features: [
        'Unlimited projects',
        '100GB storage',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {plans.map((plan, i) => (
        <div
          key={i}
          className="flex flex-col gap-6 p-6"
          style={{
            borderRadius,
            border: features.includes('border') ? `1px solid ${palette.accent}` : 'none',
            backgroundColor: palette.secondary,
            boxShadow,
            background:
              i === 1 && features.includes('gradient')
                ? `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`
                : palette.secondary,
          }}
        >
          <div className="flex flex-col space-y-1.5">
            <div className="font-medium" style={{ color: palette.primary, fontFamily }}>
              {plan.name}
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold" style={{ color: palette.text, fontFamily }}>
                {plan.price}
              </span>
              <span className="text-sm" style={{ color: palette.text, opacity: 0.7 }}>
                /month
              </span>
            </div>
            <div className="mt-4 text-sm" style={{ color: palette.text, opacity: 0.7, fontFamily }}>
              {plan.desc}
            </div>
          </div>
          <ul className="space-y-3">
            {plan.features.map((feature, j) => (
              <li key={j} className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  style={{ color: palette.accent }}
                >
                  <path d="M18.369 4.595a.75.75 0 0 1 1.262.81l-9 14a.75.75 0 0 1-1.217.064l-5-6.25a.75.75 0 0 1 1.172-.938l4.347 5.435z" />
                </svg>
                <span style={{ color: palette.text, fontFamily }}>{feature}</span>
              </li>
            ))}
          </ul>
          <button
            className="w-full px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{
              backgroundColor: palette.primary,
              color: '#ffffff',
              borderRadius,
            }}
          >
            Start free trial
          </button>
        </div>
      ))}
    </div>
  );
};

const FAQSection: React.FC<SectionProps> = ({ palette, fontFamily }) => {
  const questions = [
    'How do I get started with the platform?',
    'Can I change my plan later?',
    'What payment methods do you accept?',
    'Is there a free trial available?',
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: palette.text, fontFamily }}>
        Frequently asked questions
      </h2>
      <div className="space-y-4">
        {questions.map((question, i) => (
          <div key={i} className="py-4" style={{ borderBottom: `1px solid ${palette.accent}` }}>
            <button>
              <span className="text-sm font-medium" style={{ color: palette.primary, fontFamily }}>
                {question}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                style={{ color: palette.text, opacity: 0.5 }}
              >
                <path d="M9.47 6.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L13.94 12 9.47 7.53a.75.75 0 0 1 0-1.06" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
