/**
 * IntegrationsPanel Component
 *
 * Simplified panel for service integrations only (booking, newsletter).
 * Contact details are now collected during onboarding.
 * AI images toggle is now in PersonalizationPanel.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, ChevronRight, Zap } from 'lucide-react';
import type { IntegrationConfig } from '../types';

interface IntegrationsPanelProps {
  isDark: boolean;
  onComplete: (integrations: IntegrationConfig[]) => void;
  onSkip: () => void;
}

interface BookingConfig {
  enabled: boolean;
  provider: 'calendly' | 'calcom' | 'none';
  url: string;
}

interface NewsletterConfig {
  enabled: boolean;
  provider: 'mailchimp' | 'convertkit' | 'buttondown' | 'none';
  url: string;
}

export function IntegrationsPanel({
  isDark,
  onComplete,
  onSkip,
}: IntegrationsPanelProps) {
  const [booking, setBooking] = useState<BookingConfig>({
    enabled: false,
    provider: 'calendly',
    url: '',
  });

  const [newsletter, setNewsletter] = useState<NewsletterConfig>({
    enabled: false,
    provider: 'mailchimp',
    url: '',
  });

  const hasEnabledIntegrations = booking.enabled || newsletter.enabled;
  
  // Check if integrations are properly configured (enabled means URL is required)
  const bookingValid = !booking.enabled || (booking.enabled && booking.url.trim().length > 0);
  const newsletterValid = !newsletter.enabled || (newsletter.enabled && newsletter.url.trim().length > 0);
  const canBuild = bookingValid && newsletterValid;

  const handleContinue = () => {
    const configs: IntegrationConfig[] = [];

    if (booking.enabled && booking.provider !== 'none') {
      configs.push({
        id: 'booking',
        name: booking.provider === 'calendly' ? 'Calendly' : 'Cal.com',
        enabled: true,
        config: {
          provider: booking.provider,
          url: booking.url,
        },
      });
    }

    if (newsletter.enabled && newsletter.provider !== 'none') {
      configs.push({
        id: 'newsletter',
        name: newsletter.provider.charAt(0).toUpperCase() + newsletter.provider.slice(1),
        enabled: true,
        config: {
          provider: newsletter.provider,
          url: newsletter.url,
        },
      });
    }

    onComplete(configs);
  };

  // Theme colors
  const colors = {
    background: isDark ? '#1a1a24' : '#f9fafb',
    cardBg: isDark ? '#252532' : '#ffffff',
    cardBgEnabled: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderEnabled: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.3)',
    text: isDark ? '#ffffff' : '#111827',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6b7280',
    textTertiary: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
    inputBg: isDark ? '#1a1a24' : '#f3f4f6',
    accent: isDark ? '#C1C8FF' : '#4D5DD9',
    accentHover: isDark ? '#D4D9FF' : '#3D4BC9',
    buttonSecondaryBg: isDark ? '#252532' : '#f3f4f6',
    buttonSecondaryHover: isDark ? '#2f2f3d' : '#e5e7eb',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      data-testid="integrations-panel"
      style={{
        background: colors.background,
        borderRadius: '16px',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={20} style={{ color: colors.accent }} />
          <h3 
            data-testid="integrations-panel-title"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}
          >
            Connect Your Services
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: colors.textSecondary,
          margin: 0,
        }}>
          Optional: Add booking or newsletter integrations to your site.
        </p>
      </div>

      {/* Integration Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {/* Booking Card */}
        <IntegrationCard
          icon={<Calendar size={18} />}
          title="Booking"
          description="Let visitors schedule appointments"
          enabled={booking.enabled}
          onToggle={(enabled) => setBooking({ ...booking, enabled })}
          colors={colors}
          testId="booking"
        >
          {booking.enabled && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={booking.provider}
                onChange={(e) => setBooking({ ...booking, provider: e.target.value as BookingConfig['provider'] })}
                data-testid="booking-provider-select"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="calendly">Calendly</option>
                <option value="calcom">Cal.com</option>
              </select>
              <input
                type="url"
                placeholder={booking.provider === 'calendly' ? 'https://calendly.com/your-link' : 'https://cal.com/your-link'}
                value={booking.url}
                onChange={(e) => setBooking({ ...booking, url: e.target.value })}
                data-testid="booking-url-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  outline: 'none',
                }}
              />
            </div>
          )}
        </IntegrationCard>

        {/* Newsletter Card */}
        <IntegrationCard
          icon={<Mail size={18} />}
          title="Newsletter"
          description="Collect email subscribers"
          enabled={newsletter.enabled}
          onToggle={(enabled) => setNewsletter({ ...newsletter, enabled })}
          colors={colors}
          testId="newsletter"
        >
          {newsletter.enabled && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={newsletter.provider}
                onChange={(e) => setNewsletter({ ...newsletter, provider: e.target.value as NewsletterConfig['provider'] })}
                data-testid="newsletter-provider-select"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="mailchimp">Mailchimp</option>
                <option value="convertkit">ConvertKit</option>
                <option value="buttondown">Buttondown</option>
              </select>
              <input
                type="text"
                placeholder={
                  newsletter.provider === 'mailchimp' ? 'Form action URL' :
                  newsletter.provider === 'convertkit' ? 'Form ID' :
                  'Username'
                }
                value={newsletter.url}
                onChange={(e) => setNewsletter({ ...newsletter, url: e.target.value })}
                data-testid="newsletter-url-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  outline: 'none',
                }}
              />
            </div>
          )}
        </IntegrationCard>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onSkip}
          data-testid="integrations-skip-button"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            background: colors.buttonSecondaryBg,
            color: colors.textSecondary,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.buttonSecondaryHover}
          onMouseLeave={(e) => e.currentTarget.style.background = colors.buttonSecondaryBg}
        >
          Skip for Now
        </button>
        <button
          onClick={handleContinue}
          disabled={!canBuild}
          data-testid="integrations-continue-button"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            opacity: canBuild ? 1 : 0.5,
            cursor: canBuild ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            background: `linear-gradient(135deg, ${colors.accentHover}, ${colors.accent})`,
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { if (canBuild) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { if (canBuild) e.currentTarget.style.opacity = '1'; }}
        >
          {hasEnabledIntegrations ? 'Continue' : 'Build My Site'}
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// Integration Card Sub-component
interface IntegrationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  colors: Record<string, string>;
  testId?: string;
  children?: React.ReactNode;
}

function IntegrationCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  colors,
  testId,
  children,
}: IntegrationCardProps) {
  return (
    <div
      data-testid={testId ? `${testId}-card` : undefined}
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: enabled ? colors.cardBgEnabled : colors.cardBg,
        border: `1px solid ${enabled ? colors.borderEnabled : colors.border}`,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: enabled ? 'rgba(139, 92, 246, 0.2)' : colors.inputBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: enabled ? colors.accent : colors.textTertiary,
          }}>
            {icon}
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.text,
            }}>
              {title}
            </div>
            <div style={{
              fontSize: '12px',
              color: colors.textSecondary,
            }}>
              {description}
            </div>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          data-testid={testId ? `${testId}-toggle` : undefined}
          style={{
            position: 'relative',
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: enabled ? colors.accent : colors.inputBg,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '10px',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>
      
      {children}
    </div>
  );
}

// Re-export ContactDetails type for backwards compatibility (now in types.ts)
export type { ContactDetails } from '../types';
