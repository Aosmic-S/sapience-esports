# Continue Sapience Cup update

- Repair the four reported preview files using current generated types and current component patterns.
- Align public tournament dates, game lineup, capacities, and fees with April 2027: BGMI (32 teams, ₹1,000/team), Free Fire India (24 teams, ₹1,250/team), and FC Mobile (₹300/player).
- Make public registration status fail closed while Lovable Cloud is unavailable; do not claim the hosted database was changed.
- Verify the registration fee rules and inspect the updated public page; keep database-backed Free Fire registration and hosted status pending while Cloud is paused.

## Technical details

- Use the shared registration-fee module and add concrete-value tests for Free Fire.
- Do not edit generated Supabase files, repository credentials, or apply migrations while Cloud is paused.
