/**
 * Internal Projects Dashboard
 * 
 * Shows projects that came from the main platform's form.
 * Business data is collected there, then handed off here for generation.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useQuery, useMutation } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

export const meta: MetaFunction = () => {
  return [
    { title: 'Projects (Internal) - Flowstarter' },
    { name: 'description', content: 'Manage client projects' },
  ];
};

// Main platform URL
const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'http://localhost:3000';

export default function InternalProjects() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      {() => <InternalProjectsContent />}
    </ClientOnly>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid #7c3aed',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function InternalProjectsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessingHandoff, setIsProcessingHandoff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check for handoff from main platform
  const handoffToken = searchParams.get('handoff');
  const handoffProjectId = searchParams.get('project');
  
  // Fetch projects list
  const projects = useQuery(api.projects.list, { limit: 50 });
  
  // Process handoff on mount
  useEffect(() => {
    async function processHandoff() {
      if (!handoffToken || isProcessingHandoff) return;
      
      setIsProcessingHandoff(true);
      
      try {
        // Validate handoff with main platform and get project data
        const response = await fetch(
          `${MAIN_PLATFORM_URL}/api/editor/handoff?token=${handoffToken}`
        );
        
        if (!response.ok) {
          throw new Error('Invalid handoff token');
        }
        
        const data = await response.json();
        
        if (data.project) {
          // Redirect to draft editor with the project
          navigate(`/internal/draft/${data.project.id}?handoff=${handoffToken}`);
        }
      } catch (err) {
        console.error('Handoff failed:', err);
        setError('Failed to process handoff. Please try again from the main platform.');
        setIsProcessingHandoff(false);
      }
    }
    
    processHandoff();
  }, [handoffToken, isProcessingHandoff, navigate]);
  
  // Show loading while processing handoff
  if (isProcessingHandoff) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: 'white',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #7c3aed',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px',
        }} />
        <p style={{ fontSize: '16px' }}>Loading project from main platform...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }
  
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Client Projects
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)' }}>
            Projects created from client forms
          </p>
        </div>
        
        <a
          href={`${MAIN_PLATFORM_URL}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📝 Create New (Main Platform)
        </a>
      </div>
      
      {/* Error */}
      {error && (
        <div style={{
          margin: '16px 32px',
          padding: '16px',
          backgroundColor: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.5)',
          borderRadius: '8px',
          color: '#fca5a5',
        }}>
          {error}
        </div>
      )}
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {!projects ? (
          <LoadingFallback />
        ) : projects.length === 0 ? (
          <EmptyState mainPlatformUrl={MAIN_PLATFORM_URL} />
        ) : (
          <ProjectsGrid projects={projects} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ mainPlatformUrl }: { mainPlatformUrl: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
      <h2 style={{ marginBottom: '12px', fontSize: '20px' }}>No projects yet</h2>
      <p style={{ 
        marginBottom: '24px', 
        color: 'rgba(255,255,255,0.6)',
        maxWidth: '400px',
      }}>
        Projects are created when clients fill out the form on the main platform.
        After they submit, you'll see them here ready for site generation.
      </p>
      <a
        href={`${mainPlatformUrl}/dashboard`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '14px 28px',
          backgroundColor: '#7c3aed',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
        }}
      >
        Go to Main Platform →
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects Grid
// ─────────────────────────────────────────────────────────────────────────────

function ProjectsGrid({ projects }: { projects: any[] }) {
  const navigate = useNavigate();
  
  // Group by status
  const drafts = projects.filter(p => p.status === 'draft' || !p.status);
  const inReview = projects.filter(p => p.status === 'review');
  const published = projects.filter(p => p.status === 'published');
  
  const statusSections = [
    { title: '🔨 Drafts', projects: drafts, color: '#f59e0b' },
    { title: '👀 In Review', projects: inReview, color: '#3b82f6' },
    { title: '✅ Published', projects: published, color: '#10b981' },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {statusSections.map(section => (
        section.projects.length > 0 && (
          <div key={section.title}>
            <h3 style={{ 
              marginBottom: '16px', 
              fontSize: '16px',
              color: section.color,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {section.title}
              <span style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
              }}>
                {section.projects.length}
              </span>
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {section.projects.map(project => (
                <button
                  key={project._id}
                  onClick={() => navigate(`/internal/draft/${project.urlId}`)}
                  style={{
                    padding: '20px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    color: 'white',
                    marginBottom: '8px',
                  }}>
                    {project.name || 'Untitled Project'}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '12px',
                  }}>
                    {project.templateName || project.templateId || 'No template'}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ color: '#7c3aed' }}>
                      Open →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
