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

## Workout Events (Phase 2)
| Event Name | Trigger | Properties |
|---|---|---|
| `workout_library_viewed` | Workout-Bibliothek geöffnet | – |
| `workout_started` | Workout-Detail geöffnet | `{ workout_id }` |
| `workout_completed` | Workout abgeschlossen | `{ workout_id, duration }` |
| `workout_exercise_done` | Einzelne Übung abgehakt | `{ workout_id, exercise_name }` |
| `exercise_viewed` | Übung aus wger-API aufgerufen | `{ exercise_id }` |

## Check-in Events (Phase 2)
| Event Name | Trigger | Properties |
|---|---|---|
| `checkin_submitted` | Täglicher Check-in | `{ energy, mood, sleep, stress }` |

## Challenge Events (Phase 3)
| Event Name | Trigger | Properties |
|---|---|---|
| `challenges_viewed` | Challenge-Übersicht geöffnet | – |
| `challenge_enrolled` | In Challenge eingeschrieben | `{ challenge_id, source }` |
| `challenge_day_completed` | Challenge-Tag abgeschlossen | `{ challenge_id, day }` |

## Partner Events (Phase 3)
| Event Name | Trigger | Properties |
|---|---|---|
| `partner_dashboard_viewed` | Partner-Dashboard geöffnet | – |
| `invite_link_created` | Einladungslink erstellt | – |
| `invite_link_viewed` | Einladungslink besucht | `{ token }` |
| `invite_link_used` | Partner über Link registriert | `{ token }` |
| `invite_qr_generated` | QR-Code erstellt | – |
| `partner_challenge_created` | Partner hat Challenge erstellt | `{ challenge_id }` |
| `partner_challenge_approved` | Admin hat Challenge freigegeben | `{ challenge_id }` |
| `partner_tier_changed` | Lizenz-Tier-Wechsel | `{ old_tier, new_tier }` |

## Admin Events (Phase 3)
| Event Name | Trigger | Properties |
|---|---|---|
| `lead_score_calculated` | Score-Update | `{ lead_id, score, segment }` |
