'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExampleSite } from '@/data/example-sites';
import { cn } from '@/lib/utils';
import { ExternalLink, Eye, Layers, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ExampleSiteCardProps {
  site: ExampleSite;
  className?: string;
}

export function ExampleSiteCard({ site, className }: ExampleSiteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        'relative overflow-hidden group transition-all duration-200 hover:shadow-lg border-border/50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Site Preview */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <Image
          src={site.image}
          alt={site.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay Actions */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button size="sm" variant="secondary" asChild>
            <Link href={site.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Link>
          </Button>
        </div>

        {/* Featured Badge */}
        {site.isFeatured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 space-y-3">
        <div>
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {site.name}
          </CardTitle>
          <CardDescription className="text-sm mt-1.5 line-clamp-2">
            {site.description}
          </CardDescription>
        </div>

        {/* Category Badge */}
        <div>
          <Badge variant="secondary" className="font-normal">
            {site.category}
          </Badge>
        </div>

        {/* Stats */}
        {site.stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {site.stats.views && (
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{site.stats.views.toLocaleString()}</span>
              </div>
            )}
            {site.stats.conversionRate && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span>{site.stats.conversionRate}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <Button asChild className="w-full" size="sm">
          <Link
            href={
              site.createdWith
                ? `/dashboard/new?template=${site.createdWith}`
                : '/dashboard/new'
            }
          >
            <Layers className="h-4 w-4 mr-2" />
            Use This Template
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
