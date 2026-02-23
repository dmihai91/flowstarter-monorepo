/**
 * Team Dashboard
 * 
 * After login, shows:
 * - Quick actions (new project)
 * - Projects list by status
 * - Client management
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { isTeamAuthenticated, getTeamUser, clearTeamSession } from '~/lib/team-auth';

export default function TeamDashboard() {
  return (
    <ClientOnly fallback={<Loading />}>
      {() => <TeamDashboardContent />}
    </ClientOnly>
  );
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TeamDashboardContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getTeamUser());
  
  // Check auth
  useEffect(() => {
    if (!isTeamAuthenticated()) {
      navigate('/team/login');
    }
  }, [navigate]);
  
  // Fetch projects
  const projects = useQuery(api.projects.list, { limit: 50 });
  
  // Fetch clients
  const clients = useQuery(api.clients.list, {});
  
  const handleLogout = () => {
    clearTeamSession();
    navigate('/team/login');
  };
  
  if (!user) return <Loading />;
  
  // Group projects by status
  const drafts = projects?.filter(p => !p.status || p.status === 'draft') || [];
  const inReview = projects?.filter(p => p.status === 'review') || [];
  const published = projects?.filter(p => p.status === 'published') || [];
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#7c3aed',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20 }}>🔧</span>
          <span style={{ fontWeight: 600 }}>Flowstarter Team</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ opacity: 0.9 }}>{user.email}</span>
          <button onClick={handleLogout} style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
          }}>
            Logout
          </button>
        </div>
      </header>
      
      {/* Main */}
      <main style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Quick Actions */}
        <div style={{ marginBottom: 40 }}>
          <Link
            to="/team/project/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            ➕ New Client Project
          </Link>
        </div>
        
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}>
          <StatCard label="Drafts" value={drafts.length} color="#f59e0b" />
          <StatCard label="In Review" value={inReview.length} color="#3b82f6" />
          <StatCard label="Published" value={published.length} color="#10b981" />
          <StatCard label="Clients" value={clients?.length || 0} color="#8b5cf6" />
        </div>
        
        {/* Projects */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Recent Projects</h2>
          
          {!projects ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
          ) : projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {projects.slice(0, 9).map(project => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: 20,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const statusColors: Record<string, string> = {
    draft: '#f59e0b',
    review: '#3b82f6',
    published: '#10b981',
  };
  const status = project.status || 'draft';
  
  return (
    <Link
      to={`/team/project/${project.urlId}`}
      style={{
        display: 'block',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'white',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          {project.name || 'Untitled'}
        </h3>
        <span style={{
          padding: '4px 10px',
          backgroundColor: `${statusColors[status]}20`,
          color: statusColors[status],
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'capitalize',
        }}>
          {status}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, marginBottom: 12 }}>
        {project.description?.slice(0, 80) || 'No description'}
        {project.description?.length > 80 ? '...' : ''}
      </p>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: 48,
      textAlign: 'center',
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderRadius: 12,
      border: '1px dashed rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>No projects yet</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
        Create your first client project to get started
      </p>
      <Link
        to="/team/project/new"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#7c3aed',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 8,
          fontWeight: 500,
        }}
      >
        Create Project
      </Link>
    </div>
  );
}
