-- Allow admins to insert ambassador records for any user
CREATE POLICY "Admins can insert ambassadors"
ON public.ambassadors
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
