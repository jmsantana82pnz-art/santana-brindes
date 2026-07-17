
ALTER TABLE public.appearance
  ADD COLUMN IF NOT EXISTS home_card_buy_button_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS home_card_buy_button_label text NOT NULL DEFAULT 'COMPRAR',
  ADD COLUMN IF NOT EXISTS home_card_buy_button_color text NOT NULL DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS home_card_whatsapp_button_enabled boolean NOT NULL DEFAULT true;
