CREATE OR REPLACE FUNCTION public.squad_roster(code text)
RETURNS TABLE(in_game_id text, role text, player_rank text, slot integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT m.in_game_id, m.role, m.player_rank, m.slot
  FROM public.team_members m
  WHERE m.team_number = code
  UNION ALL
  SELECT r.in_game_id, 'IGL'::text AS role, r.player_rank, 1 AS slot
  FROM public.registrations r
  WHERE r.team_number = code
    AND NOT EXISTS (
      SELECT 1 FROM public.team_members tm WHERE tm.team_number = code AND tm.slot = 1
    )
  ORDER BY slot;
$$;

REVOKE ALL ON FUNCTION public.squad_roster(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.squad_roster(text) TO anon, authenticated, service_role;
