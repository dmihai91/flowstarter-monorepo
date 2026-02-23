/**
 * New Client Project (Team)
 * 
 * Form to create a project from discovery call notes.
 * Collects all business info, creates client + project, then starts generation.
 */

import { useState } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { useMutation } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { isTeamAuthenticated, getTeamUser } from '~/lib/team-auth';
import { useEffect } from 'react';

const TEMPLATES = [
  { id: 'service-professional', name: 'Service Professional', icon: '👔', description: 'Coaches, consultants, therapists' },
  { id: 'local-business', name: 'Local Business', icon: '🏪', description: 'Restaurants, salons, shops' },
  { id: 'creative-portfolio', name: 'Creative Portfolio', icon: '🎨', description: 'Photographers, designers, artists' },
];

export default function NewClientProject() {
  return (
    <ClientOnly fallback={<div />}>
      {() => <NewClientProjectContent />}
    </ClientOnly>
  );
}

function NewClientProjectContent() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'generating'>('info');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [discoveryNotes, setDiscoveryNotes] = useState('');
  const [templateId, setTemplateId] = useState('service-professional');
  
  // Mutations
  const createClient = useMutation(api.clients.create);
  const createProject = useMutation(api.projects.createEmpty);
  
  // Auth check
  useEffect(() => {
    if (!isTeamAuthenticated()) {
      navigate('/team/login');
    }
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!clientName || !clientEmail || !businessName) {
      setError('Please fill in all required fields');
      return;
    }
    
    setStep('generating');
    
    try {
      const user = getTeamUser();
      
      // 1. Create client
      const clientResult = await createClient({
        name: clientName,
        email: clientEmail,
        phone: clientPhone || undefined,
        discoveryNotes: discoveryNotes || undefined,
      });
      
      if (!clientResult.success) {
        // Client might already exist, that's ok
        console.log('Client creation:', clientResult);
      }
      
      // 2. Create project
      setProgress(10);
      const project = await createProject({
        name: businessName,
        description,
        templateId,
        templateName: TEMPLATES.find(t => t.id === templateId)?.name,
        businessDetails: {
          businessName,
          description,
          targetAudience,
          features: services.split(',').map(s => s.trim()).filter(Boolean),
          goals: [],
        },
        tags: industry ? [industry] : [],
        clientId: clientResult.clientId,
      });
      
      // 3. Simulate generation progress (will be real AI later)
      for (let i = 20; i <= 100; i += 15) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 500));
      }
      
      // 4. Navigate to project editor
      navigate(`/team/project/${project.urlId}`);
      
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
      setStep('info');
    }
  };
  
  if (step === 'generating') {
    return <GeneratingView progress={progress} businessName={businessName} />;
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#7c3aed',
      }}>
        <Link to="/team" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
          ← Back
        </Link>
        <span style={{ fontWeight: 600 }}>New Client Project</span>
      </header>
      
      {/* Form */}
      <main style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        {error && (
          <div style={{
            padding: 16,
            backgroundColor: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 8,
            marginBottom: 24,
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Client Info */}
          <Section title="👤 Client Information">
            <Grid>
              <Field label="Client Name" required>
                <Input value={clientName} onChange={setClientName} placeholder="Maria Ionescu" />
              </Field>
              <Field label="Client Email" required>
                <Input type="email" value={clientEmail} onChange={setClientEmail} placeholder="maria@example.com" />
              </Field>
              <Field label="Client Phone">
                <Input value={clientPhone} onChange={setClientPhone} placeholder="+40 722 123 456" />
              </Field>
            </Grid>
          </Section>
          
          {/* Business Info */}
          <Section title="🏢 Business Details">
            <Field label="Business Name" required>
              <Input value={businessName} onChange={setBusinessName} placeholder="Maria's Life Coaching" />
            </Field>
            
            <Grid>
              <Field label="Industry">
                <Select value={industry} onChange={setIndustry}>
                  <option value="">Select...</option>
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
                </Select>
              </Field>
              <Field label="Template">
                <Select value={templateId} onChange={setTemplateId}>
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </Select>
              </Field>
            </Grid>
            
            <Field label="Business Description">
              <Textarea 
                value={description} 
                onChange={setDescription} 
                placeholder="What does this business do? What makes it unique?"
                rows={3}
              />
            </Field>
            
            <Field label="Services Offered">
              <Textarea 
                value={services} 
                onChange={setServices} 
                placeholder="Life coaching, career coaching, group workshops, 1-on-1 sessions..."
                rows={2}
              />
            </Field>
            
            <Field label="Target Audience">
              <Input 
                value={targetAudience} 
                onChange={setTargetAudience} 
                placeholder="Professionals in their 30s-40s looking for career change..."
              />
            </Field>
          </Section>
          
          {/* Discovery Notes */}
          <Section title="📝 Discovery Call Notes">
            <Field label="Notes from the call">
              <Textarea 
                value={discoveryNotes} 
                onChange={setDiscoveryNotes} 
                placeholder="Key points from discovery call: what they want, their goals, specific requests, examples they liked, colors they prefer..."
                rows={6}
              />
            </Field>
          </Section>
          
          {/* Submit */}
          <div style={{ marginTop: 32 }}>
            <button
              type="submit"
              style={{
                padding: '16px 32px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Generate Site →
            </button>
            <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              This will create an initial draft. You can refine it with AI chat after.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

// ── UI Components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: 'white',
  fontSize: 14,
};

function Input({ type = 'text', value, onChange, placeholder }: { type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>{children}</select>;
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical' }} />;
}

// ── Generating View ───────────────────────────────────────────────────────────

function GeneratingView({ progress, businessName }: { progress: number; businessName: string }) {
  const steps = [
    { label: 'Creating client record', threshold: 10 },
    { label: 'Analyzing business context', threshold: 25 },
    { label: 'Generating hero copy', threshold: 40 },
    { label: 'Writing service descriptions', threshold: 55 },
    { label: 'Creating about section', threshold: 70 },
    { label: 'Setting up contact form', threshold: 85 },
    { label: 'Finalizing site', threshold: 100 },
  ];
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      color: 'white',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 500 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Generating site for {businessName}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          This will take about 30 seconds...
        </p>
        
        {/* Progress bar */}
        <div style={{ 
          height: 8, 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 4, 
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#7c3aed',
            transition: 'width 0.3s',
          }} />
        </div>
        
        {/* Steps */}
        <div style={{ textAlign: 'left' }}>
          {steps.map((step, i) => {
            const isDone = progress >= step.threshold;
            const isCurrent = !isDone && (i === 0 || progress >= steps[i - 1].threshold);
            return (
              <div key={step.label} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 8,
                opacity: isDone || isCurrent ? 1 : 0.4,
              }}>
                <span>{isDone ? '✅' : isCurrent ? '⏳' : '○'}</span>
                <span style={{ color: isDone ? '#a78bfa' : 'white' }}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
