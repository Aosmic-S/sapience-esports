import { Shield, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="container max-w-4xl px-5 py-12 md:py-16 text-foreground space-y-8">
      <header className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase mb-2">
          <Shield className="w-4 h-4" /> Legal & Governance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Effective Date: January 1, 2026 · Sapience Cup 2026 eSports Council
        </p>
      </header>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">1. Information We Collect</h2>
        <p>
          The Sapience School eSports Council collects information required for tournament participation, bracket seeding, and student eligibility verification. This includes:
        </p>
        <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-foreground">
          <li>Full name, admission number, and class/section</li>
          <li>Contact phone number / WhatsApp number</li>
          <li>In-game Name (IGN) and in-game UID (BGMI / FC Mobile)</li>
          <li>Payment transaction references and uploaded payment receipt proofs</li>
          <li>Authentication data via Google OAuth or student accounts</li>
        </ul>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">2. How We Use Your Information</h2>
        <p>
          Collected data is strictly used for the execution of the Sapience Cup eSports tournament:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Verifying student identity and eligibility (Class 9 and above)</li>
          <li>Seeding tournament brackets and recording official match results</li>
          <li>Communicating match room IDs, passwords, and schedules</li>
          <li>Reviewing fee payments and issuing referee clearance</li>
        </ul>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">3. Data Protection & Sharing</h2>
        <p>
          Student information is kept secure. We do not sell or lease student data to third parties. Publicly displayed tournament data is strictly limited to In-game Names (IGNs), team names, and match point standings.
        </p>
      </section>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">4. Contact Us</h2>
        <p>
          For queries regarding data privacy or entry modifications, please contact the STEM & eSports Desk at The Sapience School, Vikasnagar.
        </p>
      </section>
    </main>
  );
}
