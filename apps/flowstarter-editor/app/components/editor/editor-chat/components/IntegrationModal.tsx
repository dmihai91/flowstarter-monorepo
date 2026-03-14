/**
 * IntegrationModal Component
 *
 * GlassCard-style integration cards for Calendly + Google Analytics.
 * Clicking "Configure" opens a Dialog/modal with the configuration form.
 * Matches the dashboard's IntegrationCard visual style.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BarChart3, ChevronRight, ExternalLink, Check, X } from 'lucide-react';
import type { IntegrationConfig } from '../types';

interface IntegrationModalProps {
  isDark: boolean;
  onComplete: (integrations: IntegrationConfig[]) => void;
  onSkip: () => void;
}

interface CalendlyState {
  enabled: boolean;
  url: string;
}

interface GAState {
  enabled: boolean;
  measurementId: string;
}

export function IntegrationModal({ isDark, onComplete, onSkip }: IntegrationModalProps) {
  const [calendly, setCalendly] = useState<CalendlyState>({ enabled: false, url: '' });
  const [ga, setGA] = useState<GAState>({ enabled: false, measurementId: '' });
  const [activeModal, setActiveModal] = useState<'calendly' | 'ga' | null>(null);

  // Temp state for modal editing
  const [tempCalendlyUrl, setTempCalendlyUrl] = useState('');
  const [tempGAId, setTempGAId] = useState('');

  const hasAnyIntegration = calendly.enabled || ga.enabled;
  const calendlyValid = !calendly.enabled || calendly.url.trim().length > 0;
  const gaValid = !ga.enabled || ga.measurementId.trim().length > 0;
  const canContinue = calendlyValid && gaValid;

  const openCalendlyModal = () => {
    setTempCalendlyUrl(calendly.url);
    setActiveModal('calendly');
  };

  const openGAModal = () => {
    setTempGAId(ga.measurementId);
    setActiveModal('ga');
  };

  const saveCalendly = () => {
    const url = tempCalendlyUrl.trim();
    setCalendly({ enabled: url.length > 0, url });
    setActiveModal(null);
  };

  const saveGA = () => {
    const id = tempGAId.trim();
    setGA({ enabled: id.length > 0, measurementId: id });
    setActiveModal(null);
  };

  const disconnectCalendly = () => {
    setCalendly({ enabled: false, url: '' });
  };

  const disconnectGA = () => {
    setGA({ enabled: false, measurementId: '' });
  };

  const handleContinue = () => {
    const configs: IntegrationConfig[] = [];
    if (calendly.enabled) {
      configs.push({
        id: 'booking',
        name: 'Calendly',
        enabled: true,
        config: { provider: 'calendly', url: calendly.url },
      });
    }
    if (ga.enabled) {
      configs.push({
        id: 'analytics',
        name: 'Google Analytics',
        enabled: true,
        config: { provider: 'google-analytics', measurementId: ga.measurementId },
      });
    }
    onComplete(configs);
  };

  const c = {
    bg: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
    cardBgHover: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#fafafa' : '#111827',
    textSec: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
    textTer: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
    accent: isDark ? 'rgba(77, 93, 217, 0.7)' : '#4D5DD9',
    accentHover: isDark ? '#D4D9FF' : '#3D4BC9',
    greenBg: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
    greenText: isDark ? '#4ade80' : '#16a34a',
    greenBorder: isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.2)',
    glassSurface: isDark ? 'rgba(20,20,30,0.95)' : 'rgba(255,255,255,0.98)',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="integrations-panel"
      style={{ marginTop: '16px' }}
    >
      {/* Integration Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {/* Calendly Card */}
        <GlassCard
          icon={<Calendar size={22} />}
          iconColor="#0069FF"
          iconBg={isDark ? 'rgba(0,105,255,0.15)' : 'rgba(0,105,255,0.1)'}
          name="Calendly"
          description="Embed booking widget for appointments"
          connected={calendly.enabled}
          isDark={isDark}
          c={c}
          onConfigure={openCalendlyModal}
          onDisconnect={disconnectCalendly}
          testId="calendly"
        />

        {/* Google Analytics Card */}
        <GlassCard
          icon={<BarChart3 size={22} />}
          iconColor="#F59E0B"
          iconBg={isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'}
          name="Google Analytics"
          description="Track visitors and conversions"
          connected={ga.enabled}
          isDark={isDark}
          c={c}
          onConfigure={openGAModal}
          onDisconnect={disconnectGA}
          testId="analytics"
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onSkip}
          data-testid="integrations-skip-button"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500,
            background: c.cardBg, color: c.textSec,
            border: `1px solid ${c.border}`, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = c.cardBgHover}
          onMouseLeave={e => e.currentTarget.style.background = c.cardBg}
        >
          Skip for Now
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          data-testid="integrations-continue-button"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500,
            background: `linear-gradient(135deg, ${c.accentHover}, ${c.accent})`,
            color: '#ffffff', border: 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            opacity: canContinue ? 1 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (canContinue) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { if (canContinue) e.currentTarget.style.opacity = '1'; }}
        >
          {hasAnyIntegration ? 'Continue' : 'Build My Site'}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Calendly Configuration Modal ── */}
      <AnimatePresence>
        {activeModal === 'calendly' && (
          <ConfigModal
            isDark={isDark}
            c={c}
            title="Configure Calendly"
            icon={<Calendar size={20} />}
            iconColor="#0069FF"
            onClose={() => setActiveModal(null)}
            onSave={saveCalendly}
          >
            <label style={{ fontSize: '13px', fontWeight: 500, color: c.text, marginBottom: '6px', display: 'block' }}>
              Calendly Link
            </label>
            <input
              type="url"
              placeholder="https://calendly.com/your-name"
              value={tempCalendlyUrl}
              onChange={e => setTempCalendlyUrl(e.target.value)}
              data-testid="calendly-url-input"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                fontSize: '14px', background: c.inputBg,
                border: `1px solid ${c.border}`, color: c.text, outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0069FF'}
              onBlur={e => e.currentTarget.style.borderColor = c.border}
            />
            <p style={{ fontSize: '12px', color: c.textTer, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={12} /> Find your link at calendly.com/event-types
            </p>
          </ConfigModal>
        )}
      </AnimatePresence>

      {/* ── Google Analytics Configuration Modal ── */}
      <AnimatePresence>
        {activeModal === 'ga' && (
          <ConfigModal
            isDark={isDark}
            c={c}
            title="Configure Google Analytics"
            icon={<BarChart3 size={20} />}
            iconColor="#F59E0B"
            onClose={() => setActiveModal(null)}
            onSave={saveGA}
          >
            <label style={{ fontSize: '13px', fontWeight: 500, color: c.text, marginBottom: '6px', display: 'block' }}>
              Measurement ID
            </label>
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={tempGAId}
              onChange={e => setTempGAId(e.target.value)}
              data-testid="ga-measurement-input"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                fontSize: '14px', fontFamily: 'monospace',
                background: c.inputBg, border: `1px solid ${c.border}`,
                color: c.text, outline: 'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#F59E0B'}
              onBlur={e => e.currentTarget.style.borderColor = c.border}
            />
            <p style={{ fontSize: '12px', color: c.textTer, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={12} /> Find it in GA4 Admin &gt; Data Streams
            </p>
          </ConfigModal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

interface GlassCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
  connected: boolean;
  isDark: boolean;
  c: Record<string, string>;
  onConfigure: () => void;
  onDisconnect: () => void;
  testId?: string;
}

function GlassCard({ icon, iconColor, iconBg, name, description, connected, isDark, c, onConfigure, onDisconnect, testId }: GlassCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      data-testid={testId ? `${testId}-card` : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'relative',
        padding: '20px 16px',
        borderRadius: '14px',
        background: hovered ? c.cardBgHover : c.cardBg,
        backdropFilter: 'blur(16px)',
        border: connected ? `1px solid ${c.greenBorder}` : `1px solid ${c.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
      }}
      onClick={connected ? undefined : onConfigure}
    >
      {/* Status badge */}
      {connected && (
        <div
          style={{
            position: 'absolute', top: '10px', right: '10px',
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '999px',
            background: c.greenBg, fontSize: '10px', fontWeight: 600,
            color: c.greenText,
          }}
        >
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: c.greenText, display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          Connected
        </div>
      )}

      {/* Icon container */}
      <motion.div
        animate={{ scale: hovered ? 1.1 : 1 }}
        transition={{ duration: 0.15 }}
        style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: iconBg, backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}
      >
        {icon}
      </motion.div>

      {/* Name + description */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: c.text, margin: '0 0 4px' }}>
          {name}
        </h4>
        <p style={{ fontSize: '12px', color: c.textSec, margin: 0 }}>
          {description}
        </p>
      </div>

      {/* Action button */}
      {connected ? (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            onClick={e => { e.stopPropagation(); onConfigure(); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, background: c.inputBg, border: `1px solid ${c.border}`,
              color: c.textSec, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDisconnect(); }}
            style={{
              padding: '8px 10px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
              border: 'none', color: isDark ? '#f87171' : '#dc2626',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          style={{
            width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 500, background: `${iconColor}15`, border: `1px solid ${iconColor}30`,
            color: iconColor, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Configure
        </button>
      )}
    </motion.div>
  );
}

interface ConfigModalProps {
  isDark: boolean;
  c: Record<string, string>;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

function ConfigModal({ isDark, c, title, icon, iconColor, onClose, onSave, children }: ConfigModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.overlay,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '400px', maxWidth: '90vw', padding: '24px',
          borderRadius: '16px', background: c.glassSurface,
          border: `1px solid ${c.border}`,
          boxShadow: isDark
            ? '0 24px 48px rgba(0,0,0,0.5)'
            : '0 24px 48px rgba(0,0,0,0.15)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: iconColor }}>{icon}</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: c.text, margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: c.inputBg, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: c.textTer, transition: 'all 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ marginBottom: '20px' }}>
          {children}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 500, background: c.inputBg, border: `1px solid ${c.border}`,
              color: c.textSec, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 500, background: iconColor, color: '#ffffff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Check size={14} /> Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
