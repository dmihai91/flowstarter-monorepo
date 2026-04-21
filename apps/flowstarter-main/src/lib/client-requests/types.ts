export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EditorContext {
  activeFile?: string;
  selection?: { start: number; end: number };
  componentTree?: Record<string, unknown>;
  capabilityReason: string;
}

export interface ClientRequest {
  id: string;
  project_id: string;
  client_user_id: string;
  title: string;
  description: string;
  /** Present on detail fetch; omitted from list query for performance. */
  original_prompt?: string | null;
  /** Present on detail fetch; omitted from list query for performance. */
  editor_context?: EditorContext | null;
  status: RequestStatus;
  priority: RequestPriority;
  assigned_to: string | null;
  rejection_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  workspace_session_id: string | null;
  // Joined via Supabase relationship
  projects?: {
    name?: string | null;
    client_name?: string | null;
    client_email?: string | null;
  } | null;
}

export interface ClientRequestStats {
  pending: number;
  urgent: number;
  in_progress: number;
  resolved_this_week: number;
}
