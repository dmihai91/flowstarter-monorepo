import { NextResponse } from 'next/server';

// Temporary in-memory fallback; ideally fetch from Supabase tables
const audienceOptions = [
  'entrepreneurs',
  'startups',
  'small businesses',
  'SMBs',
  'enterprise',
  'freelancers',
  'students',
  'educators',
  'non-profits',
  'creators',
  'developers',
  'marketers',
  'agencies',
  'women',
  'pacients',
  'parents',
  'families',
  'children',
  'teachers',
  'customers',
  'adults with anxiety or depression',
  'adults with sleep disorders',
  'adults with eating disorders',
  'adults with addiction',
  'adults with mental health issues',
  'adults with physical health issues',
  'adults with chronic pain',
];

const goalOptions = [
  'leads',
  'sales',
  'signups',
  'bookings',
  'traffic',
  'engagement',
  'subscriptions',
  'demos',
  'downloads',
  'appointments',
  'consultations',
  'evaluations',
  'tests',
  'surgeries',
  'procedures',
  'medications',
  'treatments',
  'therapies',
  'wellness',
  'fitness',
  'nutrition',
];

export async function GET() {
  try {
    return NextResponse.json({ audience: audienceOptions, goals: goalOptions });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to load suggestions' },
      { status: 500 }
    );
  }
}
