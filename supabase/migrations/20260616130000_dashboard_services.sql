-- Dashboard services: auto-renewal, airtime, utilities, bulk, result checkers, leaderboard, WhatsApp bot

-- Auto-renewal schedules
CREATE TABLE IF NOT EXISTS public.auto_renewal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.data_packages(id) ON DELETE RESTRICT,
  recipient_phone TEXT NOT NULL,
  interval_days INT NOT NULL CHECK (interval_days IN (7, 14, 30)),
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_renewal_user ON public.auto_renewal_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_renewal_due ON public.auto_renewal_schedules(next_run_at) WHERE active = true;

-- Airtime orders
CREATE TABLE IF NOT EXISTS public.airtime_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('mtn', 'telecel', 'airteltigo')),
  recipient_phone TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status public.order_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Utility bill orders
CREATE TABLE IF NOT EXISTS public.utility_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  utility_type TEXT NOT NULL CHECK (utility_type IN ('ecg', 'water', 'dstv', 'gotv')),
  account_number TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status public.order_status NOT NULL DEFAULT 'processing',
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Result checker catalog
CREATE TABLE IF NOT EXISTS public.result_checker_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.result_checker_products (slug, name, description, price) VALUES
  ('waec', 'WAEC Result Checker', 'Check WASSCE results online', 17.00),
  ('bece', 'BECE Result Checker', 'Check BECE results online', 17.00),
  ('novdec', 'Nov/Dec Result Checker', 'Private WASSCE result checker', 17.00),
  ('university', 'University Admission Checker', 'Verify university admission status', 10.00)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.result_checker_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.result_checker_products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount NUMERIC(10,2) NOT NULL,
  voucher_codes TEXT[] NOT NULL DEFAULT '{}',
  status public.order_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bulk disbursement
CREATE TABLE IF NOT EXISTS public.bulk_disbursement_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.data_packages(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'partial', 'failed')),
  total_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bulk_disbursement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.bulk_disbursement_jobs(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  data_order_id UUID REFERENCES public.data_orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_items_job ON public.bulk_disbursement_items(job_id);

-- WhatsApp bot settings on stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS whatsapp_bot_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_bot_greeting TEXT;

-- Shared wallet debit helper
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
  VALUES (p_user_id, 'purchase', -p_amount, v_new, p_description, 'success');
  RETURN v_new;
END;
$$;

-- Auto-renewal CRUD
CREATE OR REPLACE FUNCTION public.create_auto_renewal(
  p_package_id UUID,
  p_recipient_phone TEXT,
  p_interval_days INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_id UUID;
BEGIN
  v_user_id := public.ensure_user_profile();
  IF p_interval_days NOT IN (7, 14, 30) THEN RAISE EXCEPTION 'Interval must be 7, 14, or 30 days'; END IF;
  IF length(trim(p_recipient_phone)) < 10 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.data_packages WHERE id = p_package_id AND active = true) THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  INSERT INTO public.auto_renewal_schedules (user_id, package_id, recipient_phone, interval_days, next_run_at)
  VALUES (v_user_id, p_package_id, trim(p_recipient_phone), p_interval_days, now() + (p_interval_days || ' days')::interval)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_auto_renewal(p_schedule_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.auto_renewal_schedules
  SET active = false
  WHERE id = p_schedule_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Schedule not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_auto_renewal(p_schedule_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sched public.auto_renewal_schedules%ROWTYPE;
  v_order_id UUID;
BEGIN
  SELECT * INTO v_sched FROM public.auto_renewal_schedules
  WHERE id = p_schedule_id AND user_id = auth.uid() AND active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Schedule not found'; END IF;

  v_order_id := public.purchase_data_package(v_sched.package_id, v_sched.recipient_phone);

  UPDATE public.auto_renewal_schedules
  SET last_run_at = now(),
      next_run_at = now() + (interval_days || ' days')::interval
  WHERE id = p_schedule_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_auto_renewal(UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_auto_renewal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_auto_renewal(UUID) TO authenticated;

-- Airtime purchase
CREATE OR REPLACE FUNCTION public.purchase_airtime(
  p_network TEXT,
  p_recipient_phone TEXT,
  p_amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_id UUID;
  v_maint BOOLEAN;
BEGIN
  SELECT maintenance_mode INTO v_maint FROM public.platform_settings WHERE id = 1;
  IF v_maint THEN RAISE EXCEPTION 'Platform is under maintenance'; END IF;
  IF NOT (SELECT purchases_enabled FROM public.platform_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'Purchases are temporarily disabled';
  END IF;

  v_user_id := public.ensure_user_profile();
  IF p_network NOT IN ('mtn', 'telecel', 'airteltigo') THEN RAISE EXCEPTION 'Invalid network'; END IF;
  IF p_amount < 1 OR p_amount > 500 THEN RAISE EXCEPTION 'Amount must be between ₵1 and ₵500'; END IF;
  IF length(trim(p_recipient_phone)) < 10 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;

  PERFORM public._debit_wallet(v_user_id, p_amount, 'Airtime ' || p_network || ' → ' || trim(p_recipient_phone));

  INSERT INTO public.airtime_orders (user_id, network, recipient_phone, amount, status)
  VALUES (v_user_id, p_network, trim(p_recipient_phone), p_amount, 'processing')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_airtime(TEXT, TEXT, NUMERIC) TO authenticated;

-- Utility purchase
CREATE OR REPLACE FUNCTION public.purchase_utility(
  p_utility_type TEXT,
  p_account_number TEXT,
  p_amount NUMERIC,
  p_meta JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_id UUID;
  v_label TEXT;
BEGIN
  IF NOT (SELECT purchases_enabled FROM public.platform_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'Purchases are temporarily disabled';
  END IF;

  v_user_id := public.ensure_user_profile();
  IF p_utility_type NOT IN ('ecg', 'water', 'dstv', 'gotv') THEN RAISE EXCEPTION 'Invalid utility type'; END IF;
  IF p_amount < 5 OR p_amount > 2000 THEN RAISE EXCEPTION 'Amount must be between ₵5 and ₵2000'; END IF;
  IF length(trim(p_account_number)) < 6 THEN RAISE EXCEPTION 'Invalid account/meter number'; END IF;

  v_label := upper(p_utility_type) || ' bill → ' || trim(p_account_number);
  PERFORM public._debit_wallet(v_user_id, p_amount, v_label);

  INSERT INTO public.utility_orders (user_id, utility_type, account_number, amount, status, meta)
  VALUES (v_user_id, p_utility_type, trim(p_account_number), p_amount, 'processing', COALESCE(p_meta, '{}'))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_utility(TEXT, TEXT, NUMERIC, JSONB) TO authenticated;

-- Result checker purchase
CREATE OR REPLACE FUNCTION public.purchase_result_checker(
  p_product_slug TEXT,
  p_quantity INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_prod public.result_checker_products%ROWTYPE;
  v_total NUMERIC;
  v_id UUID;
  v_codes TEXT[] := '{}';
  i INT;
BEGIN
  IF NOT (SELECT purchases_enabled FROM public.platform_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'Purchases are temporarily disabled';
  END IF;

  v_user_id := public.ensure_user_profile();
  IF p_quantity < 1 OR p_quantity > 10 THEN RAISE EXCEPTION 'Quantity must be 1-10'; END IF;

  SELECT * INTO v_prod FROM public.result_checker_products
  WHERE slug = trim(p_product_slug) AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;

  v_total := v_prod.price * p_quantity;
  PERFORM public._debit_wallet(v_user_id, v_total, v_prod.name || ' x' || p_quantity);

  FOR i IN 1..p_quantity LOOP
    v_codes := array_append(v_codes, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)));
  END LOOP;

  INSERT INTO public.result_checker_orders (user_id, product_id, quantity, total_amount, voucher_codes, status)
  VALUES (v_user_id, v_prod.id, p_quantity, v_total, v_codes, 'completed')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_result_checker(TEXT, INT) TO authenticated;

-- Bulk disbursement
CREATE OR REPLACE FUNCTION public.bulk_purchase_data(
  p_package_id UUID,
  p_phones TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_job_id UUID;
  v_phone TEXT;
  v_order_id UUID;
  v_ok INT := 0;
  v_fail INT := 0;
  v_status TEXT;
BEGIN
  v_user_id := public.ensure_user_profile();
  IF array_length(p_phones, 1) IS NULL OR array_length(p_phones, 1) < 1 THEN
    RAISE EXCEPTION 'Add at least one phone number';
  END IF;
  IF array_length(p_phones, 1) > 50 THEN RAISE EXCEPTION 'Maximum 50 numbers per batch'; END IF;

  INSERT INTO public.bulk_disbursement_jobs (user_id, package_id, total_count, status)
  VALUES (v_user_id, p_package_id, array_length(p_phones, 1), 'processing')
  RETURNING id INTO v_job_id;

  FOREACH v_phone IN ARRAY p_phones LOOP
    v_phone := regexp_replace(trim(v_phone), '\D', '', 'g');
    IF length(v_phone) < 10 THEN
      INSERT INTO public.bulk_disbursement_items (job_id, recipient_phone, status, error_message)
      VALUES (v_job_id, v_phone, 'failed', 'Invalid phone number');
      v_fail := v_fail + 1;
      CONTINUE;
    END IF;

    BEGIN
      v_order_id := public.purchase_data_package(p_package_id, v_phone);
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
  SET success_count = v_ok, failed_count = v_fail, status = v_status
  WHERE id = v_job_id;

  RETURN v_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_purchase_data(UUID, TEXT[]) TO authenticated;

-- Agent leaderboard
CREATE OR REPLACE FUNCTION public.get_agent_leaderboard()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.rank), '[]'::jsonb)
  FROM (
    SELECT
      row_number() OVER (ORDER BY coalesce(rev.revenue, 0) DESC, s.name) AS rank,
      s.name AS store_name,
      s.slug,
      coalesce(rev.order_count, 0)::INT AS order_count,
      coalesce(rev.revenue, 0)::NUMERIC AS revenue
    FROM public.stores s
    LEFT JOIN (
      SELECT store_owner_id AS user_id,
        count(*)::INT AS order_count,
        sum(price)::NUMERIC AS revenue
      FROM public.store_orders
      WHERE created_at > now() - interval '30 days'
      GROUP BY store_owner_id
    ) rev ON rev.user_id = s.user_id
    WHERE s.active = true
    ORDER BY coalesce(rev.revenue, 0) DESC, s.name
    LIMIT 25
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_leaderboard() TO authenticated;

-- RLS
ALTER TABLE public.auto_renewal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airtime_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_checker_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_checker_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_disbursement_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_disbursement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own renewals" ON public.auto_renewal_schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own airtime" ON public.airtime_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users insert airtime via rpc" ON public.airtime_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own utility" ON public.utility_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users insert utility via rpc" ON public.utility_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read active result products" ON public.result_checker_products FOR SELECT TO authenticated
  USING (active = true);
CREATE POLICY "admin manage result products" ON public.result_checker_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own result orders" ON public.result_checker_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users view own bulk jobs" ON public.bulk_disbursement_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users view own bulk items" ON public.bulk_disbursement_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bulk_disbursement_jobs j WHERE j.id = job_id AND j.user_id = auth.uid()));
