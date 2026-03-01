/**
 * ContactDetailsPanel Component
 *
 * Collects contact information during the onboarding flow.
 * Includes email, phone, address, and social media links.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Globe, ChevronRight, ChevronDown,
  Facebook, Instagram, Twitter, Linkedin, Youtube
} from 'lucide-react';
import type { ContactDetails } from '../types';

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface ContactDetailsPanelProps {
  isDark: boolean;
  initialData?: Partial<ContactDetails>;
  onComplete: (contactDetails: ContactDetails) => void;
  onSkip: () => void;
}

export function ContactDetailsPanel({
  isDark,
  initialData,
  onComplete,
  onSkip,
}: ContactDetailsPanelProps) {
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    website: initialData?.website || '',
    facebook: initialData?.facebook || '',
    instagram: initialData?.instagram || '',
    twitter: initialData?.twitter || '',
    linkedin: initialData?.linkedin || '',
    youtube: initialData?.youtube || '',
    tiktok: initialData?.tiktok || '',
  });

  const [showSocials, setShowSocials] = useState(false);

  const hasEmail = contactDetails.email.trim().length > 0;
  const hasSocialLinks = [
    contactDetails.facebook,
    contactDetails.instagram,
    contactDetails.twitter,
    contactDetails.linkedin,
    contactDetails.youtube,
    contactDetails.tiktok,
  ].some(link => link && link.trim().length > 0);

  // Theme colors
  const colors = {
    background: isDark ? '#1a1a24' : '#f9fafb',
    cardBg: isDark ? '#252532' : '#ffffff',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDark ? '#ffffff' : '#111827',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6b7280',
    textTertiary: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
    inputBg: isDark ? '#1a1a24' : '#f3f4f6',
    accent: isDark ? 'rgba(77, 93, 217, 0.7)' : '#4D5DD9',
    accentHover: isDark ? '#D4D9FF' : '#3D4BC9',
    buttonSecondaryBg: isDark ? '#252532' : '#f3f4f6',
    buttonSecondaryHover: isDark ? '#2f2f3d' : '#e5e7eb',
    contactBg: isDark ? 'rgba(77, 93, 217, 0.06)' : 'rgba(99, 102, 241, 0.05)',
    contactBorder: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
  };

  const handleContinue = () => {
    onComplete(contactDetails);
  };

  const updateField = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      data-testid="contact-details-panel"
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
          <Mail size={20} style={{ color: colors.accent }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colors.text,
            margin: 0,
          }}>
            Contact Information
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: colors.textSecondary,
          margin: 0,
        }}>
          This will appear in your site's footer and contact page.
        </p>
      </div>

      {/* Main Contact Fields */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: colors.contactBg,
        border: `1px solid ${colors.contactBorder}`,
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Email (required) */}
          <div style={{ position: 'relative' }}>
            <Mail 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: colors.textTertiary,
              }} 
            />
            <input
              type="email"
              placeholder="Email address *"
              value={contactDetails.email}
              onChange={(e) => updateField('email', e.target.value)}
              data-testid="contact-email-input"
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '8px',
                fontSize: '14px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                outline: 'none',
              }}
            />
          </div>

          {/* Phone (optional) */}
          <div style={{ position: 'relative' }}>
            <Phone 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: colors.textTertiary,
              }} 
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={contactDetails.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              data-testid="contact-phone-input"
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '8px',
                fontSize: '14px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                outline: 'none',
              }}
            />
          </div>

          {/* Address (optional) */}
          <div style={{ position: 'relative' }}>
            <MapPin 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '14px',
                color: colors.textTertiary,
              }} 
            />
            <textarea
              placeholder="Business address (optional)"
              value={contactDetails.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              rows={2}
              data-testid="contact-address-input"
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '8px',
                fontSize: '14px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Website (optional) */}
          <div style={{ position: 'relative' }}>
            <Globe 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: colors.textTertiary,
              }} 
            />
            <input
              type="url"
              placeholder="Website URL (optional)"
              value={contactDetails.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              data-testid="contact-website-input"
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '8px',
                fontSize: '14px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Social Media Links (Collapsible) */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowSocials(!showSocials)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px 16px',
            background: hasSocialLinks ? 'rgba(77, 93, 217, 0.06)' : colors.cardBg,
            border: `1px solid ${hasSocialLinks ? 'rgba(99, 102, 241, 0.3)' : colors.border}`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: hasSocialLinks ? 'rgba(99, 102, 241, 0.2)' : colors.inputBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Instagram size={16} style={{ color: hasSocialLinks ? colors.accent : colors.textTertiary }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: colors.text,
            }}>
              Social Media Links
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: colors.textSecondary,
              marginLeft: '8px',
            }}>
              (optional)
            </span>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: colors.textTertiary,
              transform: showSocials ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} 
          />
        </button>

        {showSocials && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '12px',
              padding: '16px',
              borderRadius: '12px',
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Facebook */}
              <SocialInput
                icon={<Facebook size={14} />}
                placeholder="Facebook"
                value={contactDetails.facebook || ''}
                onChange={(value) => updateField('facebook', value)}
                colors={colors}
              />
              
              {/* Instagram */}
              <SocialInput
                icon={<Instagram size={14} />}
                placeholder="Instagram"
                value={contactDetails.instagram || ''}
                onChange={(value) => updateField('instagram', value)}
                colors={colors}
              />
              
              {/* Twitter/X */}
              <SocialInput
                icon={<Twitter size={14} />}
                placeholder="Twitter/X"
                value={contactDetails.twitter || ''}
                onChange={(value) => updateField('twitter', value)}
                colors={colors}
              />
              
              {/* LinkedIn */}
              <SocialInput
                icon={<Linkedin size={14} />}
                placeholder="LinkedIn"
                value={contactDetails.linkedin || ''}
                onChange={(value) => updateField('linkedin', value)}
                colors={colors}
              />
              
              {/* YouTube */}
              <SocialInput
                icon={<Youtube size={14} />}
                placeholder="YouTube"
                value={contactDetails.youtube || ''}
                onChange={(value) => updateField('youtube', value)}
                colors={colors}
              />
              
              {/* TikTok */}
              <SocialInput
                icon={<TikTokIcon size={14} />}
                placeholder="TikTok"
                value={contactDetails.tiktok || ''}
                onChange={(value) => updateField('tiktok', value)}
                colors={colors}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Button - Email Required */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!hasEmail && (
          <p style={{
            fontSize: '13px',
            color: colors.textTertiary,
            margin: 0,
            textAlign: 'center',
          }}>
            Email is required so visitors can contact you
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={!hasEmail}
          data-testid="contact-continue-button"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '10px',
            opacity: hasEmail ? 1 : 0.5,
            cursor: hasEmail ? 'pointer' : 'not-allowed',
            fontSize: '15px',
            fontWeight: 600,
            background: `linear-gradient(135deg, ${colors.accentHover}, ${colors.accent})`,
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { if (hasEmail) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { if (hasEmail) e.currentTarget.style.opacity = '1'; }}
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// Social input helper component
interface SocialInputProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  colors: Record<string, string>;
}

function SocialInput({ icon, placeholder, value, onChange, colors }: SocialInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div 
        style={{ 
          position: 'absolute', 
          left: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: colors.textTertiary,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 10px 10px 32px',
          borderRadius: '8px',
          fontSize: '13px',
          background: colors.inputBg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          outline: 'none',
        }}
      />
    </div>
  );
}
