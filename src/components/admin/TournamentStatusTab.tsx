import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  ToggleLeft,
  ToggleRight,
  Key,
  Gamepad2,
  Swords,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Save,
  ShieldCheck,
  Eye,
  Lock,
  Megaphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function TournamentStatusTab() {
  const queryClient = useQueryClient();
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);

  const [bgmiRoomId, setBgmiRoomId] = useState('');
  const [bgmiRoomPassword, setBgmiRoomPassword] = useState('');
  const [fcRoomId, setFcRoomId] = useState('');
  const [fcRoomPassword, setFcRoomPassword] = useState('');

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['tournamentStatusSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        toast({ title: 'Error loading settings', description: error.message, variant: 'destructive' });
      }
      return data || { registration_open: false, room_id: '', room_password: '' };
    }
  });

  useEffect(() => {
    if (settings) {
      setBgmiRoomId((settings as any).bgmi_room_id || settings.room_id || '');
      setBgmiRoomPassword((settings as any).bgmi_room_password || settings.room_password || '');
      setFcRoomId((settings as any).fcmobile_room_id || '');
      setFcRoomPassword((settings as any).fcmobile_room_password || '');
    }
  }, [settings]);

  const toggleRegistrationStatus = async () => {
    setSavingStatus(true);
    const newStatus = !settings?.registration_open;
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ registration_open: newStatus })
        .eq('id', 1);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['registrationAdmissionStatus'] });
      await queryClient.invalidateQueries({ queryKey: ['tournamentStatusSettings'] });
      await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });

      toast({
        title: newStatus ? 'Registrations Active!' : 'Registration Closed',
        description: newStatus
          ? 'Tournament entries are now open for all students.'
          : 'Entries set to "Under School Approval".'
      });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message || 'Could not update registration status.', variant: 'destructive' });
    } finally {
      setSavingStatus(false);
    }
  };

  const publishRoomCredentials = async () => {
    setSavingRoom(true);
    try {
      // Build safe update payload
      const payload: Record<string, string> = {
        bgmi_room_id: bgmiRoomId.trim(),
        bgmi_room_password: bgmiRoomPassword.trim(),
        fcmobile_room_id: fcRoomId.trim(),
        fcmobile_room_password: fcRoomPassword.trim(),
        room_id: bgmiRoomId.trim() || fcRoomId.trim(),
        room_password: bgmiRoomPassword.trim() || fcRoomPassword.trim()
      };

      let { error } = await supabase
        .from('system_settings')
        .update(payload as any)
        .eq('id', 1);

      if (error) {
        // Fallback to base room_id/room_password if custom columns not added in Supabase yet
        const fallbackRes = await supabase
          .from('system_settings')
          .update({
            room_id: bgmiRoomId.trim() || fcRoomId.trim(),
            room_password: bgmiRoomPassword.trim() || fcRoomPassword.trim()
          })
          .eq('id', 1);

        if (fallbackRes.error) throw fallbackRes.error;
      }

      await queryClient.invalidateQueries({ queryKey: ['tournamentStatusSettings'] });
      await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      await refetch();

      toast({
        title: 'Room Credentials Published!',
        description: 'Updated room IDs and passwords are now live on verified team dashboards.'
      });
    } catch (e: any) {
      toast({ title: 'Failed to publish room details', description: e.message, variant: 'destructive' });
    } finally {
      setSavingRoom(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isRegistrationOpen = settings?.registration_open === true;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Registration Status Toggle Card */}
      <Card className="border-border bg-card shadow-md">
        <CardHeader className="bg-secondary/30 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold font-display uppercase flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Tournament Admission & Registration Status
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Control public entry submission status for Sapience eSports Cup 2026.
              </CardDescription>
            </div>
            <Badge
              variant={isRegistrationOpen ? "default" : "secondary"}
              className={`font-mono text-xs uppercase tracking-wider px-3 py-1 flex items-center gap-1.5 ${
                isRegistrationOpen ? 'bg-success text-success-foreground' : 'bg-warning/20 text-warning border border-warning/30'
              }`}
            >
              {isRegistrationOpen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {isRegistrationOpen ? 'Registrations OPEN' : 'Under School Approval'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-xl border border-border/70 bg-background">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-base font-bold font-display uppercase">
                {isRegistrationOpen ? 'Public Entries Active' : 'Public Entries Paused'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRegistrationOpen
                  ? 'Students can currently submit entries, create squads, and join BGMI & FC Mobile rosters.'
                  : 'Displays "Sapience Cup 2026 is under school approval. Entries are not being accepted yet." on the registration page.'}
              </p>
            </div>

            <Button
              size="lg"
              onClick={toggleRegistrationStatus}
              disabled={savingStatus}
              className={`font-display uppercase tracking-wider gap-2 shrink-0 ${
                isRegistrationOpen
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-success hover:bg-success/90 text-success-foreground'
              }`}
            >
              {isRegistrationOpen ? (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Turn Off (School Approval)
                </>
              ) : (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Turn On (Open Entries)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Published Credentials Preview */}
      <Card className="border-border bg-card shadow-md">
        <CardHeader className="bg-secondary/30 border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold font-display uppercase flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Live Published Custom Room Credentials
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Currently broadcasted Room IDs and Passwords unlocked on present team dashboards.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs font-mono uppercase border-border"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync DB
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* BGMI Active Card */}
            <div className="p-5 rounded-xl border border-border bg-background space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold uppercase text-sm">BGMI Room Credentials</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">Battle Royale</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold block">Room ID</span>
                  <span className="font-mono text-sm font-bold text-primary break-all">
                    {bgmiRoomId || 'NOT SET'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold block">Room Password</span>
                  <span className="font-mono text-sm font-bold text-primary break-all">
                    {bgmiRoomPassword || 'NOT SET'}
                  </span>
                </div>
              </div>
            </div>

            {/* FC Mobile Active Card */}
            <div className="p-5 rounded-xl border border-border bg-background space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold uppercase text-sm">FC Mobile Match Code</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">1v1 Knockout</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold block">Match ID / Host</span>
                  <span className="font-mono text-sm font-bold text-primary break-all">
                    {fcRoomId || 'NOT SET'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold block">Passcode</span>
                  <span className="font-mono text-sm font-bold text-primary break-all">
                    {fcRoomPassword || 'NOT SET'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form to Update Credentials */}
          <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-4 pt-4">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-primary flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Broadcast / Publish New Room Passcodes
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* BGMI Input Group */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">BGMI Custom Room</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Room ID (e.g. 849201)"
                    value={bgmiRoomId}
                    onChange={(e) => setBgmiRoomId(e.target.value)}
                    className="font-mono text-xs bg-card"
                  />
                  <Input
                    placeholder="Password (e.g. SAP123)"
                    value={bgmiRoomPassword}
                    onChange={(e) => setBgmiRoomPassword(e.target.value)}
                    className="font-mono text-xs bg-card"
                  />
                </div>
              </div>

              {/* FC Mobile Input Group */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">EA FC Mobile Match</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Lobby ID / Host Username"
                    value={fcRoomId}
                    onChange={(e) => setFcRoomId(e.target.value)}
                    className="font-mono text-xs bg-card"
                  />
                  <Input
                    placeholder="Match Key / Password"
                    value={fcRoomPassword}
                    onChange={(e) => setFcRoomPassword(e.target.value)}
                    className="font-mono text-xs bg-card"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={publishRoomCredentials}
              disabled={savingRoom}
              className="w-full sm:w-auto font-display uppercase tracking-wider gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              {savingRoom ? 'Publishing...' : 'Publish Room Credentials Live'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
