CREATE OR REPLACE FUNCTION public.get_public_cart(p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart public.carts%ROWTYPE;
  v_items jsonb;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;

  SELECT * INTO v_cart
  FROM public.carts
  WHERE session_id = p_session_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.carts (session_id, status)
    VALUES (p_session_id, 'open')
    RETURNING * INTO v_cart;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(item_row)::jsonb ORDER BY item_row.created_at), '[]'::jsonb)
  INTO v_items
  FROM (
    SELECT
      ci.id,
      ci.product_id,
      ci.variant_id,
      ci.qty,
      ci.unit_price_cents,
      ci.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'cover_image_url', p.cover_image_url,
        'price_cents', p.price_cents,
        'stock', p.stock
      ) AS products
    FROM public.cart_items ci
    LEFT JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart.id
    ORDER BY ci.created_at ASC
  ) AS item_row;

  RETURN jsonb_build_object(
    'cart', to_jsonb(v_cart),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_public_cart_item(p_session_id text, p_product_id uuid, p_qty int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  FROM public.products
  WHERE id = p_product_id
  LIMIT 1;

  IF v_product.id IS NULL OR v_product.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Produto indisponível';
  END IF;

  SELECT id INTO v_cart_id
  FROM public.carts
  WHERE session_id = p_session_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (session_id, status)
    VALUES (p_session_id, 'open')
    RETURNING id INTO v_cart_id;
  END IF;

  SELECT id, qty INTO v_existing
  FROM public.cart_items
  WHERE cart_id = v_cart_id
    AND product_id = p_product_id
    AND variant_id IS NULL
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.cart_items
    SET qty = v_existing.qty + v_qty,
        unit_price_cents = v_product.price_cents,
        updated_at = now()
    WHERE id = v_existing.id;
  ELSE
    INSERT INTO public.cart_items (cart_id, product_id, qty, unit_price_cents)
    VALUES (v_cart_id, p_product_id, v_qty, v_product.price_cents);
  END IF;

  RETURN public.get_public_cart(p_session_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_public_cart_item(p_session_id text, p_item_id uuid, p_qty int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;

  SELECT id INTO v_cart_id
  FROM public.carts
  WHERE session_id = p_session_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RETURN public.get_public_cart(p_session_id);
  END IF;

  IF COALESCE(p_qty, 0) <= 0 THEN
    DELETE FROM public.cart_items
    WHERE id = p_item_id
      AND cart_id = v_cart_id;
  ELSE
    UPDATE public.cart_items
    SET qty = p_qty,
        updated_at = now()
    WHERE id = p_item_id
      AND cart_id = v_cart_id;
  END IF;

  RETURN public.get_public_cart(p_session_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_public_cart_item(p_session_id text, p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 16 THEN
    RAISE EXCEPTION 'Sessão do carrinho inválida';
  END IF;

  SELECT id INTO v_cart_id
  FROM public.carts
  WHERE session_id = p_session_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cart_id IS NOT NULL THEN
    DELETE FROM public.cart_items
    WHERE id = p_item_id
      AND cart_id = v_cart_id;
  END IF;

  RETURN public.get_public_cart(p_session_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_cart(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_public_cart_item(text, uuid, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_public_cart_item(text, uuid, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_public_cart_item(text, uuid) TO anon, authenticated, service_role;