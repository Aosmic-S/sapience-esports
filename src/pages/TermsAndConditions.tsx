import { FileText, ShieldAlert } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <main className="container max-w-4xl px-5 py-12 md:py-16 text-foreground space-y-8">
      <header className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase mb-2">
          <ShieldAlert className="w-4 h-4" /> Tournament Rulebook & Terms
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Terms & Conditions</h1>
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Sapience Cup 2026 · Official Competition Terms
        </p>
      </header>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">1. Eligibility</h2>
        <p>
          Participation in Sapience Cup 2026 is strictly reserved for eligible students (Class 9 and above). Every participant must provide valid school admission credentials.
        </p>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">2. Fair Play & Hardware Policy</h2>
        <p>
          Emulators, third-party macros, auto-clickers, or unauthorized hardware devices are strictly forbidden in BGMI and EA SPORTS FC™ Mobile matches. Violations result in immediate team disqualification.
        </p>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">3. Entry Charges & Payments</h2>
        <p>
          Registration charges (₹200 per BGMI squad / ₹300 per FC Mobile entry) cover tournament organization and prize pools. Payment receipts must be submitted for referee verification before match allocation.
        </p>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">4. Referee Authority</h2>
        <p>
          The decision of the STEM Club referee table regarding match disputes, check-in timeouts, or roster penalties is final.
        </p>
      </section>
    </main>
  );
}
