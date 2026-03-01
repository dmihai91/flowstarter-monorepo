/**
 * Business Summary Component
 *
 * Displays the collected business information in a formatted card
 * for user review and confirmation.
 */

import type { BusinessInfo } from '../types';

interface BusinessSummaryProps {
  businessInfo: Partial<BusinessInfo>;
  onConfirm: () => void;
  onEdit: () => void;
}

export function BusinessSummary({ businessInfo, onConfirm, onEdit }: BusinessSummaryProps) {
  const { uvp, targetAudience, businessGoals, brandTone, sellingMethod, sellingMethodDetails, pricingOffers } =
    businessInfo;

  const sellingMethodDisplay = sellingMethodDetails
    ? sellingMethodDetails
    : sellingMethod
      ? sellingMethod.charAt(0).toUpperCase() + sellingMethod.slice(1)
      : 'Not specified';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(77, 93, 217, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: '#1f2937',
        }}
      >
        📋 Your Business Summary
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* UVP */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>UNIQUE VALUE</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>{uvp || 'Not specified'}</div>
        </div>

        {/* Target Audience */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>
            TARGET AUDIENCE
          </div>
          <div style={{ fontSize: '14px', color: '#374151' }}>{targetAudience || 'Not specified'}</div>
        </div>

        {/* Goals */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>GOALS</div>
          {businessGoals && businessGoals.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
              {businessGoals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '14px', color: '#374151' }}>Not specified</div>
          )}
        </div>

        {/* Brand Tone */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>BRAND TONE</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>{brandTone || 'Not specified'}</div>
        </div>

        {/* Selling Method */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>SELLING METHOD</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>{sellingMethodDisplay}</div>
        </div>

        {/* Pricing (if specified) */}
        {pricingOffers && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '4px' }}>
              PRICING/OFFERS
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>{pricingOffers}</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(77, 93, 217, 0.8) 0%, rgba(6, 182, 212, 0.6) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ✓ Looks Good!
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#6366f1',
            border: '2px solid #6366f1',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
