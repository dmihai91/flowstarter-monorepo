'use client';

import type { BrandProfileSummary, BusinessInfo, IntegrationConfig, SystemFont } from '../types';

interface ReviewLaunchPanelProps {
  isDark: boolean;
  projectName?: string | null;
  projectDescription?: string;
  selectedTemplateName?: string | null;
  selectedPalette?: { id: string; name: string; colors: string[] } | null;
  selectedFont?: SystemFont | null;
  businessInfo?: BusinessInfo | null;
  brandProfile?: BrandProfileSummary | null;
  integrations?: IntegrationConfig[] | null;
  onCustomize: () => void;
  onBuild: () => void;
}

function Section({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-black/10 bg-white/75'
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-white/40' : 'text-black/45'}`}>
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ReviewLaunchPanel({
  isDark,
  projectName,
  projectDescription,
  selectedTemplateName,
  selectedPalette,
  selectedFont,
  businessInfo,
  brandProfile,
  integrations,
  onCustomize,
  onBuild,
}: ReviewLaunchPanelProps) {
  const tone = brandProfile?.brandTone?.primary || businessInfo?.brandTone || 'Not set';
  const differentiators = brandProfile?.differentiators || [];
  const trustSignals = brandProfile?.trustSignals || [];

  return (
    <div className="ml-10">
      <div
        className={`overflow-hidden rounded-[28px] border shadow-[0_18px_50px_rgba(0,0,0,0.08)] ${
          isDark
            ? 'border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]'
            : 'border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,247,252,0.92))]'
        }`}
      >
        <div className={`border-b px-6 py-5 ${isDark ? 'border-white/[0.08]' : 'border-black/8'}`}>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-white/45' : 'text-black/45'}`}
          >
            Review Before Build
          </p>
          <h3 className={`mt-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {projectName || 'Untitled project'}
          </h3>
          {projectDescription ? (
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${isDark ? 'text-white/65' : 'text-black/60'}`}>
              {projectDescription}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 px-6 py-5 lg:grid-cols-2">
          <Section title="Template" isDark={isDark}>
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {selectedTemplateName || 'Not selected'}
            </p>
            {selectedPalette ? (
              <div className="mt-3 flex items-center gap-3">
                <span className={`text-xs ${isDark ? 'text-white/55' : 'text-black/55'}`}>{selectedPalette.name}</span>
                <div className="flex items-center gap-1">
                  {selectedPalette.colors.slice(0, 5).map((color, index) => (
                    <span
                      key={`${selectedPalette.id}-${index}`}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {selectedFont ? (
              <div className={`mt-3 text-xs leading-5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <div>Heading: {selectedFont.heading}</div>
                <div>Body: {selectedFont.body}</div>
              </div>
            ) : null}
          </Section>

          <Section title="Brand Direction" isDark={isDark}>
            <div className={`space-y-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>
              <p>
                <span className="font-medium">Tone:</span> {tone}
              </p>
              {brandProfile?.valueProposition || businessInfo?.uvp ? (
                <p>
                  <span className="font-medium">Value prop:</span> {brandProfile?.valueProposition || businessInfo?.uvp}
                </p>
              ) : null}
              {brandProfile?.desiredCustomerAction ? (
                <p>
                  <span className="font-medium">Primary CTA:</span> {brandProfile.desiredCustomerAction}
                </p>
              ) : null}
            </div>
          </Section>

          <Section title="Business Context" isDark={isDark}>
            <div className={`space-y-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>
              {businessInfo?.industry ? (
                <p>
                  <span className="font-medium">Industry:</span> {businessInfo.industry}
                </p>
              ) : null}
              {businessInfo?.targetAudience ? (
                <p>
                  <span className="font-medium">Audience:</span> {businessInfo.targetAudience}
                </p>
              ) : null}
              {businessInfo?.description ? (
                <p>
                  <span className="font-medium">Summary:</span> {businessInfo.description}
                </p>
              ) : null}
            </div>
          </Section>

          <Section title="Integrations" isDark={isDark}>
            {integrations && integrations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {integrations.map((integration) => (
                  <span
                    key={integration.id}
                    className={`rounded-full px-3 py-1 text-xs ${
                      isDark ? 'bg-white/[0.07] text-white/80' : 'bg-black/6 text-black/70'
                    }`}
                  >
                    {integration.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-white/55' : 'text-black/50'}`}>No integrations selected yet.</p>
            )}
          </Section>
        </div>

        {differentiators.length > 0 || trustSignals.length > 0 ? (
          <div
            className={`grid gap-4 border-t px-6 py-5 md:grid-cols-2 ${isDark ? 'border-white/[0.08]' : 'border-black/8'}`}
          >
            {differentiators.length > 0 ? (
              <Section title="Differentiators" isDark={isDark}>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                  {differentiators.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </Section>
            ) : null}
            {trustSignals.length > 0 ? (
              <Section title="Trust Signals" isDark={isDark}>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>
                  {trustSignals.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>
        ) : null}

        <div
          className={`flex flex-col gap-3 border-t px-6 py-5 sm:flex-row ${isDark ? 'border-white/[0.08]' : 'border-black/8'}`}
        >
          <button
            type="button"
            onClick={onCustomize}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isDark
                ? 'border border-white/[0.12] bg-white/[0.03] text-white hover:bg-white/[0.06]'
                : 'border border-black/10 bg-white text-black hover:bg-black/[0.03]'
            }`}
          >
            Adjust Before Build
          </button>
          <button
            type="button"
            onClick={onBuild}
            className="rounded-2xl bg-[var(--purple)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--purple)]/90"
          >
            Build Site
          </button>
        </div>
      </div>
    </div>
  );
}
