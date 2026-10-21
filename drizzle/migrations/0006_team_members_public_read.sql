GRANT SELECT ON public.team_members TO anon, authenticated;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_public_select'
  ) THEN
    CREATE POLICY team_members_public_select ON public.team_members FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;
