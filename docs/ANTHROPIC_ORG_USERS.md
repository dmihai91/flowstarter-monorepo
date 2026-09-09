# Anthropic Org Users

Flowstarter does not create Anthropic accounts directly.

For the current non-SCIM setup, use Anthropic's Admin API to invite a user's
Flowstarter email address into the Anthropic organization. The user must accept
the invite and complete Anthropic's account flow. Claude Code then owns token
and usage management for that user.

## Roles

Default to `claude_code_user` for client/editor users. This grants Workbench and
Claude Code access without API-key management permissions.

Use `developer` only for internal staff who need to create or manage API keys.
Use `billing`/`admin` only for operators who need billing or org administration.

## Invite Users

Create an Anthropic Admin API key in the Anthropic Console, then run:

```bash
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-... \
  pnpm anthropic:invite-users --email user@example.com
```

Invite multiple users:

```bash
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-... \
  pnpm anthropic:invite-users \
  --email user1@example.com \
  --email user2@example.com
```

Or use a file:

```bash
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-... \
  pnpm anthropic:invite-users --file emails.txt
```

Default role is `claude_code_user`. Override when needed:

```bash
pnpm anthropic:invite-users --email user@example.com --role developer
```

Use `--dry-run` to preview without calling Anthropic.

## Automatic Invites From Flowstarter

The Clerk webhook can invite a user to Anthropic after `user.created`, but this
is disabled by default. Enable it only when new Flowstarter users should consume
Anthropic org capacity:

```bash
ANTHROPIC_ORG_AUTO_INVITE=1
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-...
ANTHROPIC_ORG_INVITE_ROLE=claude_code_user
```

The webhook path is best-effort. It logs a warning if Anthropic rejects the
invite, but it does not fail Clerk profile creation.

Use this for approved client/editor users. Do not enable it for untrusted signup
funnels unless every new platform user should receive Anthropic org access.

## Seats And Org Limits

There is no Flowstarter-side hard-coded user limit. The practical limit is the
Anthropic plan's available seats/access capacity:

- Console org invites require an Anthropic Admin API key (`sk-ant-admin...`).
- Invites expire after 21 days.
- Team plans and seat-based Enterprise plans have seat allocations and usage
  limits by seat type.
- New/self-serve usage-based Enterprise plans include Claude Code in the
  Enterprise seat; older Enterprise contracts may require assigning a Claude
  Code-capable seat.
- If there are no available seats, purchase or reassign seats in Anthropic's
  organization settings before inviting more users.

## Usage And Remaining Credits

We cannot reliably ask Anthropic for a user's exact remaining Claude Code
"credits" in real time. Anthropic owns the included usage limits and reset
behavior, and the user sees that in Claude/Claude Code.

What can be automated:

- For Team/Enterprise orgs, use Anthropic Admin/Analytics APIs to fetch
  historical Claude Code usage and estimated cost per user.
- For API/Console org usage, use Usage & Cost API reports to fetch token and
  cost history.
- For rate limits, use the Rate Limits API to read configured organization or
  workspace limits.

What should not be rebuilt in Flowstarter:

- A custom remaining-credit counter.
- Flowstarter-side blocking based on tokens or cost.
- Per-user "credits left" UI unless Anthropic exposes a supported remaining
  balance endpoint for the exact plan we use.

If we need monitoring later, build it as an admin-only reporting dashboard using
Anthropic usage reports, not as product gating.

## True Provisioning

Silent account provisioning is only available through Anthropic Enterprise SSO
with SCIM. If Flowstarter later moves to Enterprise SCIM, replace the invite
script with a SCIM provisioning flow.
