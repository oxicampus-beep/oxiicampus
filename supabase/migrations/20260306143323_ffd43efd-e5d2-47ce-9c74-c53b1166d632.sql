
-- Create ambassadors table
CREATE TABLE public.ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  university text NOT NULL,
  whatsapp text NOT NULL,
  momo_number text NOT NULL,
  momo_network text NOT NULL,
  momo_name text NOT NULL,
  referral_code text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package text NOT NULL,
  amount numeric NOT NULL,
  commission numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Ambassadors RLS policies
CREATE POLICY "Anyone can view approved ambassadors" ON public.ambassadors
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own ambassador profile" ON public.ambassadors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ambassador application" ON public.ambassadors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ambassador profile" ON public.ambassadors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ambassadors" ON public.ambassadors
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all ambassadors" ON public.ambassadors
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ambassadors" ON public.ambassadors
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Referrals RLS policies
CREATE POLICY "Ambassadors can view their own referrals" ON public.referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ambassadors
      WHERE ambassadors.id = referrals.ambassador_id
      AND ambassadors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referrals" ON public.referrals
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.ambassadors WHERE referral_code = code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_ambassadors_updated_at
  BEFORE UPDATE ON public.ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
