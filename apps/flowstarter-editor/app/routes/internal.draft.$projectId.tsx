/**
 * Internal Draft Editor
 * 
 * Full editor for team to refine AI-generated drafts.
 * Features:
 * - AI chat with full coding capabilities
 * - File browser with code editing
 * - Terminal access
 * - Live preview
 * - Integration setup
 * - Publish controls
 */

import { useState, useEffect, useCallback } from 'react';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useParams, useNavigate, useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export const meta: MetaFunction = () => {
  return [
    { title: 'Draft Editor (Internal) - Flowstarter' },
    { name: 'description', content: 'Refine client website draft' },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ projectId: params.projectId });
};

// Check if ID looks like a valid Convex ID
function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (id.length < 10) return false;
  return /^[a-z][a-z0-9]+$/i.test(id);
}

export default function InternalDraftEditor() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      {() => <InternalDraftEditorContent />}
    </ClientOnly>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#0a0a0f',
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid #7c3aed',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          Loading editor...
        </span>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function InternalDraftEditorContent() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'integrations' | 'publish'>('chat');
  
  // Fetch project data
  const projectByUrlId = useQuery(
    api.projects.getByUrlId,
    projectId ? { urlId: projectId } : 'skip'
  );
  
  const projectByConvexId = useQuery(
    api.projects.get,
    projectId && isValidConvexId(projectId) 
      ? { id: projectId as Id<'projects'> } 
      : 'skip'
  );
  
  const project = projectByUrlId || projectByConvexId;
  
  // Fetch files
  const files = useQuery(
    api.files.getProjectFiles,
    project?._id ? { projectId: project._id } : 'skip'
  );
  
  // If project not found, redirect
  useEffect(() => {
    if (projectByUrlId === null && projectByConvexId === null) {
      navigate('/internal/new');
    }
  }, [projectByUrlId, projectByConvexId, navigate]);
  
  // Handle sending chat message
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: chatInput,
      timestamp: Date.now(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsGenerating(true);
    
    try {
      // TODO: Implement actual AI chat endpoint
      // For now, simulate a response
      await new Promise(r => setTimeout(r, 1500));
      
      const assistantMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: `I'll help you with that. Let me make the changes...\n\n✅ Done! I've updated the files. Check the preview to see the changes.`,
        timestamp: Date.now(),
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [chatInput, isGenerating]);
  
  if (!project) {
    return <LoadingFallback />;
  }
  
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#0a0a0f',
      color: 'white',
    }}>
      {/* Left Panel: File Browser + Code Editor */}
      <div style={{
        width: '350px',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Project Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {project.name}
          </h2>
          <p style={{ 
            margin: '4px 0 0', 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.5)',
          }}>
            {project.templateName || project.templateId}
          </p>
        </div>
        
        {/* File Tree */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'rgba(255,255,255,0.5)',
            padding: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Files
          </div>
          
          {files ? (
            <FileTree 
              files={files} 
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          ) : (
            <div style={{ 
              padding: '16px', 
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px',
            }}>
              Loading files...
            </div>
          )}
        </div>
        
        {/* Terminal (collapsed) */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px',
        }}>
          <button style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⬛</span>
            <span>Open Terminal</span>
          </button>
        </div>
      </div>
      
      {/* Center Panel: Live Preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>🖥️</span>
            Live Preview
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}>
              📱 Mobile
            </button>
            <button style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}>
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {/* Preview Frame */}
        <div style={{
          flex: 1,
          backgroundColor: '#1a1a1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
            <p>Preview will appear here</p>
            <p style={{ fontSize: '13px', opacity: 0.7 }}>
              Build the project to see live preview
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel: AI Chat + Controls */}
      <div style={{
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {(['chat', 'integrations', 'publish'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: activeTab === tab 
                  ? 'rgba(124,58,237,0.2)' 
                  : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab 
                  ? '2px solid #7c3aed' 
                  : '2px solid transparent',
                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'chat' && '💬 '}
              {tab === 'integrations' && '🔌 '}
              {tab === 'publish' && '🚀 '}
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && (
            <ChatPanel
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              isGenerating={isGenerating}
            />
          )}
          
          {activeTab === 'integrations' && (
            <IntegrationsPanel projectId={project._id} />
          )}
          
          {activeTab === 'publish' && (
            <PublishPanel project={project} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Tree Component
// ─────────────────────────────────────────────────────────────────────────────

interface FileTreeProps {
  files: Array<{ path: string; type: 'file' | 'folder' }>;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  // Group files by directory
  const filesByDir = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    let current = acc;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!current[dir]) {
        current[dir] = { __files: [] };
      }
      current = current[dir];
    }
    
    current.__files = current.__files || [];
    current.__files.push({
      name: parts[parts.length - 1],
      path: file.path,
      type: file.type,
    });
    
    return acc;
  }, {} as Record<string, any>);
  
  const renderTree = (tree: Record<string, any>, depth = 0): React.ReactNode => {
    return Object.entries(tree).map(([key, value]) => {
      if (key === '__files') {
        return (value as Array<{ name: string; path: string; type: string }>).map(file => (
          <button
            key={file.path}
            onClick={() => onSelectFile(file.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              padding: '4px 8px',
              paddingLeft: `${8 + depth * 16}px`,
              backgroundColor: selectedFile === file.path 
                ? 'rgba(124,58,237,0.3)' 
                : 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            <span>{file.type === 'folder' ? '📁' : '📄'}</span>
            <span>{file.name}</span>
          </button>
        ));
      }
      
      return (
        <div key={key}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            paddingLeft: `${8 + depth * 16}px`,
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
          }}>
            <span>📁</span>
            <span>{key}</span>
          </div>
          {renderTree(value, depth + 1)}
        </div>
      );
    });
  };
  
  return <div>{renderTree(filesByDir)}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Panel Component
// ─────────────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages: Array<{ id: string; role: string; content: string; timestamp: number }>;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isGenerating: boolean;
}

function ChatPanel({ messages, input, onInputChange, onSend, isGenerating }: ChatPanelProps) {
  return (
    <>
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{ 
            color: 'rgba(255,255,255,0.5)', 
            textAlign: 'center',
            paddingTop: '32px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤖</div>
            <p style={{ marginBottom: '16px' }}>
              I'm here to help you refine this draft.
            </p>
            <p style={{ fontSize: '13px' }}>
              Try: "Make the headline more punchy" or "Add a testimonials section"
            </p>
          </div>
        )}
        
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '90%',
              padding: '12px 16px',
              backgroundColor: msg.role === 'user' 
                ? '#7c3aed' 
                : 'rgba(255,255,255,0.1)',
              borderRadius: msg.role === 'user'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              fontSize: '14px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isGenerating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px',
          }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {[
          'Add testimonials section',
          'Make colors warmer',
          'Rewrite hero copy',
          'Add pricing section',
        ].map(action => (
          <button
            key={action}
            onClick={() => onInputChange(action)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '999px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {action}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Tell me what to change..."
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={onSend}
            disabled={isGenerating || !input.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isGenerating ? 'wait' : 'pointer',
              opacity: isGenerating || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Integrations Panel Component
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationsPanel({ projectId }: { projectId: Id<'projects'> }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
        Configure integrations for this client site.
      </p>
      
      {/* Calendly */}
      <IntegrationCard
        icon="📅"
        name="Calendly"
        description="Booking / Scheduling"
        enabled={false}
      />
      
      {/* Contact Form */}
      <IntegrationCard
        icon="📧"
        name="Contact Form"
        description="Lead capture (always enabled)"
        enabled={true}
        locked
      />
      
      {/* Google Analytics */}
      <IntegrationCard
        icon="📊"
        name="Google Analytics"
        description="Traffic tracking"
        enabled={false}
      />
      
      {/* WhatsApp */}
      <IntegrationCard
        icon="💬"
        name="WhatsApp Button"
        description="Direct contact"
        enabled={false}
      />
    </div>
  );
}

function IntegrationCard({ 
  icon, 
  name, 
  description, 
  enabled, 
  locked 
}: { 
  icon: string; 
  name: string; 
  description: string; 
  enabled: boolean;
  locked?: boolean;
}) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          {description}
        </div>
      </div>
      <button
        disabled={locked}
        style={{
          padding: '6px 12px',
          backgroundColor: enabled ? '#7c3aed' : 'transparent',
          border: enabled ? 'none' : '1px solid rgba(255,255,255,0.3)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '12px',
          cursor: locked ? 'not-allowed' : 'pointer',
          opacity: locked ? 0.5 : 1,
        }}
      >
        {enabled ? 'Enabled' : 'Setup'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Publish Panel Component
// ─────────────────────────────────────────────────────────────────────────────

function PublishPanel({ project }: { project: any }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '16px' }}>Ready to Publish?</h3>
      
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
      }}>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            Client Name
          </span>
          <div style={{ fontWeight: 500 }}>{project.name}</div>
        </div>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            Domain
          </span>
          <div style={{ fontWeight: 500, color: '#7c3aed' }}>
            {project.urlId}.flowstarter.app
          </div>
        </div>
      </div>
      
      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ChecklistItem done label="Site generated" />
        <ChecklistItem done={false} label="Content reviewed" />
        <ChecklistItem done={false} label="Integrations configured" />
        <ChecklistItem done={false} label="Contact info added" />
      </div>
      
      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <button style={{
          padding: '12px 16px',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          👁️ Preview Live
        </button>
        <button style={{
          padding: '12px 16px',
          backgroundColor: '#7c3aed',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          🚀 Publish to Cloudflare
        </button>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
    }}>
      <span>{done ? '✅' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}
