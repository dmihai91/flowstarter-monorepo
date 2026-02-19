import type React from 'react';

export interface ProjectData {
  name?: string;
  description?: string;
  targetUsers?: string;
  usp?: string;
  [key: string]: unknown;
}

export interface AIContentStat {
  icon?: React.ComponentType<{ className?: string }>;
  value?: string;
  label?: string;
  color?: string;
}

export interface AIContentFeature {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  color?: string;
}

export interface AIContentService {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  name?: string;
  description?: string;
  price?: string;
  color?: string;
}

export interface AIContentTestimonial {
  name?: string;
  role?: string;
  content?: string;
  text?: string;
  avatar?: string;
  img?: string;
  rating?: number;
}

export interface AIContentTeamMember {
  name: string;
  role?: string;
  img?: string;
}

export interface AIContentPricing {
  plans?: Array<{
    name?: string;
    price?: string;
    features?: string[];
    highlighted?: boolean;
  }>;
}

export interface AIContent {
  ctaText?: string;
  ctaSecondary?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutHeadline?: string;
  aboutText?: string;
  stats?: AIContentStat[];
  features?: AIContentFeature[];
  services?: AIContentService[];
  testimonials?: AIContentTestimonial[];
  team?: AIContentTeamMember[];
  pricing?: AIContentPricing;
  [key: string]: unknown;
}
