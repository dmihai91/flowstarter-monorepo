-- Create waitlist table for early access signups
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  source TEXT DEFAULT 'pricing_page',
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_plan ON public.waitlist(plan);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);
CREATE INDEX idx_waitlist_source ON public.waitlist(source);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert (public signups allowed)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own waitlist entry by email
CREATE POLICY "Users can view own waitlist entry"
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR user_id = auth.uid()::text
  );

-- Add comment
COMMENT ON TABLE public.waitlist IS 'Early access waitlist for pricing tiers';
COMMENT ON COLUMN public.waitlist.plan IS 'The pricing tier the user is interested in';
COMMENT ON COLUMN public.waitlist.notified_at IS 'When the user was notified about availability';
COMMENT ON COLUMN public.waitlist.converted_at IS 'When the user converted to a paid plan';
