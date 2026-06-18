-- Fix: CASE expressions return text; transactions.type expects tx_type enum.
-- Affects admin_adjust_wallet (Credit Management) and shared wallet helpers.

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
  v_tx_type public.tx_type;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Amount cannot be zero'; END IF;

  v_tx_type := CASE
    WHEN p_amount > 0 THEN 'topup'::public.tx_type
    ELSE 'purchase'::public.tx_type
  END;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_bal;

  IF v_new_bal IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_new_bal < 0 THEN RAISE EXCEPTION 'Balance cannot be negative'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (p_user_id, v_tx_type, p_amount, v_new_bal, p_description, 'success'::public.tx_status);

  PERFORM public.admin_log_action('wallet_adjust', 'profile', p_user_id::text, jsonb_build_object('amount', p_amount));
  RETURN v_new_bal;
END;
$$;

CREATE OR REPLACE FUNCTION public._debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bal NUMERIC;
  v_new NUMERIC;
BEGIN
  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_bal < p_amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  v_new := v_bal - p_amount;
  UPDATE public.profiles SET wallet_balance = v_new WHERE id = p_user_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    p_user_id,
    'purchase'::public.tx_type,
    -p_amount,
    v_new,
    p_description,
    'success'::public.tx_status
  );
  RETURN v_new;
END;
$$;

-- wallet_topup: explicit enum casts for consistency
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_new_bal NUMERIC;
BEGIN
  v_user_id := public.ensure_user_profile();
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid top-up amount'; END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = v_user_id
  RETURNING wallet_balance INTO v_new_bal;

  IF v_new_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (v_user_id, 'topup'::public.tx_type, p_amount, v_new_bal, 'Wallet top-up', 'success'::public.tx_status);

  RETURN v_new_bal;
END;
$$;
