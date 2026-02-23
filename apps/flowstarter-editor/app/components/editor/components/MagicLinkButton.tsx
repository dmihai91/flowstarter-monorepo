/**
 * Magic Link Button - Team Only Feature
 * 
 * Generates a magic link for sharing with clients.
 * Uses existing design system.
 */

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface MagicLinkButtonProps {
  projectId: Id<'projects'> | null;
}

export function MagicLinkButton({ projectId }: MagicLinkButtonProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const [isOpen, setIsOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get project to check for client
  const project = useQuery(api.projects.get, projectId ? { projectId } : 'skip');
  
  // Get client if linked
  const client = useQuery(
    api.clients.get,
    project?.clientId ? { id: project.clientId } : 'skip'
  );
  
  // Mutation to create magic link
  const createMagicLink = useMutation(api.magicLinks.create);
  
  const handleGenerateLink = async () => {
    if (!projectId || !client) return;
    
    setIsGenerating(true);
    try {
      const result = await createMagicLink({
        clientId: client._id,
        projectId,
        accessLevel: 'customize',
        expiresInDays: 30,
      });
      
      if (result.success && result.token) {
        const fullUrl = `${window.location.origin}/access/${result.token}`;
        setGeneratedLink(fullUrl);
      }
    } catch (err) {
      console.error('Failed to generate magic link:', err);
    }
    setIsGenerating(false);
  };
  
  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Don't render if no project
  if (!projectId) return null;
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)',
          border: `1px solid ${isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)'}`,
          borderRadius: '8px',
          color: '#a78bfa',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span>🔗</span>
        <span>Share</span>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
          />
          
          {/* Panel */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '320px',
              padding: '16px',
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: 600,
                color: colors.text,
              }}>
                Share with Client
              </h3>
            </div>
            
            {!client ? (
              <div style={{ 
                padding: '12px', 
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#f59e0b',
              }}>
                No client linked to this project.
              </div>
            ) : (
              <>
                {/* Client info */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontWeight: 500, color: colors.text, fontSize: '13px' }}>
                    {client.name}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSubtle, marginTop: '2px' }}>
                    {client.email}
                  </div>
                </div>
                
                {!generatedLink ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#7c3aed',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isGenerating ? 'wait' : 'pointer',
                      opacity: isGenerating ? 0.7 : 1,
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Magic Link'}
                  </button>
                ) : (
                  <>
                    <div style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                      color: colors.textSubtle,
                      marginBottom: '8px',
                    }}>
                      {generatedLink}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleCopy}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: copied ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                          border: 'none',
                          borderRadius: '6px',
                          color: copied ? 'white' : colors.text,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {copied ? '✓ Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => setGeneratedLink(null)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          border: 'none',
                          borderRadius: '6px',
                          color: colors.text,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        New
                      </button>
                    </div>
                  </>
                )}
                
                <p style={{ 
                  margin: '12px 0 0', 
                  fontSize: '11px', 
                  color: colors.textSubtle,
                }}>
                  Client will sign up with Google/Apple to access.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
