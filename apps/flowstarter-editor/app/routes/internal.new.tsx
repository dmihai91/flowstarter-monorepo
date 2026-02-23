/**
 * Internal New Project
 * 
 * Flow:
 * 1. Select template
 * 2. Fill business info from discovery call
 * 3. Generate first draft
 * 4. Redirect to internal editor for refinement
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Project (Internal) - Flowstarter' },
    { name: 'description', content: 'Create a new client project' },
  ];
};

// Steps in the internal creation flow
type InternalStep = 
  | 'select_template'
  | 'business_info'
  | 'generating'
  | 'done';

// Business info collected from discovery call
interface BusinessInfo {
  businessName: string;
  industry: string;
  description: string;
  services: string;
  targetAudience: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress?: string;
  discoveryNotes: string;
  colorPreference?: 'warm' | 'cool' | 'neutral' | 'bold';
  tonePreference?: 'professional' | 'friendly' | 'casual' | 'luxury';
}

// Available templates
const TEMPLATES = [
  {
    id: 'service-professional',
    name: 'Service Professional',
    description: 'For coaches, consultants, therapists',
    icon: '👔',
    industries: ['coaching', 'consulting', 'therapy', 'freelance'],
  },
  {
    id: 'local-business',
    name: 'Local Business',
    description: 'For restaurants, salons, shops',
    icon: '🏪',
    industries: ['restaurant', 'salon', 'retail', 'fitness'],
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'For photographers, designers, artists',
    icon: '🎨',
    industries: ['photography', 'design', 'art', 'creative'],
  },
];

export default function InternalNewProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState<InternalStep>('select_template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({});
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Convex mutations
  const createProject = useMutation(api.projects.createEmpty);
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep('business_info');
  };
  
  const handleBusinessInfoSubmit = async (info: BusinessInfo) => {
    setBusinessInfo(info);
    setStep('generating');
    setError(null);
    
    try {
      // Create project with business info
      const project = await createProject({
        name: info.businessName,
        description: info.description,
        templateId: selectedTemplate!,
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.name,
        businessDetails: {
          businessName: info.businessName,
          description: info.description,
          targetAudience: info.targetAudience,
          features: info.services.split(',').map(s => s.trim()),
          goals: [],
        },
        tags: [info.industry],
      });
      
      // Simulate generation progress (will be replaced with real progress)
      for (let i = 0; i <= 100; i += 10) {
        setGenerationProgress(i);
        await new Promise(r => setTimeout(r, 300));
      }
      
      // Navigate to internal draft editor
      navigate(`/internal/draft/${project.urlId}`);
      
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
      setStep('business_info');
    }
  };
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0f',
      color: 'white',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          New Client Project
        </h1>
        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)' }}>
          Step {step === 'select_template' ? '1' : step === 'business_info' ? '2' : '3'} of 3
        </p>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}
        
        {step === 'select_template' && (
          <TemplateSelector
            templates={TEMPLATES}
            onSelect={handleTemplateSelect}
            selected={selectedTemplate}
          />
        )}
        
        {step === 'business_info' && (
          <BusinessInfoForm
            templateId={selectedTemplate!}
            templateName={TEMPLATES.find(t => t.id === selectedTemplate)?.name || ''}
            initialData={businessInfo}
            onSubmit={handleBusinessInfoSubmit}
            onBack={() => setStep('select_template')}
          />
        )}
        
        {step === 'generating' && (
          <GeneratingView progress={generationProgress} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Selector Component
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateSelectorProps {
  templates: typeof TEMPLATES;
  onSelect: (id: string) => void;
  selected: string | null;
}

function TemplateSelector({ templates, onSelect, selected }: TemplateSelectorProps) {
  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        Choose a Template
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            style={{
              padding: '24px',
              backgroundColor: selected === template.id 
                ? 'rgba(124, 58, 237, 0.3)' 
                : 'rgba(255,255,255,0.05)',
              border: selected === template.id
                ? '2px solid #7c3aed'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {template.icon}
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
              {template.name}
            </h3>
            <p style={{ 
              margin: '8px 0 0', 
              fontSize: '14px', 
              color: 'rgba(255,255,255,0.6)',
            }}>
              {template.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Info Form Component
// ─────────────────────────────────────────────────────────────────────────────

interface BusinessInfoFormProps {
  templateId: string;
  templateName: string;
  initialData: Partial<BusinessInfo>;
  onSubmit: (info: BusinessInfo) => void;
  onBack: () => void;
}

function BusinessInfoForm({ 
  templateId, 
  templateName, 
  initialData, 
  onSubmit, 
  onBack 
}: BusinessInfoFormProps) {
  const [formData, setFormData] = useState<Partial<BusinessInfo>>(initialData);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.businessName || !formData.description || !formData.contactEmail) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSubmit(formData as BusinessInfo);
  };
  
  const updateField = (field: keyof BusinessInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.9)',
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: '20px' }}>
          Business Details
        </h2>
        <span style={{ 
          padding: '4px 12px', 
          backgroundColor: 'rgba(124,58,237,0.2)', 
          borderRadius: '999px',
          fontSize: '12px',
          color: '#a78bfa',
        }}>
          {templateName}
        </span>
      </div>
      
      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Business Name */}
        <div>
          <label style={labelStyle}>
            Business Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.businessName || ''}
            onChange={e => updateField('businessName', e.target.value)}
            placeholder="Maria's Life Coaching"
            style={inputStyle}
            required
          />
        </div>
        
        {/* Industry */}
        <div>
          <label style={labelStyle}>Industry</label>
          <select
            value={formData.industry || ''}
            onChange={e => updateField('industry', e.target.value)}
            style={inputStyle}
          >
            <option value="">Select industry...</option>
            <option value="coaching">Coaching</option>
            <option value="consulting">Consulting</option>
            <option value="therapy">Therapy / Wellness</option>
            <option value="restaurant">Restaurant / Cafe</option>
            <option value="salon">Salon / Beauty</option>
            <option value="fitness">Fitness / Gym</option>
            <option value="photography">Photography</option>
            <option value="design">Design / Creative</option>
            <option value="retail">Retail / Shop</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* Description */}
        <div>
          <label style={labelStyle}>
            Business Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={e => updateField('description', e.target.value)}
            placeholder="What does this business do? What makes it unique?"
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            required
          />
        </div>
        
        {/* Services */}
        <div>
          <label style={labelStyle}>Services Offered</label>
          <textarea
            value={formData.services || ''}
            onChange={e => updateField('services', e.target.value)}
            placeholder="Life coaching, career coaching, group workshops, 1-on-1 sessions..."
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </div>
        
        {/* Target Audience */}
        <div>
          <label style={labelStyle}>Target Audience</label>
          <input
            type="text"
            value={formData.targetAudience || ''}
            onChange={e => updateField('targetAudience', e.target.value)}
            placeholder="Professionals in their 30s-40s looking for career change..."
            style={inputStyle}
          />
        </div>
        
        {/* Contact Info */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div>
            <label style={labelStyle}>
              Contact Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={formData.contactEmail || ''}
              onChange={e => updateField('contactEmail', e.target.value)}
              placeholder="hello@business.com"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Contact Phone</label>
            <input
              type="tel"
              value={formData.contactPhone || ''}
              onChange={e => updateField('contactPhone', e.target.value)}
              placeholder="+40 722 123 456"
              style={inputStyle}
            />
          </div>
        </div>
        
        {/* Discovery Notes */}
        <div>
          <label style={labelStyle}>
            Discovery Call Notes
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>
              (paste your notes from the call)
            </span>
          </label>
          <textarea
            value={formData.discoveryNotes || ''}
            onChange={e => updateField('discoveryNotes', e.target.value)}
            placeholder="Key points from discovery call: what they want, their goals, specific requests, examples they liked..."
            style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
          />
        </div>
        
        {/* Preferences */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div>
            <label style={labelStyle}>Color Preference</label>
            <select
              value={formData.colorPreference || ''}
              onChange={e => updateField('colorPreference', e.target.value as any)}
              style={inputStyle}
            >
              <option value="">Auto (based on industry)</option>
              <option value="warm">Warm (orange, red, yellow)</option>
              <option value="cool">Cool (blue, teal, green)</option>
              <option value="neutral">Neutral (gray, beige, white)</option>
              <option value="bold">Bold (purple, pink, vibrant)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tone Preference</label>
            <select
              value={formData.tonePreference || ''}
              onChange={e => updateField('tonePreference', e.target.value as any)}
              style={inputStyle}
            >
              <option value="">Auto (based on industry)</option>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly & Approachable</option>
              <option value="casual">Casual & Fun</option>
              <option value="luxury">Luxury & Premium</option>
            </select>
          </div>
        </div>
        
        {/* Submit */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="submit"
            style={{
              padding: '14px 32px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Generate First Draft →
          </button>
          <p style={{ 
            marginTop: '12px', 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.5)',
          }}>
            This will create an initial draft. You'll refine it with AI chat next.
          </p>
        </div>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generating View Component
// ─────────────────────────────────────────────────────────────────────────────

function GeneratingView({ progress }: { progress: number }) {
  const steps = [
    { label: 'Analyzing business context', threshold: 10 },
    { label: 'Generating hero copy', threshold: 25 },
    { label: 'Writing service descriptions', threshold: 50 },
    { label: 'Creating about section', threshold: 70 },
    { label: 'Setting up SEO', threshold: 85 },
    { label: 'Finalizing site structure', threshold: 100 },
  ];
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    }}>
      <h2 style={{ marginBottom: '32px', fontSize: '24px' }}>
        Generating First Draft...
      </h2>
      
      <div style={{ width: '100%', maxWidth: '500px', marginBottom: '32px' }}>
        <div style={{
          height: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#7c3aed',
            transition: 'width 0.3s ease-out',
          }} />
        </div>
        <p style={{ 
          marginTop: '12px', 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
        }}>
          {progress}%
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, i) => {
          const isDone = progress >= step.threshold;
          const isCurrent = !isDone && (i === 0 || progress >= steps[i - 1].threshold);
          
          return (
            <div 
              key={step.label}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                opacity: isDone || isCurrent ? 1 : 0.4,
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {isDone ? '✅' : isCurrent ? '⏳' : '○'}
              </span>
              <span style={{ color: isDone ? '#a78bfa' : 'white' }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      <p style={{ 
        marginTop: '32px', 
        fontSize: '14px', 
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
      }}>
        This is a first draft (~80%). You'll refine it with AI chat next.
      </p>
    </div>
  );
}
