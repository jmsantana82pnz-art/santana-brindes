-- pwa_settings singleton
CREATE TABLE IF NOT EXISTS public.pwa_settings (
  id int PRIMARY KEY DEFAULT 1,
  app_name text NOT NULL DEFAULT 'Minha Loja',
  short_name text NOT NULL DEFAULT 'Loja',
  description text NOT NULL DEFAULT 'Catálogo de produtos',
  icon_url text,
  splash_color text NOT NULL DEFAULT '#ffffff',
  theme_color text NOT NULL DEFAULT '#000000',
  background_color text NOT NULL DEFAULT '#ffffff',
  install_message text NOT NULL DEFAULT 'Instale nosso aplicativo',
  active boolean NOT NULL DEFAULT true,
  onboarding_enabled boolean NOT NULL DEFAULT true,
  company_name text,
  admin_logo_url text,
  support_email text,
  support_phone text,
  tech_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pwa_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.pwa_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.pwa_settings TO authenticated;
GRANT ALL ON public.pwa_settings TO service_role;

ALTER TABLE public.pwa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pwa_settings public read" ON public.pwa_settings FOR SELECT USING (true);
CREATE POLICY "pwa_settings admin write" ON public.pwa_settings FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

CREATE TRIGGER update_pwa_settings_updated_at BEFORE UPDATE ON public.pwa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pwa_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- pwa storage bucket policies (bucket created via storage tool)
CREATE TABLE IF NOT EXISTS public._pwa_bucket_marker (id int); -- noop marker so migration is idempotent
DROP TABLE public._pwa_bucket_marker;