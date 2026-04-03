/**
 * Manual type definitions for tables not yet in the generated database.types.ts.
 *
 * The `leads` and `contact_submissions` tables exist in Supabase (via migrations)
 * but are missing from the auto-generated types because `supabase gen types`
 * has not been re-run against a live DB that includes them.
 *
 * Once `supabase gen types` is run, these definitions can be removed and the
 * generated file will be the single source of truth.
 */
import type { Database, Json } from './database.types';

// ---------------------------------------------------------------------------
// leads table (migration: 20260311000002_create_leads_table.sql)
// ---------------------------------------------------------------------------
export interface LeadsTable {
  Row: {
    id: string;
    project_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    source: string | null;
    ip_address: string | null;
    user_agent: string | null;
    referrer: string | null;
    extra: Json;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    project_id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    message?: string | null;
    source?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    referrer?: string | null;
    extra?: Json;
    status?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    project_id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    message?: string | null;
    source?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    referrer?: string | null;
    extra?: Json;
    status?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'leads_project_id_fkey';
      columns: ['project_id'];
      isOneToOne: false;
      referencedRelation: 'projects';
      referencedColumns: ['id'];
    },
  ];
}

// ---------------------------------------------------------------------------
// contact_submissions table (migration: 20260225004000_contact_submissions.sql)
// ---------------------------------------------------------------------------
export interface ContactSubmissionsTable {
  Row: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string | null;
    read_at: string | null;
    responded_at: string | null;
    notes: string | null;
  };
  Insert: {
    id?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at?: string | null;
    read_at?: string | null;
    responded_at?: string | null;
    notes?: string | null;
  };
  Update: {
    id?: string;
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    created_at?: string | null;
    read_at?: string | null;
    responded_at?: string | null;
    notes?: string | null;
  };
  Relationships: [];
}

// ---------------------------------------------------------------------------
// Extended Database type — adds the missing tables to the generated type
// ---------------------------------------------------------------------------
export type DatabaseExtended = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Functions'> & {
    Tables: Database['public']['Tables'] & {
      leads: LeadsTable;
      contact_submissions: ContactSubmissionsTable;
    };
    Functions: Database['public']['Functions'] & {
      get_lead_counts: {
        Args: { p_project_id: string };
        Returns: { status: string; count: number }[];
      };
    };
  };
};
