-- Admin platform features: promos, banners, sub-agents, SMS, audit, settings

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchases_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS spin_wheel_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS referrals_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sub_agent_activation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

ALTER TABLE public.data_packages
  ADD COLUMN IF NOT EXISTS provider_cost NUMERIC(10,2);

UPDATE public.data_packages
SET provider_cost = agent_price * 0.88
WHERE provider_cost IS NULL;

-- Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  network public.network_type,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT,
  link_url TEXT,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'users', 'agents')),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sub-agents under parent stores
CREATE TABLE IF NOT EXISTS public.sub_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  activation_fee_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_agents_parent ON public.sub_agents(parent_store_id);
CREATE INDEX IF NOT EXISTS idx_sub_agents_status ON public.sub_agents(status);

-- SMS templates
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit trail
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- Promo code redemptions
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.data_orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed SMS templates
INSERT INTO public.sms_templates (slug, name, body) VALUES
  ('order_processing', 'Order Processing', 'Hi {{name}}, your {{size_gb}}GB {{network}} order to {{phone}} is being processed. — ByteBoss'),
  ('order_completed', 'Order Completed', 'Hi {{name}}, your {{size_gb}}GB {{network}} data has been delivered to {{phone}}. — ByteBoss'),
  ('order_failed', 'Order Failed', 'Hi {{name}}, your data order could not be completed. Contact support if you were charged. — ByteBoss'),
  ('wallet_topup', 'Wallet Top-up', 'Hi {{name}}, your wallet was credited with GHS {{amount}}. New balance: GHS {{balance}}. — ByteBoss')
ON CONFLICT (slug) DO NOTHING;

-- Internal audit helper
CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, entity_type, entity_id, meta)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_meta)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Admin wallet adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Admin adjustment'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_bal NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Amount cannot be zero'; END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_bal;

  IF v_new_bal IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_new_bal < 0 THEN RAISE EXCEPTION 'Balance cannot be negative'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (p_user_id, CASE WHEN p_amount > 0 THEN 'topup' ELSE 'purchase' END, p_amount, v_new_bal, p_description, 'success');

  PERFORM public.admin_log_action('wallet_adjust', 'profile', p_user_id::text, jsonb_build_object('amount', p_amount));
  RETURN v_new_bal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(UUID, NUMERIC, TEXT) TO authenticated;

-- Admin points adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_points(
  p_user_id UUID,
  p_amount INT,
  p_description TEXT DEFAULT 'Admin adjustment'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Amount cannot be zero'; END IF;

  v_new := public._credit_points(p_user_id, p_amount, 'admin', p_description, jsonb_build_object('admin_id', auth.uid()));
  PERFORM public.admin_log_action('points_adjust', 'profile', p_user_id::text, jsonb_build_object('amount', p_amount));
  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_points(UUID, INT, TEXT) TO authenticated;

-- Sub-agent status update
CREATE OR REPLACE FUNCTION public.admin_update_sub_agent(
  p_sub_agent_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_status NOT IN ('pending', 'active', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.sub_agents
  SET status = p_status, notes = COALESCE(p_notes, notes), updated_at = now()
  WHERE id = p_sub_agent_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sub-agent not found'; END IF;

  PERFORM public.admin_log_action('sub_agent_update', 'sub_agent', p_sub_agent_id::text, jsonb_build_object('status', p_status));
  RETURN p_sub_agent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_sub_agent(UUID, TEXT, TEXT) TO authenticated;

-- Apply as sub-agent (user)
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
    RAISE EXCEPTION 'Agents cannot become sub-agents';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sub_agents WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You already applied as a sub-agent';
  END IF;

  SELECT id INTO v_store_id FROM public.stores WHERE slug = trim(p_parent_store_slug) AND active = true;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'Parent store not found'; END IF;

  SELECT sub_agent_activation_fee INTO v_fee FROM public.platform_settings WHERE id = 1;

  IF v_fee > 0 THEN
    SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_bal < v_fee THEN RAISE EXCEPTION 'Insufficient wallet balance for activation fee'; END IF;
    UPDATE public.profiles SET wallet_balance = wallet_balance - v_fee WHERE id = v_user_id;
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (v_user_id, 'purchase', -v_fee, v_bal - v_fee, 'Sub-agent activation fee', 'success');
  END IF;

  INSERT INTO public.sub_agents (parent_store_id, user_id, status, activation_fee_paid)
  VALUES (v_store_id, v_user_id, 'pending', COALESCE(v_fee, 0))
  RETURNING id INTO v_sub_id;

  RETURN v_sub_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_sub_agent(TEXT) TO authenticated;

-- Sentinel alerts (computed)
CREATE OR REPLACE FUNCTION public.get_sentinel_alerts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerts JSONB := '[]'::jsonb;
  v_failed_24h INT;
  v_stuck INT;
  v_dup INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT count(*)::INT INTO v_failed_24h
  FROM public.data_orders
  WHERE status = 'failed' AND created_at > now() - interval '24 hours';

  IF v_failed_24h >= 5 THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'severity', 'high', 'title', 'High failure rate',
      'description', v_failed_24h || ' failed orders in the last 24 hours'
    ));
  END IF;

  SELECT count(*)::INT INTO v_stuck
  FROM public.data_orders
  WHERE status = 'processing' AND created_at < now() - interval '30 minutes';

  IF v_stuck > 0 THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'severity', 'medium', 'title', 'Stuck orders',
      'description', v_stuck || ' orders processing over 30 minutes'
    ));
  END IF;

  SELECT count(*)::INT INTO v_dup FROM (
    SELECT recipient_phone FROM public.data_orders
    WHERE created_at > now() - interval '1 hour'
    GROUP BY recipient_phone HAVING count(*) >= 5
  ) d;

  IF v_dup > 0 THEN
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'severity', 'medium', 'title', 'Suspicious activity',
      'description', v_dup || ' phone number(s) with 5+ orders in 1 hour'
    ));
  END IF;

  RETURN v_alerts;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sentinel_alerts() TO authenticated;

-- Network health stats
CREATE OR REPLACE FUNCTION public.get_network_health_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_result
  FROM (
    SELECT
      network,
      count(*)::INT AS total_orders,
      count(*) FILTER (WHERE status = 'completed')::INT AS completed,
      count(*) FILTER (WHERE status = 'failed')::INT AS failed,
      count(*) FILTER (WHERE status = 'processing')::INT AS processing,
      round(
        100.0 * count(*) FILTER (WHERE status = 'completed') / NULLIF(count(*), 0), 1
      ) AS success_rate
    FROM public.data_orders
    WHERE created_at > now() - interval '7 days'
    GROUP BY network
    ORDER BY network
  ) t;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_health_stats() TO authenticated;

-- Block purchases during maintenance; optional promo code support
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
  v_is_agent BOOLEAN;
  v_price NUMERIC;
  v_discount NUMERIC := 0;
  v_final_price NUMERIC;
  v_promo_id UUID;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
  v_maint BOOLEAN;
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

  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = v_user_id AND active = true
  ) INTO v_is_agent;

  v_price := CASE WHEN v_is_agent THEN v_pkg.agent_price ELSE v_pkg.user_price END;

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
    v_user_id, 'purchase', -v_final_price, v_new_bal,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone)
      || CASE WHEN v_discount > 0 THEN ' (promo -₵' || v_discount || ')' ELSE '' END,
    'success'
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_final_price, trim(p_recipient_phone), 'processing'
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

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage promo_codes" ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "auth read active promo_codes" ON public.promo_codes FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "public read active banners" ON public.promo_banners FOR SELECT
  USING (
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "admin manage banners" ON public.promo_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own sub_agent" ON public.sub_agents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert sub_agent" ON public.sub_agents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin manage sub_agents" ON public.sub_agents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manage sms_templates" ON public.sms_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manage promo_redemptions" ON public.promo_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own redemptions" ON public.promo_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER sub_agents_updated BEFORE UPDATE ON public.sub_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER sms_templates_updated BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
