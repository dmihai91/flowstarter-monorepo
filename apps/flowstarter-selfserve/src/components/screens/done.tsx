'use client';

import React from 'react';
import { PricingTable } from '@clerk/nextjs';
import { TopBar } from '@/components/ui';
import { Icons } from '@/components/icons';

export function DoneScreen({
  projectId,
  outcome,
  brandName,
  buildId,
  previewUrl,
  subscribed,
  pricing,
}: {
  projectId: string;
  outcome: 'launch' | 'code_only';
  brandName: string;
  buildId: string | null;
  previewUrl: string | null;
  subscribed: boolean;
  pricing: { monthly: string };
}) {
  if (outcome === 'code_only') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <TopBar stage="launch" />
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 26 }}>
          <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '34px 34px', maxWidth: 500, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--pos)', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icons.check size={26} stroke={2.4} />
            </div>
            <h2 className="serif" style={{ fontSize: 28, margin: '0 0 10px' }}>
              {brandName} is yours.
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
              Payment received. Download the full code export below — host it anywhere you like.
              A copy of the receipt is in your inbox.
            </p>
            {buildId && (
              <a className="btn btn-grad" href={`/api/export/${buildId}`}>
                <Icons.download size={16} /> Download your site
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Launch path
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="launch" />
      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 26px 60px' }}>
          {subscribed ? (
            <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '34px 34px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <span className="live-dot" />
                <span className="mono" style={{ fontSize: 11.5, letterSpacing: '.1em', color: 'var(--pos)' }}>LIVE</span>
              </div>
              <h2 className="serif" style={{ fontSize: 30, margin: '0 0 10px' }}>
                {brandName} is live.
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
                Hosting, your domain, updates and AI edits are covered by your {pricing.monthly}/month plan.
                We’re connecting your domain now — you’ll get an email when DNS settles.
              </p>
              {previewUrl && (
                <a className="btn btn-grad" href={previewUrl} target="_blank" rel="noreferrer">
                  <Icons.globe size={16} /> View your live site
                </a>
              )}
              <p className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 16 }}>
                Project {projectId.slice(0, 8)} · manage your subscription from your account menu
              </p>
            </div>
          ) : (
            <div className="fade-up">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--pos)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Icons.check size={26} stroke={2.4} />
                </div>
                <h2 className="serif" style={{ fontSize: 30, margin: '0 0 10px' }}>
                  Payment received — one last step.
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 480, margin: '0 auto' }}>
                  Activate the {pricing.monthly}/month plan to put {brandName} live: hosting on our
                  servers, your domain, ongoing updates and AI edits. Cancel anytime.
                </p>
              </div>
              {/* Clerk Billing checkout — the hosting plan lives in Clerk, not Stripe */}
              <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 18 }}>
                <PricingTable />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
