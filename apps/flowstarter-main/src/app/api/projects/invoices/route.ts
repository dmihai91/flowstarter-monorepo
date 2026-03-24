/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  getOrCreateStripeCustomer,
  createDepositInvoice,
  createFinalInvoice,
  type ProjectPaymentUpdate,
} from '@/lib/stripe/invoices';

interface InvoiceRequestBody {
  projectId?: string;
  type?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = getAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as InvoiceRequestBody;
  const { projectId, type } = body;

  if (!projectId || !type || !['deposit', 'final'].includes(type)) {
    return NextResponse.json({ error: 'projectId and type (deposit|final) required' }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, client_email, client_name')
    .eq('id', projectId)
    .single();

  if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const p = project as unknown as Record<string, string>;
  const clientEmail = p.client_email;
  const clientName  = p.client_name ?? 'Client';
  const projectName = p.name ?? 'Your project';

  if (!clientEmail) return NextResponse.json({ error: 'Project has no client email' }, { status: 422 });

  // Payment columns — not in generated types yet, fetched separately
  const { data: payRaw } = await supabase
    .from('projects')
    .select('deposit_amount, final_amount, stripe_customer_id')
    .eq('id', projectId)
    .single();

  const pay = payRaw as unknown as Record<string, unknown>;
  let stripeCustomerId = pay?.stripe_customer_id as string | null ?? null;

  if (!stripeCustomerId) {
    stripeCustomerId = await getOrCreateStripeCustomer(clientEmail, clientName, projectId);
    const u: ProjectPaymentUpdate = { stripe_customer_id: stripeCustomerId };
    await supabase.from('projects').update(u as any).eq('id', projectId);
  }

  if (type === 'deposit') {
    const amountEurCents = ((pay?.deposit_amount as number) ?? 0) * 100;
    if (amountEurCents <= 0) return NextResponse.json({ error: 'deposit_amount not set' }, { status: 422 });
    const result = await createDepositInvoice({ stripeCustomerId, amountEurCents, projectName, projectId });
    const u: ProjectPaymentUpdate = {
      deposit_status: 'invoiced',
      deposit_invoice_id: result.invoiceId,
      deposit_invoice_url: result.invoiceUrl,
    };
    await supabase.from('projects').update(u as any).eq('id', projectId);
    return NextResponse.json({ success: true, invoiceUrl: result.invoiceUrl });
  }

  if (type === 'final') {
    const amountEurCents = ((pay?.final_amount as number) ?? 0) * 100;
    if (amountEurCents <= 0) return NextResponse.json({ error: 'final_amount not set' }, { status: 422 });
    const result = await createFinalInvoice({ stripeCustomerId, amountEurCents, projectName, projectId });
    const u: ProjectPaymentUpdate = {
      final_status: 'invoiced',
      final_invoice_id: result.invoiceId,
      final_invoice_url: result.invoiceUrl,
    };
    await supabase.from('projects').update(u as any).eq('id', projectId);
    return NextResponse.json({ success: true, invoiceUrl: result.invoiceUrl });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
