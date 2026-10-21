import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ArrowUpRight, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/hooks/usePlayer';
const items = [{name:'Home',path:'/'},{name:'Tournaments',path:'/#tournaments'},{name:'Brackets',path:'/brackets'},{name:'Schedule',path:'/calendar'},{name:'Rules',path:'/rules'},{name:'Leaderboard',path:'/leaderboard'}];
export const Navigation = () => {
 const [open,setOpen]=useState(false); const {pathname}=useLocation(); const {user}=usePlayer();
 if(pathname.startsWith('/admin')) return null;
 return <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
 <div className="container px-5 h-[76px] flex items-center justify-between gap-4">
 <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={()=>setOpen(false)}><img src="/sapience-logo.png" alt="Sapience Esports Logo" className="w-9 h-9 object-contain" /><span className="font-display font-bold uppercase text-base leading-[1.1]">Sapience<br/><span className="text-primary text-sm">eSports</span></span></Link>
 <nav className="hidden xl:flex items-center gap-6">{items.map(i=><Link key={i.name} to={i.path} className={cn('text-[11px] font-bold uppercase py-7 border-b-2 transition-colors',pathname===i.path?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}>{i.name}</Link>)}</nav>
 <div className="flex gap-1 sm:gap-2 items-center"><Button asChild variant="ghost" size="sm" className="text-muted-foreground text-xs px-2"><Link to="/admin" aria-label="Admin"><Shield/><span className="hidden sm:inline">Admin</span></Link></Button><Button asChild size="sm" className="text-[11px] font-bold px-3"><Link to={user?'/player-profile':'/player-login'}>{user?'My profile':'Player login'}<ArrowUpRight className="hidden sm:block"/></Link></Button><Button variant="ghost" size="icon" className="xl:hidden w-8" aria-label="Toggle navigation menu" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button></div>
 </div>{open&&<nav className="xl:hidden border-t border-border px-5 py-4 grid grid-cols-2 gap-1">{[...items,{name:'Registration',path:'/register'},{name:'Team / solo pass',path:'/team-login'},{name:'Admin console',path:'/admin'}].map(i=><Link key={i.name} to={i.path} onClick={()=>setOpen(false)} className="text-xs uppercase py-3 text-muted-foreground hover:text-primary">{i.name}</Link>)}</nav>}
 </header>;
};
