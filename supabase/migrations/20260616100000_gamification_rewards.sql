-- Gamification: points, referrals, spin wheel, redemption

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_balance INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS last_spin_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_awarded INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spin_wheel_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  segment INT NOT NULL CHECK (segment >= 0 AND segment <= 2),
  prize_type TEXT NOT NULL CHECK (prize_type IN ('points', 'data')),
  points_awarded INT,
  data_gb NUMERIC(8,2),
  network public.network_type,
  recipient_phone TEXT,
  data_order_id UUID REFERENCES public.data_orders(id),
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON public.points_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spin_wheel_spins_user ON public.spin_wheel_spins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);

-- Generate unique 8-char referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

-- Credit points helper (internal)
CREATE OR REPLACE FUNCTION public._credit_points(
  p_user_id UUID,
  p_amount INT,
  p_source TEXT,
  p_description TEXT,
  p_meta JSONB DEFAULT '{}'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_bal INT;
BEGIN
  IF p_amount = 0 THEN
    SELECT points_balance INTO v_new_bal FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_new_bal, 0);
  END IF;

  UPDATE public.profiles
  SET points_balance = points_balance + p_amount
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_bal;

  IF v_new_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO public.points_ledger (user_id, amount, balance_after, source, description, meta)
  VALUES (p_user_id, p_amount, v_new_bal, p_source, p_description, p_meta);

  RETURN v_new_bal;
END;
$$;

-- Award referral points to referrer
CREATE OR REPLACE FUNCTION public._award_referral_points(
  p_referrer_id UUID,
  p_referred_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_id UUID;
BEGIN
  IF p_referrer_id IS NULL OR p_referred_user_id IS NULL THEN RETURN; END IF;
  IF p_referrer_id = p_referred_user_id THEN RETURN; END IF;

  INSERT INTO public.user_referrals (referrer_id, referred_user_id, points_awarded)
  VALUES (p_referrer_id, p_referred_user_id, 10)
  ON CONFLICT (referred_user_id) DO NOTHING
  RETURNING id INTO v_ref_id;

  IF v_ref_id IS NOT NULL THEN
    PERFORM public._credit_points(
      p_referrer_id, 10, 'referral',
      'Referral bonus — new signup',
      jsonb_build_object('referred_user_id', p_referred_user_id)
    );
  END IF;
END;
$$;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- Signup trigger: referral code + referrer credit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_ref_code TEXT;
  v_new_code TEXT;
BEGIN
  v_new_code := public.generate_referral_code();
  v_ref_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));

  IF v_ref_code <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code;
    IF v_referrer_id = NEW.id THEN
      v_referrer_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, email, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    v_new_code,
    v_referrer_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF v_referrer_id IS NOT NULL THEN
    PERFORM public._award_referral_points(v_referrer_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure profile has referral code
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.profiles (id, full_name, phone, email, referral_code)
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'phone',
    u.email,
    public.generate_referral_code()
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles
  SET referral_code = public.generate_referral_code()
  WHERE id = v_user_id AND referral_code IS NULL;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_user_id;
END;
$$;

-- Apply referral after signup (fallback if metadata missed)
CREATE OR REPLACE FUNCTION public.apply_referral_on_signup(p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_referrer_id UUID;
  v_code TEXT;
BEGIN
  v_user_id := public.ensure_user_profile();
  v_code := upper(trim(COALESCE(p_referral_code, '')));
  IF v_code = '' THEN RETURN false; END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_code;
  IF v_referrer_id IS NULL OR v_referrer_id = v_user_id THEN RETURN false; END IF;

  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = v_user_id AND referred_by IS NULL;

  PERFORM public._award_referral_points(v_referrer_id, v_user_id);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral_on_signup(TEXT) TO authenticated;

-- Rewards status for dashboard
CREATE OR REPLACE FUNCTION public.get_rewards_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile public.profiles%ROWTYPE;
  v_referrals INT;
  v_can_spin BOOLEAN;
  v_next_spin TIMESTAMPTZ;
  v_pending_spin public.spin_wheel_spins%ROWTYPE;
BEGIN
  v_user_id := public.ensure_user_profile();

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  SELECT count(*)::INT INTO v_referrals FROM public.user_referrals WHERE referrer_id = v_user_id;

  v_can_spin := v_profile.last_spin_at IS NULL
    OR v_profile.last_spin_at < (now() - interval '25 days');
  v_next_spin := CASE
    WHEN v_can_spin THEN NULL
    ELSE v_profile.last_spin_at + interval '25 days'
  END;

  SELECT * INTO v_pending_spin
  FROM public.spin_wheel_spins
  WHERE user_id = v_user_id
    AND prize_type = 'data'
    AND claimed = false
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'points_balance', v_profile.points_balance,
    'referral_code', v_profile.referral_code,
    'referrals_count', v_referrals,
    'can_spin', v_can_spin,
    'next_spin_at', v_next_spin,
    'last_spin_at', v_profile.last_spin_at,
    'pending_data_spin', CASE WHEN v_pending_spin.id IS NOT NULL THEN
      jsonb_build_object('spin_id', v_pending_spin.id, 'data_gb', v_pending_spin.data_gb)
    ELSE NULL END,
    'redeem_threshold', 100,
    'can_redeem', v_profile.points_balance >= 100
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rewards_status() TO authenticated;

-- Spin wheel: 3 segments — 5 pts (47%), 15 pts (48%), 1GB data (5%)
CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile public.profiles%ROWTYPE;
  v_roll NUMERIC;
  v_segment INT;
  v_points INT;
  v_prize_type TEXT;
  v_data_gb NUMERIC := 1;
  v_spin_id UUID;
  v_new_bal INT;
BEGIN
  v_user_id := public.ensure_user_profile();

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_profile.last_spin_at IS NOT NULL
    AND v_profile.last_spin_at >= (now() - interval '25 days') THEN
    RAISE EXCEPTION 'You can spin again on %',
      to_char(v_profile.last_spin_at + interval '25 days', 'YYYY-MM-DD');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.spin_wheel_spins
    WHERE user_id = v_user_id AND prize_type = 'data' AND claimed = false
  ) THEN
    RAISE EXCEPTION 'Claim your pending data prize before spinning again';
  END IF;

  v_roll := random() * 100;
  IF v_roll < 5 THEN
    v_segment := 2;
    v_prize_type := 'data';
    v_points := NULL;
  ELSIF v_roll < 52 THEN
    v_segment := 0;
    v_prize_type := 'points';
    v_points := 5;
  ELSE
    v_segment := 1;
    v_prize_type := 'points';
    v_points := 15;
  END IF;

  UPDATE public.profiles SET last_spin_at = now() WHERE id = v_user_id;

  IF v_prize_type = 'points' THEN
    v_new_bal := public._credit_points(
      v_user_id, v_points, 'spin',
      'Spin wheel — ' || v_points || ' points',
      jsonb_build_object('segment', v_segment)
    );

    INSERT INTO public.spin_wheel_spins (
      user_id, segment, prize_type, points_awarded, claimed
    ) VALUES (
      v_user_id, v_segment, 'points', v_points, true
    ) RETURNING id INTO v_spin_id;

    RETURN jsonb_build_object(
      'spin_id', v_spin_id,
      'segment', v_segment,
      'prize_type', 'points',
      'points_awarded', v_points,
      'points_balance', v_new_bal
    );
  END IF;

  INSERT INTO public.spin_wheel_spins (
    user_id, segment, prize_type, data_gb, claimed
  ) VALUES (
    v_user_id, v_segment, 'data', v_data_gb, false
  ) RETURNING id INTO v_spin_id;

  RETURN jsonb_build_object(
    'spin_id', v_spin_id,
    'segment', v_segment,
    'prize_type', 'data',
    'data_gb', v_data_gb,
    'points_balance', v_profile.points_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;

-- Claim data prize from spin (network + phone)
CREATE OR REPLACE FUNCTION public.claim_spin_data_prize(
  p_spin_id UUID,
  p_network public.network_type,
  p_recipient_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_spin public.spin_wheel_spins%ROWTYPE;
  v_pkg public.data_packages%ROWTYPE;
  v_order_id UUID;
BEGIN
  v_user_id := public.ensure_user_profile();

  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT * INTO v_spin
  FROM public.spin_wheel_spins
  WHERE id = p_spin_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Spin not found'; END IF;
  IF v_spin.prize_type <> 'data' THEN RAISE EXCEPTION 'This spin is not a data prize'; END IF;
  IF v_spin.claimed THEN RAISE EXCEPTION 'Prize already claimed'; END IF;
  IF v_spin.data_gb IS NULL OR v_spin.data_gb > 1 THEN RAISE EXCEPTION 'Invalid data prize'; END IF;

  SELECT * INTO v_pkg
  FROM public.data_packages
  WHERE active = true
    AND network = p_network
    AND size_gb = v_spin.data_gb
  ORDER BY user_price ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active %GB package for this network', v_spin.data_gb;
  END IF;

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, 0,
    trim(p_recipient_phone), 'processing'
  ) RETURNING id INTO v_order_id;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;

  UPDATE public.spin_wheel_spins
  SET claimed = true,
      data_order_id = v_order_id,
      network = p_network,
      recipient_phone = trim(p_recipient_phone)
  WHERE id = p_spin_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_spin_data_prize(UUID, public.network_type, TEXT) TO authenticated;

-- Redeem 100 points for 1GB data
CREATE OR REPLACE FUNCTION public.redeem_points_for_data(
  p_network public.network_type,
  p_recipient_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_points INT;
  v_pkg public.data_packages%ROWTYPE;
  v_order_id UUID;
  v_redeem_cost INT := 100;
  v_size_gb NUMERIC := 1;
BEGIN
  v_user_id := public.ensure_user_profile();

  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT points_balance INTO v_points
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_points IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_points < v_redeem_cost THEN
    RAISE EXCEPTION 'You need at least % points to redeem 1GB data', v_redeem_cost;
  END IF;

  SELECT * INTO v_pkg
  FROM public.data_packages
  WHERE active = true
    AND network = p_network
    AND size_gb = v_size_gb
  ORDER BY user_price ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active 1GB package for this network';
  END IF;

  PERFORM public._credit_points(
    v_user_id, -v_redeem_cost, 'redemption',
    'Redeemed ' || v_size_gb || 'GB ' || p_network::text || ' data',
    jsonb_build_object('network', p_network, 'size_gb', v_size_gb)
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, 0,
    trim(p_recipient_phone), 'processing'
  ) RETURNING id INTO v_order_id;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_points_for_data(public.network_type, TEXT) TO authenticated;

-- RLS
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own points ledger" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own spins" ON public.spin_wheel_spins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
