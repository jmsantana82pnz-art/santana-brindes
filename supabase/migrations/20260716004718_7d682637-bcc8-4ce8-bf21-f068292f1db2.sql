DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'hero';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'categories';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'benefits';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'about';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'instagram';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN others THEN NULL; END $$;