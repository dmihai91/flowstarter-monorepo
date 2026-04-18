import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ClientInfo {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
}

interface DraftBody {
  projectConfig?: {
    name?: string;
    clientInfo?: ClientInfo;
    userInput?: string;
    businessInfo?: { summary?: string };
  };
}

/**
 * POST /api/team/projects/draft
 *
 * Creates a draft project for the team wizard, saving client info.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DraftBody = await req.json().catch(() => ({}));
    const clientInfo = body?.projectConfig?.clientInfo;
    const projectName = clientInfo?.businessName
      ? clientInfo.businessName
      : clientInfo?.name
      ? `${clientInfo.name}'s Project`
      : body?.projectConfig?.name || 'Untitled Project';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        description: body?.projectConfig?.businessInfo?.summary || '',
        user_id: userId,
        status: 'draft',
        is_draft: true,
        client_name: clientInfo?.name || null,
        client_email: clientInfo?.email || null,
        client_phone: clientInfo?.phone || null,
        client_business_name: clientInfo?.businessName || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Draft API] Error creating draft:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Draft API] Draft project created:', data.id);
    return NextResponse.json({ id: data.id, projectId: data.id });
  } catch (error) {
    console.error('[Draft API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create draft project' },
      { status: 500 }
    );
  }
}
