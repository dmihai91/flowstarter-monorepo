import { loadLibraryTemplateRegistry } from '@/lib/flowstarter-engine/library-template-registry';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templates = await loadLibraryTemplateRegistry();
    return NextResponse.json({ templates });
  } catch (e) {
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}
