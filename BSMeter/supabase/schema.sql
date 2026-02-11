-- =============================================================================
-- BS Meter — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: public.users
-- Stores user pro status and subscription info
-- has_lifetime = one-time $15 purchase (never expires)
-- plan + autoscan_expires_at = $20/mo subscription (Alibaba + auto-scan)
-- is_pro = has_lifetime OR (plan='autoscan' AND autoscan_expires_at > NOW())
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  has_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'autoscan')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  autoscan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Migrations for existing projects (run if you already have users table)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AND
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'has_lifetime') THEN
    ALTER TABLE public.users ADD COLUMN has_lifetime BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE public.users SET has_lifetime = TRUE WHERE is_pro = TRUE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AND
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'plan') THEN
    ALTER TABLE public.users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AND
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE public.users ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AND
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'autoscan_expires_at') THEN
    ALTER TABLE public.users ADD COLUMN autoscan_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row (by email from JWT)
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Service role has full access (for webhooks)
DROP POLICY IF EXISTS "Service role full access" ON public.users;
CREATE POLICY "Service role full access"
  ON public.users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- Trigger: updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Optional: Auto-create user row on Supabase Auth signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (email, plan)
  VALUES (NEW.email, 'free')
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
