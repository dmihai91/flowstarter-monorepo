/**
 * Team Project Editor
 * 
 * Full editor for team members:
 * - Preview site
 * - AI chat to refine
 * - Generate magic link
 * - Publish to production
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from '@remix-run/react';
import { useQuery, useMutation } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { isTeamAuthenticated } from '~/lib/team-auth';
import type { Id } from '../../convex/_generated/dataModel';

export default function TeamProjectEditor() {
  return (
    <ClientOnly fallback={<Loading />}>
      {() => <TeamProjectEditorContent />}
    </ClientOnly>
  );
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TeamProjectEditorContent() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'magiclink' | 'publish'>('chat');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auth check
  useEffect(() => {
    if (!isTeamAuthenticated()) {
      navigate('/team/login');
    }
  }, [navigate]);
  
  // Fetch project
  const project = useQuery(api.projects.getByUrlId, projectId ? { urlId: projectId } : 'skip');
  
  // Fetch client if linked
  const client = useQuery(
    api.clients.get,
    project?.clientId ? { id: project.clientId } : 'skip'
  );
  
  // Send chat message
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);
    
    // TODO: Implement real AI chat
    await new Promise(r => setTimeout(r, 1500));
    
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `I'll help you with that! Let me make the changes...\n\n✅ Done! I've updated the site. Check the preview to see the changes.` 
    }]);
    setIsGenerating(false);
  }, [chatInput, isGenerating]);
  
  if (!project) {
    return <Loading />;
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '12px 20px',
        backgroundColor: '#7c3aed',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/team" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>← Back</Link>
          <span style={{ fontWeight: 600 }}>{project.name || 'Untitled'}</span>
          <StatusBadge status={project.status || 'draft'} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {client && (
            <span style={{ opacity: 0.8, marginRight: 8 }}>
              Client: {client.name}
            </span>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Preview */}
        <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            🖥️ Preview
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
              <p>Preview will appear here</p>
              <p style={{ fontSize: 13 }}>Site URL: {project.urlId}.flowstarter.app</p>
            </div>
          </div>
        </div>
        
        {/* Right Panel */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {(['chat', 'magiclink', 'publish'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  backgroundColor: activeTab === tab ? 'rgba(124,58,237,0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {tab === 'chat' && '💬 Refine'}
                {tab === 'magiclink' && '🔗 Magic Link'}
                {tab === 'publish' && '🚀 Publish'}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                input={chatInput}
                onInputChange={setChatInput}
                onSend={handleSendMessage}
                isGenerating={isGenerating}
              />
            )}
            {activeTab === 'magiclink' && (
              <MagicLinkPanel project={project} client={client} />
            )}
            {activeTab === 'publish' && (
              <PublishPanel project={project} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: '#f59e0b',
    review: '#3b82f6',
    published: '#10b981',
  };
  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: `${colors[status] || '#666'}30`,
      color: colors[status] || '#666',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ messages, input, onInputChange, onSend, isGenerating }: {
  messages: Array<{ role: string; content: string }>;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isGenerating: boolean;
}) {
  return (
    <>
      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', paddingTop: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
            <p>Ask me to make changes to the site</p>
            <p style={{ fontSize: 13 }}>e.g. "Make the headline more punchy"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              backgroundColor: msg.role === 'user' ? '#7c3aed' : 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            ⏳ AI is thinking...
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['Make headline punchier', 'Add testimonials', 'Change colors', 'Add pricing'].map(action => (
          <button
            key={action}
            onClick={() => onInputChange(action)}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {action}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder="Ask AI to make changes..."
            style={{
              flex: 1,
              padding: '12px 14px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
            }}
          />
          <button
            onClick={onSend}
            disabled={isGenerating || !input.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              opacity: isGenerating || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

// ── Magic Link Panel ──────────────────────────────────────────────────────────

function MagicLinkPanel({ project, client }: { project: any; client: any }) {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const createMagicLink = useMutation(api.magicLinks.create);
  
  const handleGenerate = async () => {
    if (!client) return;
    
    setIsGenerating(true);
    try {
      const result = await createMagicLink({
        clientId: client._id,
        projectId: project._id,
        accessLevel: 'customize',
        expiresInDays: 30,
      });
      
      if (result.success) {
        const fullUrl = `${window.location.origin}/access/${result.token}`;
        setGeneratedLink(fullUrl);
      }
    } catch (err) {
      console.error('Failed to create magic link:', err);
    }
    setIsGenerating(false);
  };
  
  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Send to Client
      </h3>
      
      {!client ? (
        <div style={{ 
          padding: 20, 
          backgroundColor: 'rgba(239,68,68,0.1)', 
          borderRadius: 8,
          color: 'rgba(255,255,255,0.7)',
        }}>
          <p>⚠️ No client linked to this project.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            Create the project through the new project form to link a client.
          </p>
        </div>
      ) : (
        <>
          {/* Client info */}
          <div style={{
            padding: 16,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <div style={{ fontWeight: 500 }}>{client.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {client.email}
            </div>
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              backgroundColor: client.clerkUserId ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              color: client.clerkUserId ? '#10b981' : '#f59e0b',
              borderRadius: 4,
              fontSize: 12,
              display: 'inline-block',
            }}>
              {client.clerkUserId ? '✓ Has account' : 'Not signed up yet'}
            </div>
          </div>
          
          {/* Generate button or link */}
          {!generatedLink ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#7c3aed',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? 'Generating...' : '🔗 Generate Magic Link'}
            </button>
          ) : (
            <div>
              <div style={{
                padding: 14,
                backgroundColor: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8 }}>
                  ✓ Magic link generated!
                </div>
                <div style={{
                  padding: 10,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 6,
                  fontSize: 12,
                  wordBreak: 'break-all',
                  color: 'rgba(255,255,255,0.8)',
                }}>
                  {generatedLink}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <button
                  onClick={() => setGeneratedLink(null)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  New Link
                </button>
              </div>
              
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                Send this link to {client.name}. They'll sign up with Google/Apple and get access to customize their site.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Publish Panel ─────────────────────────────────────────────────────────────

function PublishPanel({ project }: { project: any }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(project.status === 'published');
  
  const publishProject = useMutation(api.projects.publish);
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishProject({
        projectId: project._id,
        publishedUrl: `https://${project.urlId}.flowstarter.app`,
      });
      setPublished(true);
    } catch (err) {
      console.error('Publish failed:', err);
    }
    setIsPublishing(false);
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Publish Site
      </h3>
      
      {/* Checklist */}
      <div style={{ marginBottom: 24 }}>
        <ChecklistItem done={!!project.name} label="Site name set" />
        <ChecklistItem done={!!project.description} label="Description added" />
        <ChecklistItem done={!!project.templateId} label="Template selected" />
        <ChecklistItem done={!!project.clientId} label="Client linked" />
      </div>
      
      {/* Domain info */}
      <div style={{
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          Site URL
        </div>
        <div style={{ fontWeight: 500, color: '#7c3aed' }}>
          {project.urlId}.flowstarter.app
        </div>
      </div>
      
      {/* Publish button */}
      {published ? (
        <div style={{
          padding: 16,
          backgroundColor: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 4 }}>
            Site Published!
          </div>
          <a
            href={`https://${project.urlId}.flowstarter.app`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7c3aed', fontSize: 14 }}
          >
            View live site →
          </a>
        </div>
      ) : (
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#10b981',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: isPublishing ? 0.7 : 1,
          }}
        >
          {isPublishing ? 'Publishing...' : '🚀 Publish to Production'}
        </button>
      )}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      color: done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
    }}>
      <span>{done ? '✅' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}
