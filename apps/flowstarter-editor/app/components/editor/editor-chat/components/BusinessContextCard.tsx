/**
 * BusinessContextCard Component
 * 
 * Displays project name + description at the top of the chat.
 * Name is editable inline.
 */

import { useState, useRef, useEffect } from 'react';
import { Building2, Pencil, Check } from 'lucide-react';

interface BusinessContextCardProps {
  businessName: string;
  description?: string;
  targetAudience?: string;
  goals?: string[];
  industry?: string;
  uvp?: string;
  isDark: boolean;
  onEdit?: () => void;
  onNameChange?: (name: string) => void;
}

export function BusinessContextCard({
  businessName,
  description,
  isDark,
  onNameChange,
}: BusinessContextCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(businessName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== businessName) {
      onNameChange?.(trimmed);
    } else {
      setEditName(businessName);
    }
    setIsEditing(false);
  };

  return (
    <div
      className="rounded-xl p-3.5 mb-3"
      style={{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: isDark ? 'rgba(77, 93, 217, 0.15)' : 'rgba(77, 93, 217, 0.08)' }}
        >
          <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--purple)' }} />
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') { setEditName(businessName); setIsEditing(false); }
              }}
              onBlur={handleSave}
              className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b outline-none"
              style={{
                color: isDark ? '#fafafa' : '#09090b',
                borderColor: 'var(--purple)',
              }}
            />
            <button onClick={handleSave} className="p-0.5 rounded" style={{ color: 'var(--purple)' }}>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 group cursor-pointer" onClick={() => setIsEditing(true)}>
            <span className="text-sm font-semibold truncate" style={{ color: isDark ? '#fafafa' : '#09090b' }}>
              {businessName}
            </span>
            <Pencil
              className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0"
              style={{ color: isDark ? '#fafafa' : '#09090b' }}
            />
          </div>
        )}
      </div>

      {description && (
        <p
          className="text-xs mt-2 ml-8 line-clamp-2"
          style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
