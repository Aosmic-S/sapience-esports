import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  Users, Settings, Megaphone, 
  Calendar as CalendarIcon, Mail, Database, Gamepad2, FileText, 
  Trophy, LogOut, GitBranch, Shield, RefreshCw, ExternalLink, Activity, CreditCard
} from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import RegistrationsTab from '@/components/admin/RegistrationsTab';
import CalendarTab from '@/components/admin/CalendarTab';
import BannerTab from '@/components/admin/BannerTab';
import CommunicationsTab from '@/components/admin/CommunicationsTab';
import SystemTab from '@/components/admin/SystemTab';
import GamesTab from '@/components/admin/GamesTab';
import RulesTab from '@/components/admin/RulesTab';
import LeaderboardTab from '@/components/admin/LeaderboardTab';
import BracketsTab from '@/components/admin/BracketsTab';
import PaymentsTab from '@/components/admin/PaymentsTab';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface NavSection {
  id: string;
  label: string;
  category: 'OPS' | 'SETUP' | 'SYSTEM';
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [active, setActive] = useState('registrations');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isAdminLoggedIn) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    setIsAuthenticated(false);
    toast({
      title: "Session Terminated",
      description: "You have been logged out of the admin console.",
    });
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Data Refreshed", description: "Tournament state synced with database." });
    }, 400);
  };

  // Queries
  const { data: registrations = [], isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
      if (error) {
        toast({ title: "Failed to load registrations", description: error.message, variant: "destructive" });
        return [];
      }
      return data || [];
    },
    enabled: isAuthenticated
  });

  const { data: bannerSettings } = useQuery({
    queryKey: ['bannerSettings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banner_settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: isAuthenticated
  });

  const { data: matchDays = [] } = useQuery({
    queryKey: ['matchDays'],
    queryFn: async () => {
      const { data, error } = await supabase.from('match_days').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    },
    enabled: isAuthenticated
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  const [backupSettings, setBackupSettings] = useState({ autoBackup: true, backupInterval: 'daily', lastBackup: new Date().toISOString() });
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Sapience eSports Cup 2026 Update',
    message: 'Dear participant,\n\nTournament update regarding match check-ins and room timings.\n\nSapience eSports Ops'
  });

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const allData = { registrations, bannerSettings, matchDays, systemSettings, announcements, games };

  // Calculate quick stats
  const totalRegistrations = registrations.length;
  const dqCount = registrations.filter((r: any) => r.status === 'disqualified' || r.status === 'dq').length;
  const activeGamesCount = games.filter((g: any) => g.is_active).length;

  const sections: NavSection[] = [
    { id: 'registrations', label: 'Registrations', category: 'OPS', icon: Users, count: totalRegistrations },
    { id: 'payments', label: 'Payments Review', category: 'OPS', icon: CreditCard },
    { id: 'brackets', label: 'Brackets', category: 'OPS', icon: GitBranch },
    { id: 'leaderboard', label: 'Leaderboard & Points', category: 'OPS', icon: Trophy },
    { id: 'games', label: 'Game Titles', category: 'SETUP', icon: Gamepad2, count: games.length },
    { id: 'calendar', label: 'Match Schedule', category: 'SETUP', icon: CalendarIcon, count: matchDays.length },
    { id: 'rules', label: 'Rulebook Editor', category: 'SETUP', icon: FileText },
    { id: 'banner', label: 'Live Banner', category: 'SYSTEM', icon: Megaphone },
    { id: 'communications', label: 'Announcements', category: 'SYSTEM', icon: Mail, count: announcements.length },
    { id: 'system', label: 'System & DB', category: 'SYSTEM', icon: Database },
  ];

  const current = sections.find((s) => s.id === active) ?? sections[0];

  const renderSection = () => {
    switch (active) {
      case 'brackets': 
        return <BracketsTab games={games} registrations={registrations} />;
      case 'registrations': 
        return (
          <RegistrationsTab 
            registrations={registrations} 
            onRegistrationsChange={() => queryClient.invalidateQueries({ queryKey: ['registrations'] })} 
          />
        );
      case 'payments':
        return <PaymentsTab />;
      case 'leaderboard': 
        return <LeaderboardTab />;
      case 'calendar': 
        return (
          <CalendarTab 
            matchDays={matchDays || []} 
            onMatchDaysChange={() => queryClient.invalidateQueries({ queryKey: ['matchDays'] })}
          />
        );
      case 'games': 
        return (
          <GamesTab 
            games={games || []} 
            onGamesChange={() => queryClient.invalidateQueries({ queryKey: ['games'] })}
          />
        );
      case 'rules': 
        return <RulesTab />;
      case 'banner': 
        return (
          <BannerTab 
            bannerSettings={bannerSettings || null} 
            onBannerSettingsChange={() => queryClient.invalidateQueries({ queryKey: ['bannerSettings'] })}
          />
        );
      case 'communications': 
        return (
          <CommunicationsTab 
            emailTemplate={emailTemplate}
            onEmailTemplateChange={setEmailTemplate}
            announcements={announcements || []}
            onAnnouncementsChange={() => queryClient.invalidateQueries({ queryKey: ['announcements'] })}
            registrationCount={registrations.length}
          />
        );
      case 'system': 
        return (
          <SystemTab 
            systemSettings={systemSettings}
            onSystemSettingsChange={() => queryClient.invalidateQueries({ queryKey: ['systemSettings'] })}
            backupSettings={backupSettings}
            onBackupSettingsChange={setBackupSettings}
            registrationCount={registrations.length}
            matchDayCount={matchDays.length}
            allData={allData}
          />
        );
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-border/70 bg-card md:sticky md:top-0 md:h-screen flex flex-col justify-between shrink-0 z-30">
        <div>
          {/* Brand header */}
          <div className="px-5 h-16 flex items-center justify-between border-b border-border/70 bg-secondary/40">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="h-3 w-3 bg-primary rotate-45 " />
              <div>
                <div className="font-display font-black uppercase  text-sm">
                  Sapience<span className="text-primary">/</span>Console
                </div>
                <div className="font-mono-tag text-[9px] uppercase  text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Organizer Ops
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation by Category */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {(['OPS', 'SETUP', 'SYSTEM'] as const).map((cat) => {
              const items = sections.filter(s => s.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 text-[10px] font-mono-tag uppercase  text-muted-foreground/60 font-semibold mb-1">
                    {cat === 'OPS' ? 'Competition Ops' : cat === 'SETUP' ? 'Tournament Setup' : 'Broadcast & System'}
                  </div>
                  {items.map((s) => {
                    const Icon = s.icon;
                    const on = s.id === active;
                    return (
                      <Button
                        key={s.id}
                        onClick={() => setActive(s.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                          on 
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/70'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${on ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        <span className="truncate">{s.label}</span>
                        {s.count !== undefined && (
                          <span className={`ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded ${
                            on ? 'bg-secondary/40 text-primary-foreground font-bold' : 'bg-muted/40 text-muted-foreground'
                          }`}>
                            {s.count}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/70 bg-secondary/20 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/40 rounded transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              View website
            </span>
            <span className="font-mono text-[10px] text-primary">↗</span>
          </Link>
          <Button 
            onClick={handleLogout} 
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Command Bar */}
        <header className="h-16 border-b border-border/70 px-4 md:px-8 bg-card/20 backdrop-blur flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary " />
            <h1 className="font-display uppercase  font-bold text-base md:text-lg">
              {current.label}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tag uppercase bg-primary/10 text-primary border border-primary/20">
              <Shield className="w-3 h-3" /> Staff Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="h-8 text-xs font-mono-tag uppercase border-border/80 hover:border-primary/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleLogout} 
              className="md:hidden text-destructive p-2 hover:bg-destructive/10 rounded" 
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Live Operations Metric Bar */}
        <div className="border-b border-border/60 bg-background px-4 md:px-8 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="py-2.5">
              <div className="text-[10px] font-mono-tag uppercase  text-muted-foreground">Total Teams</div>
              <div className="text-xl font-bold font-mono text-foreground mt-0.5">{totalRegistrations}</div>
            </div>
            <div className="py-2.5">
              <div className="text-[10px] font-mono-tag uppercase  text-muted-foreground">Active Games</div>
              <div className="text-xl font-bold font-mono text-primary mt-0.5">{activeGamesCount} <span className="text-xs text-muted-foreground font-normal">/ 2 Edition</span></div>
            </div>
            <div className="py-2.5">
              <div className="text-[10px] font-mono-tag uppercase  text-muted-foreground">Disqualified / Out</div>
              <div className="text-xl font-bold font-mono text-destructive mt-0.5">{dqCount}</div>
            </div>
            <div className="py-2.5">
              <div className="text-[10px] font-mono-tag uppercase  text-muted-foreground">Match Days</div>
              <div className="text-xl font-bold font-mono text-foreground mt-0.5">{matchDays.length}</div>
            </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {isLoadingRegistrations ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-card" />
              <Skeleton className="h-72 w-full bg-card" />
            </div>
          ) : (
            <div className="">
              {renderSection()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
