
-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  description text,
  image_url text,
  link_url text,
  start_date timestamptz,
  end_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_public_read" ON public.campaigns;
CREATE POLICY "campaigns_public_read" ON public.campaigns FOR SELECT USING (true);
DROP POLICY IF EXISTS "campaigns_editor_write" ON public.campaigns;
CREATE POLICY "campaigns_editor_write" ON public.campaigns FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- countdown singleton
CREATE TABLE IF NOT EXISTS public.countdown_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active boolean NOT NULL DEFAULT false,
  title text,
  ends_at timestamptz,
  bg_color text NOT NULL DEFAULT '#111111',
  text_color text NOT NULL DEFAULT '#ffffff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.countdown_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.countdown_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.countdown_settings TO authenticated;
GRANT ALL ON public.countdown_settings TO service_role;
ALTER TABLE public.countdown_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "countdown_public_read" ON public.countdown_settings;
CREATE POLICY "countdown_public_read" ON public.countdown_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "countdown_editor_write" ON public.countdown_settings;
CREATE POLICY "countdown_editor_write" ON public.countdown_settings FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
DROP TRIGGER IF EXISTS trg_countdown_updated_at ON public.countdown_settings;
CREATE TRIGGER trg_countdown_updated_at BEFORE UPDATE ON public.countdown_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- coupons: permitir leitura pública dos ativos (catálogo mostra códigos promocionais)
GRANT SELECT ON public.coupons TO anon;
DROP POLICY IF EXISTS "coupons_public_read_active" ON public.coupons;
CREATE POLICY "coupons_public_read_active" ON public.coupons FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- products: campos extras de marketing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promotion_label text,
  ADD COLUMN IF NOT EXISTS related_product_ids uuid[] NOT NULL DEFAULT '{}';

-- analytics_events: FKs opcionais
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_product ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign ON public.analytics_events(campaign_id);
