import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Lock, 
  Shield, 
  ArrowRight, 
  Gamepad2, 
  Eye, 
  EyeOff, 
  Trophy, 
  UserCheck,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';

export default function TeamLogin() {
  const [activeTab, setActiveTab] = useState<'squad' | 'solo'>('squad');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Roster Public Lookup (without password)
  const [lookupCode, setLookupCode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [rosterResult, setRosterResult] = useState<any>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim().toUpperCase();

    if (!cleanId || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both your ID and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: records, error } = await supabase
        .from('registrations')
        .select('*')
        .ilike('team_number', cleanId);

      if (error || !records || records.length === 0) {
        toast({
          title: "Account Not Found",
          description: `No registration found for ID "${cleanId}". Please verify your credentials.`,
          variant: "destructive",
        });
        return;
      }

      const data = records[0];

      // Check password
      if (data.password_hash !== password.trim()) {
        toast({
          title: "Invalid Password",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Store authenticated team session
      sessionStorage.setItem('teamSession', JSON.stringify({
        teamNumber: data.team_number,
        teamName: data.team_name || data.full_name,
        game: data.game,
        entryType: data.entry_type,
        status: data.status || 'active',
        dqReason: data.dq_reason,
        admissionNo: data.admission_no,
        inGameId: data.in_game_id,
        uid: data.uid,
        teamOvr: data.team_ovr,
        playerRank: data.player_rank
      }));

      toast({
        title: "Welcome Back, Champion!",
        description: `Logged in as ${data.team_name || data.full_name} (${data.team_number}).`,
      });

      navigate('/team-dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupCode.trim().toUpperCase();
    if (!clean) return;

    setIsLookingUp(true);
    setRosterResult(null);

    try {
      const { data: team, error: teamErr } = await supabase
        .from('registrations')
        .select('team_number, team_name, game, status, full_name')
        .eq('team_number', clean)
        .maybeSingle();

      if (teamErr || !team) {
        toast({
          title: "Not Found",
          description: `No team or player registered with code ${clean}.`,
          variant: "destructive"
        });
        return;
      }

      const { data: members } = await supabase
        .from('team_members')
        .select('slot, role, in_game_id, uid')
        .eq('team_number', clean)
        .order('slot');

      setRosterResult({
        ...team,
        members: members || []
      });
    } catch (err: any) {
      toast({ title: "Lookup Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            Sapience Cup 2026 · Competitor Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
            Player & Team <span className="text-primary">Login</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Access your team roster, bracket seeding, live match scores, and room credentials.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Main Login Card */}
          <div className="md:col-span-7">
            <Card className="border-border bg-card shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
              
              <CardHeader className="p-6 pb-4">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary border border-border rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('squad'); setIdentifier(''); }}
                    className={`py-2 text-xs font-bold uppercase transition-all rounded ${
                      activeTab === 'squad'
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                    BGMI Squad
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('solo'); setIdentifier(''); }}
                    className={`py-2 text-xs font-bold uppercase transition-all rounded ${
                      activeTab === 'solo'
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5 inline mr-1.5" />
                    FC Mobile Solo
                  </button>
                </div>

                <CardTitle className="text-lg uppercase font-bold flex items-center justify-between">
                  <span>{activeTab === 'squad' ? 'Squad Captain Sign In' : 'Solo Competitor Sign In'}</span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/40 text-primary">
                    {activeTab === 'squad' ? 'TEAM CODE' : 'SOLO ID'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {activeTab === 'squad' 
                    ? 'Enter your squad team code (e.g., TEAM1001 or BGMI-XXXX) and password.' 
                    : 'Enter your solo player ID (e.g., FCM-XXXX) and password.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-2">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {activeTab === 'squad' ? 'Squad Team Code' : 'Player Match Pass ID'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={activeTab === 'squad' ? "e.g. TEAM1001 or BGMI-4819" : "e.g. FCM-1048"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                        className="font-mono uppercase font-bold tracking-wider bg-secondary/80 border-border text-foreground h-11 pl-10"
                        required
                      />
                      <Users className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Account Password
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter the password set at registration"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-secondary/80 border-border text-foreground h-11 pl-10 pr-10"
                        required
                      />
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 font-bold uppercase tracking-wider text-xs rounded-none bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Verifying Credentials...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Open Tournament Dashboard <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                  <span>Haven't registered yet?</span>
                  <Link to="/register" className="text-primary hover:underline font-bold uppercase flex items-center gap-1">
                    Register New Entry <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Roster Status Lookup */}
          <div className="md:col-span-5 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm uppercase font-bold flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Public Squad Pass Lookup
                </CardTitle>
                <CardDescription className="text-xs">
                  Teammate checking roster slots or match status? Enter your team code below without password.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form onSubmit={handleQuickLookup} className="flex gap-2 mb-4">
                  <Input
                    placeholder="e.g. TEAM1001"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase bg-secondary border-border"
                  />
                  <Button type="submit" size="sm" disabled={isLookingUp} className="rounded-none uppercase font-bold text-xs">
                    {isLookingUp ? '...' : 'Check'}
                  </Button>
                </form>

                {rosterResult && (
                  <div className="p-3.5 bg-secondary/50 border border-border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-foreground">{rosterResult.team_name}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">ID: {rosterResult.team_number} · {rosterResult.game.toUpperCase()}</p>
                      </div>
                      <Badge className={
                        rosterResult.status === 'active' ? 'bg-primary/20 text-primary border-primary/40' :
                        rosterResult.status === 'eliminated' ? 'bg-muted text-muted-foreground' :
                        'bg-destructive/20 text-destructive border-destructive/40'
                      }>
                        {rosterResult.status?.toUpperCase()}
                      </Badge>
                    </div>

                    {rosterResult.members.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border/60">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                          Roster ({rosterResult.members.length}/5 Slots):
                        </span>
                        {rosterResult.members.map((m: any) => (
                          <div key={m.slot} className="flex justify-between items-center text-xs bg-background/60 px-2.5 py-1.5 border border-border/40">
                            <span className="font-mono text-[11px] text-muted-foreground">Slot {m.slot} ({m.role}):</span>
                            <span className="font-bold text-foreground">{m.in_game_id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fair Play Notice */}
            <div className="p-4 bg-secondary/30 border border-border/80 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-foreground">
                <Trophy className="w-4 h-4 text-primary" />
                Tournament Credentials Rules
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                • Custom BGMI Room ID & Password are published inside your Team Dashboard exactly 10 minutes before match time.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                • EA SPORTS FC™ Mobile opponents and scheduled kickoff times are synced directly from the tournament bracket.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
