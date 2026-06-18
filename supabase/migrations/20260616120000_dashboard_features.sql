-- Customer address book + notification inbox RPC

CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_user ON public.customer_contacts(user_id);

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own contacts" ON public.customer_contacts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_notification_inbox()
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  severity public.announcement_severity,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.title,
    a.body,
    a.severity,
    a.created_at,
    EXISTS (
      SELECT 1 FROM public.announcement_dismissals d
      WHERE d.announcement_id = a.id AND d.user_id = auth.uid()
    ) AS is_read
  FROM public.platform_announcements a
  WHERE
    (a.starts_at IS NULL OR a.starts_at <= now())
    AND (
      a.audience = 'all'
      OR (a.audience = 'users' AND NOT public.is_agent(auth.uid()))
      OR (a.audience = 'agents' AND public.is_agent(auth.uid()))
      OR public.has_role(auth.uid(), 'admin')
    )
  ORDER BY a.created_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_inbox() TO authenticated;
