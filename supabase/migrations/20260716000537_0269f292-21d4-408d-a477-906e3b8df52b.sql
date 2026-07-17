
ALTER TABLE public.appearance
  ADD COLUMN IF NOT EXISTS show_product_reviews boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_whatsapp_button boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_share_button boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_color text NOT NULL DEFAULT '#25d366',
  ADD COLUMN IF NOT EXISTS button_color text,
  ADD COLUMN IF NOT EXISTS button_text_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS logo_position text NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS header_show_menu boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_show_social boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_show_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_social boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_payments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_security_badges boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '["pix","visa","mastercard","boleto"]'::jsonb,
  ADD COLUMN IF NOT EXISTS security_badges jsonb NOT NULL DEFAULT '["ssl","lgpd","secure-checkout"]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_institutional_text text;

-- Allow anonymous read of appearance and related tables that feed the public catalog
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appearance' AND policyname='anon_read_appearance') THEN
    CREATE POLICY anon_read_appearance ON public.appearance FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='store_settings' AND policyname='anon_read_store_settings') THEN
    CREATE POLICY anon_read_store_settings ON public.store_settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_settings' AND policyname='anon_read_contact_settings') THEN
    CREATE POLICY anon_read_contact_settings ON public.contact_settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_settings' AND policyname='anon_read_whatsapp_settings') THEN
    CREATE POLICY anon_read_whatsapp_settings ON public.whatsapp_settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='promo_bar' AND policyname='anon_read_promo_bar') THEN
    CREATE POLICY anon_read_promo_bar ON public.promo_bar FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_settings' AND policyname='anon_read_payment_settings') THEN
    CREATE POLICY anon_read_payment_settings ON public.payment_settings FOR SELECT TO anon USING (true);
  END IF;
END $$;

GRANT SELECT ON public.appearance TO anon;
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT ON public.contact_settings TO anon;
GRANT SELECT ON public.whatsapp_settings TO anon;
GRANT SELECT ON public.promo_bar TO anon;
GRANT SELECT ON public.payment_settings TO anon;
