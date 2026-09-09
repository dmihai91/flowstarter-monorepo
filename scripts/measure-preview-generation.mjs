#!/usr/bin/env node
/**
 * Measures preview-generation reliability against a running dev server.
 *
 * Drives N real generations through POST /api/discovery/preview/live, polls
 * each one, and prints every phase with its elapsed second, the final status,
 * the failure reason and the phase it failed in. Ends with one JSON summary
 * line. Pair it with the server's `[preview-outcome]` and `[pi-sdk]` log
 * lines to see which retries fired.
 *
 * Each run costs real money (model tokens plus ~$0.16 of brief imagery) and
 * five to fifteen minutes, so it is a tool for measuring a change, not a test.
 *
 *   BASE=http://localhost:3005 N=4 node scripts/measure-preview-generation.mjs
 */
const BASE = process.env.BASE ?? 'http://localhost:3000';
const N = Number(process.env.N ?? 1);
const HUNG_AFTER_S = 22 * 60;

const specs = [
  {
    businessName: 'Ionescu Dental',
    fullName: 'Maria Ionescu',
    description:
      'A boutique dental clinic in Cluj doing cosmetic work, mostly veneers and whitening. Calm, unhurried appointments for adults who avoided the dentist for years.',
    industry: 'Therapy & wellness',
    targetAudience: 'Adults in Cluj who want a better smile',
    goal: 'Take bookings or appointments, Build trust and credibility',
    brandTone: 'Calm, Premium / elegant, Trustworthy',
  },
  {
    businessName: 'Bogdan Electric',
    fullName: 'Bogdan Pop',
    description:
      'Licensed electrician in Timisoara doing rewiring, panel upgrades and EV charger installs for homeowners. Same-week appointments, fixed quotes.',
    industry: 'Professional services',
    targetAudience: 'Homeowners in Timisoara',
    goal: 'Get enquiries / leads, Drive calls or visits',
    brandTone: 'Trustworthy, Confident, Approachable',
  },
  {
    businessName: 'Studio Lumina',
    fullName: 'Ana Radu',
    description:
      'Portrait and wedding photographer based in Brasov. Natural light, editorial style, small number of weddings per year so every couple gets my full attention.',
    industry: 'Photography',
    targetAudience: 'Couples planning a wedding in Transylvania',
    goal: 'Show a portfolio of work, Get enquiries / leads',
    brandTone: 'Warm, Editorial, Minimal',
  },
  {
    businessName: 'Atelier Verde',
    fullName: 'Ioana Marin',
    description:
      'Small-batch natural skincare made in Sibiu from Romanian botanicals. Sold online and at two local markets, with refills for regulars.',
    industry: 'Online store / ecommerce',
    targetAudience: 'Women 25 to 45 who read ingredient lists',
    goal: 'Sell products or services, Grow an email list',
    brandTone: 'Earthy / natural, Warm, Minimal',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];

for (let i = 0; i < N; i += 1) {
  const spec = specs[i % specs.length];
  const t0 = Date.now();
  const started = await fetch(`${BASE}/api/discovery/preview/live`, {
    method: 'POST',
    // The CSRF check wants a same-origin Origin header, like a browser sends.
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify(spec),
  }).then((response) => response.json());
  console.log(
    `\n=== run ${i + 1}: ${spec.businessName} → ${JSON.stringify(started)}`,
  );
  if (!started.demoId) {
    results.push({ run: i + 1, business: spec.businessName, status: 'skip' });
    continue;
  }
  let lastPhase = '';
  let final;
  for (;;) {
    await sleep(5000);
    const status = await fetch(
      `${BASE}/api/discovery/preview/live?demoId=${started.demoId}`,
    )
      .then((response) => response.json())
      .catch(() => null);
    if (!status) continue;
    const elapsed = Math.round((Date.now() - t0) / 1000);
    if (status.phase && status.phase !== lastPhase) {
      console.log(`  [${elapsed}s] ${status.phase}`);
      lastPhase = status.phase;
    }
    if (status.status !== 'building') {
      final = { ...status, seconds: elapsed };
      break;
    }
    if (elapsed > HUNG_AFTER_S) {
      final = { status: 'hung', seconds: elapsed };
      break;
    }
  }
  console.log(
    `  → ${final.status} after ${final.seconds}s` +
      (final.error ? ` :: ${final.error}` : '') +
      (final.failedPhase ? ` (in: ${final.failedPhase})` : '') +
      (final.previewUrl ? ` :: ${final.previewUrl}` : ''),
  );
  results.push({
    run: i + 1,
    business: spec.businessName,
    status: final.status,
    seconds: final.seconds,
    ...(final.error ? { error: final.error } : {}),
    ...(final.failedPhase ? { failedPhase: final.failedPhase } : {}),
    ...(final.previewUrl ? { previewUrl: final.previewUrl } : {}),
  });
}

const ready = results.filter((result) => result.status === 'ready');
console.log(
  `\nSUMMARY ${JSON.stringify({
    runs: results.length,
    ready: ready.length,
    medianSeconds: ready.length
      ? [...ready].sort((a, b) => a.seconds - b.seconds)[
          Math.floor(ready.length / 2)
        ].seconds
      : null,
    results,
  })}`,
);
