-- Fix PostgREST ambiguity: drop legacy 2-arg overload so only (uuid, text, text) remains.
-- Error: "Could not choose the best candidate function between purchase_data_package(uuid,text) and purchase_data_package(uuid,text,text)"

DROP FUNCTION IF EXISTS public.purchase_data_package(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.purchase_data_package(
  p_package_id UUID,
  p_recipient_phone TEXT,
  p_promo_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_pkg public.data_packages%ROWTYPE;
  v_price NUMERIC;
  v_discount NUMERIC := 0;
  v_final_price NUMERIC;
  v_promo_id UUID;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
  v_maint BOOLEAN;
  v_sub_id UUID;
  v_role TEXT := 'user';
BEGIN
  SELECT maintenance_mode INTO v_maint FROM public.platform_settings WHERE id = 1;
  IF v_maint THEN RAISE EXCEPTION 'Platform is under maintenance. Try again later.'; END IF;
  IF NOT (SELECT purchases_enabled FROM public.platform_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'Purchases are temporarily disabled';
  END IF;

  v_user_id := public.ensure_user_profile();

  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT * INTO v_pkg FROM public.data_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found or inactive'; END IF;

  v_price := public.resolve_buy_price(v_user_id, p_package_id);

  IF public.is_subagent(v_user_id) THEN
    v_role := 'sub_agent';
    SELECT id INTO v_sub_id FROM public.sub_agents WHERE user_id = v_user_id AND status = 'active';
  ELSIF EXISTS(SELECT 1 FROM public.stores WHERE user_id = v_user_id AND active = true) THEN
    v_role := 'agent';
  END IF;

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    SELECT pc.id,
      CASE pc.discount_type
        WHEN 'percent' THEN round(v_price * pc.discount_value / 100, 2)
        WHEN 'fixed' THEN pc.discount_value
      END
    INTO v_promo_id, v_discount
    FROM public.promo_codes pc
    WHERE upper(pc.code) = upper(trim(p_promo_code))
      AND pc.active = true
      AND (pc.expires_at IS NULL OR pc.expires_at > now())
      AND (pc.max_uses IS NULL OR pc.uses_count < pc.max_uses)
      AND (pc.network IS NULL OR pc.network = v_pkg.network)
      AND pc.min_order_amount <= v_price;

    IF v_promo_id IS NULL THEN RAISE EXCEPTION 'Invalid or expired promo code'; END IF;
    v_discount := LEAST(v_discount, v_price);
  END IF;

  v_final_price := v_price - v_discount;

  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_bal < v_final_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  v_new_bal := v_bal - v_final_price;
  UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = v_user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    v_user_id,
    'purchase'::public.tx_type,
    -v_final_price,
    v_new_bal,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone)
      || CASE WHEN v_discount > 0 THEN ' (promo -₵' || v_discount || ')' ELSE '' END,
    'success'::public.tx_status
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status, sub_agent_id, buyer_role
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_final_price, trim(p_recipient_phone),
    'processing', v_sub_id, v_role
  ) RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE public.promo_codes SET uses_count = uses_count + 1 WHERE id = v_promo_id;
    INSERT INTO public.promo_redemptions (promo_code_id, user_id, order_id, discount_amount)
    VALUES (v_promo_id, v_user_id, v_order_id, v_discount);
  END IF;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_data_package(UUID, TEXT, TEXT) TO authenticated;
