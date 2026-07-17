CREATE OR REPLACE FUNCTION public.checkout_public_whatsapp_cart(
  p_session_id text,
  p_customer jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  SELECT id INTO v_cart_id
  FROM public.carts
  WHERE session_id = p_session_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'product_id', ci.product_id,
           'variant_id', ci.variant_id,
           'name', COALESCE(p.name, 'Produto'),
           'qty', ci.qty,
           'unit_price_cents', ci.unit_price_cents
         ) ORDER BY ci.created_at), '[]'::jsonb),
         COALESCE(SUM(ci.qty * ci.unit_price_cents), 0)::int
  INTO v_items, v_subtotal
  FROM public.cart_items ci
  LEFT JOIN public.products p ON p.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  IF v_items = '[]'::jsonb OR v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = v_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, email, address)
    VALUES (v_name, v_phone, v_email, CASE WHEN v_city IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('city', v_city) END)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET name = v_name,
        email = v_email,
        address = CASE WHEN v_city IS NULL THEN address ELSE jsonb_build_object('city', v_city) END,
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.orders (customer_id, status, subtotal_cents, total_cents, channel, notes)
  VALUES (v_customer_id, 'pending', v_subtotal, v_subtotal, 'whatsapp', v_notes)
  RETURNING id, number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (order_id, product_id, variant_id, name_snapshot, qty, unit_price_cents)
  SELECT
    v_order_id,
    (item->>'product_id')::uuid,
    NULLIF(item->>'variant_id', '')::uuid,
    item->>'name',
    (item->>'qty')::int,
    (item->>'unit_price_cents')::int
  FROM jsonb_array_elements(v_items) AS item;

  UPDATE public.carts
  SET status = 'converted', updated_at = now()
  WHERE id = v_cart_id;

  INSERT INTO public.order_events (order_id, event, payload)
  VALUES (v_order_id, 'created', jsonb_build_object('channel', 'whatsapp'));

  SELECT * INTO v_wa FROM public.whatsapp_settings WHERE id = 1;

  SELECT string_agg(
    format('• %s (x%s) — R$ %s',
      item->>'name',
      item->>'qty',
      replace(to_char(((item->>'qty')::int * (item->>'unit_price_cents')::int) / 100.0, 'FM999999990.00'), '.', ',')
    ), E'\n'
  )
  INTO v_summary
  FROM jsonb_array_elements(v_items) AS item;

  v_template := COALESCE(
    v_wa.order_message_template,
    'Olá! Fiz o pedido #{{order_number}}.' || E'\n' || '{{order_summary}}' || E'\n' || 'Total: {{total}}' || E'\n' || 'Cliente: {{customer_name}} — {{customer_phone}}'
  );

  v_msg := replace(v_template, '{{order_number}}', v_order_number);
  v_msg := replace(v_msg, '{{order_summary}}', COALESCE(v_summary, ''));
  v_msg := replace(v_msg, '{{total}}', 'R$ ' || replace(to_char(v_subtotal / 100.0, 'FM999999990.00'), '.', ','));
  v_msg := replace(v_msg, '{{customer_name}}', v_name);
  v_msg := replace(v_msg, '{{customer_phone}}', v_phone);

  UPDATE public.orders
  SET whatsapp_message = v_msg,
      updated_at = now()
  WHERE id = v_order_id;

  v_phone_wa := regexp_replace(COALESCE(v_wa.phone_number, ''), '\D', '', 'g');

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'number', v_order_number,
    'message', v_msg,
    'whatsappUrl', CASE WHEN v_phone_wa <> '' THEN 'https://wa.me/' || v_phone_wa || '?text=' || replace(replace(v_msg, E'\n', '%0A'), ' ', '%20') ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_public_whatsapp_cart(text, jsonb) TO anon, authenticated, service_role;