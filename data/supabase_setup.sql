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

-- Drop constraints if present from earlier schema
ALTER TABLE public.land_records DROP CONSTRAINT IF EXISTS land_records_user_id_fkey;
ALTER TABLE public.land_records ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT 'p.manojkumar1101@gmail.com';
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS partitions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.land_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes for fast performance
CREATE INDEX IF NOT EXISTS idx_land_records_user_email ON public.land_records(user_email);
CREATE INDEX IF NOT EXISTS idx_nearby_land_records_user_email ON public.nearby_land_records(user_email);
CREATE INDEX IF NOT EXISTS idx_nearby_land_records_survey ON public.nearby_land_records(survey_number);

-- 4. Storage Bucket Setup for Documents (Patta, EC, FMB, Master FMB, Deed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('land_documents', 'land_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on public tables to allow simple direct queries
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_land_records DISABLE ROW LEVEL SECURITY;
