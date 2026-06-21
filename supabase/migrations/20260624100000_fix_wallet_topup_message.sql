-- Ensure wallet_topup RPC gives a clear message and cannot bypass Paystack
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Use the Pay with Paystack button on the Wallet page to top up.';
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_topup(NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_topup(NUMERIC) TO authenticated;
