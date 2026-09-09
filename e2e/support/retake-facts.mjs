/**
 * The facts the two re-shot clips are captioned with, read back out of the
 * database rather than typed from memory.
 *
 * The page builder will not print a number the manifest does not hold, and the
 * manifest only holds what something measured. The clip 06 recorder wrote its
 * own notes; this fills in the same facts from the rows the server actually
 * wrote, so a caption that says "one photo, rights confirmed" is a claim about
 * `assets`, not about what the script believed it did.
 *
 *   node e2e/support/retake-facts.mjs
 */
import { readFileSync } from 'node:fs';
import { db, writeManifest } from './showcase-lib.mjs';

const BUILT = '4d543e0b-882b-4a53-9f51-444df9793db7';
const CLAIMED = readFileSync('/tmp/retake-workspace.txt', 'utf8').trim();

const [messages, assets, builtRow, claimedRow, versions] = await Promise.all([
  db(`project_messages?workspace_id=eq.${BUILT}&select=id,direction,kind,status,created_at&order=created_at`),
  db(`assets?workspace_id=eq.${BUILT}&select=id,usable_for,width,height,rights_confirmed_at,created_at&order=created_at`),
  db(`workspaces?id=eq.${BUILT}&select=name,project_state,monthly_fee,billing_interval,subscription_status,stripe_subscription_id,subscription_trial_ends,deposit_status,final_status`),
  db(`workspaces?id=eq.${CLAIMED}&select=id,name,project_state,monthly_fee,billing_interval,final_value_minor,deposit_status,final_status`),
  db(`site_versions?workspace_id=eq.${BUILT}&select=version,summary,created_by,created_at&order=version`),
]);

const facts = {
  workspaceBuilt: BUILT,
  workspaceClaimed: CLAIMED,
  built: builtRow[0],
  claimed: claimedRow[0],
  messages: messages.length,
  inbound: messages.filter((m) => m.direction === 'inbound').length,
  openAssetRequests: messages.filter(
    (m) => m.kind === 'asset_request' && m.status === 'sent'
  ).length,
  clarifications: messages.filter((m) => m.kind === 'clarification').length,
  assets: assets.map((a) => ({
    usableFor: a.usable_for,
    size: `${a.width}x${a.height}`,
    rightsConfirmed: Boolean(a.rights_confirmed_at),
  })),
  siteVersions: versions.map((v) => `v${v.version} ${v.summary ?? ''}`.trim()),
};

writeManifest({ retake: facts });
console.log(JSON.stringify(facts, null, 2));
