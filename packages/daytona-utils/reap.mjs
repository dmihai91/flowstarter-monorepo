import { Daytona } from '@daytonaio/sdk';
const d = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
const { items, total } = await d.list();
console.log(`reaping ${items.length} sandboxes (total=${total})…`);
let removed = 0, failed = 0;
for (const s of items) {
  const id = s.id ?? '(unknown)';
  try { await s.delete(); console.log(`✓ ${id}`); removed++; }
  catch (e) { console.log(`✗ ${id}: ${String(e?.message ?? e).slice(0, 100)}`); failed++; }
}
console.log(`\nremoved=${removed} failed=${failed}`);
