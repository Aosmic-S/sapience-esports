import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Trash2, Download, Ban, CheckCircle2, XCircle, AlertTriangle, Search, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import RegistrationAuditModal from './RegistrationAuditModal';

export interface Registration {
  id: string;
  full_name: string;
  admission_no?: string;
  class_section: string;
  game: string;
  entry_type: string;
  team_name?: string;
  team_number?: string;
  phone_number: string;
  in_game_id?: string;
  uid?: string;
  created_at: string;
  members?: string[];
  status?: 'active' | 'eliminated' | 'disqualified' | string;
  dq_reason?: string;
  is_present?: boolean;
}

interface RegistrationsTabProps {
  registrations: Registration[];
  onRegistrationsChange: () => void;
}

const RegistrationsTab = ({ registrations, onRegistrationsChange }: RegistrationsTabProps) => {
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ game: 'all', status: 'all', type: 'all' });
  
  // DQ dialog state
  const [auditOpen, setAuditOpen] = useState(false);
  const [dqTarget, setDqTarget] = useState<Registration | null>(null);
  const [dqReason, setDqReason] = useState('Emulator / Unauthorized hardware');

  // QR Check-in scanner modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<Registration | null>(null);

  useEffect(() => {
    let filtered = [...registrations];

    if (filters.game !== 'all') {
      filtered = filtered.filter(reg => reg.game === filters.game);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(reg => (reg.status || 'active') === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(reg => reg.entry_type === filters.type);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.full_name?.toLowerCase().includes(q) ||
        reg.team_name?.toLowerCase().includes(q) ||
        reg.team_number?.toLowerCase().includes(q) ||
        reg.admission_no?.toLowerCase().includes(q) ||
        reg.phone_number?.includes(q)
      );
    }

    setFilteredRegistrations(filtered);
  }, [registrations, filters, search]);

  const toggleAttendance = async (id: string, isPresent: boolean) => {
    const { error } = await supabase.from('registrations').update({ is_present: isPresent } as any).eq('id', id);
    if (error) {
      toast({ title: "Attendance Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isPresent ? "Team Marked PRESENT" : "Team Marked ABSENT", description: "Attendance updated." });
      onRegistrationsChange();
    }
  };

  const handleQrScanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toLowerCase();
    if (!query) return;
    const match = registrations.find(r =>
      r.team_number?.toLowerCase() === query ||
      r.admission_no?.toLowerCase() === query ||
      r.id.toLowerCase() === query
    );
    if (match) {
      setScanResult(match);
    } else {
      toast({ title: "Pass Not Found", description: `No team pass matching ${scanInput}`, variant: "destructive" });
      setScanResult(null);
    }
  };

  const confirmQrCheckIn = async (match: Registration) => {
    await toggleAttendance(match.id, true);
    setScanResult(null);
    setScanInput('');
    setQrModalOpen(false);
  };

  const updateTeamStatus = async (id: string, status: 'active' | 'eliminated' | 'disqualified', reason?: string) => {
    const payload = { status, dq_reason: status === 'disqualified' ? reason || 'Rule violation' : null };

    const { error } = await supabase.from('registrations').update(payload).eq('id', id);

    if (error) {
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Team marked as ${status.toUpperCase()}`,
        description: reason ? `Reason: ${reason}` : 'Status updated successfully',
      });
      setDqTarget(null);
      onRegistrationsChange();
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this team?')) return;
    const { error } = await supabase.from('registrations').delete().eq('id', id);

    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registration Deleted" });
      onRegistrationsChange();
    }
  };

  const exportToCSV = () => {
    const headers = ['Team #', 'Name', 'Admission No', 'Class', 'Game', 'Type', 'Team Name', 'Status', 'DQ Reason', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...filteredRegistrations.map(reg => [
        reg.team_number || 'N/A',
        `"${reg.full_name}"`,
        reg.admission_no || 'N/A',
        reg.class_section,
        reg.game,
        reg.entry_type,
        `"${reg.team_name || 'N/A'}"`,
        reg.status || 'active',
        `"${reg.dq_reason || ''}"`,
        reg.phone_number
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-registrations-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusCounts = {
    total: registrations.length,
    active: registrations.filter(r => (r.status || 'active') === 'active').length,
    eliminated: registrations.filter(r => r.status === 'eliminated').length,
    disqualified: registrations.filter(r => r.status === 'disqualified').length,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border pb-6">
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-muted-foreground">Total Enrolled</div>
          <div className="text-2xl font-bold font-display mt-1">{statusCounts.total}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-primary">Active Teams</div>
          <div className="text-2xl font-bold font-display text-primary mt-1">{statusCounts.active}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-warning">Out of Tournament</div>
          <div className="text-2xl font-bold font-display text-warning mt-1">{statusCounts.eliminated}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-destructive">Disqualified (DQ)</div>
          <div className="text-2xl font-bold font-display text-destructive mt-1">{statusCounts.disqualified}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between py-2">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team, name, ID, phone..."
              className="pl-9 bg-secondary border-border h-9"
            />
          </div>
          <Select value={filters.game} onValueChange={v => setFilters(f => ({ ...f, game: v }))}>
            <SelectTrigger className="w-[130px] bg-secondary border-border h-9">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="bgmi">BGMI</SelectItem>
              <SelectItem value="fc-mobile">FC Mobile</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
            <SelectTrigger className="w-[150px] bg-secondary border-border h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="eliminated">Out of Tourney</SelectItem>
              <SelectItem value="disqualified">Disqualified (DQ)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setQrModalOpen(true)} variant="default" size="sm" className="gap-2 uppercase text-xs font-bold bg-primary text-black hover:bg-primary/90">
          <CheckCircle2 className="w-4 h-4" /> Scan / Check-in QR
        </Button>
        <Button onClick={() => setAuditOpen(true)} variant="outline" size="sm"><Sparkles className="w-4 h-4"/>AI review</Button>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2 border-border">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Teams List */}
      <div className="space-y-3">
        {filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
            No registrations found matching the filters.
          </div>
        ) : (
          filteredRegistrations.map((reg) => {
            const isDQ = reg.status === 'disqualified';
            const isEliminated = reg.status === 'eliminated';

            return (
              <Card 
                key={reg.id} 
                className={`transition-all border ${
                  isDQ 
                    ? 'border-destructive/60 bg-destructive/5' 
                    : isEliminated 
                    ? 'border-border/60 bg-muted/20 opacity-75' 
                    : 'border-border bg-card'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Team Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary font-bold">
                          {reg.team_number || 'PENDING'}
                        </span>
                        <h4 className={`font-display font-bold text-base ${isDQ ? 'line-through text-destructive' : 'text-foreground'}`}>
                          {reg.team_name || reg.full_name}
                        </h4>

                        {/* Status Badges */}
                        {isDQ && (
                          <Badge variant="destructive" className="uppercase font-mono text-[10px] gap-1">
                            <Ban className="w-3 h-3" /> DQ: {reg.dq_reason || 'Disqualified'}
                          </Badge>
                        )}
                        {isEliminated && (
                          <Badge variant="outline" className="text-warning border-warning/40 uppercase font-mono text-[10px] gap-1">
                            <XCircle className="w-3 h-3" /> Out of Tournament
                          </Badge>
                        )}
                        {(!reg.status || reg.status === 'active') && (
                          <Badge variant="outline" className="text-success border-success/40 uppercase font-mono text-[10px] gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </Badge>
                        )}
                        {reg.is_present ? (
                          <Badge className="bg-success/20 text-success border-success/40 font-mono text-[10px] uppercase gap-1">
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-mono text-[10px] uppercase gap-1 opacity-60">
                            Absent
                          </Badge>
                        )}
                        <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                          {reg.game}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>Captain: <strong>{reg.full_name}</strong></span>
                        {reg.admission_no && <span>Adm No: <strong className="font-mono">{reg.admission_no}</strong></span>}
                        <span>Class: <strong>{reg.class_section}</strong></span>
                        <span>Phone: <strong className="font-mono">{reg.phone_number}</strong></span>
                        {reg.in_game_id && <span>IGN: <strong className="font-mono">{reg.in_game_id}</strong></span>}
                      </div>

                      {reg.members && reg.members.length > 0 && (
                        <div className="text-xs text-muted-foreground/80 mt-1">
                          Roster: {reg.members.join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Attendance Toggle & Quick Management Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={reg.is_present ? "secondary" : "outline"}
                        className={`h-8 text-xs font-bold uppercase ${reg.is_present ? 'text-success border-success/30' : 'text-muted-foreground'}`}
                        onClick={() => toggleAttendance(reg.id, !reg.is_present)}
                      >
                        {reg.is_present ? 'Mark Absent' : 'Mark Present'}
                      </Button>

                      {isDQ || isEliminated ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs border-success/50 text-success hover:bg-success/10"
                          onClick={() => updateTeamStatus(reg.id, 'active')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Re-instate Active
                        </Button>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs border-warning/40 text-warning hover:bg-warning/10"
                            onClick={() => updateTeamStatus(reg.id, 'eliminated')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Mark Out
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 text-xs gap-1"
                            onClick={() => setDqTarget(reg)}
                          >
                            <Ban className="w-3.5 h-3.5" /> Disqualify
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${reg.team_number || reg.full_name}`} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRegistration(reg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <RegistrationAuditModal open={auditOpen} onOpenChange={setAuditOpen} registrations={registrations}/>

      {/* QR Code Check-in Scanner Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-display text-lg uppercase">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Venue QR Code Check-in
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Scan team QR Code using a handheld scanner or enter the team code / admission number below to mark physical attendance and unlock Room ID & Password for the team.
            </p>
            <form onSubmit={handleQrScanSearch} className="flex gap-2">
              <Input
                placeholder="Scan / enter Team Code e.g. 100045"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                autoFocus
                className="bg-background text-xs font-mono uppercase"
              />
              <Button type="submit" size="sm" variant="default" className="uppercase text-xs font-bold shrink-0">
                Lookup Pass
              </Button>
            </form>

            {scanResult && (
              <div className="p-4 bg-secondary/80 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 uppercase">
                      {scanResult.game.toUpperCase()}
                    </Badge>
                    <h4 className="font-bold text-sm text-foreground mt-1">{scanResult.team_name || scanResult.full_name}</h4>
                    <p className="text-xs font-mono text-muted-foreground">Pass #: {scanResult.team_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Captain: {scanResult.full_name} ({scanResult.admission_no || 'N/A'})</p>
                  </div>
                  {scanResult.is_present ? (
                    <Badge className="bg-success/20 text-success border-success/40 uppercase font-mono text-[10px]">
                      Already Present
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                      Pending Check-in
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => confirmQrCheckIn(scanResult)}
                  size="sm"
                  className="w-full bg-success text-white hover:bg-success/90 font-bold uppercase text-xs"
                >
                  Confirm Venue Attendance & Unlock Room Pass
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setQrModalOpen(false)}>Close Scanner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Disqualification Reason Modal */}
      <Dialog open={!!dqTarget} onOpenChange={(open) => !open && setDqTarget(null)}>
        <DialogContent className="sm:max-w-[440px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-display text-lg">
              <AlertTriangle className="w-5 h-5" /> Disqualify Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are disqualifying <strong className="text-foreground">{dqTarget?.team_name || dqTarget?.full_name}</strong> ({dqTarget?.team_number}). New match results will be blocked. Review any existing bracket assignments separately.
            </p>

            <div className="space-y-2">
              <Label className="text-xs">Violation Reason</Label>
              <Select value={dqReason} onValueChange={setDqReason}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emulator / Unauthorized hardware">PC Emulator / Macro detected</SelectItem>
                  <SelectItem value="Unsportsmanlike conduct">Toxicity / Unsportsmanlike conduct</SelectItem>
                  <SelectItem value="No-show / Missed check-in">No-show / Exceeded grace period</SelectItem>
                  <SelectItem value="Ineligible player / Roll number mismatch">Ineligible player / Disciplinary record</SelectItem>
                  <SelectItem value="Cheating / Ringing">Impersonation / Roster violation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDqTarget(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => dqTarget && updateTeamStatus(dqTarget.id, 'disqualified', dqReason)}
            >
              Confirm Disqualification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationsTab;
