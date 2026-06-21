-- Paystack payment integration: track payments and fulfill orders after verification

CREATE TABLE IF NOT EXISTS public.paystack_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paystack_access_code TEXT,
  result_id UUID,
  result_type TEXT,
  paystack_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS paystack_payments_user_idx ON public.paystack_payments (user_id);
CREATE INDEX IF NOT EXISTS paystack_payments_status_idx ON public.paystack_payments (status);

GRANT SELECT ON public.paystack_payments TO authenticated;
GRANT ALL ON public.paystack_payments TO service_role;

ALTER TABLE public.paystack_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own paystack payments" ON public.paystack_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Quote expected Paystack amount (GHS) for a purpose + metadata
CREATE OR REPLACE FUNCTION public.quote_paystack_amount(
  p_purpose TEXT,
  p_metadata JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
  v_pkg public.data_packages%ROWTYPE;
  v_sp public.store_packages%ROWTYPE;
  v_prod public.result_checker_products%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_price NUMERIC;
  v_discount NUMERIC := 0;
  v_promo_id UUID;
  v_count INT;
  v_phone TEXT;
  v_is_agent BOOLEAN;
  v_unit NUMERIC;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL AND p_purpose NOT IN ('store_order') THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  CASE p_purpose
    WHEN 'wallet_topup' THEN
      v_amount := (p_metadata->>'amount')::NUMERIC;
      IF v_amount IS NULL OR v_amount < 1 THEN RAISE EXCEPTION 'Minimum top-up is ₵1'; END IF;
      IF v_amount > 10000 THEN RAISE EXCEPTION 'Maximum top-up is ₵10,000'; END IF;
      RETURN round(v_amount, 2);

    WHEN 'data_purchase' THEN
      SELECT * INTO v_pkg FROM public.data_packages
      WHERE id = (p_metadata->>'package_id')::UUID AND active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'Package not found'; END IF;
      v_price := public.resolve_buy_price(v_user_id, v_pkg.id);

      IF p_metadata ? 'promo_code' AND length(trim(p_metadata->>'promo_code')) > 0 THEN
        SELECT pc.id,
          CASE pc.discount_type
            WHEN 'percent' THEN round(v_price * pc.discount_value / 100, 2)
            WHEN 'fixed' THEN pc.discount_value
          END
        INTO v_promo_id, v_discount
        FROM public.promo_codes pc
        WHERE upper(pc.code) = upper(trim(p_metadata->>'promo_code'))
          AND pc.active = true
          AND (pc.expires_at IS NULL OR pc.expires_at > now())
          AND (pc.max_uses IS NULL OR pc.uses_count < pc.max_uses)
          AND (pc.network IS NULL OR pc.network = v_pkg.network)
          AND pc.min_order_amount <= v_price;
        IF v_promo_id IS NULL THEN RAISE EXCEPTION 'Invalid or expired promo code'; END IF;
        v_discount := LEAST(v_discount, v_price);
      END IF;
      RETURN round(v_price - v_discount, 2);

    WHEN 'store_order' THEN
      SELECT sp.* INTO v_sp FROM public.store_packages sp
      JOIN public.stores s ON s.user_id = sp.user_id AND s.active = true
      WHERE sp.id = (p_metadata->>'store_package_id')::UUID AND sp.active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'Store package not found'; END IF;
      IF (p_metadata->>'store_owner_id')::UUID IS DISTINCT FROM v_sp.user_id THEN
        RAISE EXCEPTION 'Invalid store package';
      END IF;
      RETURN round(v_sp.price, 2);

    WHEN 'store_activation' THEN
      SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;
      IF public.is_subagent(v_user_id) THEN RETURN 0; END IF;
      IF NOT v_settings.store_activation_enabled OR v_settings.store_activation_fee <= 0 THEN RETURN 0; END IF;
      RETURN round(v_settings.store_activation_fee, 2);

    WHEN 'sub_agent_activation' THEN
      SELECT sub_agent_activation_fee INTO v_amount FROM public.platform_settings WHERE id = 1;
      RETURN round(COALESCE(v_amount, 0), 2);

    WHEN 'airtime' THEN
      v_amount := (p_metadata->>'amount')::NUMERIC;
      IF v_amount IS NULL OR v_amount < 1 OR v_amount > 500 THEN
        RAISE EXCEPTION 'Airtime amount must be between ₵1 and ₵500';
      END IF;
      RETURN round(v_amount, 2);

    WHEN 'utility' THEN
      v_amount := (p_metadata->>'amount')::NUMERIC;
      IF v_amount IS NULL OR v_amount < 5 OR v_amount > 2000 THEN
        RAISE EXCEPTION 'Utility amount must be between ₵5 and ₵2,000';
      END IF;
      RETURN round(v_amount, 2);

    WHEN 'result_checker' THEN
      SELECT * INTO v_prod FROM public.result_checker_products
      WHERE id = (p_metadata->>'product_id')::UUID AND active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
      SELECT EXISTS(SELECT 1 FROM public.stores WHERE user_id = v_user_id AND active = true) INTO v_is_agent;
      v_unit := CASE WHEN v_is_agent THEN v_prod.agent_price ELSE v_prod.user_price END;
      v_count := COALESCE((p_metadata->>'quantity')::INT, 1);
      IF v_count < 1 OR v_count > 10 THEN RAISE EXCEPTION 'Quantity must be 1-10'; END IF;
      RETURN round(v_unit * v_count, 2);

    WHEN 'bulk_purchase' THEN
      SELECT * INTO v_pkg FROM public.data_packages
      WHERE id = (p_metadata->>'package_id')::UUID AND active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'Package not found'; END IF;
      v_price := public.resolve_buy_price(v_user_id, v_pkg.id);
      v_count := 0;
      IF p_metadata ? 'phones' AND jsonb_typeof(p_metadata->'phones') = 'array' THEN
        FOR v_phone IN SELECT jsonb_array_elements_text(p_metadata->'phones') LOOP
          IF length(regexp_replace(trim(v_phone), '\D', '', 'g')) >= 10 THEN v_count := v_count + 1; END IF;
        END LOOP;
      END IF;
      IF v_count < 1 THEN RAISE EXCEPTION 'Add at least one valid phone number'; END IF;
      IF v_count > 50 THEN RAISE EXCEPTION 'Maximum 50 numbers per batch'; END IF;
      RETURN round(v_price * v_count, 2);

    ELSE
      RAISE EXCEPTION 'Unknown payment purpose: %', p_purpose;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quote_paystack_amount(TEXT, JSONB, UUID) TO authenticated, service_role;

-- Purchase data without wallet debit (Paystack already collected)
CREATE OR REPLACE FUNCTION public._purchase_data_package_paid(
  p_user_id UUID,
  p_package_id UUID,
  p_recipient_phone TEXT,
  p_paystack_reference TEXT,
  p_promo_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.data_packages%ROWTYPE;
  v_price NUMERIC;
  v_discount NUMERIC := 0;
  v_final_price NUMERIC;
  v_promo_id UUID;
  v_order_id UUID;
  v_sub_id UUID;
  v_role TEXT := 'user';
BEGIN
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

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  SELECT
    p_user_id,
    'purchase'::public.tx_type,
    -v_final_price,
    pr.wallet_balance,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone)
      || ' (Paystack ' || p_paystack_reference || ')'
      || CASE WHEN v_discount > 0 THEN ' (promo -₵' || v_discount || ')' ELSE '' END,
    'success'::public.tx_status
  FROM public.profiles pr WHERE pr.id = p_user_id;

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status, sub_agent_id, buyer_role
  ) VALUES (
    p_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_final_price, trim(p_recipient_phone),
    'processing', v_sub_id, v_role
  ) RETURNING id INTO v_order_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE public.promo_codes SET uses_count = uses_count + 1 WHERE id = v_promo_id;
    INSERT INTO public.promo_redemptions (promo_code_id, user_id, order_id, discount_amount)
    VALUES (v_promo_id, p_user_id, v_order_id, v_discount);
  END IF;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;
  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public._purchase_data_package_paid(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._purchase_data_package_paid(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- Fulfill a verified Paystack payment (idempotent)
CREATE OR REPLACE FUNCTION public.fulfill_paystack_payment(
  p_reference TEXT,
  p_paystack_data JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay public.paystack_payments%ROWTYPE;
  v_result UUID;
  v_order_id UUID;
  v_settings public.platform_settings%ROWTYPE;
  v_sp public.store_packages%ROWTYPE;
  v_store_owner UUID;
  v_data_pkg UUID;
  v_phone TEXT;
  v_job_id UUID;
  v_ok INT := 0;
  v_fail INT := 0;
  v_status TEXT;
  v_new_bal NUMERIC;
  v_codes TEXT[] := '{}';
  v_prod public.result_checker_products%ROWTYPE;
  v_is_agent BOOLEAN;
  v_unit NUMERIC;
  v_total NUMERIC;
  v_qty INT;
  i INT;
BEGIN
  SELECT * INTO v_pay FROM public.paystack_payments WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment reference not found'; END IF;

  IF v_pay.status = 'success' THEN
    RETURN jsonb_build_object(
      'already_processed', true,
      'purpose', v_pay.purpose,
      'result_id', v_pay.result_id,
      'result_type', v_pay.result_type
    );
  END IF;

  IF v_pay.status NOT IN ('pending', 'paid') THEN
    RAISE EXCEPTION 'Payment cannot be fulfilled (status: %)', v_pay.status;
  END IF;

  UPDATE public.paystack_payments
  SET
    status = 'paid',
    paid_at = COALESCE(paid_at, now()),
    paystack_response = COALESCE(p_paystack_data, paystack_response)
  WHERE reference = p_reference;

  CASE v_pay.purpose
    WHEN 'wallet_topup' THEN
      UPDATE public.profiles
      SET wallet_balance = wallet_balance + v_pay.amount
      WHERE id = v_pay.user_id
      RETURNING wallet_balance INTO v_new_bal;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
      VALUES (
        v_pay.user_id,
        'topup'::public.tx_type,
        v_pay.amount,
        v_new_bal,
        'Wallet top-up via Paystack (' || p_reference || ')',
        'success'::public.tx_status
      );

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_type = 'wallet_balance'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'wallet_topup', 'balance', v_new_bal);

    WHEN 'data_purchase' THEN
      v_order_id := public._purchase_data_package_paid(
        v_pay.user_id,
        (v_pay.metadata->>'package_id')::UUID,
        v_pay.metadata->>'recipient_phone',
        p_reference,
        v_pay.metadata->>'promo_code'
      );
      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_order_id, result_type = 'data_order'
      WHERE reference = p_reference;
      RETURN jsonb_build_object('success', true, 'purpose', 'data_purchase', 'order_id', v_order_id);

    WHEN 'store_order' THEN
      SELECT sp.* INTO v_sp FROM public.store_packages sp
      WHERE sp.id = (v_pay.metadata->>'store_package_id')::UUID AND sp.active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'Store package not found'; END IF;

      v_store_owner := v_sp.user_id;
      v_data_pkg := v_sp.data_package_id;
      v_phone := regexp_replace(trim(v_pay.metadata->>'customer_phone'), '\D', '', 'g');

      INSERT INTO public.store_orders (store_owner_id, package_id, customer_phone, price, status, payment_reference)
      VALUES (v_store_owner, v_sp.id, v_phone, v_sp.price, 'processing', p_reference)
      RETURNING id INTO v_result;

      IF v_data_pkg IS NOT NULL THEN
        v_order_id := public._purchase_data_package_paid(
          v_store_owner,
          v_data_pkg,
          v_phone,
          p_reference,
          NULL
        );
        UPDATE public.store_orders SET status = 'processing' WHERE id = v_result;
      END IF;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'store_order',
          metadata = metadata || jsonb_build_object('data_order_id', v_order_id)
      WHERE reference = p_reference;

      RETURN jsonb_build_object(
        'success', true,
        'purpose', 'store_order',
        'store_order_id', v_result,
        'data_order_id', v_order_id
      );

    WHEN 'store_activation' THEN
      IF EXISTS(SELECT 1 FROM public.stores WHERE user_id = v_pay.user_id) THEN
        RAISE EXCEPTION 'You already have a store';
      END IF;

      INSERT INTO public.stores (user_id, name, whatsapp, slug)
      VALUES (
        v_pay.user_id,
        trim(v_pay.metadata->>'name'),
        trim(v_pay.metadata->>'whatsapp'),
        trim(v_pay.metadata->>'slug')
      )
      RETURNING id INTO v_result;

      IF v_pay.amount > 0 THEN
        INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
        SELECT
          v_pay.user_id,
          'purchase'::public.tx_type,
          -v_pay.amount,
          pr.wallet_balance,
          'Store activation fee (Paystack ' || p_reference || ')',
          'success'::public.tx_status
        FROM public.profiles pr WHERE pr.id = v_pay.user_id;
      END IF;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'store'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'store_activation', 'store_id', v_result);

    WHEN 'sub_agent_activation' THEN
      IF EXISTS (SELECT 1 FROM public.stores WHERE user_id = v_pay.user_id) THEN
        RAISE EXCEPTION 'Store owners cannot become sub-agents';
      END IF;
      IF EXISTS (SELECT 1 FROM public.sub_agents WHERE user_id = v_pay.user_id) THEN
        RAISE EXCEPTION 'You already have a sub-agent application';
      END IF;

      SELECT id INTO v_result FROM public.stores
      WHERE slug = trim(v_pay.metadata->>'parent_store_slug') AND active = true;
      IF v_result IS NULL THEN RAISE EXCEPTION 'Parent store not found'; END IF;

      INSERT INTO public.sub_agents (parent_store_id, user_id, status, activation_fee_paid)
      VALUES (v_result, v_pay.user_id, 'pending', v_pay.amount)
      RETURNING id INTO v_result;

      IF v_pay.amount > 0 THEN
        INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
        SELECT
          v_pay.user_id,
          'purchase'::public.tx_type,
          -v_pay.amount,
          pr.wallet_balance,
          'Sub-agent activation fee (Paystack ' || p_reference || ')',
          'success'::public.tx_status
        FROM public.profiles pr WHERE pr.id = v_pay.user_id;
      END IF;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'sub_agent'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'sub_agent_activation', 'sub_agent_id', v_result);

    WHEN 'airtime' THEN
      INSERT INTO public.airtime_orders (user_id, network, recipient_phone, amount, status)
      VALUES (
        v_pay.user_id,
        v_pay.metadata->>'network',
        regexp_replace(trim(v_pay.metadata->>'recipient_phone'), '\D', '', 'g'),
        v_pay.amount,
        'processing'
      )
      RETURNING id INTO v_result;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
      SELECT
        v_pay.user_id,
        'purchase'::public.tx_type,
        -v_pay.amount,
        pr.wallet_balance,
        'Airtime ' || (v_pay.metadata->>'network') || ' (Paystack ' || p_reference || ')',
        'success'::public.tx_status
      FROM public.profiles pr WHERE pr.id = v_pay.user_id;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'airtime_order'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'airtime', 'order_id', v_result);

    WHEN 'utility' THEN
      INSERT INTO public.utility_orders (user_id, utility_type, account_number, amount, status, meta)
      VALUES (
        v_pay.user_id,
        v_pay.metadata->>'utility_type',
        trim(v_pay.metadata->>'account_number'),
        v_pay.amount,
        'processing',
        COALESCE(v_pay.metadata->'meta', '{}')
      )
      RETURNING id INTO v_result;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
      SELECT
        v_pay.user_id,
        'purchase'::public.tx_type,
        -v_pay.amount,
        pr.wallet_balance,
        upper(v_pay.metadata->>'utility_type') || ' bill (Paystack ' || p_reference || ')',
        'success'::public.tx_status
      FROM public.profiles pr WHERE pr.id = v_pay.user_id;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'utility_order'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'utility', 'order_id', v_result);

    WHEN 'result_checker' THEN
      SELECT * INTO v_prod FROM public.result_checker_products
      WHERE id = (v_pay.metadata->>'product_id')::UUID;
      v_qty := COALESCE((v_pay.metadata->>'quantity')::INT, 1);

      FOR i IN 1..v_qty LOOP
        v_codes := array_append(v_codes, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)));
      END LOOP;

      INSERT INTO public.result_checker_orders (
        user_id, product_id, quantity, total_amount, voucher_codes, status, recipient_phone
      )
      VALUES (
        v_pay.user_id,
        v_prod.id,
        v_qty,
        v_pay.amount,
        v_codes,
        'completed',
        regexp_replace(trim(v_pay.metadata->>'recipient_phone'), '\D', '', 'g')
      )
      RETURNING id INTO v_result;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
      SELECT
        v_pay.user_id,
        'purchase'::public.tx_type,
        -v_pay.amount,
        pr.wallet_balance,
        v_prod.name || ' (Paystack ' || p_reference || ')',
        'success'::public.tx_status
      FROM public.profiles pr WHERE pr.id = v_pay.user_id;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_result, result_type = 'result_checker_order'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'result_checker', 'order_id', v_result);

    WHEN 'bulk_purchase' THEN
      INSERT INTO public.bulk_disbursement_jobs (user_id, package_id, total_count, status)
      VALUES (
        v_pay.user_id,
        (v_pay.metadata->>'package_id')::UUID,
        jsonb_array_length(v_pay.metadata->'phones'),
        'processing'
      )
      RETURNING id INTO v_job_id;

      FOR v_phone IN SELECT jsonb_array_elements_text(v_pay.metadata->'phones') LOOP
        v_phone := regexp_replace(trim(v_phone), '\D', '', 'g');
        IF length(v_phone) < 10 THEN
          INSERT INTO public.bulk_disbursement_items (job_id, recipient_phone, status, error_message)
          VALUES (v_job_id, v_phone, 'failed', 'Invalid phone number');
          v_fail := v_fail + 1;
          CONTINUE;
        END IF;
        BEGIN
          v_order_id := public._purchase_data_package_paid(
            v_pay.user_id,
            (v_pay.metadata->>'package_id')::UUID,
            v_phone,
            p_reference,
            NULL
          );
          INSERT INTO public.bulk_disbursement_items (job_id, recipient_phone, data_order_id, status)
          VALUES (v_job_id, v_phone, v_order_id, 'success');
          v_ok := v_ok + 1;
        EXCEPTION WHEN OTHERS THEN
          INSERT INTO public.bulk_disbursement_items (job_id, recipient_phone, status, error_message)
          VALUES (v_job_id, v_phone, 'failed', SQLERRM);
          v_fail := v_fail + 1;
        END;
      END LOOP;

      v_status := CASE
        WHEN v_fail = 0 THEN 'completed'
        WHEN v_ok = 0 THEN 'failed'
        ELSE 'partial'
      END;

      UPDATE public.bulk_disbursement_jobs
      SET status = v_status,
          success_count = v_ok,
          failed_count = v_fail
      WHERE id = v_job_id;

      UPDATE public.paystack_payments
      SET status = 'success', processed_at = now(), result_id = v_job_id, result_type = 'bulk_job'
      WHERE reference = p_reference;

      RETURN jsonb_build_object('success', true, 'purpose', 'bulk_purchase', 'job_id', v_job_id, 'ok', v_ok, 'fail', v_fail);

    ELSE
      RAISE EXCEPTION 'Unknown payment purpose: %', v_pay.purpose;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_paystack_payment(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_paystack_payment(TEXT, JSONB) TO service_role;

-- Block direct wallet top-up; use Paystack instead
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Wallet top-ups must be made via Paystack. Go to Wallet and click Top up.';
END;
$$;
