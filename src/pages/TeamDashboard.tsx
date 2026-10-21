import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  LogOut, 
  Shield, 
  Key, 
  Clock, 
  Gamepad2, 
  AlertTriangle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TeamSession {
  teamNumber: string;
  teamName: string;
  game: string;
  entryType: string;
  status: string;
  dqReason?: string;
  admissionNo?: string;
  inGameId?: string;
  uid?: string;
  teamOvr?: number;
  playerRank?: string;
}

export default function TeamDashboard() {
  const [teamSession, setTeamSession] = useState<TeamSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const session = sessionStorage.getItem('teamSession');
      if (!session) {
        navigate('/team-login', { replace: true });
        return;
      }
      const parsed = JSON.parse(session);
      if (!parsed || !parsed.teamNumber) {
        sessionStorage.removeItem('teamSession');
        navigate('/team-login', { replace: true });
        return;
      }
      setTeamSession(parsed);
    } catch {
      sessionStorage.removeItem('teamSession');
      navigate('/team-login', { replace: true });
    }
  }, [navigate]);

  // Fetch full registration details for real-time status & DQ check & attendance
  const { data: teamDetails } = useQuery({
    queryKey: ['teamDetails', teamSession?.teamNumber],
    queryFn: async () => {
      if (!teamSession?.teamNumber) return null;
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .ilike('team_number', teamSession.teamNumber)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!teamSession?.teamNumber
  });

  // Fetch Room ID and Password from system_settings
  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettingsRoomDetails'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('room_id, room_password').eq('id', 1).maybeSingle();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    }
  });

  // Fetch 5-player Krafton Roster if BGMI
  const { data: roster = [] } = useQuery({
    queryKey: ['teamRosterMembers', teamSession?.teamNumber, teamDetails?.id],
    queryFn: async () => {
      if (!teamSession) return [];
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_number', teamSession.teamNumber)
        .order('slot');

      if (error) {
        console.error('Error fetching roster:', error);
      }

      const list = members || [];
      const hasSlot1 = list.some((m: any) => m.slot === 1);

      // Include captain at slot 1 if not present in team_members
      if (!hasSlot1 && teamDetails && teamDetails.game === 'bgmi') {
        const captainSlot = {
          id: teamDetails.id,
          team_number: teamDetails.team_number,
          full_name: teamDetails.full_name,
          admission_no: teamDetails.admission_no || '',
          class_section: teamDetails.class_section,
          in_game_id: teamDetails.in_game_id || teamDetails.full_name,
          uid: teamDetails.uid || 'N/A',
          phone_number: teamDetails.phone_number,
          role: 'IGL',
          player_rank: teamDetails.player_rank,
          slot: 1
        };
        return [captainSlot, ...list].sort((a, b) => a.slot - b.slot);
      }

      return list;
    },
    enabled: !!teamSession && teamSession?.game === 'bgmi'
  });

  // Fetch Leaderboard Standing
  const { data: leaderboardData } = useQuery({
    queryKey: ['teamLeaderboard', teamSession?.teamNumber, teamSession?.game],
    queryFn: async () => {
      if (!teamSession) return null;
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('team_number', teamSession.teamNumber)
        .eq('game', teamSession.game)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching leaderboard:', error);
      }
      return data;
    },
    enabled: !!teamSession
  });

  // Fetch Match History
  const { data: matchHistory = [] } = useQuery({
    queryKey: ['teamMatchHistory', teamSession?.teamNumber],
    queryFn: async () => {
      if (!teamSession) return [];
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('team_number', teamSession.teamNumber)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching match history:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!teamSession
  });

  const handleLogout = () => {
    sessionStorage.removeItem('teamSession');
    toast({
      title: "Logged Out",
      description: "You have been logged out of the competitor portal.",
    });
    navigate('/team-login');
  };

  const [codeCopied, setCodeCopied] = useState(false);

  const copyTeamCode = () => {
    if (teamSession?.teamNumber) {
      navigator.clipboard.writeText(teamSession.teamNumber);
      setCodeCopied(true);
      toast({
        title: "Team Pass Code Copied!",
        description: `Team code ${teamSession.teamNumber} copied to clipboard.`
      });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (!teamSession) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading competitor dashboard...
      </div>
    );
  }

  const isBGMI = teamSession.game === 'bgmi';
  const currentStatus = teamDetails?.status || teamSession.status || 'active';
  const dqReason = teamDetails?.dq_reason || teamSession.dqReason;

  return (
    <div className="min-h-[calc(100vh-76px)] bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-card border border-border p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/40">
                {isBGMI ? 'BGMI SQUAD BATTLE' : 'EA SPORTS FC MOBILE SOLO'}
              </Badge>
              <Badge className={
                currentStatus === 'active' ? 'bg-primary/20 text-primary border border-primary/30' :
                currentStatus === 'eliminated' ? 'bg-muted text-muted-foreground' :
                'bg-destructive text-destructive-foreground'
              }>
                {currentStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                {teamDetails?.team_name || teamSession.teamName}
              </h1>
              <div className="px-3 py-1 bg-secondary/80 border border-primary/40 rounded-md flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                  PASS: {teamSession.teamNumber}
                </span>
                <button
                  onClick={copyTeamCode}
                  className="p-1 hover:bg-primary/20 rounded text-primary transition-colors"
                  title="Copy Pass Code"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-none uppercase text-xs">
              <Link to="/brackets">Live Brackets</Link>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="rounded-none uppercase text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
            </Button>
          </div>
        </div>

        {/* Disqualification or Elimination Alert */}
        {currentStatus === 'disqualified' && (
          <div className="p-4 bg-destructive/15 border border-destructive/40 text-destructive rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm uppercase">Tournament Disqualification Notice</p>
              <p className="text-xs mt-1 text-destructive/90">
                Reason: {dqReason || 'Violated tournament rules or academic eligibility requirements.'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Please contact the STEM Club referee desk for formal dispute resolution.
              </p>
            </div>
          </div>
        )}

        {/* Venue QR Attendance Pass & Room Credentials */}
        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* QR Code Pass Card */}
          <Card className="md:col-span-5 border-border bg-card shadow-lg relative overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Team QR Attendance Pass
              </CardTitle>
              <CardDescription className="text-xs">
                Scan at the tournament desk to verify physical attendance & unlock Room ID/Password.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white rounded-lg shadow-inner border border-border/80">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${teamSession.teamNumber}`}
                  alt={`QR Code for Team ${teamSession.teamNumber}`}
                  className="w-44 h-44 object-contain"
                />
              </div>
              <div>
                <p className="font-mono font-bold text-sm tracking-widest text-foreground uppercase">{teamSession.teamNumber}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Show this QR Code to referee upon venue entry</p>
              </div>
              {teamDetails?.is_present ? (
                <Badge className="bg-success/20 text-success border-success/40 gap-1 uppercase font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attendance Marked: Present
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 uppercase font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> Attendance Pending
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Attendance-Gated Room Credentials */}
          <Card className="md:col-span-7 border-border bg-card shadow-lg relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base uppercase font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  {isBGMI ? 'Custom Room Credentials' : 'Head-to-Head Match Pass'}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> 10 Mins Prior Protocol
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {teamDetails?.is_present ? (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-success uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Attendance Verified — Room Pass Unlocked
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-1 text-xs">
                    <div className="p-3 bg-background border border-border rounded">
                      <p className="text-muted-foreground uppercase text-[10px] font-bold">{isBGMI ? 'Custom Room ID' : 'Lobby Code'}</p>
                      <p className="font-mono font-bold text-primary text-base mt-1 select-all">
                        {systemSettings?.room_id || 'NOT_SET_YET'}
                      </p>
                    </div>
                    <div className="p-3 bg-background border border-border rounded">
                      <p className="text-muted-foreground uppercase text-[10px] font-bold">Room Password</p>
                      <p className="font-mono font-bold text-foreground text-base mt-1 select-all">
                        {systemSettings?.room_password || 'NOT_SET_YET'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-secondary/60 border border-border rounded-lg text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-warning/80" />
                  <p className="font-bold text-sm text-foreground uppercase">Room Credentials Locked</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Room ID and Password are only visible to teams marked present at the venue. Please present your QR Code on the left to the desk referee.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-secondary/40 border border-border rounded">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Scheduled Match</p>
                  <p className="font-bold text-foreground text-xs mt-0.5">Round 1 (Group Stage)</p>
                </div>
                <div className="p-3 bg-secondary/40 border border-border rounded">
                  <p className="text-muted-foreground uppercase text-[10px] font-bold">Referee Desk</p>
                  <p className="font-bold text-foreground text-xs mt-0.5">STEM Club Main Arena</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BGMI Krafton Roster Breakdown */}
        {isBGMI && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight">Official Squad Roster</h2>
                <p className="text-xs text-muted-foreground">4 Starters + 1 Substitute capacity</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {roster.length}/5 Slots Filled
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((slotNum) => {
                const member = roster.find((m: any) => m.slot === slotNum);
                const isSub = slotNum === 5;

                return (
                  <Card key={slotNum} className={`border-border bg-card ${!member ? 'border-dashed opacity-60' : ''}`}>
                    <CardHeader className="p-3.5 pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="font-mono text-[9px] uppercase">
                          {isSub ? 'Sub 5' : `Slot 0${slotNum}`}
                        </Badge>
                        {member && (
                          <span className="text-[9px] font-bold uppercase text-primary font-mono">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-0 space-y-1.5">
                      {member ? (
                        <>
                          <p className="font-bold text-xs truncate text-foreground">{member.in_game_id}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">UID: {member.uid}</p>
                          <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground flex justify-between">
                            <span>Adm: {member.admission_no}</span>
                            <span>{member.class_section}</span>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-[11px] text-muted-foreground font-mono">Empty Slot</p>
                          <p className="text-[9px] text-muted-foreground mt-1">Use team code to join</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tournament Performance Stats */}
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
                <span>Tournament Standing</span>
                <Trophy className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-primary">
                  #{leaderboardData?.rank_position || '—'}
                </span>
                <span className="text-xs text-muted-foreground">in official rankings</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Total Points</span>
                  <p className="font-bold font-mono text-foreground">{leaderboardData?.points || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Matches Played</span>
                  <p className="font-bold font-mono text-foreground">{leaderboardData?.matches_played || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
                <span>Win Ratio</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-foreground">
                  {leaderboardData?.matches_played
                    ? `${Math.round((leaderboardData.wins / leaderboardData.matches_played) * 100)}%`
                    : '0%'}
                </span>
                <span className="text-xs text-muted-foreground">win rate</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Wins</span>
                  <p className="font-bold font-mono text-emerald-400">{leaderboardData?.wins || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Defeats</span>
                  <p className="font-bold font-mono text-destructive">{leaderboardData?.losses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
                <span>Competitor Identity</span>
                <Shield className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered Game:</span>
                <span className="font-bold uppercase text-foreground">{teamSession.game}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admission No:</span>
                <span className="font-mono text-foreground">{teamDetails?.admission_no || 'Verified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier / OVR:</span>
                <span className="font-mono text-primary font-bold">
                  {teamDetails?.team_ovr ? `OVR ${teamDetails.team_ovr}` : (teamDetails?.player_rank || 'Crown')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Logs */}
        <Card className="border-border bg-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm uppercase font-bold">Match Result Logs</CardTitle>
            <CardDescription className="text-xs">
              Recorded match outcomes published by referee desk.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {matchHistory.length > 0 ? (
              <div className="space-y-2">
                {matchHistory.map((match: any) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-secondary/60 border border-border rounded-lg text-xs">
                    <div>
                      <p className="font-bold uppercase">{match.game}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {new Date(match.match_date).toLocaleDateString()} {match.notes ? `· ${match.notes}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <Badge className={
                        match.result === 'win' ? 'bg-primary text-primary-foreground' :
                        match.result === 'loss' ? 'bg-destructive text-destructive-foreground' : 'bg-muted'
                      }>
                        {match.result?.toUpperCase()}
                      </Badge>
                      <span className="font-mono font-bold text-primary">+{match.points_earned} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                No tournament matches recorded yet. Match logs will appear here as games conclude.
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
