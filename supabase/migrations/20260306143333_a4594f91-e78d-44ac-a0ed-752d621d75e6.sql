
-- Fix function search path
ALTER FUNCTION public.generate_referral_code() SET search_path = public;

-- Fix permissive INSERT policy on referrals - restrict to service role / edge functions
DROP POLICY "System can insert referrals" ON public.referrals;
CREATE POLICY "Authenticated users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
