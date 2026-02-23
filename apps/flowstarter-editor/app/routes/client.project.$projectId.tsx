/**
 * Client Project Editor
 * 
 * Simplified editor for clients (via magic link):
 * - View their site
 * - Make customizations (constrained)
 * - Publish changes
 * 
 * NO: code editing, terminal, full AI capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { useQuery, useMutation } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

export default function ClientProjectEditor() {
  return (
    <ClientOnly fallback={<Loading />}>
      {() => <ClientProjectEditorContent />}
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

function ClientProjectEditorContent() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Check client auth
  useEffect(() => {
    const mode = localStorage.getItem('flowstarter_mode');
    if (mode !== 'client') {
      // Check for magic link session
      const session = localStorage.getItem('flowstarter_session');
      if (!session) {
        navigate('/');
        return;
      }
    }
  }, [navigate]);
  
  // Fetch project
  const project = useQuery(api.projects.getByUrlId, projectId ? { urlId: projectId } : 'skip');
  
  // Get client info
  const clientId = localStorage.getItem('flowstarter_client_id');
  
  // Send customization request
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);
    
    // TODO: Implement constrained AI customization
    await new Promise(r => setTimeout(r, 1500));
    
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `I've made that change for you! 👍\n\nYou can see the update in the preview. When you're happy with all your changes, click "Publish Changes" to make them live.`
    }]);
    setIsGenerating(false);
    setHasChanges(true);
  }, [chatInput, isGenerating]);
  
  // Publish changes
  const handlePublish = async () => {
    // TODO: Implement publish
    alert('Changes published! Your site is now live.');
    setHasChanges(false);
  };
  
  if (!project) {
    return <Loading />;
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#1a1a2e',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 24 }}>🌐</span>
          <div>
            <div style={{ fontWeight: 600 }}>{project.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {project.urlId}.flowstarter.app
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {hasChanges && (
            <span style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(245,158,11,0.2)',
              color: '#f59e0b',
              borderRadius: 999,
              fontSize: 12,
            }}>
              Unsaved changes
            </span>
          )}
          <button
            onClick={handlePublish}
            disabled={!hasChanges}
            style={{
              padding: '10px 20px',
              backgroundColor: hasChanges ? '#10b981' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontWeight: 500,
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            🚀 Publish Changes
          </button>
        </div>
      </header>
      
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            🖥️ Your Website Preview
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎨</div>
              <p style={{ fontSize: 18, marginBottom: 8 }}>Your site preview</p>
              <p style={{ fontSize: 13 }}>Make changes using the chat on the right</p>
            </div>
          </div>
        </div>
        
        {/* Chat Panel */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 4 }}>
              ✨ Customize Your Site
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Tell me what you'd like to change
            </p>
          </div>
          
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {/* Welcome message */}
            {chatMessages.length === 0 && (
              <div style={{
                padding: 16,
                backgroundColor: 'rgba(124,58,237,0.1)',
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  👋 Hi! I'm here to help you customize your website.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                  You can ask me to:
                </p>
                <ul style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', paddingLeft: 20, margin: 0 }}>
                  <li>Change text and headlines</li>
                  <li>Update colors</li>
                  <li>Modify images</li>
                  <li>Rearrange sections</li>
                </ul>
              </div>
            )}
            
            {chatMessages.map((msg, i) => (
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
                ✨ Making your changes...
              </div>
            )}
          </div>
          
          {/* Quick suggestions */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Suggestions:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                'Change headline',
                'Update my phone number',
                'Change the colors',
                'Add my hours',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setChatInput(suggestion)}
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
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          
          {/* Input */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="What would you like to change?"
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
                onClick={handleSendMessage}
                disabled={isGenerating || !chatInput.trim()}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#7c3aed',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  cursor: 'pointer',
                  opacity: isGenerating || !chatInput.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
