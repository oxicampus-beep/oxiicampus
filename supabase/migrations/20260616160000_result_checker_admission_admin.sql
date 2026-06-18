-- Result checkers & admission forms: admin catalog, user/agent pricing, phone on purchase

DO $$ BEGIN
  CREATE TYPE public.exam_product_category AS ENUM ('result_checker', 'admission_form');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.result_checker_products
  ADD COLUMN IF NOT EXISTS category public.exam_product_category NOT NULL DEFAULT 'result_checker',
  ADD COLUMN IF NOT EXISTS user_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS agent_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

UPDATE public.result_checker_products
SET
  user_price = COALESCE(user_price, price),
  agent_price = COALESCE(agent_price, ROUND(price * 0.92, 2)),
  category = CASE WHEN slug IN ('university', 'admission') THEN 'admission_form'::public.exam_product_category ELSE 'result_checker'::public.exam_product_category END
WHERE user_price IS NULL OR agent_price IS NULL;

ALTER TABLE public.result_checker_products
  ALTER COLUMN user_price SET NOT NULL,
  ALTER COLUMN agent_price SET NOT NULL;

ALTER TABLE public.result_checker_orders
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Admin can view all exam product orders
CREATE POLICY "admin view result orders" ON public.result_checker_orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.purchase_result_checker(TEXT, INT);

CREATE OR REPLACE FUNCTION public.purchase_result_checker(
  p_product_id UUID DEFAULT NULL,
  p_product_slug TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
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
  v_is_agent BOOLEAN;
  v_unit_price NUMERIC;
  v_total NUMERIC;
  v_id UUID;
  v_codes TEXT[] := '{}';
  i INT;
BEGIN
  IF NOT (SELECT purchases_enabled FROM public.platform_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'Purchases are temporarily disabled';
  END IF;

  v_user_id := public.ensure_user_profile();

  IF p_recipient_phone IS NULL OR length(regexp_replace(trim(p_recipient_phone), '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Enter a valid 10-digit phone number';
  END IF;

  IF p_quantity < 1 OR p_quantity > 10 THEN RAISE EXCEPTION 'Quantity must be 1-10'; END IF;

  IF p_product_id IS NOT NULL THEN
    SELECT * INTO v_prod FROM public.result_checker_products
    WHERE id = p_product_id AND active = true;
  ELSIF p_product_slug IS NOT NULL AND length(trim(p_product_slug)) > 0 THEN
    SELECT * INTO v_prod FROM public.result_checker_products
    WHERE slug = trim(p_product_slug) AND active = true;
  ELSE
    RAISE EXCEPTION 'Product is required';
  END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found or inactive'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = v_user_id AND active = true
  ) INTO v_is_agent;

  v_unit_price := CASE WHEN v_is_agent THEN v_prod.agent_price ELSE v_prod.user_price END;
  v_total := v_unit_price * p_quantity;

  PERFORM public._debit_wallet(
    v_user_id,
    v_total,
    v_prod.name || ' → ' || regexp_replace(trim(p_recipient_phone), '\D', '', 'g') || ' x' || p_quantity
  );

  FOR i IN 1..p_quantity LOOP
    v_codes := array_append(v_codes, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)));
  END LOOP;

  INSERT INTO public.result_checker_orders (
    user_id, product_id, quantity, total_amount, voucher_codes, status, recipient_phone
  )
  VALUES (
    v_user_id,
    v_prod.id,
    p_quantity,
    v_total,
    v_codes,
    'completed',
    regexp_replace(trim(p_recipient_phone), '\D', '', 'g')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_result_checker(UUID, TEXT, TEXT, INT) TO authenticated;

-- Seed admission form products if missing
INSERT INTO public.result_checker_products (slug, name, description, price, user_price, agent_price, category, sort_order) VALUES
  ('admission-ug', 'University of Ghana Admission', 'UG admission checker voucher', 12.00, 12.00, 10.00, 'admission_form', 1),
  ('admission-knust', 'KNUST Admission', 'KNUST admission checker voucher', 12.00, 12.00, 10.00, 'admission_form', 2),
  ('admission-ucc', 'UCC Admission', 'UCC admission checker voucher', 12.00, 12.00, 10.00, 'admission_form', 3)
ON CONFLICT (slug) DO NOTHING;
