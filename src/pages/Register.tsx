import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Copy, Check, Users, UserRound, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/hooks/usePlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import battleground from '@/assets/sapience-battleground.jpg';
import football from '@/assets/sapience-football.jpg';
import { registrationFee, registrationFeeLabel } from '@/lib/registration-fees';

const roles = ['IGL', 'Fragger', 'Sniper', 'Scout', 'Support'];
const ranks = ['Conqueror', 'Ace Dominator', 'Ace Master', 'Ace', 'Crown', 'Diamond', 'Platinum'];
const divisions = ['FC Champion', 'Legendary', 'World Class', 'Pro', 'Amateur'];
export default function Register() {
  const [params] = useSearchParams();
  const { user, loading: playerLoading } = usePlayer();
  const queryClient = useQueryClient();
  const [game, setGame] = useState(params.get('game') === 'fc-mobile' ? 'fc-mobile' : 'bgmi');
  const [mode, setMode] = useState('create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState<{ name: string; count: number; code: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [fields, setFields] = useState({ full_name: '', admission_no: '', class_section: '', phone_number: '', in_game_id: '', uid: '', team_name: '', password: '', role: 'Fragger', player_rank: 'Crown', player_level: '', team_ovr: '', fcDivision: 'Legendary' });
  const update = (key: keyof typeof fields, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  const { data: settings, isLoading, error: settingsError } = useQuery({ queryKey: ['registrationAdmissionStatus'], queryFn: async () => { const { data, error } = await supabase.from('system_settings').select('registration_open').eq('id', 1).single(); if (error) throw error; return data; } });
  const closed = settings?.registration_open !== true;
  const bgmi = game === 'bgmi';
  const joining = bgmi && mode === 'join';
  const verify = async () => {
    setChecking(true); setError(''); setVerified(null);
    try {
      const clean = code.trim().toUpperCase();
      const { data: team, error } = await supabase.from('registrations').select('team_number,team_name,game,status').eq('team_number', clean).maybeSingle();
      if (error) throw error;
      if (!team || team.game !== 'bgmi') throw new Error('No BGMI squad found with this code.');
      if (!['active', 'waitlisted'].includes(team.status || 'active')) throw new Error('This squad is not accepting players.');
      const { data: members, error: membersErr } = await supabase.from('team_members').select('id').eq('team_number', clean);
      let count = members?.length || 0;
      if (membersErr || count === 0) {
        const { data: roster } = await supabase.rpc('squad_roster', { code: clean });
        count = roster?.length || 0;
      }
      if (count >= 5) throw new Error('This squad already has 5 players.');
      setVerified({ name: team.team_name || 'BGMI squad', count, code: clean });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not look up this squad.'); }
    finally { setChecking(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (closed) { setError('Sapience Cup 2026 is under school approval. Entries are not being accepted yet.'); return; }
    if (!user) { setError('Sign in to your player account first.'); return; }
    if (joining && (!verified || verified.code !== code.trim().toUpperCase())) { setError('Check your squad code first.'); return; }
    setBusy(true);
    try {
      const payload = { ...fields, full_name: fields.full_name.trim(), admission_no: fields.admission_no.trim(), class_section: fields.class_section.trim(), phone_number: fields.phone_number.trim(), uid: fields.uid.trim(), in_game_id: fields.in_game_id.trim(), game, mode: bgmi ? mode : 'solo', team_code: joining ? verified?.code : '', role: bgmi && !joining ? 'IGL' : fields.role, player_rank: bgmi ? fields.player_rank : fields.fcDivision, player_level: bgmi ? fields.player_level : '', team_ovr: bgmi ? '' : fields.team_ovr };
      const { data, error } = await supabase.rpc('register_player_entry', { payload });
      if (error) throw error;
      if (!data) throw new Error('No entry code returned. Please contact the tournament desk.');
      setResult(data); update('password', '');
      void queryClient.invalidateQueries({ queryKey: ['playerOwnEntries', user.id] });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to register. Try again.'); }
    finally { setBusy(false); }
  };
  const field = (key: keyof typeof fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div className="space-y-2"><Label htmlFor={key}>{label}</Label><Input id={key} value={fields[key]} onChange={event => update(key, event.target.value)} required maxLength={100} {...props}/></div>;
  return <main className="container px-5 max-w-6xl py-10 md:py-14">
    <header className="border-b border-border pb-8"><p className="section-label">Sapience Cup 2026</p><h1 className="text-3xl sm:text-4xl font-bold mt-3">Tournament entry</h1><p className="text-sm text-muted-foreground mt-3">The Sapience School · Open tournament · Class 9 and above</p></header>
    {result ? <section className="py-14 max-w-xl"><Check className="w-9 h-9 text-success"/><h2 className="text-3xl font-bold mt-5">{joining ? 'You’re on the roster.' : 'Your entry is saved.'}</h2><p className="text-sm text-muted-foreground mt-3">{joining ? verified?.name : bgmi ? fields.team_name : 'EA SPORTS FC™ Mobile'}</p><div className="flex items-center justify-between gap-4 border-y border-border py-6 my-7"><div className="min-w-0"><p className="section-label">{bgmi ? 'Squad code' : 'Solo pass'}</p><p className="font-mono text-3xl break-all mt-2">{result}</p></div><Button variant="outline" size="icon" aria-label="Copy entry code" onClick={async () => { try { await navigator.clipboard.writeText(result); setCopied(true); } catch { setError('Could not copy the code.'); } }}>{copied ? <Check/> : <Copy/>}</Button></div>{bgmi && !joining && <p className="text-sm text-warning mb-7">Your squad needs at least 4 players before it is match-ready.</p>}<Button asChild><Link to="/player-profile">My player profile<ArrowRight/></Link></Button>{error && <p role="alert">{error}</p>}</section> : <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8 lg:gap-14 mt-8">
      <aside className="min-w-0"><img src={bgmi ? battleground : football} alt={bgmi ? 'BGMI squad battleground' : 'FC Mobile football tournament'} className="aspect-[16/9] lg:aspect-[4/3] object-cover w-full"/><p className="section-label mt-5">{bgmi ? 'Squad battle royale' : '1v1 knockout'}</p><h2 className="text-2xl font-bold mt-2">{bgmi ? 'BGMI' : 'EA SPORTS FC™ Mobile'}</h2><dl className="mt-6 text-sm space-y-4"><div className="flex justify-between border-b border-border pb-4"><dt className="text-muted-foreground">Format</dt><dd>{bgmi ? '4 + 1 substitute' : 'H2H / VSA'}</dd></div><div className="flex justify-between border-b border-border pb-4"><dt className="text-muted-foreground">Platform</dt><dd>Mobile only</dd></div><div className="flex justify-between border-b border-border pb-4"><dt className="text-muted-foreground">Dates</dt><dd>To be announced</dd></div></dl><Button asChild variant="link" className="px-0 mt-3"><Link to="/rules">Official rulebook<ArrowRight className="w-4 h-4"/></Link></Button></aside>
      <div className="min-w-0">
        <Tabs value={game} onValueChange={value => { setGame(value); setError(''); setVerified(null); }}><TabsList className="w-full sm:w-auto"><TabsTrigger value="bgmi"><Users className="w-4 h-4 mr-2"/>BGMI</TabsTrigger><TabsTrigger value="fc-mobile"><UserRound className="w-4 h-4 mr-2"/>FC Mobile</TabsTrigger></TabsList></Tabs>
        <div className="py-5 border-b border-border flex flex-wrap justify-between items-center gap-2">
          <p className="text-sm text-muted-foreground">Registration charge</p>
          <div className="sm:text-right"><p className="font-display text-lg font-bold text-primary">{registrationFeeLabel(bgmi ? 'bgmi' : 'fc-mobile')}</p>{bgmi && <p className="text-xs text-muted-foreground mt-1">₹{registrationFee('bgmi', 5).toLocaleString('en-IN')} for a full team · 4 players + 1 substitute</p>}</div>
        </div>
        <div role="status" className="flex gap-3 py-5 mt-3 border-b border-border text-sm"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-warning"/><p className="text-muted-foreground">{isLoading ? 'Checking tournament status…' : settingsError ? 'Tournament status unavailable. Entries are paused.' : closed ? 'Sapience Cup 2026 is under school approval. Entries are not being accepted yet.' : 'Entries are being accepted.'}</p></div>
        {!user && !playerLoading && <div className="flex flex-wrap items-center justify-between gap-3 py-5 border-b border-border"><p className="text-sm text-muted-foreground">Your entry belongs to your player account.</p><Button asChild variant="outline" size="sm"><Link to="/player-login">Player sign in<ArrowRight/></Link></Button></div>}
        <form onSubmit={submit}>
          {bgmi && <section className="registration-section"><h2 className="text-lg font-bold mb-4">Squad</h2><Tabs value={mode} onValueChange={value => { setMode(value); setVerified(null); setError(''); }}><TabsList className="w-full sm:w-auto"><TabsTrigger value="create">Create squad</TabsTrigger><TabsTrigger value="join">Join squad</TabsTrigger></TabsList></Tabs>{joining ? <div className="mt-5 space-y-2"><Label htmlFor="squadCode">Squad code</Label><div className="flex gap-2"><Input id="squadCode" value={code} maxLength={60} onChange={event => { setCode(event.target.value); setVerified(null); }} required/><Button type="button" variant="outline" disabled={checking || !code.trim()} onClick={() => void verify()}>{checking ? 'Checking…' : 'Check'}</Button></div>{verified && <p className="text-sm text-success">{verified.name} · {verified.count}/5 players</p>}</div> : <div className="mt-5">{field('team_name', 'Squad name', { minLength: 2, maxLength: 60 })}</div>}</section>}
          <section className="registration-section"><h2 className="text-lg font-bold mb-5">Student details</h2><div className="grid sm:grid-cols-2 gap-5">{field('full_name', 'Full name', { autoComplete: 'name', minLength: 2 })}{field('admission_no', 'Admission number', { minLength: 2, maxLength: 50 })}{field('class_section', 'Class & section', { placeholder: '10-A', pattern: '(9|10|11|12)([^0-9].*)?', title: 'Class 9, 10, 11 or 12 with your section' })}{field('phone_number', 'Contact / WhatsApp number', { type: 'tel', autoComplete: 'tel', pattern: '[0-9+ ()\\-]{7,20}', maxLength: 20 })}</div></section>
          <section className="registration-section"><h2 className="text-lg font-bold mb-5">Game profile</h2><div className="grid sm:grid-cols-2 gap-5">{field('in_game_id', 'In-game name', { minLength: 2, maxLength: 60 })}{field('uid', 'In-game UID', { minLength: 3, maxLength: 60 })}<div className="space-y-2"><Label htmlFor="rank">{bgmi ? 'Current rank' : 'H2H division'}</Label><Select value={bgmi ? fields.player_rank : fields.fcDivision} onValueChange={value => update(bgmi ? 'player_rank' : 'fcDivision', value)}><SelectTrigger id="rank"><SelectValue/></SelectTrigger><SelectContent>{(bgmi ? ranks : divisions).map(rank => <SelectItem value={rank} key={rank}>{rank}</SelectItem>)}</SelectContent></Select></div>{bgmi ? field('player_level', 'Player level', { type: 'number', required: false, min: 1, step: 1 }) : field('team_ovr', 'Team OVR', { type: 'number', min: 1, step: 1 })}</div>{bgmi && joining && <div className="space-y-2 mt-5"><Label htmlFor="role">Roster role</Label><Select value={fields.role} onValueChange={value => update('role', value)}><SelectTrigger id="role"><SelectValue/></SelectTrigger><SelectContent>{roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></div>}{bgmi && !joining && <p className="text-xs text-muted-foreground mt-4">Captain · IGL · Roster slot 1</p>}</section>
          {!joining && <section className="registration-section"><h2 className="text-lg font-bold mb-5">Tournament pass</h2>{field('password', 'Entry password', { type: 'password', autoComplete: 'new-password', minLength: 6 })}</section>}
          <div className="registration-section"><div className="flex items-start gap-3"><Checkbox id="acceptRules" checked={accepted} onCheckedChange={value => setAccepted(value === true)}/><Label htmlFor="acceptRules" className="text-sm leading-relaxed text-muted-foreground">I meet the school eligibility requirements and agree to the <Link to="/rules" className="text-foreground underline">official rules</Link>.</Label></div>{error && <p role="alert" className="text-destructive text-sm mt-5">{error}</p>}<Button className="mt-6 w-full sm:w-auto" type="submit" disabled={busy || closed || !user || !accepted || (joining && !verified)}>{closed ? 'Under school approval' : busy ? 'Saving entry…' : joining ? 'Join squad' : bgmi ? 'Create squad' : 'Submit solo entry'}<ArrowRight/></Button></div>
        </form>
      </div>
    </div>}
  </main>;
}
