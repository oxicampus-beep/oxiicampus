-- Fix store order status: 'paid' is not in order_status enum
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
