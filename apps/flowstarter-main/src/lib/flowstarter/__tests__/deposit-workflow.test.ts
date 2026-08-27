/**
 * The deposit gate, exercised through both Stripe webhook events.
 *
 * A deposit reaches Flowstarter one of two ways: the self-serve Checkout
 * PaymentIntent, or an operator-created deposit invoice. Both must advance
 * PREVIEW_READY -> DEPOSIT_PAID and enqueue exactly one full-site build, and
 * both must survive Stripe redelivering the same event.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import {
  enqueueFullBuildFromDeposit,
  enqueueFullBuildFromDepositInvoice,
} from '../deposit-workflow';

interface ClientScript {
  workspace?: { data: unknown; error: unknown };
  insertResult?: { data: unknown; error: unknown };
  existingJob?: { data: unknown; error: unknown };
  stateUpdate?: { data: unknown; error: unknown };
}

const script: ClientScript = {};
const captured: {
  insert?: Record<string, unknown>;
  update?: Record<string, unknown>;
  tables: string[];
} = { tables: [] };

function builderFor(table: string) {
  captured.tables.push(table);
  const builder = {
    _mode: 'select' as 'select' | 'insert' | 'update',
    select() {
      return builder;
    },
    insert(values: Record<string, unknown>) {
      builder._mode = 'insert';
      captured.insert = values;
      return builder;
    },
    update(values: Record<string, unknown>) {
      builder._mode = 'update';
      captured.update = values;
      return builder;
    },
    eq() {
      return builder;
    },
    in() {
      return builder;
    },
    maybeSingle() {
      return Promise.resolve(script.workspace ?? { data: null, error: null });
    },
    single() {
      if (table === 'workspaces') {
        return Promise.resolve(
          script.stateUpdate ?? { data: { id: 'ws' }, error: null }
        );
      }
      return Promise.resolve(
        builder._mode === 'insert'
          ? script.insertResult ?? { data: { id: 'job-1' }, error: null }
          : script.existingJob ?? { data: null, error: null }
      );
    },
  };
  return builder;
}

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({ from: builderFor }),
}));

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

function event(id = 'evt_1'): Stripe.Event {
  return { id } as Stripe.Event;
}

function depositInvoice(
  overrides: Record<string, unknown> = {}
): Stripe.Invoice {
  return {
    id: 'in_deposit_1',
    currency: 'eur',
    amount_paid: 15_980,
    metadata: { invoiceType: 'deposit', workspaceId: WORKSPACE_ID },
    ...overrides,
  } as unknown as Stripe.Invoice;
}

function workspaceRow(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: WORKSPACE_ID,
      project_state: ProjectState.PREVIEW_READY,
      billing_currency: 'eur',
      deposit_invoice_id: 'in_deposit_1',
      final_value_minor: 79_900,
      deposit_payment_intent_id: null,
      ...overrides,
    },
    error: null,
  };
}

beforeEach(() => {
  delete script.workspace;
  delete script.insertResult;
  delete script.existingJob;
  delete script.stateUpdate;
  captured.insert = undefined;
  captured.update = undefined;
  captured.tables = [];
});

describe('deposit paid by operator invoice', () => {
  it('advances the lifecycle and enqueues one build', async () => {
    script.workspace = workspaceRow();

    const result = await enqueueFullBuildFromDepositInvoice(
      event(),
      depositInvoice()
    );

    expect(result).toEqual({
      workspaceId: WORKSPACE_ID,
      jobId: 'job-1',
      duplicate: false,
    });
    expect(captured.insert).toMatchObject({
      workspace_id: WORKSPACE_ID,
      kind: 'FULL_SITE_BUILD',
      status: 'queued',
      stripe_event_id: 'evt_1',
      // An invoice deposit has no PaymentIntent of its own to record.
      stripe_payment_intent_id: null,
    });
    expect(captured.insert?.payload).toMatchObject({
      trigger: 'deposit_paid',
      source: 'deposit_invoice',
      depositPercent: 20,
    });
    expect(captured.update).toMatchObject({
      project_state: ProjectState.DEPOSIT_PAID,
      deposit_status: 'paid',
      outstanding_payment: false,
    });
    // The invoice path must not claim the PaymentIntent slot — it has a unique
    // index and belongs to the Checkout path.
    expect(captured.update).not.toHaveProperty('deposit_payment_intent_id');
  });

  it('ignores an invoice that is not a deposit', async () => {
    const result = await enqueueFullBuildFromDepositInvoice(
      event(),
      depositInvoice({
        metadata: { invoiceType: 'final', workspaceId: WORKSPACE_ID },
      })
    );
    expect(result).toBeNull();
    expect(captured.tables).toEqual([]);
  });

  it('does not throw the webhook for a workspace outside the concierge lifecycle', async () => {
    script.workspace = workspaceRow({ project_state: ProjectState.INTAKE });

    const result = await enqueueFullBuildFromDepositInvoice(
      event(),
      depositInvoice()
    );

    expect(result).toBeNull();
    expect(captured.insert).toBeUndefined();
  });

  it('refuses an invoice the server never recorded on the workspace', async () => {
    script.workspace = workspaceRow({ deposit_invoice_id: 'in_some_other' });

    await expect(
      enqueueFullBuildFromDepositInvoice(event(), depositInvoice())
    ).rejects.toThrow(/does not match the invoice recorded/);
    expect(captured.insert).toBeUndefined();
  });

  it('refuses a currency that is not the quoted one', async () => {
    script.workspace = workspaceRow({ billing_currency: 'usd' });

    await expect(
      enqueueFullBuildFromDepositInvoice(event(), depositInvoice())
    ).rejects.toThrow(/currency does not match/);
  });

  it('refuses an invoice marked paid with no money on it', async () => {
    script.workspace = workspaceRow();

    await expect(
      enqueueFullBuildFromDepositInvoice(
        event(),
        depositInvoice({ amount_paid: 0 })
      )
    ).rejects.toThrow(/no amount paid/);
  });

  it('converges on the existing job when Stripe redelivers the event', async () => {
    script.workspace = workspaceRow();
    script.insertResult = { data: null, error: { code: '23505' } };
    script.existingJob = {
      data: { id: 'job-1', status: 'queued' },
      error: null,
    };

    const result = await enqueueFullBuildFromDepositInvoice(
      event(),
      depositInvoice()
    );

    expect(result).toEqual({
      workspaceId: WORKSPACE_ID,
      jobId: 'job-1',
      duplicate: true,
    });
  });

  it('does not re-advance state for a build that already succeeded', async () => {
    script.workspace = workspaceRow({
      project_state: ProjectState.DEPOSIT_PAID,
    });
    script.insertResult = { data: null, error: { code: '23505' } };
    script.existingJob = {
      data: { id: 'job-1', status: 'succeeded' },
      error: null,
    };

    const result = await enqueueFullBuildFromDepositInvoice(
      event(),
      depositInvoice()
    );

    expect(result).toEqual({
      workspaceId: WORKSPACE_ID,
      jobId: 'job-1',
      duplicate: true,
    });
    expect(captured.update).toBeUndefined();
  });
});

describe('deposit paid by Checkout PaymentIntent', () => {
  function depositIntent(
    overrides: Record<string, unknown> = {}
  ): Stripe.PaymentIntent {
    return {
      id: 'pi_1',
      status: 'succeeded',
      currency: 'eur',
      amount_received: 15_980,
      metadata: { kind: 'flowstarter_deposit', workspaceId: WORKSPACE_ID },
      ...overrides,
    } as unknown as Stripe.PaymentIntent;
  }

  it('still records the PaymentIntent and tags the source', async () => {
    script.workspace = workspaceRow();

    const result = await enqueueFullBuildFromDeposit(event(), depositIntent());

    expect(result).toMatchObject({ jobId: 'job-1', duplicate: false });
    expect(captured.insert).toMatchObject({ stripe_payment_intent_id: 'pi_1' });
    expect(captured.insert?.payload).toMatchObject({
      source: 'payment_intent',
    });
    expect(captured.update).toMatchObject({
      project_state: ProjectState.DEPOSIT_PAID,
      deposit_payment_intent_id: 'pi_1',
    });
  });

  it('still rejects an amount that is not exactly 20% of the quote', async () => {
    script.workspace = workspaceRow();

    await expect(
      enqueueFullBuildFromDeposit(
        event(),
        depositIntent({ amount_received: 1_000 })
      )
    ).rejects.toThrow(/Deposit amount mismatch/);
  });

  it('ignores a PaymentIntent that is not a Flowstarter deposit', async () => {
    const result = await enqueueFullBuildFromDeposit(
      event(),
      depositIntent({ metadata: { kind: 'something_else' } })
    );
    expect(result).toBeNull();
  });
});
