// POST /api/leads — "email me my draft": captures the bounce cohort before
// the account gate. Public, IP rate-limited; emails a permalink to the draft.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';
import { sendEmail } from '@/lib/emails';
import { renderEmailHtml } from '@/lib/email-template';
import { clientIp } from '@/lib/auth';
import { SpecSchema } from '@/lib/demo';
import type { SiteSpec } from '@flowstarter/build-engine';

const Body = z.object({
  email: z.string().trim().email().max(120),
  businessDescription: z.string().trim().min(10).max(2000),
  demoSpec: SpecSchema.optional(),
  demoHtml: z.string().max(300_000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });

    const store = getStore();
    const ip = await clientIp();
    const day = new Date().toISOString().slice(0, 10);
    if (ip) {
      const count = await store.bumpRateLimit(`ip-lead:${ip}:${day}`);
      if (count > 5) return NextResponse.json({ error: 'Too many requests today.' }, { status: 429 });
    }

    const lead = await store.createLead({
      email: body.data.email,
      businessDescription: body.data.businessDescription,
      demoSpec: (body.data.demoSpec as SiteSpec | undefined) ?? null,
      demoHtml: body.data.demoHtml ?? null,
    });

    const origin = new URL(req.url).origin;
    const name = body.data.demoSpec?.brand.name ?? 'your site';
    const draftUrl = `${origin}/draft/${lead.id}`;
    await sendEmail({
      to: body.data.email,
      subject: `Your draft of ${name} is saved`,
      text: [
        'Hi,',
        '',
        `The draft our agent built for "${body.data.businessDescription.slice(0, 80)}" is saved here:`,
        '',
        draftUrl,
        '',
        'Open it any time to keep going — a free account unlocks 10 prompts with the agent, and the full build starts whenever you say so.',
        '',
        '— The Flowstarter crew',
      ].join('\n'),
      html: renderEmailHtml({
        preheader: `${name} — the page our agent drafted from your one-sentence description.`,
        heading: `Your draft of ${name} is saved`,
        paragraphs: [
          `Our agent built a first draft of your site from: “${body.data.businessDescription.slice(0, 120)}”.`,
          'Open it any time to keep going — a free account unlocks 10 prompts with the agent, and the full build starts only when you say so.',
        ],
        cta: { label: 'Open your draft', url: draftUrl },
        footnote: 'Your draft stays saved at this link. Nothing is charged without your say-so.',
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[selfserve leads]', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
