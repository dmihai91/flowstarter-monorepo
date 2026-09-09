// Honest scarcity: real monthly build capacity. Slots taken = paid build
// fees this calendar month; remaining is shown on the landing/funnel and
// ENFORCED at checkout, so the number is never theater.
import 'server-only';
import { CAPACITY } from './config';
import { getStore } from './store';

export async function slotsLeftThisMonth(): Promise<number> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const taken = await getStore().countPaidBuildFeesSince(monthStart);
  return Math.max(0, CAPACITY.buildsPerMonth - taken);
}
