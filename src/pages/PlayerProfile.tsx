import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  UserRound, LogOut, ArrowUpRight, Save, Shield, CreditCard, Upload,
  CheckCircle2, Clock, XCircle, Link as LinkIcon, Gamepad2, Award,
  Image as ImageIcon, Calendar, FileText, School, Sparkles, Check, Copy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/hooks/usePlayer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function PlayerProfile() {
  const { user, loading } = usePlayer();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Game Profile state
  const [selectedEntryTeam, setSelectedEntryTeam] = useState<string>('');
  const [inGameId, setInGameId] = useState('');
  const [uid, setUid] = useState('');
  const [rank, setRank] = useState('');
  const [level, setLevel] = useState<number | ''>('');
  const [teamOvr, setTeamOvr] = useState<number | ''>('');
  const [admNo, setAdmNo] = useState('');
  const [classSec, setClassSec] = useState('');
  const [idScreenshot, setIdScreenshot] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState(false);

  // Payment upload fields state
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [refNum, setRefNum] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['playerOwnProfile', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: entries = [], refetch, error } = useQuery({
    queryKey: ['playerOwnEntries', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from('player_entries').select('id,team_number,game,created_at');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: registrations = [], refetch: refetchRegs } = useQuery({
    queryKey: ['playerRegistrationsDetails', entries.map(e => e.team_number).join(',')],
    enabled: entries.length > 0,
    queryFn: async () => {
      const teamNums = entries.map(e => e.team_number);
      const { data, error } = await supabase.from('registrations').select('*').in('team_number', teamNums);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: matchDays = [] } = useQuery({
    queryKey: ['playerSchedule'],
    queryFn: async () => {
      const { data, error } = await supabase.from('match_days').select('*').order('date', { ascending: true }).limit(5);
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    }
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['playerPaymentSubmissions', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_submissions').select('*');
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    if (registrations.length > 0 && !selectedEntryTeam) {
      setSelectedEntryTeam(registrations[0].team_number);
    }
  }, [registrations, selectedEntryTeam]);

  useEffect(() => {
    if (selectedEntryTeam) {
      const target = registrations.find(r => r.team_number === selectedEntryTeam);
      if (target) {
        setInGameId(target.in_game_id || '');
        setUid(target.uid || target.team_uid || '');
        setRank(target.player_rank || '');
        setLevel(target.player_level || '');
        setTeamOvr(target.team_ovr || '');
        setAdmNo(target.admission_no || '');
        setClassSec(target.class_section || '');
      }
    }
  }, [selectedEntryTeam, registrations]);

  if (loading) return <main className="container py-16 text-muted-foreground text-sm">Loading player account…</main>;
  if (!user) return <Navigate to="/player-login" replace />;

  const selectedReg = registrations.find(r => r.team_number === selectedEntryTeam);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id);
    setMessage(error ? error.message : 'Personal display name updated.');
    setBusy(false);
  };

  const saveGameProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryTeam) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.from('registrations').update({
        in_game_id: inGameId.trim(),
        uid: uid.trim(),
        team_uid: uid.trim(),
        player_rank: rank.trim(),
        player_level: level !== '' ? Number(level) : null,
        team_ovr: teamOvr !== '' ? Number(teamOvr) : null,
        admission_no: admNo.trim(),
        class_section: classSec.trim()
      }).eq('team_number', selectedEntryTeam);

      if (error) throw error;
      setMessage(`Game profile updated for pass ${selectedEntryTeam}.`);
      void refetchRegs();
    } catch (err: any) {
      setMessage(err.message || 'Could not update game profile.');
    } finally {
      setBusy(false);
    }
  };

  const uploadIdProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idScreenshot || !selectedEntryTeam) {
      setMessage('Please select a profile screenshot file.');
      return;
    }
    setUploadingId(true);
    setMessage('');
    try {
      const ext = idScreenshot.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/id-${selectedEntryTeam}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('payment-proofs').upload(path, idScreenshot);
      if (uploadErr) throw uploadErr;

      setMessage(`Profile screenshot uploaded successfully for pass ${selectedEntryTeam}. Referees will verify your in-game identity.`);
      setIdScreenshot(null);
    } catch (err: any) {
      setMessage(err.message || 'Could not upload screenshot proof.');
    } finally {
      setUploadingId(false);
    }
  };

  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc('claim_player_entry', { code: code.trim().toUpperCase(), entry_password: password });
    setMessage(error ? error.message : 'Tournament entry linked to your profile.');
    if (!error) {
      setPassword('');
      setCode('');
      void refetch();
      void refetchRegs();
    }
    setBusy(false);
  };

  const submitPayment = async (e: React.FormEvent, entryId: string) => {
    e.preventDefault();
    if (!file || !refNum.trim()) {
      setMessage('Please select a payment receipt image/pdf and enter transaction reference.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${entryId}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('payment-proofs').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error: rpcErr } = await supabase.rpc('submit_payment_proof', {
        entry_id: entryId,
        object_path: path,
        reference: refNum.trim()
      });
      if (rpcErr) throw rpcErr;

      setMessage('Payment proof submitted for referee review.');
      setRefNum('');
      setFile(null);
      setActiveEntryId(null);
      void refetchPayments();
    } catch (err: any) {
      setMessage(err.message || 'Could not submit payment proof.');
    } finally {
      setUploading(false);
    }
  };

  const copyPassport = () => {
    const text = `SAPIENCE ESPORTS PASSPORT\nCompetitor: ${profile?.display_name || user.email}\nEmail: ${user.email}\nLinked Passes: ${entries.length}\nGenerated: ${new Date().toLocaleDateString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="container max-w-6xl px-5 py-8 md:py-12 min-h-[80vh] space-y-8">
      {/* 1. Feature 1: Player Passport Header & Badges */}
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
            <UserRound className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">
                {profile?.display_name || 'Competitor Profile'}
              </h1>
              <Badge className="bg-primary text-black font-bold uppercase text-[10px] gap-1">
                <Sparkles className="w-3 h-3" /> Verified Player
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                Linked Entries: {entries.length}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono uppercase border-success/40 text-success">
                Sapience Cup 2026 Ready
              </Badge>
            </div>
          </div>
        </div>

        {/* 11. Feature 11 & 12: E-Pass Copy & Logout */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={copyPassport} className="text-xs uppercase font-bold">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-success" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'E-Pass Copied' : 'Copy Digital E-Pass'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void supabase.auth.signOut()} className="text-xs uppercase font-bold text-destructive">
            <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Tabs Dashboard */}
      <Tabs defaultValue="entries" className="w-full space-y-6">
        <TabsList className="w-full flex flex-wrap h-auto p-1 bg-secondary border border-border rounded-md justify-start gap-1">
          <TabsTrigger value="entries" className="text-xs font-bold uppercase py-2 px-4 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" /> Tournament Passes ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="game-profile" className="text-xs font-bold uppercase py-2 px-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Game Profile & ID Upload
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs font-bold uppercase py-2 px-4 flex items-center gap-2">
            <UserRound className="w-4 h-4 text-primary" /> Account & Details
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs font-bold uppercase py-2 px-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Fixtures & Match Schedule
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TOURNAMENT PASSES & PAYMENTS */}
        <TabsContent value="entries" className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Active Passes Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" /> Active Tournament Passes
                </h2>
                <Button asChild size="sm" variant="default">
                  <Link to="/register">Register New Entry <ArrowUpRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>

              {error && <p role="alert" className="text-sm text-destructive">Unable to load entries. Please refresh.</p>}

              {entries.length === 0 ? (
                <Card className="border-border bg-card p-8 text-center text-muted-foreground">
                  <Award className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-bold text-foreground">No tournament entries linked yet.</p>
                  <p className="text-xs mt-1">Register for BGMI or EA SPORTS FC™ Mobile to join Sapience Cup 2026.</p>
                </Card>
              ) : (
                entries.map((entry) => {
                  const payment = payments.find((p: any) => p.player_entry_id === entry.id);
                  const reg = registrations.find(r => r.team_number === entry.team_number);
                  const isBgmi = entry.game === 'bgmi';

                  return (
                    <Card key={entry.id} className="border-border bg-card shadow-md">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                          <div>
                            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/40 mb-1">
                              {isBgmi ? 'BGMI SQUAD' : 'FC MOBILE SOLO'}
                            </Badge>
                            <p className="text-2xl font-mono font-bold tracking-wider text-foreground">{entry.team_number}</p>
                            {reg?.team_name && (
                              <p className="text-xs text-muted-foreground font-semibold">Squad Name: {reg.team_name}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Feature 7: Live Status Badges */}
                            {payment ? (
                              payment.status === 'verified' ? (
                                <Badge className="bg-success/20 text-success border-success/40 gap-1 uppercase font-mono text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                </Badge>
                              ) : payment.status === 'rejected' ? (
                                <Badge variant="destructive" className="gap-1 uppercase font-mono text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Rejected
                                </Badge>
                              ) : (
                                <Badge className="bg-warning/20 text-warning border-warning/40 gap-1 uppercase font-mono text-[11px]">
                                  <Clock className="w-3.5 h-3.5" /> Pending Review
                                </Badge>
                              )
                            ) : (
                              <Badge variant="secondary" className="gap-1 uppercase font-mono text-[11px]">
                                <CreditCard className="w-3.5 h-3.5" /> Payment Due
                              </Badge>
                            )}

                            {/* Feature 9: Direct Competitor Portal Launch */}
                            <Button asChild variant="outline" size="sm" className="font-bold text-xs uppercase">
                              <Link to="/team-login">Competitor Portal <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                            </Button>
                          </div>
                        </div>

                        {/* Feature 8: Payment Proof Upload */}
                        {payment ? (
                          <div className="p-3 bg-secondary/50 border border-border rounded text-xs space-y-1">
                            <div className="flex justify-between font-mono text-muted-foreground">
                              <span>Ref: {payment.transaction_reference}</span>
                              <span>Amount: ₹{payment.amount}</span>
                            </div>
                            {payment.review_note && (
                              <p className="text-destructive font-semibold mt-1">Referee Note: {payment.review_note}</p>
                            )}
                            {payment.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="link"
                                className="px-0 text-primary text-xs h-auto mt-2"
                                onClick={() => setActiveEntryId(activeEntryId === entry.id ? null : entry.id)}
                              >
                                Re-upload Payment Receipt
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="pt-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full uppercase text-xs font-bold"
                              onClick={() => setActiveEntryId(activeEntryId === entry.id ? null : entry.id)}
                            >
                              <Upload className="w-3.5 h-3.5 mr-2" /> Upload Payment Proof (₹{isBgmi ? '200' : '300'})
                            </Button>
                          </div>
                        )}

                        {activeEntryId === entry.id && (
                          <form onSubmit={(e) => submitPayment(e, entry.id)} className="p-4 bg-secondary/80 border border-border rounded-md space-y-3 mt-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Submit Payment Verification</p>
                            <div className="space-y-1">
                              <Label className="text-xs">Transaction Ref / UPI Ref ID</Label>
                              <Input
                                placeholder="e.g. 402910839210 or UPI-1039"
                                value={refNum}
                                onChange={(e) => setRefNum(e.target.value)}
                                required
                                className="bg-background text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Receipt Image / PDF Proof</Label>
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                                className="bg-background text-xs"
                              />
                            </div>
                            <Button type="submit" size="sm" disabled={uploading} className="w-full uppercase font-bold text-xs">
                              {uploading ? 'Uploading...' : 'Submit Verification Proof'}
                            </Button>
                          </form>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Feature 6: Link Entry Pass Column */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" /> Link Entry Pass
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connect an existing squad code or FC Mobile pass to your passport.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <form onSubmit={claim} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="claimCode" className="text-xs uppercase font-bold text-muted-foreground">Entry Code</Label>
                      <Input id="claimCode" placeholder="e.g. 100045 or FCM-1048" value={code} onChange={e => setCode(e.target.value)} required maxLength={60} className="font-mono uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="claimPassword" className="text-xs uppercase font-bold text-muted-foreground">Pass Password</Label>
                      <Input id="claimPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} required maxLength={100} />
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={busy} className="w-full font-bold uppercase text-xs">
                      Link Entry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: GAME PROFILE & IN-GAME ID SCREENSHOT */}
        <TabsContent value="game-profile" className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Feature 3 & 5: Game Profile Stats & School Info */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-primary" /> In-Game Profile Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your gamer tag, character ID/UID, rank, and school details for tournament verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  {entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Please link or register a tournament pass first.</p>
                  ) : (
                    <form onSubmit={saveGameProfile} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Select Tournament Pass</Label>
                        <select
                          className="w-full bg-background border border-border rounded p-2 text-xs font-mono"
                          value={selectedEntryTeam}
                          onChange={e => setSelectedEntryTeam(e.target.value)}
                        >
                          {entries.map(e => (
                            <option key={e.id} value={e.team_number}>
                              {e.team_number} ({e.game.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">In-Game Name (IGN)</Label>
                          <Input value={inGameId} onChange={e => setInGameId(e.target.value)} placeholder="e.g. Soul_Mortal" className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Character UID / ID</Label>
                          <Input value={uid} onChange={e => setUid(e.target.value)} placeholder="e.g. 5120394812" className="text-xs font-mono" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">In-Game Rank</Label>
                          <Input value={rank} onChange={e => setRank(e.target.value)} placeholder="Ace / Champion" className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Player Level</Label>
                          <Input type="number" value={level} onChange={e => setLevel(e.target.value ? Number(e.target.value) : '')} placeholder="65" className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Team OVR (FC Mobile)</Label>
                          <Input type="number" value={teamOvr} onChange={e => setTeamOvr(e.target.value ? Number(e.target.value) : '')} placeholder="102" className="text-xs" />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">School Admission No</Label>
                          <Input value={admNo} onChange={e => setAdmNo(e.target.value)} placeholder="e.g. S-2024-88" className="text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Class & Section</Label>
                          <Input value={classSec} onChange={e => setClassSec(e.target.value)} placeholder="e.g. X-A" className="text-xs" />
                        </div>
                      </div>

                      <Button type="submit" variant="default" size="sm" disabled={busy} className="w-full font-bold uppercase text-xs">
                        <Save className="w-4 h-4 mr-2" /> Save Game Profile Data
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Feature 4: In-Game Profile / ID Screenshot Upload */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Profile Screenshot Verification
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload a screenshot of your in-game profile or squad screen for quick referee badge verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <form onSubmit={uploadIdProof} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Target Pass Code</Label>
                      <Input value={selectedEntryTeam} disabled className="bg-secondary text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Select In-Game Screenshot</Label>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => setIdScreenshot(e.target.files?.[0] || null)}
                        required
                        className="bg-background text-xs"
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={uploadingId || !selectedEntryTeam} className="w-full font-bold uppercase text-xs">
                      <Upload className="w-3.5 h-3.5 mr-2" /> {uploadingId ? 'Uploading Screenshot...' : 'Upload Profile Screenshot'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: ACCOUNT & PERSONAL DETAILS */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Feature 2: Display Name Management */}
            <Card className="border-border bg-card">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-primary" /> Personal Competitor Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Your primary name displayed on match brackets and public leaderboards.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="profileName" className="text-xs uppercase font-bold text-muted-foreground">Display Name</Label>
                    <Input id="profileName" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Account Email</Label>
                    <Input value={user.email || ''} disabled className="bg-secondary text-xs font-mono" />
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={busy} className="w-full font-bold uppercase text-xs">
                    <Save className="w-4 h-4 mr-2" /> Save Personal Name
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                  <School className="w-4 h-4 text-primary" /> Sapience School Student Record
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3 text-xs text-muted-foreground">
                <p>Official Sapience Cup 2026 competitors must adhere to school guidelines.</p>
                <div className="p-3 bg-secondary rounded border border-border space-y-1">
                  <p className="font-bold text-foreground">School Approval Status: Pending Review</p>
                  <p>All registered students are eligible for official trophy certificates and prizes upon verification.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: FEATURE 10 - FIXTURES & MATCH SCHEDULE */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Upcoming Match Fixtures
              </CardTitle>
              <CardDescription className="text-xs">
                Check official dates and timings for upcoming BGMI and FC Mobile tournament rounds.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {matchDays.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming match days scheduled yet.</p>
              ) : (
                matchDays.map((m: any) => (
                  <div key={m.id} className="p-3 bg-secondary/60 border border-border rounded flex justify-between items-center text-xs">
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase text-primary font-mono mb-1">
                        {m.game.toUpperCase()}
                      </Badge>
                      <p className="font-bold text-foreground">{m.description || 'Tournament Round Match'}</p>
                    </div>
                    <div className="text-right font-mono text-muted-foreground">
                      <p className="text-foreground font-bold">{m.date}</p>
                      <p>{m.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {message && (
        <div role="status" className="p-4 bg-secondary border border-border rounded-lg text-sm text-foreground font-mono">
          {message}
        </div>
      )}
    </main>
  );
}