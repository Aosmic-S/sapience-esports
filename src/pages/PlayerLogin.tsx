import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/hooks/usePlayer';

export default function PlayerLogin() {
  const { user } = usePlayer(); const navigate = useNavigate();
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [busy, setBusy] = useState(false); const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { if (user) navigate('/player-profile', { replace: true }); }, [user, navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setMessage('If an account exists, a password reset link will arrive by email.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/player-login', data: { display_name: name.trim() } } });
        if (error) throw error;
        if (!data.session) {
          setMessage('Account created! Please check your email inbox to confirm your account, then sign in.');
        } else {
          setMessage('Account created and signed in successfully!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message?.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address via the link sent to your inbox before signing in.');
          }
          if (error.message?.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. If you registered via team pass, use the Team / Competitor Login portal.');
          }
          throw error;
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  };
  const googleLogin = async () => {
    setError('');
    try {
      const redirectUri = `${window.location.origin}/player-login`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri }
      });
      if (error) {
        const errStr = typeof error === 'string' ? error : (error.message || '') + ' ' + JSON.stringify(error);
        if (errStr.includes('validation_failed') || errStr.includes('missing OAuth secret') || errStr.includes('Unsupported provider')) {
          setError('Google OAuth is not configured on this Supabase project yet (Missing Google Client Secret in Supabase Auth -> Providers -> Google). Please sign in with email/password or use Team / Solo Pass login above.');
        } else {
          setError(error.message || 'Google sign in failed.');
        }
      }
    } catch (err) {
      const errStr = err instanceof Error ? err.message : JSON.stringify(err);
      if (errStr.includes('validation_failed') || errStr.includes('missing OAuth secret') || errStr.includes('Unsupported provider')) {
        setError('Google OAuth is not configured on this Supabase project yet (Missing Google Client Secret in Supabase Auth -> Providers -> Google). Please sign in with email/password or use Team / Solo Pass login above.');
      } else {
        setError(errStr || 'Google sign in failed. Please try again.');
      }
    }
  };
  return <main className="container max-w-5xl px-5 py-12 md:py-20 min-h-[70vh]">
    <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-24 items-start">
      <div><UserRound className="h-8 w-8 text-primary mb-6"/><p className="section-label">Sapience eSports</p><h1 className="text-4xl font-bold mt-3">Your player account.</h1><p className="text-muted-foreground mt-5 text-sm">One player profile. Your squads and solo entries.</p><div className="mt-8 border-t border-border pt-6"><Link className="text-sm text-muted-foreground hover:text-primary" to="/team-login">Have a team code or solo pass? <ArrowRight className="inline w-4 h-4 ml-2"/></Link></div></div>
      <div className="max-w-md w-full">
        <Tabs value={mode === 'forgot' ? 'login' : mode} onValueChange={v => { setMode(v); setMessage(''); setError(''); }}><TabsList className="w-full mb-7"><TabsTrigger value="login" className="flex-1">Sign in</TabsTrigger><TabsTrigger value="signup" className="flex-1">Create account</TabsTrigger></TabsList></Tabs>
        <form onSubmit={submit} className="space-y-5">
          {mode === 'signup' && <div className="space-y-2"><Label htmlFor="displayName">Display name</Label><Input id="displayName" required minLength={2} maxLength={100} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div className="space-y-2"><Label htmlFor="playerEmail">Email address</Label><Input id="playerEmail" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          {mode !== 'forgot' && <div className="space-y-2"><Label htmlFor="playerPassword">Password</Label><div className="relative"><Input id="playerPassword" className="pr-12" type={visible?'text':'password'} required minLength={6} maxLength={100} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff/>:<Eye/>}</Button></div></div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
          <Button disabled={busy} className="w-full" type="submit">{busy?'Please wait…':mode==='signup'?'Create player account':mode==='forgot'?'Send reset link':'Sign in'}<ArrowRight/></Button>
        </form>
        <Button variant="link" className="px-0 mt-2 text-muted-foreground" onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setMessage('');setError('');}}>{mode==='forgot'?'Back to sign in':'Forgot password?'}</Button>
        {mode !== 'forgot' && <div className="mt-6 pt-6 border-t border-border space-y-3"><Button variant="outline" className="w-full" onClick={()=>void googleLogin()}>Continue with Google</Button></div>}
      </div>
    </div>
  </main>;
}