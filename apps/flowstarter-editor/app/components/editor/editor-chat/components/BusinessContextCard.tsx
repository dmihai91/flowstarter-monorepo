/**
 * BusinessContextCard Component
 * 
 * Displays the business context (from team dashboard) at the top of the chat.
 * Shows business name, industry, description, and key details from Convex.
 * 
 * This is displayed when the editor is opened with pre-existing project data
 * (internal flow - project created in team dashboard).
 */

import { Building2, Users, Target, Sparkles } from 'lucide-react';

interface BusinessContextCardProps {
  businessName: string;
  description?: string;
  targetAudience?: string;
  goals?: string[];
  industry?: string;
  uvp?: string;
  isDark: boolean;
  onEdit?: () => void;
}

export function BusinessContextCard({
  businessName,
  description,
  targetAudience,
  goals,
  industry,
  uvp,
  isDark,
  onEdit,
}: BusinessContextCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 mb-4 ${
        isDark
          ? 'bg-white/5 border-white/10 text-white/90'
          : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isDark ? 'bg-purple-500/20' : 'bg-purple-100'
            }`}
          >
            <Building2
              className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
            />
          </div>
          <h3
            className={`font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {businessName}
          </h3>
          {industry && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isDark
                  ? 'bg-white/10 text-white/60'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {industry}
            </span>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className={`text-xs px-2 py-1 rounded ${
              isDark
                ? 'text-white/50 hover:text-white/80 hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } transition-colors`}
          >
            Edit
          </button>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          className={`text-sm mb-3 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}
        >
          {description}
        </p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Target Audience */}
        {targetAudience && (
          <div className="flex items-start gap-2">
            <Users
              className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`}
            />
            <div>
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                }`}
              >
                Audience
              </span>
              <p
                className={`text-xs ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}
              >
                {targetAudience}
              </p>
            </div>
          </div>
        )}

        {/* UVP */}
        {uvp && (
          <div className="flex items-start gap-2">
            <Sparkles
              className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-amber-400' : 'text-amber-500'
              }`}
            />
            <div>
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                }`}
              >
                What makes you unique
              </span>
              <p
                className={`text-xs ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}
              >
                {uvp}
              </p>
            </div>
          </div>
        )}

        {/* Goals */}
        {goals && goals.length > 0 && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <Target
              className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-green-400' : 'text-green-500'
              }`}
            />
            <div>
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                }`}
              >
                Goals
              </span>
              <p
                className={`text-xs ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}
              >
                {goals.slice(0, 2).join(' • ')}
                {goals.length > 2 && ` +${goals.length - 2} more`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessContextCard;
