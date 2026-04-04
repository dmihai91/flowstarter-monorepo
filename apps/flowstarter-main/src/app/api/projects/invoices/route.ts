import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  getOrCreateStripeCustomer,
  createDepositInvoice,
  createFinalInvoice,
} from '@/lib/stripe/invoices';

interface InvoiceRequestBody {
  projectId?: string;
  type?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as InvoiceRequestBody;
  const { projectId, type } = body;
  if (!projectId || !type || !['deposit', 'final'].includes(type)) {
    return NextResponse.json(
      { error: 'projectId and type (deposit|final) required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      'id, name, user_id, deposit_amount, final_amount, stripe_customer_id'
    )
    .eq('id', projectId)
    .single();

  if (error || !project)
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Look up client email + name from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(project.user_id);
  const clientEmail = clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const clientName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    'Client';

  if (!clientEmail)
    return NextResponse.json(
      { error: 'Client has no email in Clerk' },
      { status: 422 }
    );

  let stripeCustomerId = project.stripe_customer_id ?? null;
  if (!stripeCustomerId) {
    stripeCustomerId = await getOrCreateStripeCustomer(
      clientEmail,
      clientName,
      projectId
    );
    await supabase
      .from('projects')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', projectId);
  }

  const projectName = project.name ?? 'Your project';

  if (type === 'deposit') {
    const amountEurCents = (project.deposit_amount ?? 0) * 100;
    if (amountEurCents <= 0)
      return NextResponse.json(
        { error: 'deposit_amount not set' },
        { status: 422 }
      );
    const result = await createDepositInvoice({
      stripeCustomerId,
      amountEurCents,
      projectName,
      projectId,
    });
    await supabase
      .from('projects')
      .update({
        deposit_status: 'invoiced',
        deposit_invoice_id: result.invoiceId,
        deposit_invoice_url: result.invoiceUrl,
      })
      .eq('id', projectId);
    return NextResponse.json({ success: true, invoiceUrl: result.invoiceUrl });
  }

  // type === 'final'
  const amountEurCents = (project.final_amount ?? 0) * 100;
  if (amountEurCents <= 0)
    return NextResponse.json(
      { error: 'final_amount not set' },
      { status: 422 }
    );
  const result = await createFinalInvoice({
    stripeCustomerId,
    amountEurCents,
    projectName,
    projectId,
  });
  await supabase
    .from('projects')
    .update({
      final_status: 'invoiced',
      final_invoice_id: result.invoiceId,
      final_invoice_url: result.invoiceUrl,
    })
    .eq('id', projectId);
  return NextResponse.json({ success: true, invoiceUrl: result.invoiceUrl });
}
