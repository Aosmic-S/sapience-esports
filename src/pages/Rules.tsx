import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ShieldAlert,
  Gamepad2,
  Trophy,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  Swords,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Rules() {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: rulesContent, isLoading: loadingRules } = useQuery({
    queryKey: ['rulesContent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules_content')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    }
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      return data || [];
    }
  });

  const defaultSections = {
    general: `• School Eligibility: Tournament is strictly open to students of Class 9, 10, 11, and 12 with a valid Sapience School Admission Number.
• Device Policy: Only personal mobile smartphones (Android / iOS) are permitted. Emulators, tablets, triggers, mouse/keyboard setups, or external controllers are strictly prohibited.
• Attendance & Verification: Every player must present their official Student ID card and Sapience eSports Digital Competitor Pass at the venue desk prior to match entry.
• Fair Play: All games must be played with sportsmanship. Any use of hacks, modified APKs, glitch exploitation, or unregistered ringers will lead to instant squad disqualification and administrative disciplinary action.`,

    bgmi: `• Roster Composition: 4 Core Players + 1 Optional Substitute (Total max 5 players per squad). All squad members must belong to Class 9-12.
• Match Format: Battle Royale Custom Rooms (Erangel / Miramar / Sanhok). Points distribution follows official Esports India standard tables (Elimination + Placement Points).
• Room Passcode: Room ID and Password will unlock in your Team Dashboard 15 minutes before scheduled match start upon QR check-in.
• Disqualification Triggers: Use of third-party GFX tools, iPad view scripts, teammate teaming, or abusive in-game voice chat will result in immediate match forfeit (0 points).`,

    fcmobile: `• Competition Format: Head-to-Head (H2H) & Versus Attack (VSA) 1v1 Bracket Knockout.
• Team OVR Limit: Maximum allowed Squad OVR capped at 110. Players must lock their squad lineup before entering the custom head-to-head lobby.
• Connection & Lag: Players are responsible for maintaining stable Wi-Fi/4G connection. In case of disconnection, match result stands unless disconnection occurs within first 15 game minutes.
• Rematches: Rematches are only granted under confirmed game server crash verified by match referees.`,

    conduct: `• Zero Tolerance Bullying: Any toxic behavior, hate speech, or unsportsmanlike conduct directed at opponents, teammates, or referees will result in zero-warning disqualification.
• Referee Authority: Match referees hold full authority over all rulings, pauses, and disputes. Refusal to comply with referee instructions incurs immediate forfeit.
• Punctuality: Teams failing to enter custom room lobbies within 10 minutes of room launch will automatically forfeit that round.`,

    tournament: `• Stage 1: Qualifiers (Knockout Rounds & Group Stage Leaderboards)
• Stage 2: Semi-Finals (Top 16 Squads BGMI / Top 8 EA FC Players)
• Stage 3: Grand Finals (Live Stage Main Auditorium Battle)
• Prizes & Awards: Winner Trophies, Champion Medals, Official Certificates, and Sapience Cup 2026 eSports Accolades.`
  };

  const getRuleText = (key: string) => {
    if (rulesContent && rulesContent[key as keyof typeof rulesContent]) {
      const content = rulesContent[key as keyof typeof rulesContent];
      if (typeof content === 'string' && content.trim().length > 10) {
        return content;
      }
    }
    return defaultSections[key as keyof typeof defaultSections] || 'Official rule details will be published prior to match day.';
  };

  const categories = [
    { id: 'general', label: 'General Rules', icon: BookOpen, badge: 'Core Policy' },
    { id: 'bgmi', label: 'BGMI Squad', icon: Swords, badge: 'Battle Royale' },
    { id: 'fc-mobile', label: 'EA FC Mobile', icon: Gamepad2, badge: '1v1 Knockout' },
    { id: 'conduct', label: 'Code of Conduct', icon: ShieldAlert, badge: 'Fair Play' },
    { id: 'tournament', label: 'Format & Stages', icon: Trophy, badge: 'Schedules' }
  ];

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const ruleText = getRuleText(cat.id === 'fc-mobile' ? 'fcmobile' : cat.id).toLowerCase();
    return cat.label.toLowerCase().includes(query) || cat.badge.toLowerCase().includes(query) || ruleText.includes(query);
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* High-Impact Hero Banner */}
      <div className="relative border-b border-border bg-gradient-to-b from-primary/10 via-background to-background py-10 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="container relative max-w-5xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-widest inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Official Rulebook 2026
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display uppercase">
            Tournament <span className="text-primary">Rules & Regulations</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Essential guidelines, fair play codes, match parameters, and eligibility requirements for Sapience Cup 2026.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8">
            <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Eligibility</p>
                <p className="text-xs font-bold">Class 9 - 12</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning"><Gamepad2 className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Devices</p>
                <p className="text-xs font-bold">Mobile Only</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success"><Clock className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Punctuality</p>
                <p className="text-xs font-bold">10 Min Window</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive"><ShieldAlert className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Anti-Cheat</p>
                <p className="text-xs font-bold">Zero Tolerance</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rules (e.g., emulators, OVR limit, substitute, disqualification)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-card/80 border-border shadow-sm rounded-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container max-w-5xl mx-auto px-4 mt-8">
        {loadingRules ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            {/* Mobile-Optimized Horizontal Scrollable Tab Bar */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              <TabsList className="h-auto p-1.5 bg-card border border-border/80 rounded-xl inline-flex w-max min-w-full md:w-full justify-start md:justify-between gap-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md shrink-0"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{cat.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Filtered Content Rendering */}
            {categories.map((cat) => {
              const ruleKey = cat.id === 'fc-mobile' ? 'fcmobile' : cat.id;
              const ruleText = getRuleText(ruleKey);
              const ruleLines = ruleText.split('\n').filter(line => line.trim().length > 0);

              return (
                <TabsContent key={cat.id} value={cat.id} className="mt-0 focus-visible:outline-none">
                  <Card className="border-border/80 bg-card shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-secondary/40 border-b border-border/60 pb-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold font-display">{cat.label}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                              Official Tournament Code & Standards
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wider px-3 py-1 border border-border">
                          {cat.badge}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-7 space-y-4">
                      {ruleLines.map((line, idx) => {
                        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                        const parts = cleanLine.split(':');
                        const hasHeader = parts.length > 1;
                        const title = hasHeader ? parts[0] : null;
                        const description = hasHeader ? parts.slice(1).join(':') : cleanLine;

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-border/50 bg-background/50 hover:border-primary/40 hover:bg-secondary/20 transition-all flex items-start gap-3.5 group"
                          >
                            <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              {title && (
                                <h3 className="text-sm font-bold text-foreground font-display tracking-wide uppercase">
                                  {title}
                                </h3>
                              )}
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {description}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Important Warning Banner */}
                      <div className="mt-6 p-4 rounded-xl border border-warning/30 bg-warning/10 flex items-start gap-3 text-xs sm:text-sm">
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div className="space-y-1 text-warning-foreground">
                          <p className="font-bold uppercase tracking-wider font-mono">School Administration Note</p>
                          <p className="text-muted-foreground leading-relaxed">
                            Violations of tournament rules or academic integrity rules during the Sapience Cup may lead to suspension from current and future esports events.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* CTA Banner */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/30 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide">Ready to claim your victory?</h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Make sure your squad members meet all class eligibility requirements before registering.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild size="default" className="gap-2">
              <Link to="/register">
                Register Entry <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link to="/player-profile">My Competitor Pass</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
