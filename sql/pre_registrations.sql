-- Run in Supabase SQL Editor (new project recommended).

CREATE TABLE pre_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  children_ages TEXT NOT NULL,
  interests TEXT[] NOT NULL,
  interest_other TEXT,
  themes TEXT[] NOT NULL,
  theme_other TEXT,
  price_range TEXT,
  notifications TEXT[],
  usage_image TEXT,
  consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_pre_registrations_email ON pre_registrations (email);
CREATE INDEX idx_pre_registrations_created_at ON pre_registrations (created_at DESC);

-- RLS on with no policies: PostgREST anon/authenticated cannot read/write.
-- Inserts from this repo use the service_role key server-side, which bypasses RLS in Supabase.
ALTER TABLE pre_registrations ENABLE ROW LEVEL SECURITY;
