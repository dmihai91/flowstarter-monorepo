/**
 * POST /api/admin/projects/[id]/changes/[changeId]/quote
 *
 * Writes the quote the client will see and can accept and pay.
 */
export { quoteChangeRequestHandler as POST } from '@/lib/flowstarter/change-requests-api';
