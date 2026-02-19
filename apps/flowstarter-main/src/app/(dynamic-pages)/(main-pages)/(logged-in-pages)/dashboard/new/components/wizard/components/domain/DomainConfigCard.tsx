import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM_CONFIG } from '@/lib/const';
import type { ProjectConfig } from '@/types/project-config';
import { ExternalLink, Server } from 'lucide-react';

interface DomainConfigCardProps {
  projectConfig: ProjectConfig;
}

export function DomainConfigCard({ projectConfig }: DomainConfigCardProps) {
  const domainType = projectConfig.domainConfig.domainType || 'hosted';
  const isCustomDomain = domainType === 'custom';

  return (
    <Card className="group [@media(hover:hover)]:hover:shadow-lg transition-all duration-200 [@media(hover:hover)]:hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center group-[@media(hover:hover)]:hover:scale-110 transition-transform ${
              isCustomDomain
                ? 'bg-blue-500/10 group-[@media(hover:hover)]:hover:bg-blue-500/20'
                : 'bg-green-500/10 group-[@media(hover:hover)]:hover:bg-green-500/20'
            }`}
          >
            {isCustomDomain ? (
              <ExternalLink
                className="h-5 w-5"
                style={{ color: 'var(--blue)' }}
              />
            ) : (
              <Server className="h-5 w-5" style={{ color: 'var(--green)' }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Domain & Hosting</CardTitle>
              <Badge
                variant={isCustomDomain ? 'default' : 'secondary'}
                className={
                  isCustomDomain
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }
              >
                {isCustomDomain ? 'Custom' : 'Hosted'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCustomDomain
                ? 'Custom domain configuration'
                : 'Platform hosted domain'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              Domain
            </span>
            <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
              {projectConfig.domainConfig.domain ||
                (isCustomDomain
                  ? 'yourdomain.com'
                  : `yoursite${PLATFORM_CONFIG.SUBDOMAIN_SUFFIX}`)}
            </p>
          </div>

          {!projectConfig.domainConfig.domain && (
            <p className="text-xs text-muted-foreground">
              {isCustomDomain
                ? 'Custom domain not configured yet'
                : 'Domain will be auto-generated from project name'}
            </p>
          )}

          {isCustomDomain && projectConfig.domainConfig.domain && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>DNS configuration required after deployment</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
