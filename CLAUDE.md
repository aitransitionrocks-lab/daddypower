# CLAUDE.md — daddypower Plattform
# Projektkontext für alle Agenten · Version 2.0

> Diese Datei ist die **einzige Wahrheitsquelle** für alle Agenten.
> Vor jeder Arbeitssession vollständig lesen. Bei Widersprüchen zwischen
> dieser Datei und bestehendem Code: Diese Datei gewinnt.
> Änderungen nur durch Orchestrator-Agent.

---

## 1. PRODUKT-VISION

daddypower ist eine **Multi-Tenant Health & Community Plattform** für junge Väter mit Kleinkindern — erschöpft, schuldbewusst, keine Zeit. Kein Fitness-Supplement. Echte Lösungen für echte Pain Points.

**Drei Kernversprechen:**
- Minimum Effective Dose Fitness (2–3× 20 Min./Woche, auch bei Chaos)
- Schuldfreie Me-Time (Paar-Kommunikations-Toolkit)
- Mentale Entlastung (kein Performance-Optimierungs-Bullshit)

**Einzigartiger Layer:** FitLine-Partner-Netzwerk. Partner treten nur via Einladungslink bei. Sie können Challenges für ihre Downline erstellen. Rekursiver Baum in PostgreSQL. Partner mit mehr als 10 aktiven Partnern in ihrer Downline zahlen eine gestaffelte monatliche Lizenzgebühr (Pricing im Admin-Panel konfigurierbar).

**Brand-Ton:** Direkt, kein Bullshit, immer „Du". Männlich = Verantwortung, nicht Macho. Keine Influencer-Sprache.

---

## 2. TECH STACK — VERBINDLICH

```
Frontend:     Vite + React 18 + TypeScript + React Router v6
Styling:      Tailwind CSS v3
Auth:         Supabase Auth (Magic Link + JWT)
Database:     Supabase (PostgreSQL 15)
Storage:      Supabase Storage
Payments:     Stripe (Checkout Sessions + Subscriptions + Customer Portal)
Email:        Resend
Analytics:    Plausible (DSGVO-konform) + eigenes Event-System in Supabase
Deployment:   Vercel (Auto-Deploy via GitHub, SPA-Routing konfiguriert)
Monitoring:   Sentry
Testing:      Vitest (Unit) + Playwright (E2E)
```

### ⚠️ KEIN FRAMEWORK-WECHSEL
Das Projekt läuft auf **Vite + React Router**. Es gibt keinen Wechsel zu Next.js.
- Statt Next.js Server Actions → **Supabase Edge Functions**
- Statt Next.js API Routes → **Supabase Edge Functions** oder direkte Supabase-Calls
- Statt Next.js SSR → clientseitiges React mit Supabase RLS als Sicherheitsschicht

---

## 3. AGENTEN-MODELL — WIE CLAUDE CODE ARBEITET

Claude Code agiert als **Orchestrator** und verwaltet dedizierte Sub-Agenten.

### Orchestrator-Verantwortung
- Liest CLAUDE.md + aktuellen Phasenstatus vor jeder Session
- Erstellt präzise Tasks für Sub-Agenten (Scope, Akzeptanzkriterien, Branch)
- Startet Sub-Agenten mit ihrem jeweiligen AGENT-*.md als Kontext
- Reviewed Output, löst Konflikte, gibt Merge frei
- Aktualisiert CLAUDE.md nach jeder abgeschlossenen Phase

### Sub-Agenten starten
```bash
# Orchestrator startet Sub-Agenten so:
# "Starte Agent 02. Kontext: CLAUDE.md + AGENTS/AGENT-02-BACKEND.md
#  Dein Task: [TASK-ID aus aktuellem Backlog]
#  Branch: feature/02-[task-name]
#  Akzeptanzkriterien: [aus Ticket]"
```

### Parallele Agenten
Agenten 03 (Stripe) und 04 (E-Mail) können parallel laufen — keine gemeinsamen Schreibzugriffe. Agent 02 (DB) muss immer zuerst fertig sein.

---

## 4. REPOSITORY-STRUKTUR

```
/
├── CLAUDE.md                        ← Diese Datei (Root — immer lesen!)
├── AGENTS/
│   ├── ORCHESTRATOR_PROMPT.md       ← Hauptprompt für Orchestrator
│   ├── AGENT-01-FRONTEND.md
│   ├── AGENT-02-BACKEND.md
│   ├── AGENT-03-AUTH-PAYMENTS.md
│   ├── AGENT-04-EMAIL.md
│   ├── AGENT-05-CONTENT.md
│   ├── AGENT-06-CHALLENGE.md
│   ├── AGENT-07-PARTNER-NETWORK.md
│   ├── AGENT-08-GROWTH.md
│   ├── AGENT-09-ADMIN-OPS.md
│   └── AGENT-10-QA-RELEASE.md
├── docs/
│   ├── DB_SCHEMA.md                 ← Vollständiges Datenbankschema
│   ├── EVENT_TAXONOMY.md            ← Alle Event-Namen (eingefroren)
│   ├── RLS_POLICIES.md              ← Row Level Security Dokumentation
│   ├── API_CONTRACTS.md             ← Interfaces zwischen Agenten
│   └── ANSWERS_TO_CLAUDE.md        ← Antworten auf Klärungsfragen
├── src/
│   ├── pages/                       ← Route-Level-Komponenten
│   │   ├── Landing.tsx
│   │   ├── Quiz.tsx
│   │   ├── Result.tsx
│   │   ├── Welcome.tsx
│   │   ├── Dashboard.tsx            ← Member-Bereich (geschützt)
│   │   ├── partner/                 ← Partner-Bereich (geschützt)
│   │   └── admin/                   ← Admin-Bereich (geschützt)
│   ├── components/
│   │   ├── ui/                      ← Atomic (Button, Input, Card...)
│   │   ├── quiz/
│   │   ├── landing/
│   │   ├── member/
│   │   ├── challenge/
│   │   ├── partner/
│   │   └── admin/
│   ├── features/
│   │   ├── leads/
│   │   ├── quiz/
│   │   ├── tracking/
│   │   ├── content/
│   │   ├── challenge/
│   │   └── network/                 ← Partner-Netzwerk-Logik
│   ├── services/
│   │   ├── quiz-scoring.ts
│   │   ├── lead-capture.ts
│   │   ├── event-tracking.ts
│   │   ├── attribution.ts
│   │   ├── invite-tokens.ts
│   │   └── tree-resolver.ts         ← Rekursiver Netzwerk-Baum
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            ← Browser-Client (anon key)
│   │   │   └── admin.ts             ← Service Role (NUR in Edge Functions!)
│   │   ├── stripe/
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   │   └── database.types.ts        ← Generiert via supabase gen types
│   └── i18n/
│       ├── de.ts
│       └── en.ts
├── supabase/
│   └── functions/                   ← Edge Functions
│       ├── on-lead-created/
│       ├── on-subscription-updated/
│       ├── on-challenge-enrolled/
│       └── on-invite-used/
└── db/
    ├── migrations/                  ← Nummeriert: 001_*.sql, 002_*.sql
    ├── seeds/
    ├── policies/
    └── views/
```

---

## 5. NAMING CONVENTIONS — ABSOLUT VERBINDLICH

### Datenbank (snake_case)
```
Tabellen:     snake_case, Plural           → leads, partner_network
Spalten:      snake_case                   → created_at, partner_id
Primary Keys: id UUID DEFAULT gen_random_uuid()
Timestamps:   created_at + updated_at (TIMESTAMPTZ DEFAULT NOW())
Foreign Keys: {tabelle_singular}_id        → user_id, partner_id
Booleans:     is_ oder has_ Prefix         → is_active, has_completed
Status-Felder: TEXT mit CHECK-Constraint   → NIEMALS ENUM-Typ
```

### TypeScript (camelCase / PascalCase)
```
Komponenten:  PascalCase    → QuizStep, MemberDashboard
Hooks:        use-Prefix    → useQuizState, usePartnerNetwork
Services:     camelCase     → quizScoring.ts
Types:        PascalCase    → QuizResult, PartnerNode
Konstanten:   SCREAMING     → MAX_QUIZ_STEPS, RESULT_TYPES
Routes:       kebab-case    → /partner-dashboard, /invite/[token]
```

### Git
```
Branches:  feature/{agent-nr}-{name}     → feature/02-migration-system
           fix/{agent-nr}-{beschreibung} → fix/03-stripe-webhook
Commits:   [Agent-XX] type(scope): text  → [Agent-03] feat(payments): add checkout
```

---

## 6. ERGEBNISTYPEN — EINGEFROREN

```typescript
// Überall identisch — niemals andere Werte verwenden
type ResultType =
  | 'leerer_akku'           // Emotional erschöpft, Freude verloren
  | 'funktionierer'         // Funktioniert, aber lebt nicht mehr
  | 'stiller_kaempfer'      // Kämpft alleine, zeigt nichts
  | 'performer_auf_reserve' // Hochleistung außen, Reserven null

// DB ist leer — keine Migration alter Werte nötig
// Neue Werte direkt verwenden
```

---

## 7. USER-ROLLEN

```typescript
type UserRole =
  | 'member'        // Aktive Stripe Subscription → /dashboard
  | 'partner'       // partner_network-Eintrag → /partner
  | 'operator'      // Admin-Light (kein Schema-Zugriff)
  | 'super_admin'   // Voller Zugriff (du)

// Gesetzt in auth.users.raw_user_meta_data->>'role'
// Gesetzt via supabase Admin-Client (service_role) in Edge Functions
```

---

## 8. PARTNER-LIZENZMODELL

```
Freie Nutzung:    0–10 aktive Partner in eigener Downline
Lizenzpflichtig:  > 10 aktive Partner → monatliche Gebühr

Definition "aktiv": Partner mit status = 'active' in partner_network,
                    direkt ODER indirekt in der Downline des Partners
                    (get_full_downline() Funktion, nur active)

Pricing:          Im Admin-Panel konfigurierbar (partner_license_tiers Tabelle)
Billing:          Über Stripe (separates Subscription-Produkt für Partner)
Prüfung:          Monatlich via Supabase Scheduled Function
                  → zählt aktive Downline → wählt Tier → erstellt/updated Stripe Subscription

Tabellen:
  partner_license_tiers   ← Admin konfiguriert Schwellwerte + Preise
  partner_billing         ← Tracking welcher Partner welches Tier hat
```

Konkrete Implementierung: siehe `AGENTS/AGENT-07-PARTNER-NETWORK.md`

---

## 9. EVENT-TAXONOMIE — EINGEFROREN

Vollständig in `docs/EVENT_TAXONOMY.md`. **Niemals eigene Event-Namen erfinden.**

```typescript
// Bestehend (nicht umbenennen!)
'page_view' | 'quiz_started' | 'quiz_answer' | 'quiz_completed'
'result_assigned' | 'waitlist_submitted' | 'whatsapp_clicked'

// Phase 1 (neu)
'email_opened' | 'email_clicked' | 'checkout_started'
'subscription_activated' | 'subscription_cancelled' | 'member_login'

// Phase 2
'workout_started' | 'workout_completed' | 'checkin_submitted'

// Phase 3
'challenge_enrolled' | 'challenge_day_completed'
'partner_registered' | 'invite_link_created' | 'invite_link_used'
'partner_tier_upgraded' | 'partner_license_billed'
```

---

## 10. SUPABASE-NUTZUNG

```typescript
// Browser-Client (src/lib/supabase/client.ts)
// → für alle Frontend-Queries (RLS schützt automatisch)
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Admin-Client (NUR in Supabase Edge Functions!)
// → bypasses RLS — niemals im Browser!
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Kein next/supabase — kein @supabase/ssr
// Kein createServerClient — das ist Next.js-spezifisch
```

---

## 11. EDGE FUNCTIONS STATT SERVER ACTIONS

Da kein Next.js:

| Next.js Pattern | daddypower Pattern |
|----------------|-------------------|
| Server Action (Form) | Direkter Supabase-Call aus React + RLS |
| API Route (Webhook) | Supabase Edge Function |
| Middleware (Auth-Guard) | React Router `<PrivateRoute>` + Supabase Session |
| getServerSideProps | useEffect + Supabase-Query |
| Server-side Stripe | Edge Function `stripe-checkout/` |

---

## 12. UMGEBUNGSVARIABLEN

```bash
# Vite Frontend (öffentlich — mit VITE_ Prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_APP_URL=                    # https://daddypower.de
VITE_PLAUSIBLE_DOMAIN=           # daddypower.de

# Supabase Edge Functions (geheim — kein VITE_ Prefix)
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

---

## 13. QUALITÄTS-STANDARDS

### TypeScript
- `strict: true` in tsconfig
- Keine `any` ohne Kommentar
- Typen aus `supabase gen types typescript` generiert
- `null`-Felder explizit als `T | null` typisiert

### Fehler-Handling
```typescript
// Standard-Return für alle async Operations
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; message?: string }
```

### Performance
- `select('*')` verboten in Production — immer Spalten benennen
- Images: explizite Dimensionen
- Code-Splitting via React `lazy()` für geschützte Bereiche

### DSGVO
- Plausible: cookie-frei → kein Banner nötig
- Logs enthalten keine E-Mail-Adressen (nur user_id)
- Unsubscribe-Link in jeder Marketing-Mail
- AVV mit Stripe + Resend abschließen vor erstem bezahlten Launch

---

## 14. PHASEN-ÜBERSICHT

```
Phase 0 — Fundament (JETZT)
  ├── Migrations-System aufsetzen
  ├── Alle DB-Tabellen anlegen (inkl. Partner-Netzwerk-Schema!)
  ├── result_videos → content_assets migrieren
  ├── Ergebnistypen umbenennen (DB leer → einfach)
  └── .env.example vervollständigen

Phase 1 — Monetarisierung (Wochen 1–3)
  ├── Stripe Checkout (Edge Function)
  ├── Stripe Webhook Handler (Edge Function)
  ├── Resend E-Mail-Sequenz (5 Mails/Typ)
  ├── Supabase Auth (Magic Link)
  └── Member-Dashboard (Basis)

Phase 2 — Content (Wochen 4–8)
  ├── Workout-Bibliothek
  ├── Video-Player
  ├── Daily Check-in
  └── Admin-CRM-Ausbau

Phase 3 — Challenge + Partner (Wochen 9–16)
  ├── Challenge Engine
  ├── Partner-Netzwerk-Feature (Invite, Downline)
  ├── Partner-Challenge-Creator
  └── Partner-Lizenz-Billing

Phase 4 — Scale (Wochen 17+)
  ├── KI-Personalisierung
  ├── A/B-Testing-Framework
  └── Mobile PWA
```

---

## 15. WAS AGENTEN NIEMALS TUN DÜRFEN

```
❌ Framework wechseln (kein Next.js, kein Remix)
❌ Event-Namen erfinden (nur aus EVENT_TAXONOMY.md)
❌ Direkt in main pushen
❌ service_role Key im Frontend/Browser-Code
❌ Schema-Änderungen ohne Migration-Datei
❌ select('*') in Production-Queries
❌ Rohe DB-Fehlermeldungen an User
❌ npm-Pakete ohne Rücksprache mit Orchestrator
❌ RLS deaktivieren ohne explizite Genehmigung
❌ console.log mit E-Mails oder Namen
❌ Strings direkt in Komponenten (immer i18n)
```

---

## 16. SOFORT-REFERENZ

| Frage | Dokument |
|-------|---------|
| DB-Schema vollständig | `docs/DB_SCHEMA.md` |
| Welche Events? | `docs/EVENT_TAXONOMY.md` |
| RLS-Regeln | `docs/RLS_POLICIES.md` |
| Interfaces zwischen Agenten | `docs/API_CONTRACTS.md` |
| Antworten auf Klärungsfragen | `docs/ANSWERS_TO_CLAUDE.md` |
| Welcher Agent macht was? | `AGENTS/AGENT-0X-*.md` |

---

*Version 2.0 — Stack-Korrektur (Vite), Partner-Lizenzmodell hinzugefügt, DB leer (keine Datenmigration nötig)*
*Orchestrator ist verantwortlich für Updates dieser Datei.*
