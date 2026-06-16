-- Admin broadcast notifications to users and agents
CREATE TYPE public.announcement_audience AS ENUM ('all', 'users', 'agents');
CREATE TYPE public.announcement_severity AS ENUM ('info', 'warning', 'urgent');

CREATE TABLE public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience public.announcement_audience NOT NULL DEFAULT 'all',
  severity public.announcement_severity NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.announcement_dismissals (
  announcement_id UUID NOT NULL REFERENCES public.platform_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

GRANT SELECT ON public.platform_announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_announcements TO authenticated;
GRANT ALL ON public.platform_announcements TO service_role;

GRANT SELECT, INSERT ON public.announcement_dismissals TO authenticated;
GRANT ALL ON public.announcement_dismissals TO service_role;

ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Recipients: active, in-window, matching audience, not dismissed
CREATE POLICY "recipients view announcements" ON public.platform_announcements
  FOR SELECT TO authenticated
  USING (
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      audience = 'all'
      OR (audience = 'users' AND NOT public.is_agent(auth.uid()))
      OR (audience = 'agents' AND public.is_agent(auth.uid()))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.announcement_dismissals d
      WHERE d.announcement_id = platform_announcements.id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "admin view all announcements" ON public.platform_announcements
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin insert announcements" ON public.platform_announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update announcements" ON public.platform_announcements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete announcements" ON public.platform_announcements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users dismiss own" ON public.announcement_dismissals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own dismissals" ON public.announcement_dismissals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admin view dismissals" ON public.announcement_dismissals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'platform_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_announcements;
  END IF;
END $$;
