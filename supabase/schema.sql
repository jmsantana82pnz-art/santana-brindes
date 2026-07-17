-- =========================================================================
-- CATÁLOGO DIGITAL — SCHEMA COMPLETO (single-tenant)
-- =========================================================================
-- Uso: em um projeto Supabase VAZIO, execute este arquivo inteiro.
-- Cada cliente = 1 código + 1 Supabase + 1 execução deste schema.sql.
-- NÃO é SaaS, NÃO é multi-tenant.
--
-- Ordem:
--   01_extensions | 02_enums | 03_functions | 04_tables | 05_indexes
--   06_triggers   | 07_storage | 08_rls | 09_policies | 10_seed
--
-- Regra: toda tabela / coluna / policy / trigger / bucket criada no
-- projeto DEVE existir aqui antes de ser aplicada no banco.
-- =========================================================================


-- =========================================================================
-- 01_EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =========================================================================
-- 02_ENUMS
-- =========================================================================
DO $$ BEGIN
  -- Papéis dentro da loja (uma única loja)
  CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer','customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- Modo de operação
  --   catalog  = catálogo puro (sem preço/carrinho, contato via WhatsApp)
  --   showcase = vitrine com preço, pedido via WhatsApp (sem checkout)
  --   checkout = carrinho + pedido completo
  CREATE TYPE public.store_mode AS ENUM ('catalog','showcase','checkout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM
    ('pending','confirmed','processing','shipped','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.section_type AS ENUM
    ('featured','category','banner','text','products_grid','testimonials','newsletter',
     'hero','categories','benefits','about','instagram','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Garante que instalações antigas recebam os novos valores do enum
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'hero'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'categories'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'benefits'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'about'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'instagram'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'custom'; EXCEPTION WHEN others THEN NULL; END $$;


DO $$ BEGIN
  CREATE TYPE public.promotion_type AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_discount_type AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cart_status AS ENUM ('open','converted','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =========================================================================
-- 03_FUNCTIONS
-- =========================================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Verificação de papel (SECURITY DEFINER — evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Admin?
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Pode editar (admin ou editor)
CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','editor')
  );
$$;

-- Membro da equipe (admin/editor/viewer)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','editor','viewer')
  );
$$;

-- Geração de número de pedido sequencial
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_num int;
BEGIN
  IF NEW.number IS NULL OR NEW.number = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(number,'\D','','g'),'')::int),0)+1
      INTO next_num FROM public.orders;
    NEW.number := LPAD(next_num::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

-- Criação automática de profile + primeiro usuário vira admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- Baixa de estoque ao criar item de pedido
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants SET stock = GREATEST(stock - NEW.qty, 0)
      WHERE id = NEW.variant_id;
  ELSIF NEW.product_id IS NOT NULL THEN
    UPDATE public.products SET stock = GREATEST(stock - NEW.qty, 0)
      WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;

-- Recalcula rating agregado do produto
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric,2)
                           FROM public.product_reviews
                           WHERE product_id = pid AND status = 'approved'), 0),
    rating_count = COALESCE((SELECT COUNT(*) FROM public.product_reviews
                             WHERE product_id = pid AND status = 'approved'), 0)
  WHERE p.id = pid;
  RETURN COALESCE(NEW, OLD);
END $$;

-- Auditoria: grava toda alteração administrativa em audit_log
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _entity_id uuid;
BEGIN
  BEGIN _entity_id := COALESCE((NEW).id, (OLD).id);
  EXCEPTION WHEN undefined_column THEN _entity_id := NULL; END;
  INSERT INTO public.audit_log (user_id, entity, entity_id, action, diff)
  VALUES (auth.uid(), TG_TABLE_NAME, _entity_id, TG_OP,
          jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
  RETURN COALESCE(NEW, OLD);
END $$;




-- =========================================================================
-- 04_TABLES
-- =========================================================================

-- ---------------- USUÁRIOS / PAPÉIS ----------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email citext,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ---------------- CONFIGURAÇÕES DA LOJA (linha única) ----------------
-- Todas as tabelas de configuração usam id fixo = 1 (linha única).
CREATE TABLE IF NOT EXISTS public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Minha Loja',
  mode public.store_mode NOT NULL DEFAULT 'checkout',
  legal_name text,
  cnpj text,
  email citext,
  phone text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_url text,
  favicon_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appearance (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  primary_color   text NOT NULL DEFAULT '#111111',
  secondary_color text NOT NULL DEFAULT '#666666',
  accent_color    text NOT NULL DEFAULT '#22c55e',
  bg_color        text NOT NULL DEFAULT '#ffffff',
  text_color      text NOT NULL DEFAULT '#111111',
  header_bg_color text,
  header_text_color text,
  footer_bg_color text,
  footer_text_color text,
  button_style    text NOT NULL DEFAULT 'rounded',  -- rounded|square|pill
  border_radius   int  NOT NULL DEFAULT 8,
  font_family     text NOT NULL DEFAULT 'Inter',
  font_heading    text,
  layout_variant  text NOT NULL DEFAULT 'default',
  product_card_style text NOT NULL DEFAULT 'default',
  show_product_price boolean NOT NULL DEFAULT true,
  show_product_stock boolean NOT NULL DEFAULT true,
  show_search    boolean NOT NULL DEFAULT true,
  show_categories_menu boolean NOT NULL DEFAULT true,
  show_product_reviews boolean NOT NULL DEFAULT true,
  show_whatsapp_button boolean NOT NULL DEFAULT true,
  show_share_button    boolean NOT NULL DEFAULT true,
  whatsapp_color       text NOT NULL DEFAULT '#25d366',
  button_color         text,
  button_text_color    text NOT NULL DEFAULT '#ffffff',
  logo_position        text NOT NULL DEFAULT 'left',
  header_show_menu     boolean NOT NULL DEFAULT true,
  header_show_social   boolean NOT NULL DEFAULT true,
  header_show_whatsapp boolean NOT NULL DEFAULT true,
  footer_show_contact  boolean NOT NULL DEFAULT true,
  footer_show_social   boolean NOT NULL DEFAULT true,
  footer_show_payments boolean NOT NULL DEFAULT true,
  footer_show_security_badges boolean NOT NULL DEFAULT true,
  payment_methods      jsonb   NOT NULL DEFAULT '["pix","visa","mastercard","boleto"]'::jsonb,
  security_badges      jsonb   NOT NULL DEFAULT '["ssl","lgpd","secure-checkout"]'::jsonb,
  footer_institutional_text text,
  footer_text    text,
  selected_palette text,           -- id da paleta pré-definida (temas do catálogo)
  home_card_buy_button_enabled boolean NOT NULL DEFAULT true,
  home_card_buy_button_label   text    NOT NULL DEFAULT 'COMPRAR',
  home_card_buy_button_color   text    NOT NULL DEFAULT '#111827',
  home_card_whatsapp_button_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Migração idempotente das colunas adicionadas após a criação inicial da tabela
ALTER TABLE public.appearance
  ADD COLUMN IF NOT EXISTS show_product_reviews boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_whatsapp_button boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_share_button    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_color       text    NOT NULL DEFAULT '#25d366',
  ADD COLUMN IF NOT EXISTS button_color         text,
  ADD COLUMN IF NOT EXISTS button_text_color    text    NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS logo_position        text    NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS header_show_menu     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_show_social   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_show_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_contact  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_social   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_payments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_security_badges boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_methods      jsonb   NOT NULL DEFAULT '["pix","visa","mastercard","boleto"]'::jsonb,
  ADD COLUMN IF NOT EXISTS security_badges      jsonb   NOT NULL DEFAULT '["ssl","lgpd","secure-checkout"]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_institutional_text text,
  ADD COLUMN IF NOT EXISTS selected_palette     text,
  ADD COLUMN IF NOT EXISTS home_card_buy_button_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS home_card_buy_button_label   text    NOT NULL DEFAULT 'COMPRAR',
  ADD COLUMN IF NOT EXISTS home_card_buy_button_color   text    NOT NULL DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS home_card_whatsapp_button_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.seo (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  meta_title text,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  robots text NOT NULL DEFAULT 'index,follow',
  og_title text,
  og_description text,
  og_image_url text,
  og_type text NOT NULL DEFAULT 'website',
  twitter_card text NOT NULL DEFAULT 'summary_large_image',
  twitter_site text,
  twitter_creator text,
  structured_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sitemap_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_bar (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active boolean NOT NULL DEFAULT false,
  text text,
  link_url text,
  link_label text,
  icon text,
  bg_color text NOT NULL DEFAULT '#111111',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pix_enabled boolean NOT NULL DEFAULT true,
  pix_key text,
  pix_discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  card_enabled boolean NOT NULL DEFAULT true,
  card_installments_max int NOT NULL DEFAULT 1,
  card_interest_free_max int NOT NULL DEFAULT 1,
  boleto_enabled boolean NOT NULL DEFAULT false,
  cash_on_delivery_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracking_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ga_id text,
  gtm_id text,
  meta_pixel_id text,
  tiktok_pixel_id text,
  google_ads_id text,
  hotjar_id text,
  clarity_id text,
  custom_head_html text,
  custom_body_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  email_contact citext,
  phone text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  youtube_url text,
  twitter_url text,
  linkedin_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT true,
  phone_number text,                    -- E.164 (5511999999999)
  display_name text,
  default_message text,
  product_message_template text,        -- {{product_name}} {{product_url}}
  cart_message_template text,           -- {{cart_summary}}
  order_message_template text,
  floating_button_enabled boolean NOT NULL DEFAULT true,
  floating_button_position text NOT NULL DEFAULT 'bottom-right',
  floating_button_label text,
  business_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  offline_message text,
  send_order_via_whatsapp boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------- CATÁLOGO ----------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug citext NOT NULL UNIQUE,
  description text,
  image_url text,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  meta_title text,
  meta_description text,
  og_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug citext NOT NULL UNIQUE,
  short_description text,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  compare_at_price_cents int,
  pix_price_cents int,
  installment_text text,
  cost_cents int,
  sku text,
  barcode text,
  stock int NOT NULL DEFAULT 0,
  stock_alert int NOT NULL DEFAULT 0,
  weight_grams int,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_promotion boolean NOT NULL DEFAULT false,
  cover_image_url text,
  whatsapp_message text,
  position int NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  og_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Instalações antigas: garantir as colunas novas
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pix_price_cents int,
  ADD COLUMN IF NOT EXISTS installment_text text,
  ADD COLUMN IF NOT EXISTS is_promotion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text;

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position int NOT NULL DEFAULT 0,
  is_main boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS is_main boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);



CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price_cents int,
  stock int NOT NULL DEFAULT 0,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag citext NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, tag)
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text,
  author_email citext,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  status public.review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id),
  UNIQUE (product_id, session_id)
);

-- ---------------- HOME PÚBLICA ----------------
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  image_mobile_url text,
  link_url text,
  title text,
  subtitle text,
  cta_label text,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.section_type NOT NULL,
  title text,
  subtitle text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug citext NOT NULL UNIQUE,
  title text NOT NULL,
  content_html text,
  meta_title text,
  meta_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------- MARKETING ----------------
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.promotion_type NOT NULL DEFAULT 'percent',
  discount_percent numeric(5,2),
  discount_cents int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  discount_type public.coupon_discount_type NOT NULL DEFAULT 'percent',
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  min_order_cents int,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auto_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text NOT NULL,
  template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Campanhas (definida antes de analytics_events por causa da FK)
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

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event text NOT NULL,
  path text,
  referrer text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contador regressivo
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

-- Slides do hero do catálogo (topo da home)
CREATE TABLE IF NOT EXISTS public.catalog_hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  brand_logo_url text,
  eyebrow text,
  title text NOT NULL DEFAULT '',
  highlight_prefix text,
  highlight_value text,
  highlight_suffix text,
  button_text text,
  button_link text,
  disclaimer text,
  image_desktop_url text,
  image_mobile_url text,
  background_color text DEFAULT '#f4f1ec',
  text_color text DEFAULT '#111111',
  button_bg_color text DEFAULT '#0f766e',
  button_text_color text DEFAULT '#ffffff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Configurações do PWA (Progressive Web App) e onboarding do admin
CREATE TABLE IF NOT EXISTS public.pwa_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
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
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Campos extras de marketing em products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promotion_label text,
  ADD COLUMN IF NOT EXISTS related_product_ids uuid[] NOT NULL DEFAULT '{}';

-- ---------------- PEDIDOS ----------------
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text,
  email citext,
  phone text,
  document text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  session_id text,
  status public.cart_status NOT NULL DEFAULT 'open',
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  qty int NOT NULL DEFAULT 1,
  unit_price_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  number text NOT NULL UNIQUE,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal_cents int NOT NULL DEFAULT 0,
  discount_cents int NOT NULL DEFAULT 0,
  shipping_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  payment_method text,
  channel text,          -- site | whatsapp | manual
  coupon_code text,
  notes text,
  whatsapp_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_message text;

-- Índice auxiliar para as RPCs do carrinho público
CREATE INDEX IF NOT EXISTS idx_carts_session_status ON public.carts(session_id, status);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  qty int NOT NULL DEFAULT 1,
  unit_price_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------- AUDITORIA ----------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- =========================================================================
-- 05_INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user           ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent         ON public.categories(parent_id, position);
CREATE INDEX IF NOT EXISTS idx_products_active           ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category         ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured         ON public.products(is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm        ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_images_product    ON public.product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_product_variants_product  ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag          ON public.product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product   ON public.product_reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_favorites_user    ON public.product_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_session ON public.product_favorites(session_id);
CREATE INDEX IF NOT EXISTS idx_banners_active            ON public.banners(is_active, position);
CREATE INDEX IF NOT EXISTS idx_sections_position         ON public.sections(position);
CREATE INDEX IF NOT EXISTS idx_promotions_active         ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_carts_session             ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart           ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_status             ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created            ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order         ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order        ON public.order_events(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_created         ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created  ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event    ON public.analytics_events(event);


-- =========================================================================
-- 06_TRIGGERS
-- =========================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','store_settings','appearance','seo','promo_bar',
    'payment_settings','tracking_settings','contact_settings','whatsapp_settings',
    'categories','products','product_images','product_variants',
    'product_reviews','banners','sections','pages',
    'promotions','coupons','auto_messages',
    'campaigns','countdown_settings','catalog_hero_slides','pwa_settings',
    'customers','carts','cart_items','orders'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$s
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_orders_number ON public.orders;
CREATE TRIGGER trg_orders_number BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

DROP TRIGGER IF EXISTS trg_order_items_stock ON public.order_items;
CREATE TRIGGER trg_order_items_stock AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();

DROP TRIGGER IF EXISTS trg_product_reviews_rating ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers de auditoria em todas as entidades administrativas
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'store_settings','appearance','seo','promo_bar',
    'payment_settings','tracking_settings','contact_settings','whatsapp_settings',
    'categories','products','product_images','product_variants','product_tags',
    'banners','sections','pages',
    'promotions','coupons','auto_messages',
    'campaigns','countdown_settings','catalog_hero_slides','pwa_settings',
    'orders','user_roles'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_audit ON public.%1$s;
       CREATE TRIGGER trg_%1$s_audit AFTER INSERT OR UPDATE OR DELETE ON public.%1$s
       FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();', t);
  END LOOP;
END $$;




-- =========================================================================
-- 07_STORAGE
-- =========================================================================
-- Buckets públicos: leitura anônima liberada, escrita apenas por editor/admin.
-- Em Supabase próprio (self-hosted ou projeto do cliente) este INSERT cria os
-- buckets já como public=true e a loja carrega imagens sem qualquer passo manual.
-- OBS: alguns workspaces gerenciados (ex.: Lovable Cloud) podem bloquear buckets
-- públicos via política de plataforma. Nesse caso, o bloqueio NÃO afeta instalações
-- white label em Supabase do cliente — só o ambiente gerenciado.
INSERT INTO storage.buckets (id, name, public) VALUES
  ('logos','logos', true),
  ('favicons','favicons', true),
  ('banners','banners', true),
  ('product-images','product-images', true),
  ('pages','pages', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;


-- Leitura pública / escrita apenas por editor/admin
DO $$
DECLARE b text;
BEGIN
  FOR b IN SELECT unnest(ARRAY['logos','favicons','banners','product-images','pages'])
  LOOP
    EXECUTE format($p$
      DROP POLICY IF EXISTS "public_read_%1$s" ON storage.objects;
      CREATE POLICY "public_read_%1$s" ON storage.objects FOR SELECT
        USING (bucket_id = %1$L);
      DROP POLICY IF EXISTS "editor_insert_%1$s" ON storage.objects;
      CREATE POLICY "editor_insert_%1$s" ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = %1$L AND public.can_edit(auth.uid()));
      DROP POLICY IF EXISTS "editor_update_%1$s" ON storage.objects;
      CREATE POLICY "editor_update_%1$s" ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = %1$L AND public.can_edit(auth.uid()));
      DROP POLICY IF EXISTS "editor_delete_%1$s" ON storage.objects;
      CREATE POLICY "editor_delete_%1$s" ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = %1$L AND public.can_edit(auth.uid()));
    $p$, b);
  END LOOP;
END $$;


-- =========================================================================
-- 08_RLS
-- =========================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','user_roles',
    'store_settings','appearance','seo','promo_bar',
    'payment_settings','tracking_settings','contact_settings','whatsapp_settings',
    'categories','products','product_images','product_variants','product_tags',
    'product_features',
    'product_reviews','product_favorites',
    'banners','sections','pages',
    'promotions','coupons','auto_messages','analytics_events',
    'campaigns','countdown_settings','catalog_hero_slides','pwa_settings',
    'customers','carts','cart_items','orders','order_items','order_events',
    'audit_log'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- GRANTs
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Leitura pública (anon)
GRANT SELECT ON
  public.store_settings, public.appearance, public.seo, public.promo_bar,
  public.payment_settings, public.tracking_settings,
  public.contact_settings, public.whatsapp_settings,
  public.categories, public.products, public.product_images, public.product_variants,
  public.product_tags, public.product_features, public.product_reviews,
  public.banners, public.sections, public.pages, public.promotions,
  public.campaigns, public.countdown_settings, public.catalog_hero_slides, public.pwa_settings
TO anon;


-- Interações públicas (checkout, favoritos, reviews, analytics)
GRANT INSERT ON
  public.customers, public.carts, public.cart_items, public.orders, public.order_items,
  public.product_reviews, public.product_favorites, public.analytics_events
TO anon;
GRANT DELETE ON public.product_favorites TO anon;

-- Authenticated: full CRUD (filtrado por RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.user_roles,
  public.store_settings, public.appearance, public.seo, public.promo_bar,
  public.payment_settings, public.tracking_settings,
  public.contact_settings, public.whatsapp_settings,
  public.categories, public.products, public.product_images, public.product_variants,
  public.product_tags, public.product_features, public.product_reviews, public.product_favorites,
  public.banners, public.sections, public.pages,
  public.promotions, public.coupons, public.auto_messages, public.analytics_events,
  public.campaigns, public.countdown_settings, public.catalog_hero_slides, public.pwa_settings,
  public.customers, public.carts, public.cart_items,
  public.orders, public.order_items, public.order_events, public.audit_log
TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;


-- =========================================================================
-- 09_POLICIES
-- =========================================================================

-- profiles
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "user_roles_self_read" ON public.user_roles;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Padrão "leitura pública + escrita por editor/admin" para tabelas de configuração e catálogo
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'store_settings','appearance','seo','promo_bar',
    'payment_settings','tracking_settings','contact_settings','whatsapp_settings',
    'categories','products','product_images','product_variants','product_tags','product_features',
    'banners','sections','pages','promotions',
    'campaigns','countdown_settings','catalog_hero_slides','pwa_settings'
  ])
  LOOP
    EXECUTE format($p$
      DROP POLICY IF EXISTS "%1$s_public_read" ON public.%1$s;
      CREATE POLICY "%1$s_public_read" ON public.%1$s FOR SELECT USING (true);
      DROP POLICY IF EXISTS "%1$s_editor_write" ON public.%1$s;
      CREATE POLICY "%1$s_editor_write" ON public.%1$s FOR ALL TO authenticated
        USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
    $p$, t);
  END LOOP;
END $$;

-- coupons: staff apenas
DROP POLICY IF EXISTS "coupons_staff_read" ON public.coupons;
CREATE POLICY "coupons_staff_read" ON public.coupons FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "coupons_editor_write" ON public.coupons;
CREATE POLICY "coupons_editor_write" ON public.coupons FOR ALL TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

-- auto_messages: staff apenas
DROP POLICY IF EXISTS "auto_messages_staff" ON public.auto_messages;
CREATE POLICY "auto_messages_staff" ON public.auto_messages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

-- product_reviews
DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_public_read" ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "reviews_public_insert" ON public.product_reviews;
CREATE POLICY "reviews_public_insert" ON public.product_reviews FOR INSERT
  WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "reviews_editor_update" ON public.product_reviews;
CREATE POLICY "reviews_editor_update" ON public.product_reviews FOR UPDATE TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
DROP POLICY IF EXISTS "reviews_editor_delete" ON public.product_reviews;
CREATE POLICY "reviews_editor_delete" ON public.product_reviews FOR DELETE TO authenticated
  USING (public.can_edit(auth.uid()));

-- product_favorites
DROP POLICY IF EXISTS "favorites_self_read" ON public.product_favorites;
CREATE POLICY "favorites_self_read" ON public.product_favorites FOR SELECT
  USING ( (user_id IS NOT NULL AND user_id = auth.uid())
       OR (user_id IS NULL AND session_id IS NOT NULL)
       OR public.is_staff(auth.uid()) );
DROP POLICY IF EXISTS "favorites_insert" ON public.product_favorites;
CREATE POLICY "favorites_insert" ON public.product_favorites FOR INSERT
  WITH CHECK ( (user_id = auth.uid()) OR (user_id IS NULL AND session_id IS NOT NULL) );
DROP POLICY IF EXISTS "favorites_delete" ON public.product_favorites;
CREATE POLICY "favorites_delete" ON public.product_favorites FOR DELETE
  USING ( (user_id IS NOT NULL AND user_id = auth.uid())
       OR (user_id IS NULL AND session_id IS NOT NULL) );

-- analytics_events
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_public_insert" ON public.analytics_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "analytics_staff_read" ON public.analytics_events;
CREATE POLICY "analytics_staff_read" ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- customers
DROP POLICY IF EXISTS "customers_staff_read" ON public.customers;
CREATE POLICY "customers_staff_read" ON public.customers FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "customers_public_insert" ON public.customers;
CREATE POLICY "customers_public_insert" ON public.customers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "customers_editor_update" ON public.customers;
CREATE POLICY "customers_editor_update" ON public.customers FOR UPDATE TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

-- carts / cart_items
DROP POLICY IF EXISTS "carts_staff_read" ON public.carts;
CREATE POLICY "carts_staff_read" ON public.carts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "carts_public_insert" ON public.carts;
CREATE POLICY "carts_public_insert" ON public.carts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cart_items_staff_read" ON public.cart_items;
CREATE POLICY "cart_items_staff_read" ON public.cart_items FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "cart_items_public_insert" ON public.cart_items;
CREATE POLICY "cart_items_public_insert" ON public.cart_items FOR INSERT WITH CHECK (true);

-- orders
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "orders_staff_read" ON public.orders;
CREATE POLICY "orders_staff_read" ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "orders_editor_update" ON public.orders;
CREATE POLICY "orders_editor_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "order_items_public_insert" ON public.order_items;
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "order_items_staff_read" ON public.order_items;
CREATE POLICY "order_items_staff_read" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "order_events_staff" ON public.order_events;
CREATE POLICY "order_events_staff" ON public.order_events FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- audit_log
DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));


-- =========================================================================
-- 10_SEED — linha única em todas as tabelas de configuração
-- =========================================================================
-- Configurações da loja (linha única id=1)
INSERT INTO public.store_settings   (id, name, mode)
  VALUES (1, 'Minha Loja', 'checkout') ON CONFLICT (id) DO NOTHING;

-- Aparência padrão
INSERT INTO public.appearance (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- SEO padrão
INSERT INTO public.seo (id, meta_title, meta_description, robots, og_type, twitter_card)
  VALUES (1, 'Minha Loja', 'Confira nosso catálogo completo.',
          'index,follow', 'website', 'summary_large_image')
  ON CONFLICT (id) DO NOTHING;

-- Barra promocional (desativada por padrão)
INSERT INTO public.promo_bar (id, is_active, text, bg_color, text_color, dismissible)
  VALUES (1, false, 'Frete grátis nas compras acima de R$ 200', '#111111', '#ffffff', true)
  ON CONFLICT (id) DO NOTHING;

-- Pagamentos
INSERT INTO public.payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Tracking / pixels
INSERT INTO public.tracking_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Contato
INSERT INTO public.contact_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- WhatsApp (habilitado, sem número; admin preenche depois)
INSERT INTO public.whatsapp_settings
  (id, is_enabled, default_message, product_message_template,
   cart_message_template, order_message_template,
   floating_button_enabled, floating_button_position, floating_button_label,
   send_order_via_whatsapp)
VALUES (1, true,
  'Olá! Gostaria de mais informações.',
  'Olá! Tenho interesse no produto: {{product_name}} - {{product_url}}',
  'Olá! Este é o meu carrinho: {{cart_summary}}',
  'Olá! Fiz o pedido #{{order_number}}. Detalhes: {{order_summary}}',
  true, 'bottom-right', 'Fale conosco', true)
ON CONFLICT (id) DO NOTHING;

-- Seções padrão da home
INSERT INTO public.sections (type, title, position, is_active, config) VALUES
  ('banner',         NULL,               0, true, '{}'::jsonb),
  ('featured',       'Destaques',        1, true, '{"limit": 8}'::jsonb),
  ('category',       'Categorias',       2, true, '{}'::jsonb),
  ('products_grid',  'Todos os produtos',3, true, '{"limit": 12}'::jsonb),
  ('newsletter',     'Receba novidades', 4, false,'{}'::jsonb)
ON CONFLICT DO NOTHING;

-- PWA / onboarding (linha única id=1)
INSERT INTO public.pwa_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Contador regressivo (linha única id=1, desativado por padrão)
INSERT INTO public.countdown_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- 11_PUBLIC_CART_RPCS — carrinho e checkout WhatsApp para visitantes (anon)
-- =========================================================================
-- Estas funções rodam com SECURITY DEFINER para permitir que o front público
-- (sem login) crie/atualize carrinhos identificados por session_id e converta
-- o carrinho em um pedido enviado via WhatsApp.

CREATE OR REPLACE FUNCTION public.get_public_cart(p_session_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cart public.carts%ROWTYPE;
  v_items jsonb;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;

  SELECT * INTO v_cart FROM public.carts
    WHERE session_id = p_session_id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.carts (session_id, status) VALUES (p_session_id, 'open')
    RETURNING * INTO v_cart;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(item_row)::jsonb ORDER BY item_row.created_at), '[]'::jsonb)
  INTO v_items
  FROM (
    SELECT ci.id, ci.product_id, ci.variant_id, ci.qty, ci.unit_price_cents, ci.created_at,
           jsonb_build_object(
             'id', p.id, 'name', p.name, 'slug', p.slug,
             'cover_image_url', p.cover_image_url,
             'price_cents', p.price_cents, 'stock', p.stock
           ) AS products
    FROM public.cart_items ci
    LEFT JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart.id
    ORDER BY ci.created_at ASC
  ) AS item_row;

  RETURN jsonb_build_object('cart', to_jsonb(v_cart), 'items', COALESCE(v_items, '[]'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.add_public_cart_item(p_session_id text, p_product_id uuid, p_qty integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cart_id uuid;
  v_product record;
  v_qty int := GREATEST(1, COALESCE(p_qty, 1));
  v_existing record;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;

  SELECT id, price_cents, is_active INTO v_product
    FROM public.products WHERE id = p_product_id LIMIT 1;
  IF v_product.id IS NULL OR v_product.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Produto indisponível';
  END IF;

  SELECT id INTO v_cart_id FROM public.carts
    WHERE session_id = p_session_id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;
  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (session_id, status) VALUES (p_session_id, 'open')
    RETURNING id INTO v_cart_id;
  END IF;

  SELECT id, qty INTO v_existing FROM public.cart_items
    WHERE cart_id = v_cart_id AND product_id = p_product_id AND variant_id IS NULL LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.cart_items
      SET qty = v_existing.qty + v_qty, unit_price_cents = v_product.price_cents, updated_at = now()
      WHERE id = v_existing.id;
  ELSE
    INSERT INTO public.cart_items (cart_id, product_id, qty, unit_price_cents)
      VALUES (v_cart_id, p_product_id, v_qty, v_product.price_cents);
  END IF;

  RETURN public.get_public_cart(p_session_id);
END; $$;

CREATE OR REPLACE FUNCTION public.update_public_cart_item(p_session_id text, p_item_id uuid, p_qty integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cart_id uuid;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;
  SELECT id INTO v_cart_id FROM public.carts
    WHERE session_id = p_session_id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;
  IF v_cart_id IS NULL THEN RETURN public.get_public_cart(p_session_id); END IF;

  IF COALESCE(p_qty, 0) <= 0 THEN
    DELETE FROM public.cart_items WHERE id = p_item_id AND cart_id = v_cart_id;
  ELSE
    UPDATE public.cart_items SET qty = p_qty, updated_at = now()
      WHERE id = p_item_id AND cart_id = v_cart_id;
  END IF;
  RETURN public.get_public_cart(p_session_id);
END; $$;

CREATE OR REPLACE FUNCTION public.remove_public_cart_item(p_session_id text, p_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cart_id uuid;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;
  SELECT id INTO v_cart_id FROM public.carts
    WHERE session_id = p_session_id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;
  IF v_cart_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE id = p_item_id AND cart_id = v_cart_id;
  END IF;
  RETURN public.get_public_cart(p_session_id);
END; $$;

CREATE OR REPLACE FUNCTION public.checkout_public_whatsapp_cart(p_session_id text, p_customer jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text := trim(coalesce(p_customer->>'name', ''));
  v_phone text := trim(coalesce(p_customer->>'phone', ''));
  v_email text := nullif(trim(coalesce(p_customer->>'email', '')), '');
  v_city text := nullif(trim(coalesce(p_customer->>'city', '')), '');
  v_notes text := nullif(trim(coalesce(p_customer->>'notes', '')), '');
  v_customer_id uuid;
  v_cart_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_items jsonb;
  v_subtotal int;
  v_wa public.whatsapp_settings%ROWTYPE;
  v_summary text;
  v_template text;
  v_msg text;
  v_phone_wa text;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;
  IF v_name = '' OR v_phone = '' THEN
    RAISE EXCEPTION 'Nome e telefone são obrigatórios';
  END IF;

  SELECT id INTO v_cart_id FROM public.carts
    WHERE session_id = p_session_id AND status = 'open'
    ORDER BY created_at DESC LIMIT 1;
  IF v_cart_id IS NULL THEN RAISE EXCEPTION 'Carrinho vazio'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'product_id', ci.product_id, 'variant_id', ci.variant_id,
           'name', COALESCE(p.name, 'Produto'),
           'qty', ci.qty, 'unit_price_cents', ci.unit_price_cents
         ) ORDER BY ci.created_at), '[]'::jsonb),
         COALESCE(SUM(ci.qty * ci.unit_price_cents), 0)::int
  INTO v_items, v_subtotal
  FROM public.cart_items ci
  LEFT JOIN public.products p ON p.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  IF v_items = '[]'::jsonb OR v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;

  SELECT id INTO v_customer_id FROM public.customers
    WHERE phone = v_phone ORDER BY created_at DESC LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, email, address)
      VALUES (v_name, v_phone, v_email,
              CASE WHEN v_city IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('city', v_city) END)
      RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
      SET name = v_name, email = v_email,
          address = CASE WHEN v_city IS NULL THEN address ELSE jsonb_build_object('city', v_city) END,
          updated_at = now()
      WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.orders (customer_id, status, subtotal_cents, total_cents, channel, notes)
    VALUES (v_customer_id, 'pending', v_subtotal, v_subtotal, 'whatsapp', v_notes)
    RETURNING id, number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (order_id, product_id, variant_id, name_snapshot, qty, unit_price_cents)
  SELECT v_order_id,
         (item->>'product_id')::uuid,
         NULLIF(item->>'variant_id', '')::uuid,
         item->>'name',
         (item->>'qty')::int,
         (item->>'unit_price_cents')::int
  FROM jsonb_array_elements(v_items) AS item;

  UPDATE public.carts SET status = 'converted', updated_at = now() WHERE id = v_cart_id;

  INSERT INTO public.order_events (order_id, event, payload)
    VALUES (v_order_id, 'created', jsonb_build_object('channel', 'whatsapp'));

  SELECT * INTO v_wa FROM public.whatsapp_settings WHERE id = 1;

  SELECT string_agg(
    format('• %s (x%s) — R$ %s',
      item->>'name', item->>'qty',
      replace(to_char(((item->>'qty')::int * (item->>'unit_price_cents')::int) / 100.0, 'FM999999990.00'), '.', ',')
    ), E'\n'
  ) INTO v_summary
  FROM jsonb_array_elements(v_items) AS item;

  v_template := COALESCE(v_wa.order_message_template,
    'Olá! Fiz o pedido #{{order_number}}.' || E'\n' || '{{order_summary}}' || E'\n' ||
    'Total: {{total}}' || E'\n' || 'Cliente: {{customer_name}} — {{customer_phone}}');

  v_msg := replace(v_template, '{{order_number}}', v_order_number);
  v_msg := replace(v_msg, '{{order_summary}}', COALESCE(v_summary, ''));
  v_msg := replace(v_msg, '{{total}}', 'R$ ' || replace(to_char(v_subtotal / 100.0, 'FM999999990.00'), '.', ','));
  v_msg := replace(v_msg, '{{customer_name}}', v_name);
  v_msg := replace(v_msg, '{{customer_phone}}', v_phone);

  UPDATE public.orders SET whatsapp_message = v_msg, updated_at = now() WHERE id = v_order_id;

  v_phone_wa := regexp_replace(COALESCE(v_wa.phone_number, ''), '\D', '', 'g');

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'number', v_order_number,
    'message', v_msg,
    'whatsappUrl', CASE WHEN v_phone_wa <> ''
      THEN 'https://wa.me/' || v_phone_wa || '?text=' || replace(replace(v_msg, E'\n', '%0A'), ' ', '%20')
      ELSE NULL END
  );
END; $$;

-- Grants para o front público
GRANT EXECUTE ON FUNCTION public.get_public_cart(text)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_public_cart_item(text, uuid, integer)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_public_cart_item(text, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_public_cart_item(text, uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_public_whatsapp_cart(text, jsonb)   TO anon, authenticated;


-- =========================================================================
-- FIM DO SCHEMA
-- =========================================================================

