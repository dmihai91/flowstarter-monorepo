import { NextResponse } from 'next/server';

export async function GET() {
  const resources = {
    users: [{ id: 'U1', email: 'you@business.com' }],
    eventTypes: [
      {
        id: 'E1',
        name: '30 min meeting',
        url: 'https://calendly.com/you/30min',
      },
      { id: 'E2', name: 'Intro call', url: 'https://calendly.com/you/intro' },
    ],
  };
  return NextResponse.json(resources);
}
