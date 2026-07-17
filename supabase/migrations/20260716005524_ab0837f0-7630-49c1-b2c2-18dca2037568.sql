
-- Products: campos adicionais para o CMS profissional
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pix_price_cents int,
  ADD COLUMN IF NOT EXISTS installment_text text,
  ADD COLUMN IF NOT EXISTS is_promotion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text;

-- Product images: sinalizar imagem principal
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS is_main boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, position);

-- Ficha técnica: pares chave/valor
CREATE TABLE IF NOT EXISTS public.product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON public.product_features(product_id, position);

GRANT SELECT ON public.product_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_features TO authenticated;
GRANT ALL ON public.product_features TO service_role;

ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_features_public_read" ON public.product_features;
CREATE POLICY "product_features_public_read" ON public.product_features FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_features_editor_write" ON public.product_features;
CREATE POLICY "product_features_editor_write" ON public.product_features FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_product_features_updated_at ON public.product_features;
CREATE TRIGGER trg_product_features_updated_at
  BEFORE UPDATE ON public.product_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
