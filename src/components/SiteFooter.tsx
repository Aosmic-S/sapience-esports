import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export const SiteFooter = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return <footer className="border-t border-border bg-card/40">
    <div className="container px-5 py-10 flex flex-col md:flex-row justify-between gap-8">
      <div><Link to="/" className="font-display font-bold text-xl uppercase flex items-center gap-2"><img src="/sapience-logo.png" alt="Sapience Esports Logo" className="w-6 h-6 object-contain" /><span>Sapience <span className="text-primary">eSports</span></span></Link><p className="text-xs text-muted-foreground mt-2">The Sapience School, Vikasnagar</p></div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground"><Link to="/rules" className="hover:text-primary">Official rules</Link><Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link><Link to="/terms-and-conditions" className="hover:text-primary">Terms & Conditions</Link><Link to="/calendar" className="hover:text-primary">Match schedule</Link><Link to="/admin" className="flex gap-1 hover:text-primary">Organizer console <ArrowUpRight className="w-3 h-3" /></Link></div>
    </div>
    <div className="container px-5 py-5 border-t border-border flex flex-wrap gap-3 justify-between text-[11px] text-muted-foreground"><span>© 2025 <a href="https://aosmicstudio.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Aosmic Studio</a></span><span>Sapience Cup 2026 · Under school approval</span></div>
  </footer>;
};