/**
 * Lead Scoring Service
 *
 * Calculates a numeric score from a list of events and assigns
 * a segment: 'cold' | 'warm' | 'hot'.
 */

interface LeadEvent {
  event_name: string
}

interface LeadScoreResult {
  score: number
  segment: 'cold' | 'warm' | 'hot'
}

const EVENT_SCORES: Record<string, number> = {
  quiz_completed: 5,
  waitlist_submitted: 10,
  email_opened: 15,
  email_clicked: 25,
  whatsapp_clicked: 30,
  checkout_started: 50,
}

/**
 * Calculate lead score and segment from a list of events.
 *
 * Score per event:
 *   +5  quiz_completed
 *   +10 waitlist_submitted
 *   +15 email_opened (per email)
 *   +25 email_clicked (per click)
 *   +30 whatsapp_clicked
 *   +50 checkout_started
 *
 * Segments:
 *   0-30  -> cold
 *   31-70 -> warm
 *   71+   -> hot
 *
 * If any event is 'unsubscribed', segment is overridden to 'cold'.
 */
export function calculateLeadScore(events: LeadEvent[]): LeadScoreResult {
  let score = 0
  let isUnsubscribed = false

  for (const event of events) {
    if (event.event_name === 'unsubscribed') {
      isUnsubscribed = true
      continue
    }

    const points = EVENT_SCORES[event.event_name]
    if (points !== undefined) {
      score += points
    }
  }

  // Determine segment based on score
  let segment: 'cold' | 'warm' | 'hot'
  if (score <= 30) {
    segment = 'cold'
  } else if (score <= 70) {
    segment = 'warm'
  } else {
    segment = 'hot'
  }

  // Override: unsubscribed leads are always cold
  if (isUnsubscribed) {
    segment = 'cold'
  }

  return { score, segment }
}
