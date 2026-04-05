import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  registerDomain,
  setNameservers,
} from '@flowstarter/editor-engine/publishing';
import type { NameComConfig } from '@flowstarter/editor-engine/publishing';

const bodySchema = z.object({
  domain: z.string().min(1),
  projectId: z.string().min(1),
});

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { domain, projectId } = parsed.data;

  const username = process.env.NAME_COM_USERNAME;
  const token = process.env.NAME_COM_TOKEN;

  if (!username || !token) {
    return NextResponse.json(
      { error: 'Domain registration is not configured' },
      { status: 503 }
    );
  }

  const config: NameComConfig = {
    username,
    token,
    sandbox: process.env.NAME_COM_SANDBOX === 'true',
  };

  try {
    // 1. Register the domain
    await registerDomain(domain, config);

    // 2. Set nameservers to Cloudflare
    const cfNameservers = process.env.CLOUDFLARE_NAMESERVERS
      ? process.env.CLOUDFLARE_NAMESERVERS.split(',').map((ns) => ns.trim())
      : ['ns1.cloudflare.com', 'ns2.cloudflare.com'];

    await setNameservers(domain, cfNameservers, config);

    // 3. Update Supabase project record
    const supabase = createSupabaseServiceRoleClient();
    await supabase
      .from('projects')
      .update({
        domain_name: domain,
        domain_provider: 'namecom',
        domain_type: 'provisioned',
        domain_status: 'registered',
      })
      .eq('id', projectId);

    return NextResponse.json({ success: true, domain });
  } catch (err) {
    console.error('[domains/register]', err);
    return NextResponse.json(
      { error: 'Failed to register domain' },
      { status: 500 }
    );
  }
}
