// POST /api/projects/[id]/walk-away — the user keeps a Brand Kit PDF (emailed),
// the €50 covered the build, the site code is NOT delivered.
import { NextResponse } from 'next/server';
import { requireIdentity } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { generateBrandKitPdf } from '@/lib/brand-kit';
import { sendEmail } from '@/lib/emails';
import { trackServer } from '@/lib/analytics-server';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const project = await store.getProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.clerk_user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const build = await store.latestBuildForProject(id);
    const spec = build?.outputs?.spec ?? project.demo_spec;
    if (!spec) return NextResponse.json({ error: 'Nothing to package yet.' }, { status: 409 });

    await store.updateProject(id, { outcome: 'walked_away' });

    const pdf = await generateBrandKitPdf(spec);
    await sendEmail({
      to: project.email,
      subject: `Your ${spec.brand.name} brand kit`,
      text: [
        'Hi,',
        '',
        `Attached is the brand kit the agents built for ${spec.brand.name}: logo direction, color palette, voice, and the full homepage copy. It's yours to keep.`,
        '',
        'If you change your mind, your finished site stays ready for 30 days — just open your project again.',
        '',
        '— The Flowstarter team',
      ].join('\n'),
      attachments: [{ filename: `${spec.brand.name.replace(/\s+/g, '-').toLowerCase()}-brand-kit.pdf`, content: pdf }],
    });

    await trackServer(project.clerk_user_id, 'abandoned_after_build', { projectId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
