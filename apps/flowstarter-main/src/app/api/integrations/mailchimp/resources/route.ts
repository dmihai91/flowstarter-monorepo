import { NextResponse } from 'next/server';

export async function GET() {
  const resources = {
    account: { id: 'AC1', email: 'you@business.com' },
    audiences: [
      { id: 'AUD1', name: 'Newsletter' },
      { id: 'AUD2', name: 'Customers' },
    ],
  };
  return NextResponse.json(resources);
}
