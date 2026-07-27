-- =========================================================================
-- Simplified Supabase Schema Setup for Land Record Manager
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Create the `users` table for custom login check
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial user account
INSERT INTO public.users (email, password, name)
VALUES ('p.manojkumar1101@gmail.com', 'Manoj@1101', 'Manoj Kumar')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- 2. Create or alter the `land_records` table
CREATE TABLE IF NOT EXISTS public.land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com',
    user_id UUID,
    document_number TEXT NOT NULL,
    document_owner_name JSONB NOT NULL DEFAULT '[]'::jsonb,
    purchased_from JSONB DEFAULT '[]'::jsonb,
    purchase_date DATE,
    district TEXT,
    sro TEXT,
    village TEXT,
    notes TEXT,
    pattas JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '{}'::jsonb,
    survey_number TEXT,
    sub_division TEXT,
    land_type TEXT DEFAULT 'dry',
    land_size JSONB DEFAULT '{"value": 0, "unit": "cent"}'::jsonb,
    patta_number TEXT,
    patta_names JSONB DEFAULT '[]'::jsonb,
    is_patta_transferred BOOLEAN DEFAULT false,
    partitions JSONB DEFAULT '[]'::jsonb,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create `nearby_land_records` table for surrounding parcels & Master Survey FMB maps
CREATE TABLE IF NOT EXISTS public.nearby_land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com',
    survey_number TEXT NOT NULL,
    sub_division TEXT,
    patta_number TEXT,
    patta_names JSONB DEFAULT '[]'::jsonb,
    land_type TEXT DEFAULT 'dry',
    land_size JSONB DEFAULT '{"value": 0, "unit": "cent"}'::jsonb,
    direction TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create `pending_land_deals` table for unregistered land purchases & deals made
CREATE TABLE IF NOT EXISTS public.pending_land_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com',
    seller_name JSONB DEFAULT '[]'::jsonb,
    buyer_name JSONB DEFAULT '[]'::jsonb,
    survey_number TEXT NOT NULL,
    sub_division TEXT,
    patta_number TEXT,
    land_type TEXT DEFAULT 'dry',
    land_size JSONB DEFAULT '{"value": 0, "unit": "cent"}'::jsonb,
    deal_status TEXT DEFAULT 'agreement_executed',
    agreement_date DATE,
    target_registration_date DATE,
    total_price NUMERIC(15, 2) DEFAULT 0,
    advance_paid NUMERIC(15, 2) DEFAULT 0,
    district TEXT,
    sro TEXT,
    village TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.land_records DROP CONSTRAINT IF EXISTS land_records_user_id_fkey;
ALTER TABLE public.land_records ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com';
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS partitions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS deed_type TEXT DEFAULT 'sale_deed';
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. Create `master_survey_records` table for whole survey numbers & sub-divisions registry
CREATE TABLE IF NOT EXISTS public.master_survey_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com',
    survey_number TEXT NOT NULL,
    sub_divisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    village TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast performance
CREATE INDEX IF NOT EXISTS idx_land_records_user_email ON public.land_records(user_email);
CREATE INDEX IF NOT EXISTS idx_nearby_land_records_user_email ON public.nearby_land_records(user_email);
CREATE INDEX IF NOT EXISTS idx_nearby_land_records_survey ON public.nearby_land_records(survey_number);
CREATE INDEX IF NOT EXISTS idx_pending_land_deals_user_email ON public.pending_land_deals(user_email);
CREATE INDEX IF NOT EXISTS idx_master_survey_user_email ON public.master_survey_records(user_email);
CREATE INDEX IF NOT EXISTS idx_master_survey_number ON public.master_survey_records(survey_number);

-- Storage Bucket Setup for Documents (Patta, EC, FMB, Master FMB, Deed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('land_documents', 'land_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on public tables to allow simple direct queries
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_land_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_land_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_survey_records DISABLE ROW LEVEL SECURITY;

