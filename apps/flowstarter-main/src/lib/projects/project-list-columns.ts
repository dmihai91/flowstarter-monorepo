/**
 * Columns safe for list/dashboard views — excludes large JSON (`data`) and
 * generation blobs (Convex). Keeps payloads small for PostgREST.
 */
export const PROJECT_LIST_SELECT = `
  id,
  user_id,
  name,
  description,
  status,
  is_draft,
  template_id,
  template_slug,
  created_at,
  updated_at,
  generated_at,
  generation_completed_at,
  published_url,
  project_type,
  setup_fee,
  monthly_fee,
  is_paid,
  client_name,
  client_email,
  client_phone,
  client_business_name,
  deposit_status,
  deposit_amount,
  final_status,
  final_amount,
  subscription_status,
  plan_name,
  outstanding_payment,
  generation_cost_usd,
  ai_credits_used
`.trim();
