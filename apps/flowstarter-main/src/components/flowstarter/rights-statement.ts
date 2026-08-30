/**
 * The words a client agrees to when they hand us pictures.
 *
 * Kept in its own module, with no imports, because both sides need it and
 * neither may drift: the checkbox in `AssetUploader.tsx` renders this exact
 * text, and `POST /api/client/assets/[workspaceId]/rights` refuses a version
 * it does not know. The version string is what gets stored in
 * `asset_rights_confirmations.statement_version`, so a confirmation recorded
 * today stays legible after the wording changes.
 *
 * To change the wording: add a new version, leave the old one in
 * `KNOWN_RIGHTS_STATEMENT_VERSIONS`, and never edit an existing entry — the
 * table is evidence, and rewriting the statement rewrites what people agreed
 * to.
 */

/** The version a client confirming right now agrees to. */
export const CURRENT_RIGHTS_STATEMENT_VERSION = '2026-08-30';

/** Versions the API still accepts. Historical entries stay for old clients. */
export const KNOWN_RIGHTS_STATEMENT_VERSIONS: readonly string[] = [
  '2026-08-30',
];

/** The statement itself, keyed by version. */
export const RIGHTS_STATEMENTS: Record<string, string> = {
  '2026-08-30':
    'I own these files, or I have permission to use them, and Flowstarter may publish them on my website.',
};

/** The text to show for a version, falling back to the current wording. */
export function rightsStatementText(
  version: string = CURRENT_RIGHTS_STATEMENT_VERSION
): string {
  return (
    RIGHTS_STATEMENTS[version] ??
    RIGHTS_STATEMENTS[CURRENT_RIGHTS_STATEMENT_VERSION] ??
    ''
  );
}
