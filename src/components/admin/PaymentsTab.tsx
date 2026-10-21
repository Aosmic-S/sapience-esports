import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, FileText, Search, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';

export interface PaymentSubmission {
  id: string;
  player_entry_id: string;
  user_id: string;
  payer_name: string;
  proof_path: string;
  transaction_reference: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected' | string;
  review_note: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export default function PaymentsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<PaymentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['adminPaymentSubmissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) {
        console.error('Error fetching payment submissions:', error);
        return [];
      }
      return data || [];
    }
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['adminPlayerEntries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_entries')
        .select('id, team_number, game, user_id');
      if (error) return [];
      return data || [];
    }
  });

  const handleReview = async (submissionId: string, decision: 'verified' | 'rejected', note: string = '') => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('review_payment_proof', {
        submission_id: submissionId,
        decision,
        note
      });
      if (error) throw error;

      toast({
        title: `Payment ${decision.toUpperCase()}`,
        description: `Successfully marked transaction as ${decision}.`
      });

      setSelectedSub(null);
      setRejectReason('');
      void queryClient.invalidateQueries({ queryKey: ['adminPaymentSubmissions'] });
    } catch (err: any) {
      toast({
        title: "Review Action Failed",
        description: err.message || "Could not complete review.",
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const getSignedUrl = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw new Error('Could not generate proof view URL.');
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast({ title: "Proof Access Failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = submissions.filter((sub: PaymentSubmission) => {
    const entry = entries.find((e: any) => e.id === sub.player_entry_id);
    const matchesSearch =
      sub.payer_name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.transaction_reference?.toLowerCase().includes(search.toLowerCase()) ||
      entry?.team_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: submissions.length,
    pending: submissions.filter((s: any) => s.status === 'pending').length,
    verified: submissions.filter((s: any) => s.status === 'verified').length,
    rejected: submissions.filter((s: any) => s.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border pb-6">
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-muted-foreground">Total Submissions</div>
          <div className="text-2xl font-bold font-display mt-1">{counts.total}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-warning">Pending Review</div>
          <div className="text-2xl font-bold font-display text-warning mt-1">{counts.pending}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-success">Verified Payments</div>
          <div className="text-2xl font-bold font-display text-success mt-1">{counts.verified}</div>
        </div>
        <div className="py-2">
          <div className="text-xs font-mono uppercase text-destructive">Rejected</div>
          <div className="text-2xl font-bold font-display text-destructive mt-1">{counts.rejected}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payer name, ref ID, entry code..."
            className="pl-9 bg-secondary border-border h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'pending', 'verified', 'rejected'].map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? 'default' : 'outline'}
              onClick={() => setStatusFilter(st)}
              className="uppercase font-mono text-[10px] h-8"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* List of Submissions */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading payment verification submissions...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-border bg-card p-8 text-center text-muted-foreground">
            No payment submissions found matching your filters.
          </Card>
        ) : (
          filtered.map((sub: PaymentSubmission) => {
            const entry = entries.find((e: any) => e.id === sub.player_entry_id);

            return (
              <Card key={sub.id} className="border-border bg-card">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-secondary">
                        {entry?.team_number || 'UNKNOWN ENTRY'}
                      </span>
                      <span className="font-bold text-foreground text-sm">{sub.payer_name}</span>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        ₹{sub.amount}
                      </Badge>
                      {sub.status === 'verified' && (
                        <Badge className="bg-success/20 text-success border-success/40 gap-1 uppercase font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                      {sub.status === 'rejected' && (
                        <Badge variant="destructive" className="gap-1 uppercase font-mono text-[10px]">
                          <XCircle className="w-3 h-3" /> Rejected
                        </Badge>
                      )}
                      {sub.status === 'pending' && (
                        <Badge className="bg-warning/20 text-warning border-warning/40 gap-1 uppercase font-mono text-[10px]">
                          <Clock className="w-3 h-3" /> Pending Review
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
                      <span>Ref: <strong className="text-foreground">{sub.transaction_reference}</strong></span>
                      <span>Submitted: {new Date(sub.submitted_at).toLocaleString()}</span>
                    </div>

                    {sub.review_note && (
                      <p className="text-xs text-destructive mt-1 font-sans">
                        Note: {sub.review_note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void getSignedUrl(sub.proof_path)}
                      className="h-8 text-xs font-bold gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Inspect Proof
                    </Button>

                    {sub.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy}
                          onClick={() => handleReview(sub.id, 'verified')}
                          className="h-8 text-xs bg-success text-success-foreground hover:bg-success/90 font-bold gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => setSelectedSub(sub)}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rejection Modal */}
      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold text-lg">Reject Payment Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for rejecting transaction <strong>{selectedSub?.transaction_reference}</strong>.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Rejection Note</Label>
              <Input
                placeholder="e.g. Transaction reference ID mismatch or unreadable receipt."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-secondary border-border text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSub(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy || rejectReason.trim().length < 3}
              onClick={() => selectedSub && handleReview(selectedSub.id, 'rejected', rejectReason)}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
