/**
 * Context Aggregation API Route
 *
 * Pulls data from both Supabase and Convex to build unified project context.
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { createClient } from '@supabase/supabase-js';
import type { ContextData } from '@flowstarter/editor-engine';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { projectId, supabaseProjectId } = await request.json() as { projectId?: string; supabaseProjectId?: string };

  if (!projectId) {
    return json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const context = await aggregateContext(supabaseProjectId || projectId);
    return json({ context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to aggregate context';
    return json({ error: message }, { status: 500 });
  }
}

async function aggregateContext(projectId: string): Promise<Partial<ContextData>> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { projectId };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch project with extended fields
  const { data: project } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      template_id,
      template_name,
      domain_type,
      domain_name,
      domain_provider,
      setup_fee,
      monthly_fee,
      is_paid,
      project_type,
      business_name,
      business_type,
      business_description,
      industry,
      target_audience,
      client_name,
      client_email,
      client_phone,
      client_website
    `)
    .eq('id', projectId)
    .single();

  if (!project) {
    return { projectId };
  }

  // Fetch integrations
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('project_id', projectId);

  const bookingIntegration = integrations?.find((i) => i.type === 'booking');
  const newsletterIntegration = integrations?.find((i) => i.type === 'newsletter');

  const context: Partial<ContextData> = {
    projectId: project.id,
    projectName: project.name,
    templateId: project.template_id,
    templateName: project.template_name,

    businessName: project.business_name,
    businessType: project.business_type,
    businessDescription: project.business_description,
    industry: project.industry,
    targetAudience: project.target_audience,

    clientName: project.client_name,
    clientEmail: project.client_email,
    clientPhone: project.client_phone,
    clientWebsite: project.client_website,

    domainInfo: {
      domainType: project.domain_type,
      domainName: project.domain_name,
      domainProvider: project.domain_provider,
    },

    billingInfo: {
      setupFee: project.setup_fee,
      monthlyFee: project.monthly_fee,
      isPaid: project.is_paid,
    },

    integrations: {
      bookingProvider: bookingIntegration?.provider,
      bookingUrl: bookingIntegration?.url,
      newsletterProvider: newsletterIntegration?.provider,
      newsletterUrl: newsletterIntegration?.url,
    },

    contactDetails: {
      email: project.client_email,
      phone: project.client_phone,
    },
  };

  return context;
}
