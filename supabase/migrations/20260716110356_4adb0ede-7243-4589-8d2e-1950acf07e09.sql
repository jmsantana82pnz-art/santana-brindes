
CREATE TABLE public.catalog_hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  brand_logo_url TEXT,
  eyebrow TEXT,
  title TEXT NOT NULL DEFAULT '',
  highlight_prefix TEXT,
  highlight_value TEXT,
  highlight_suffix TEXT,
  button_text TEXT,
  button_link TEXT,
  disclaimer TEXT,
  image_desktop_url TEXT,
  image_mobile_url TEXT,
  background_color TEXT DEFAULT '#f4f1ec',
  text_color TEXT DEFAULT '#111111',
  button_bg_color TEXT DEFAULT '#0f766e',
  button_text_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalog_hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_hero_slides TO authenticated;
GRANT ALL ON public.catalog_hero_slides TO service_role;

ALTER TABLE public.catalog_hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_hero_public_read" ON public.catalog_hero_slides
  FOR SELECT USING (is_active = true);

CREATE POLICY "catalog_hero_admin_read_all" ON public.catalog_hero_slides
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "catalog_hero_admin_write" ON public.catalog_hero_slides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER catalog_hero_slides_updated_at
  BEFORE UPDATE ON public.catalog_hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX catalog_hero_slides_position_idx ON public.catalog_hero_slides(position);

-- Seed com um slide de exemplo (estilo Zattini / Sneakers)
INSERT INTO public.catalog_hero_slides
  (position, is_active, eyebrow, title, highlight_prefix, highlight_value, highlight_suffix, button_text, button_link, disclaimer, background_color, text_color, button_bg_color, button_text_color)
VALUES
  (1, true, NULL, 'Sneakers', 'com até', '60%', 'off', 'aproveite', '/loja', 'Imagem ilustrativa', '#f4f1ec', '#111111', '#0f766e', '#ffffff');
