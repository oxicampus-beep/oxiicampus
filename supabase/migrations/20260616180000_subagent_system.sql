-- Full sub-agent system: pricing, stores, orders, dashboard roles

-- Parent agents set wholesale prices for their sub-agents (floor = platform agent_price)
CREATE TABLE IF NOT EXISTS public.agent_subagent_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_package_id UUID NOT NULL REFERENCES public.data_packages(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_agent_id, data_package_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_subagent_prices_parent ON public.agent_subagent_prices(parent_agent_id);

ALTER TABLE public.data_orders
  ADD COLUMN IF NOT EXISTS sub_agent_id UUID REFERENCES public.sub_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_role TEXT NOT NULL DEFAULT 'user'
    CHECK (buyer_role IN ('user', 'agent', 'sub_agent'));

-- Role helpers
CREATE OR REPLACE FUNCTION public.is_subagent(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.sub_agents
    WHERE user_id = _user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_parent_agent(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = _user_id AND active = true
  )
  AND NOT public.is_subagent(_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_subagent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_agent(UUID) TO authenticated;

-- Resolve wallet buy price for a user + catalog package
CREATE OR REPLACE FUNCTION public.resolve_buy_price(
  p_user_id UUID,
  p_package_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.data_packages%ROWTYPE;
  v_custom NUMERIC;
  v_parent UUID;
BEGIN
  SELECT * INTO v_pkg FROM public.data_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF public.is_subagent(p_user_id) THEN
    SELECT s.user_id INTO v_parent
    FROM public.sub_agents sa
    JOIN public.stores s ON s.id = sa.parent_store_id
    WHERE sa.user_id = p_user_id AND sa.status = 'active';

    IF v_parent IS NOT NULL THEN
      SELECT asp.price INTO v_custom
      FROM public.agent_subagent_prices asp
      WHERE asp.parent_agent_id = v_parent AND asp.data_package_id = p_package_id;
    END IF;

    RETURN COALESCE(v_custom, v_pkg.agent_price);
  END IF;

  IF EXISTS(SELECT 1 FROM public.stores WHERE user_id = p_user_id AND active = true) THEN
    RETURN v_pkg.agent_price;
  END IF;

  RETURN v_pkg.user_price;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_buy_price(UUID, UUID) TO authenticated;

-- Sub-agents read prices set for them
CREATE OR REPLACE FUNCTION public.get_my_subagent_prices()
RETURNS TABLE (
  data_package_id UUID,
  network public.network_type,
  size_gb NUMERIC,
  agent_base_price NUMERIC,
  subagent_price NUMERIC,
  validity TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.id AS data_package_id,
    dp.network,
    dp.size_gb,
    dp.agent_price AS agent_base_price,
    public.resolve_buy_price(auth.uid(), dp.id) AS subagent_price,
    dp.validity
  FROM public.data_packages dp
  WHERE dp.active = true
    AND public.is_subagent(auth.uid())
  ORDER BY dp.network, dp.size_gb;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_subagent_prices() TO authenticated;

-- Parent agent upsert sub-agent pricing
CREATE OR REPLACE FUNCTION public.set_subagent_price(
  p_data_package_id UUID,
  p_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID := auth.uid();
  v_floor NUMERIC;
  v_id UUID;
BEGIN
  IF NOT public.is_parent_agent(v_agent_id) THEN
    RAISE EXCEPTION 'Only parent agents can set sub-agent prices';
  END IF;

  SELECT agent_price INTO v_floor
  FROM public.data_packages
  WHERE id = p_data_package_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found'; END IF;
  IF p_price < v_floor THEN
    RAISE EXCEPTION 'Sub-agent price must be at least ₵% (your agent base)', v_floor;
  END IF;

  INSERT INTO public.agent_subagent_prices (parent_agent_id, data_package_id, price)
  VALUES (v_agent_id, p_data_package_id, p_price)
  ON CONFLICT (parent_agent_id, data_package_id)
  DO UPDATE SET price = EXCLUDED.price, updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_subagent_price(UUID, NUMERIC) TO authenticated;

-- Apply as sub-agent (from parent store)
CREATE OR REPLACE FUNCTION public.apply_sub_agent(p_parent_store_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_fee NUMERIC;
  v_bal NUMERIC;
  v_sub_id UUID;
BEGIN
  v_user_id := public.ensure_user_profile();

  IF EXISTS (SELECT 1 FROM public.stores WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Store owners cannot become sub-agents';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sub_agents WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You already have a sub-agent application';
  END IF;

  SELECT id INTO v_store_id
  FROM public.stores
  WHERE slug = trim(p_parent_store_slug) AND active = true;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'Parent store not found'; END IF;

  SELECT sub_agent_activation_fee INTO v_fee FROM public.platform_settings WHERE id = 1;

  IF v_fee > 0 THEN
    SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_bal < v_fee THEN RAISE EXCEPTION 'Insufficient wallet balance for activation fee'; END IF;
    UPDATE public.profiles SET wallet_balance = wallet_balance - v_fee WHERE id = v_user_id;
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (
      v_user_id,
      'purchase'::public.tx_type,
      -v_fee,
      v_bal - v_fee,
      'Sub-agent activation fee',
      'success'::public.tx_status
    );
  END IF;

  INSERT INTO public.sub_agents (parent_store_id, user_id, status, activation_fee_paid)
  VALUES (v_store_id, v_user_id, 'pending', COALESCE(v_fee, 0))
  RETURNING id INTO v_sub_id;

  RETURN v_sub_id;
END;
$$;

-- Create store: active sub-agents may create (activation fee waived)
CREATE OR REPLACE FUNCTION public.create_store(
  p_name TEXT,
  p_whatsapp TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_settings public.platform_settings%ROWTYPE;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_store_id UUID;
  v_is_sub BOOLEAN;
BEGIN
  v_user_id := public.ensure_user_profile();
  v_is_sub := public.is_subagent(v_user_id);

  IF EXISTS(SELECT 1 FROM public.sub_agents WHERE user_id = v_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Your sub-agent application is pending approval';
  END IF;

  IF NOT v_is_sub AND EXISTS(SELECT 1 FROM public.sub_agents WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Sub-agents use a separate store setup flow';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN RAISE EXCEPTION 'Store name required'; END IF;
  IF p_whatsapp IS NULL OR trim(p_whatsapp) = '' THEN RAISE EXCEPTION 'WhatsApp number required'; END IF;
  IF p_slug IS NULL OR trim(p_slug) = '' THEN RAISE EXCEPTION 'Store slug required'; END IF;

  IF EXISTS(SELECT 1 FROM public.stores WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You already have a store';
  END IF;

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;

  IF NOT v_is_sub AND v_settings.store_activation_enabled AND v_settings.store_activation_fee > 0 THEN
    SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF v_bal < v_settings.store_activation_fee THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Top up ₵% to activate your store.', v_settings.store_activation_fee;
    END IF;

    v_new_bal := v_bal - v_settings.store_activation_fee;
    UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = v_user_id;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (
      v_user_id,
      'purchase'::public.tx_type,
      -v_settings.store_activation_fee,
      v_new_bal,
      'Store activation fee',
      'success'::public.tx_status
    );
  END IF;

  INSERT INTO public.stores (user_id, name, whatsapp, slug)
  VALUES (v_user_id, trim(p_name), trim(p_whatsapp), trim(p_slug))
  RETURNING id INTO v_store_id;

  RETURN v_store_id;
END;
$$;

-- Purchase with sub-agent pricing + order tagging
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

-- API purchases use same pricing
CREATE OR REPLACE FUNCTION public.api_purchase_data_package(
  p_user_id UUID,
  p_package_id UUID,
  p_recipient_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.data_packages%ROWTYPE;
  v_price NUMERIC;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
  v_sub_id UUID;
  v_role TEXT := 'user';
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User id required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT * INTO v_pkg FROM public.data_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found or inactive'; END IF;

  v_price := public.resolve_buy_price(p_user_id, p_package_id);

  IF public.is_subagent(p_user_id) THEN
    v_role := 'sub_agent';
    SELECT id INTO v_sub_id FROM public.sub_agents WHERE user_id = p_user_id AND status = 'active';
  ELSIF EXISTS(SELECT 1 FROM public.stores WHERE user_id = p_user_id AND active = true) THEN
    v_role := 'agent';
  END IF;

  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_bal < v_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  v_new_bal := v_bal - v_price;
  UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    p_user_id,
    'purchase'::public.tx_type,
    -v_price,
    v_new_bal,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone),
    'success'::public.tx_status
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status, sub_agent_id, buyer_role
  ) VALUES (
    p_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_price, trim(p_recipient_phone),
    'processing', v_sub_id, v_role
  ) RETURNING id INTO v_order_id;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

-- Admin overview of sub-agents with stores and stats
CREATE OR REPLACE FUNCTION public.get_admin_subagents()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb)
    FROM (
      SELECT
        sa.id,
        sa.status,
        sa.created_at,
        sa.activation_fee_paid,
        sa.notes,
        p.full_name AS user_name,
        p.email AS user_email,
        p.phone AS user_phone,
        p.wallet_balance,
        ps.name AS parent_store_name,
        ps.slug AS parent_store_slug,
        pp.full_name AS parent_agent_name,
        ss.name AS sub_store_name,
        ss.slug AS sub_store_slug,
        (SELECT count(*)::INT FROM public.data_orders o WHERE o.user_id = sa.user_id) AS order_count,
        (SELECT coalesce(sum(o.price), 0)::NUMERIC FROM public.data_orders o WHERE o.user_id = sa.user_id) AS order_revenue
      FROM public.sub_agents sa
      JOIN public.profiles p ON p.id = sa.user_id
      JOIN public.stores ps ON ps.id = sa.parent_store_id
      JOIN public.profiles pp ON pp.id = ps.user_id
      LEFT JOIN public.stores ss ON ss.user_id = sa.user_id
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_subagents() TO authenticated;

-- RLS
ALTER TABLE public.agent_subagent_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent manage subagent prices" ON public.agent_subagent_prices
  FOR ALL TO authenticated
  USING (parent_agent_id = auth.uid())
  WITH CHECK (parent_agent_id = auth.uid());

CREATE POLICY "subagent read own prices" ON public.agent_subagent_prices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_agents sa
      JOIN public.stores s ON s.id = sa.parent_store_id
      WHERE sa.user_id = auth.uid() AND sa.status = 'active'
        AND s.user_id = agent_subagent_prices.parent_agent_id
    )
  );

CREATE POLICY "admin manage subagent prices" ON public.agent_subagent_prices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER agent_subagent_prices_updated
  BEFORE UPDATE ON public.agent_subagent_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Parent agents can view sub-agents under their store
DROP POLICY IF EXISTS "parent view store sub_agents" ON public.sub_agents;
CREATE POLICY "parent view store sub_agents" ON public.sub_agents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = parent_store_id AND s.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_parent_subagents()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM public.stores WHERE user_id = auth.uid() AND active = true;
  IF v_store_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb)
    FROM (
      SELECT
        sa.id,
        sa.status,
        sa.created_at,
        sa.activation_fee_paid,
        p.full_name,
        p.email,
        p.phone,
        ss.name AS store_name,
        ss.slug AS store_slug,
        (SELECT count(*)::INT FROM public.data_orders o WHERE o.user_id = sa.user_id) AS order_count
      FROM public.sub_agents sa
      JOIN public.profiles p ON p.id = sa.user_id
      LEFT JOIN public.stores ss ON ss.user_id = sa.user_id
      WHERE sa.parent_store_id = v_store_id
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_parent_subagents() TO authenticated;
