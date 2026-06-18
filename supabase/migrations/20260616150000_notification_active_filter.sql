-- Only show active, in-window announcements in the user inbox
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
    a.active = true
    AND (a.starts_at IS NULL OR a.starts_at <= now())
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND (
      a.audience = 'all'
      OR (a.audience = 'users' AND NOT public.is_agent(auth.uid()))
      OR (a.audience = 'agents' AND public.is_agent(auth.uid()))
    )
  ORDER BY a.created_at DESC
  LIMIT 50;
$$;
