/**
 * BusinessDetailsForm Component
 *
 * Consolidated form replacing business-uvp, business-offering, and business-contact steps.
 * Clean card-based sections with icons, subtle separators, and pre-fill support.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Package, Mail, Phone, MapPin, Globe,
  Plus, Trash2, ChevronRight, ChevronDown,
  Facebook, Instagram, Twitter, Linkedin, Youtube,
} from 'lucide-react';
import type { ServiceOffering, BusinessDetailsData, BusinessInfo } from '../types';

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface BusinessDetailsFormProps {
  isDark: boolean;
  businessInfo?: Partial<BusinessInfo> | null;
  onComplete: (data: BusinessDetailsData) => void;
}

let nextOfferingId = 1;
function createOffering(): ServiceOffering {
  return { id: `offering-${nextOfferingId++}`, name: '', description: '', price: '' };
}

export function BusinessDetailsForm({ isDark, businessInfo, onComplete }: BusinessDetailsFormProps) {
  // Pre-fill from existing business info
  const [uvp, setUvp] = useState(businessInfo?.uvp || '');
  const [offerings, setOfferings] = useState<ServiceOffering[]>([createOffering()]);
  const [email, setEmail] = useState(businessInfo?.contactEmail || '');
  const [phone, setPhone] = useState(businessInfo?.contactPhone || '');
  const [address, setAddress] = useState(businessInfo?.contactAddress || '');
  const [website, setWebsite] = useState(businessInfo?.website || '');
  const [showSocials, setShowSocials] = useState(false);
  const [socials, setSocials] = useState<Record<string, string>>({
    facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '', tiktok: '',
  });

  const canContinue = uvp.trim().length > 0 && email.trim().length > 0;

  const addOffering = useCallback(() => {
    setOfferings(prev => [...prev, createOffering()]);
  }, []);

  const removeOffering = useCallback((id: string) => {
    setOfferings(prev => prev.length > 1 ? prev.filter(o => o.id !== id) : prev);
  }, []);

  const updateOffering = useCallback((id: string, field: keyof ServiceOffering, value: string) => {
    setOfferings(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  }, []);

  const updateSocial = useCallback((key: string, value: string) => {
    setSocials(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = () => {
    const filteredSocials: Record<string, string> = {};
    for (const [key, val] of Object.entries(socials)) {
      if (val.trim()) filteredSocials[key] = val.trim();
    }

    onComplete({
      uvp: uvp.trim(),
      offerings: offerings.filter(o => o.name.trim()),
      contactEmail: email.trim(),
      contactPhone: phone.trim() || undefined,
      contactAddress: address.trim() || undefined,
      website: website.trim() || undefined,
      socialLinks: Object.keys(filteredSocials).length > 0 ? filteredSocials : undefined,
    });
  };

  const c = {
    bg: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#fafafa' : '#111827',
    textSec: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
    textTer: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
    accent: isDark ? 'rgba(77, 93, 217, 0.7)' : '#4D5DD9',
    accentBg: isDark ? 'rgba(77, 93, 217, 0.08)' : 'rgba(77, 93, 217, 0.06)',
    accentBorder: isDark ? 'rgba(77, 93, 217, 0.2)' : 'rgba(77, 93, 217, 0.15)',
    accentHover: isDark ? '#D4D9FF' : '#3D4BC9',
    dangerBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)',
    dangerText: isDark ? '#f87171' : '#dc2626',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    background: c.inputBg,
    border: `1px solid ${c.border}`,
    color: c.text,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  const iconInputStyle: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: '38px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="business-details-form"
      style={{ marginTop: '16px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Section 1: Value Proposition */}
        <div
          style={{
            background: c.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Sparkles size={16} style={{ color: c.accent }} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: c.text, margin: 0 }}>
                Value Proposition
              </h4>
              <p style={{ fontSize: '12px', color: c.textSec, margin: 0 }}>
                What makes your business unique?
              </p>
            </div>
          </div>
          <textarea
            value={uvp}
            onChange={e => setUvp(e.target.value)}
            placeholder="e.g. We help busy professionals get fit with 30-minute personal training sessions that fit any schedule."
            rows={3}
            data-testid="business-uvp-input"
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = c.accent}
            onBlur={e => e.currentTarget.style.borderColor = c.border}
          />
        </div>

        {/* Section 2: Services/Offerings */}
        <div
          style={{
            background: c.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Package size={16} style={{ color: c.accent }} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: c.text, margin: 0 }}>
                Services & Offerings
              </h4>
              <p style={{ fontSize: '12px', color: c.textSec, margin: 0 }}>
                What do you sell? (optional)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {offerings.map((offering, idx) => (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: c.accentBg,
                    border: `1px solid ${c.accentBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      placeholder={`Service ${idx + 1} name`}
                      value={offering.name}
                      onChange={e => updateOffering(offering.id, 'name', e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <input
                      placeholder="Price (opt.)"
                      value={offering.price || ''}
                      onChange={e => updateOffering(offering.id, 'price', e.target.value)}
                      style={{ ...inputStyle, width: '100px', flexShrink: 0 }}
                    />
                    {offerings.length > 1 && (
                      <button
                        onClick={() => removeOffering(offering.id)}
                        aria-label="Remove offering"
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: c.dangerBg, border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: c.dangerText, flexShrink: 0, transition: 'opacity 0.15s',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Short description"
                    value={offering.description}
                    onChange={e => updateOffering(offering.id, 'description', e.target.value)}
                    style={inputStyle}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={addOffering}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                background: 'transparent', border: `1px dashed ${c.border}`,
                color: c.textSec, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSec; }}
            >
              <Plus size={14} /> Add another service
            </button>
          </div>
        </div>

        {/* Section 3: Contact Info */}
        <div
          style={{
            background: c.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Mail size={16} style={{ color: c.accent }} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: c.text, margin: 0 }}>
                Contact Information
              </h4>
              <p style={{ fontSize: '12px', color: c.textSec, margin: 0 }}>
                How can visitors reach you?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Email (required) */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textTer }} />
              <input
                type="email"
                placeholder="Email address *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                data-testid="business-email-input"
                style={iconInputStyle}
                onFocus={e => e.currentTarget.style.borderColor = c.accent}
                onBlur={e => e.currentTarget.style.borderColor = c.border}
              />
            </div>

            {/* Phone */}
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textTer }} />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={iconInputStyle}
              />
            </div>

            {/* Address */}
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: c.textTer }} />
              <textarea
                placeholder="Business address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                style={{ ...iconInputStyle, resize: 'none' }}
              />
            </div>

            {/* Website */}
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textTer }} />
              <input
                type="url"
                placeholder="Existing website"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                style={iconInputStyle}
              />
            </div>
          </div>

          {/* Social Links (collapsible) */}
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowSocials(!showSocials)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '10px 14px', background: c.accentBg,
                border: `1px solid ${c.accentBorder}`, borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Instagram size={14} style={{ color: c.textTer }} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 500, color: c.text }}>
                Social Media Links
              </span>
              <span style={{ fontSize: '11px', color: c.textTer }}>optional</span>
              <ChevronDown
                size={14}
                style={{
                  color: c.textTer,
                  transform: showSocials ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            <AnimatePresence>
              {showSocials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    {[
                      { key: 'facebook', icon: <Facebook size={14} />, label: 'Facebook' },
                      { key: 'instagram', icon: <Instagram size={14} />, label: 'Instagram' },
                      { key: 'twitter', icon: <Twitter size={14} />, label: 'Twitter/X' },
                      { key: 'linkedin', icon: <Linkedin size={14} />, label: 'LinkedIn' },
                      { key: 'youtube', icon: <Youtube size={14} />, label: 'YouTube' },
                      { key: 'tiktok', icon: <TikTokIcon size={14} />, label: 'TikTok' },
                    ].map(({ key, icon, label }) => (
                      <div key={key} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                          color: c.textTer, display: 'flex', alignItems: 'center',
                        }}>
                          {icon}
                        </div>
                        <input
                          placeholder={label}
                          value={socials[key] || ''}
                          onChange={e => updateSocial(key, e.target.value)}
                          style={{ ...inputStyle, paddingLeft: '32px', fontSize: '13px', padding: '8px 10px 8px 32px' }}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          disabled={!canContinue}
          data-testid="business-details-continue"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            background: canContinue
              ? `linear-gradient(135deg, ${c.accentHover}, ${c.accent})`
              : c.inputBg,
            color: canContinue ? '#ffffff' : c.textTer,
            border: 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: canContinue ? 1 : 0.6,
          }}
          onMouseEnter={e => { if (canContinue) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { if (canContinue) e.currentTarget.style.opacity = '1'; }}
        >
          Continue
          <ChevronRight size={16} />
        </button>

        {!canContinue && (
          <p style={{ fontSize: '12px', color: c.textTer, textAlign: 'center', margin: '-8px 0 0' }}>
            Value proposition and email are required
          </p>
        )}
      </div>
    </motion.div>
  );
}
