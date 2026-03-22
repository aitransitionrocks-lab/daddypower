# Event Taxonomy – daddypower
# Eingefroren: Neue Events nur nach Eintrag hier

## Funnel Events
| Event Name | Trigger | Properties |
|---|---|---|
| `page_view` | Jede Seite | `{ page }` |
| `quiz_cta_clicked` | CTA auf Landingpage | `{ source }` |
| `quiz_started` | Quiz-Seite geladen | – |
| `quiz_answer` | Antwort ausgewählt | `{ question_id, option_id, step }` |
| `quiz_completed` | Letzte Frage beantwortet | `{ answers }` |
| `result_assigned` | Ergebnis berechnet | `{ type, lang }` |
| `waitlist_cta_clicked` | CTA auf Ergebnis-Seite | `{ source, type }` |
| `waitlist_submitted` | Formular abgeschickt | `{ lead_id, quiz_type }` |
| `welcome_viewed` | Willkommen-Seite | `{ resultType }` |
| `whatsapp_clicked` | WhatsApp-Button | `{ resultType }` |
| `thankyou_viewed` | Danke-Seite | – |

## E-Mail Events (Phase 1)
| Event Name | Trigger | Properties |
|---|---|---|
| `email_sent` | Resend Webhook | `{ sequence_type, step, message_id }` |
| `email_opened` | Resend Webhook | `{ message_id }` |
| `email_clicked` | Resend Webhook | `{ message_id, url }` |
| `email_unsubscribed` | Abmelde-Seite | `{ email_hash }` |

## Payment Events (Phase 1)
| Event Name | Trigger | Properties |
|---|---|---|
| `checkout_started` | Stripe Checkout Button | `{ price_id, result_type }` |
| `subscription_activated` | Stripe Webhook | `{ subscription_id }` |
| `subscription_cancelled` | Stripe Webhook | `{ subscription_id }` |

## Member Events (Phase 1)
| Event Name | Trigger | Properties |
|---|---|---|
| `member_login` | Magic Link Auth | `{ method }` |
| `dashboard_viewed` | Dashboard geladen | – |
