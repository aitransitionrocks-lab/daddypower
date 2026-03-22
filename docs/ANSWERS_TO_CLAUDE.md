# Antworten auf Klärungsfragen von Claude Code

1. **Kein Next.js** – Vite + React + React Router bleibt. Edge Functions statt Server Actions.
2. **Ergebnistypen umbenannt** – DB ist leer, direkt neue Werte:
   `leerer_akku` | `funktionierer` | `stiller_kaempfer` | `performer_auf_reserve`
3. **Reihenfolge:** DB-Migrations → Stripe + Resend (parallel) → Auth + Member-Dashboard
4. **Credentials:** Stripe + Resend Accounts anlegen, Keys in .env
5. **Partner-Schema jetzt** – Schema Phase 0, Feature-Code Phase 3
6. **result_videos → _deprecated_result_videos**, content_assets neu
