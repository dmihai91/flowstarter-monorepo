import Stripe from 'stripe';

// Type for DB project payment columns (not yet in generated types)
export interface ProjectPaymentUpdate {
  deposit_status?: string;
  deposit_invoice_id?: string;
  deposit_invoice_url?: string;
  deposit_paid_at?: string;
  final_status?: string;
  final_invoice_id?: string;
  final_invoice_url?: string;
  final_paid_at?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  stripe_subscription_id?: string;
  subscription_trial_ends?: string;
  subscription_next_billing?: string | null;
  launched_at?: string;
  outstanding_payment?: boolean;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export async function getOrCreateStripeCustomer(
  clientEmail: string,
  clientName: string,
  projectId: string
): Promise<string> {
  const stripe = getStripe();
  const existing = await stripe.customers.list({
    email: clientEmail,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0].id;
  const customer = await stripe.customers.create({
    email: clientEmail,
    name: clientName,
    metadata: { projectId },
  });
  return customer.id;
}

export interface CreateInvoiceResult {
  invoiceId: string;
  invoiceUrl: string;
  amountEur: number;
}

export async function createDepositInvoice(params: {
  stripeCustomerId: string;
  amountEurCents: number;
  projectName: string;
  projectId: string;
  dueInDays?: number;
}): Promise<CreateInvoiceResult> {
  const stripe = getStripe();
  const {
    stripeCustomerId,
    amountEurCents,
    projectName,
    projectId,
    dueInDays = 10,
  } = params;
  const dueDateUnix = Math.floor(Date.now() / 1000) + dueInDays * 86400;

  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    collection_method: 'send_invoice',
    due_date: dueDateUnix,
    currency: 'eur',
    description: `Non-refundable deposit -- ${projectName}`,
    metadata: { projectId, invoiceType: 'deposit' },
    auto_advance: false,
  });

  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: amountEurCents,
    currency: 'eur',
    description: `Website project deposit (50%) -- ${projectName}`,
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  await stripe.invoices.sendInvoice(invoice.id);

  return {
    invoiceId: finalized.id,
    invoiceUrl: finalized.hosted_invoice_url ?? '',
    amountEur: amountEurCents / 100,
  };
}

export async function createFinalInvoice(params: {
  stripeCustomerId: string;
  amountEurCents: number;
  projectName: string;
  projectId: string;
  dueInDays?: number;
}): Promise<CreateInvoiceResult> {
  const stripe = getStripe();
  const {
    stripeCustomerId,
    amountEurCents,
    projectName,
    projectId,
    dueInDays = 10,
  } = params;
  const dueDateUnix = Math.floor(Date.now() / 1000) + dueInDays * 86400;

  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    collection_method: 'send_invoice',
    due_date: dueDateUnix,
    currency: 'eur',
    description: `Final payment -- ${projectName}`,
    metadata: { projectId, invoiceType: 'final' },
    auto_advance: false,
  });

  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: amountEurCents,
    currency: 'eur',
    description: `Website project final payment (50%) -- ${projectName}`,
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  await stripe.invoices.sendInvoice(invoice.id);

  return {
    invoiceId: finalized.id,
    invoiceUrl: finalized.hosted_invoice_url ?? '',
    amountEur: amountEurCents / 100,
  };
}

export async function activateSubscriptionTrial(params: {
  stripeCustomerId: string;
  stripePriceId: string;
  projectId: string;
  launchedAt: Date;
}): Promise<{ subscriptionId: string; trialEnd: Date }> {
  const stripe = getStripe();
  const { stripeCustomerId, stripePriceId, projectId, launchedAt } = params;

  const trialEnd = new Date(launchedAt);
  trialEnd.setDate(trialEnd.getDate() + 30);

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: stripePriceId }],
    trial_end: Math.floor(trialEnd.getTime() / 1000),
    currency: 'eur',
    metadata: { projectId },
  });

  return { subscriptionId: subscription.id, trialEnd };
}

export const PLAN_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
  RELAUNCH_39: process.env.STRIPE_PRICE_RELAUNCH_39 ?? '',
  RELAUNCH_59: process.env.STRIPE_PRICE_RELAUNCH_59 ?? '',
  GROWTH: process.env.STRIPE_PRICE_GROWTH ?? '',
  PRO: process.env.STRIPE_PRICE_PRO ?? '',
};
