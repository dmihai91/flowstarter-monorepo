// GET/POST /api/internal/watchdog — cron-able sweep for stuck builds (>2h):
// raises one internal alert per build. Token gated via WATCHDOG_SECRET.
import { NextResponse } from 'next/server';
import { watchdogSweep } from '@/lib/runner';

async function sweep(req: Request) {
  const secret = process.env.WATCHDOG_SECRET;
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    new URL(req.url).searchParams.get('token');
  if (secret && provided !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const stuck = await watchdogSweep();
  return NextResponse.json({ stuck });
}

export async function GET(req: Request) {
  return sweep(req);
}
export async function POST(req: Request) {
  return sweep(req);
}
