import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { UserRound, LogOut, ArrowUpRight, Save, Shield, CreditCard, Upload, CheckCircle2, Clock, XCircle, Link as LinkIcon, Gamepad2, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/hooks/usePlayer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PlayerProfile() {
  const { user, loading } = usePlayer();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

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

  if (loading) return <main className="container py-16 text-muted-foreground text-sm">Loading player account…</main>;
  if (!user) return <Navigate to="/player-login" replace />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id);
    setMessage(error ? error.message : 'Profile updated successfully.');
    setBusy(false);
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

  return (
    <main className="container max-w-5xl px-5 py-10 md:py-14 min-h-[75vh] space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase mb-2">
            <Shield className="w-4 h-4" /> Sapience eSports Passport
          </div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <UserRound className="text-primary w-8 h-8" />
            {profile?.display_name || 'Competitor Profile'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void supabase.auth.signOut()}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personal Profile & Linking */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                <UserRound className="w-4 h-4 text-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={save} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profileName" className="text-xs uppercase font-bold text-muted-foreground">Display Name</Label>
                  <Input id="profileName" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} />
                </div>
                <Button type="submit" variant="outline" size="sm" disabled={busy} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base uppercase font-bold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" /> Link Entry Pass
              </CardTitle>
              <CardDescription className="text-xs">
                Already created a squad or solo pass? Connect it to your profile.
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
                <Button type="submit" variant="outline" size="sm" disabled={busy} className="w-full">
                  Link Entry
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tournament Entries & Payment Uploads */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
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
                      </div>

                      <div className="flex items-center gap-2">
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

                        <Button asChild variant="outline" size="sm" className="font-bold text-xs uppercase">
                          <Link to="/team-login">Competitor Portal <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                        </Button>
                      </div>
                    </div>

                    {/* Payment Status & Submission Box */}
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

                    {/* Expandable Upload Form */}
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
      </div>

      {message && (
        <div role="status" className="p-4 bg-secondary border border-border rounded-lg text-sm text-foreground font-mono">
          {message}
        </div>
      )}
    </main>
  );
}