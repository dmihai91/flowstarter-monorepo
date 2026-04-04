# Client Account Creation After Payment — Beta Feature Plan

## Context

The Flowstarter operator builds a site for their client. After the deposit is paid (Stripe), 
the client should receive an invitation email to create their own Clerk account so they can:
- Log into the Flowstarter platform
- View/access their site in the editor (read/limited mode)
- See their site status, invoices, and content

The operator is already a Clerk user (role: team/admin).
The client is a new user who needs a Clerk account with role: 'client'.

## Current Infrastructure (already exists)

- `invite-tokens.ts` — JWT-based signed invite tokens (7-day expiry), audience: 'team-invite'
- `/api/team/invite` — POST, creates invite token, sends invitation email (team members only)
- `/api/team/join` — POST, receives token + password, creates Clerk user with role from token
- `/api/team/join/validate` — GET, validates token before account creation page
- `/api/webhooks/stripe` — handles `invoice.payment_succeeded` for deposit/final
- `/api/projects/invoices` — creates Stripe invoices for a project, uses Clerk user as customer
- `email-templates/` — base, invitation, verification, welcome templates
- `projects` table — has `stripe_customer_id`, `client_last_login_at`, `deposit_status`

## Missing: Client-specific invite flow

### What needs to be built

#### 1. Extend invite-tokens.ts

Add `'client'` to the InvitePayload role union and add `projectId` to the payload
so the join handler can link the account to the correct project:

```ts
export interface InvitePayload {
  email: string;
  role: 'team' | 'admin' | 'client';  // add 'client'
  invitedBy: string;
  invitedByEmail: string;
  projectId?: string;  // add — links client to project on account creation
}
```

#### 2. New API route: POST /api/projects/[id]/invite-client

Operator-only (role: team/admin). Given a projectId, sends an invite email to the
client email stored in the project's `data` JSON field (from handoff).

Logic:
1. Auth check — operator only
2. Load project from Supabase, extract `clientEmail` and `clientName` from `data.client`
3. Check Clerk — if client already has an account, return 200 with `alreadyExists: true`
4. Create signed invite token with role: 'client', projectId embedded
5. Store `client_invite_sent_at` + `client_invite_token_hash` on the project row
6. Send client-welcome email with the invite link: `/client/join?token=<token>`
7. Return `{ success: true, email }`

#### 3. Extend /api/team/join to handle client role

When `payload.role === 'client'` and `payload.projectId` is set:
- After creating the Clerk user, update the project row: set `client_user_id = newUser.id`
- Send a welcome email specific to clients (not operators)

#### 4. New page: /client/join?token=...

Simple account creation page for clients. Similar to `/team/join` but:
- Branded differently ("Your website is ready — create your account to access it")
- Collects password + confirm password
- Calls POST /api/team/join with { token, password }
- On success, redirects to sign-in page (or auto-signs them in via Clerk)

#### 5. New page: /client/dashboard (optional for beta)

Minimal client-facing view:
- Shows their project name + status
- Shows invoice status (paid / pending)
- Has a link to open their site in the editor (read-only handoff)

For beta this could just be a redirect to the editor after sign-in.

#### 6. Stripe webhook trigger (automated path)

In `/api/webhooks/stripe`, in `handleInvoicePaymentSucceeded`:
- When `invoiceType === 'deposit'` and payment succeeds, automatically trigger the 
  client invite if not already sent:
  - Fetch the project, check `client_invite_sent_at` is null
  - Call the invite logic (or emit to a queue/background job)
  
This means the moment the deposit lands, the client gets an email to create their account.

#### 7. DB migration

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_user_id TEXT; -- Clerk user ID
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_invite_sent_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_invite_token_hash TEXT; -- sha256 prefix
```

Also populate `client_email`/`client_name` from the handoff `data.client` field when a project is created.

#### 8. Email template: client-invite.ts

New email template in `lib/email-templates/client-invite.ts`:
- Subject: "Your website is ready — create your account"
- Body: operator name built the site, click to set password and access your site
- CTA button: "Create My Account" → `/client/join?token=<token>`

## Flow Summary

```
Operator builds site → deposit invoice sent → client pays →
Stripe webhook fires → auto-send client invite email →
Client clicks email → /client/join → sets password → Clerk account created (role: client) →
Client signs in → sees their site / editor access
```

Manual path (operator sends invite from project detail page):
```
Operator opens project → clicks "Send Client Invite" →
POST /api/projects/[id]/invite-client →
Client gets email → same join flow
```

## Files to create/modify

New:
- `src/app/api/projects/[id]/invite-client/route.ts`
- `src/app/(dynamic-pages)/client/join/page.tsx`
- `src/app/(dynamic-pages)/client/join/JoinForm.tsx`
- `src/lib/email-templates/client-invite.ts`
- `supabase/migrations/YYYYMMDD_add_client_columns.sql`

Modify:
- `src/lib/invite-tokens.ts` — add 'client' role + projectId
- `src/app/api/team/join/route.ts` — handle client role + link to project
- `src/app/api/webhooks/stripe/route.ts` — auto-trigger invite on deposit paid
- `src/app/(dynamic-pages)/team/dashboard/projects/[id]/page.tsx` — add "Send Client Invite" button
- `src/app/api/editor/handoff/route.ts` — store client_email/client_name on project insert

## Security notes

- Invite token is short-lived (7 days), signed with INVITE_TOKEN_SECRET
- Token is single-use — mark as consumed in DB after account creation
- Client role is locked down in Clerk publicMetadata, cannot access team routes
- Client can only see their own project (RLS: `client_user_id = auth.uid()`)
