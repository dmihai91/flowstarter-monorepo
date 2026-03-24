export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string | ProjectCategory;
  slug?: string;
  styleTags?: Array<
    | 'Minimal'
    | 'Bold'
    | 'Dark'
    | 'Creative'
    | 'Corporate'
    | 'Premium'
    | 'Gradient'
    | 'Modern'
    | 'Vibrant'
    | 'Local'
    | 'Tech'
    | 'SaaS'
  >;
  status?: 'published' | 'draft';
  thumbnailUrl?: string;
  features: ProjectFeature[];
  techStack: TechStack;
  complexity: 'simple' | 'medium' | 'advanced';
  estimatedTime: string;
  preview?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: ProjectTemplate[];
}

export interface ProjectFeature {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'frontend' | 'backend' | 'ai' | 'auth' | 'database' | 'deployment';
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  ai?: string[];
  deployment: string[];
}
