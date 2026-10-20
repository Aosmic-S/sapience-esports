CREATE OR REPLACE FUNCTION public.squad_roster(code text)
RETURNS TABLE(in_game_id text, role text, player_rank text, slot integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_number = code) THEN
    RETURN QUERY SELECT m.in_game_id, m.role, m.player_rank, m.slot FROM public.team_members m WHERE m.team_number = code ORDER BY m.slot;
  ELSE
    RETURN QUERY SELECT r.in_game_id, 'IGL'::text AS role, r.player_rank, 1 AS slot FROM public.registrations r WHERE r.team_number = code;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.squad_roster(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.squad_roster(text) TO anon, authenticated, service_role;
