#!/usr/bin/env tsx

type AnthropicInviteRole = "user" | "developer" | "billing" | "claude_code_user";

interface Options {
  readonly emails: readonly string[];
  readonly role: AnthropicInviteRole;
  readonly dryRun: boolean;
}

const VALID_ROLES = new Set<AnthropicInviteRole>([
  "user",
  "developer",
  "billing",
  "claude_code_user",
]);

function usage(): string {
  return `Invite users to the Anthropic organization.

Usage:
  pnpm anthropic:invite-users --email user@example.com [--email user2@example.com]
  pnpm anthropic:invite-users --file emails.txt [--role claude_code_user]

Env:
  ANTHROPIC_ADMIN_API_KEY  Admin API key from Anthropic Console.

Options:
  --email <email>          Email address to invite. Repeatable.
  --file <path>            Newline/comma separated email list.
  --role <role>            user | developer | billing | claude_code_user.
                           Defaults to claude_code_user.
  --dry-run                Print invites without calling Anthropic.
  --help                   Show this help.
`;
}

function assertNever(flag: string): never {
  throw new Error(`Unknown option: ${flag}\n\n${usage()}`);
}

async function parseArgs(argv: readonly string[]): Promise<Options> {
  const emails: string[] = [];
  let role: AnthropicInviteRole = "claude_code_user";
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--email") {
      const value = argv[index + 1];
      if (!value) throw new Error("--email requires a value");
      emails.push(value);
      index += 1;
      continue;
    }
    if (arg === "--file") {
      const path = argv[index + 1];
      if (!path) throw new Error("--file requires a value");
      const { readFile } = await import("node:fs/promises");
      const text = await readFile(path, "utf8");
      emails.push(
        ...text
          .split(/[\s,]+/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      );
      index += 1;
      continue;
    }
    if (arg === "--role") {
      const value = argv[index + 1];
      if (!value) throw new Error("--role requires a value");
      if (!VALID_ROLES.has(value as AnthropicInviteRole)) {
        throw new Error(`Invalid --role "${value}". Expected one of: ${[...VALID_ROLES].join(", ")}`);
      }
      role = value as AnthropicInviteRole;
      index += 1;
      continue;
    }
    assertNever(arg);
  }

  const uniqueEmails = [...new Set(emails.map((email) => email.toLowerCase()))];
  if (uniqueEmails.length === 0) {
    throw new Error(`Provide at least one --email or --file.\n\n${usage()}`);
  }

  return { emails: uniqueEmails, role, dryRun };
}

async function inviteUser(input: {
  readonly email: string;
  readonly role: AnthropicInviteRole;
  readonly adminApiKey: string;
}): Promise<void> {
  const response = await fetch("https://api.anthropic.com/v1/organizations/invites", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": input.adminApiKey,
    },
    body: JSON.stringify({
      email: input.email,
      role: input.role,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic invite failed (${response.status}): ${detail}`);
  }
}

async function main(): Promise<void> {
  const options = await parseArgs(process.argv.slice(2));
  const adminApiKey = process.env.ANTHROPIC_ADMIN_API_KEY?.trim();
  if (!adminApiKey && !options.dryRun) {
    throw new Error("ANTHROPIC_ADMIN_API_KEY is required unless --dry-run is set.");
  }

  for (const email of options.emails) {
    if (options.dryRun) {
      console.log(`[dry-run] invite ${email} as ${options.role}`);
      continue;
    }
    await inviteUser({
      email,
      role: options.role,
      adminApiKey: adminApiKey!,
    });
    console.log(`Invited ${email} as ${options.role}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
