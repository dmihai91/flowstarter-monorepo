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

export interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  template: ProjectTemplate;
  selectedFeatures: ProjectFeature[];
  schema: DatabaseSchema;
  files: GeneratedFile[];
  deploymentConfig: DeploymentConfig;
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  functions: DatabaseFunction[];
  policies: RLSPolicy[];
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  relationships: TableRelationship[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  unique?: boolean;
  primaryKey?: boolean;
}

export interface TableRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  table: string;
  column: string;
}

export interface DatabaseFunction {
  name: string;
  parameters: FunctionParameter[];
  returnType: string;
  body: string;
}

export interface FunctionParameter {
  name: string;
  type: string;
  required: boolean;
}

export interface RLSPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  condition: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'api' | 'schema' | 'config' | 'migration';
}

export interface DeploymentConfig {
  vercel?: VercelConfig;
  supabase?: SupabaseConfig;
  env: EnvironmentVariable[];
}

export interface VercelConfig {
  projectName: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
}

export interface SupabaseConfig {
  projectName: string;
  region: string;
  tier: 'free' | 'pro' | 'pay-as-you-go';
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
}
