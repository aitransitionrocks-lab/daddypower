import { supabase, isSupabaseConfigured } from './supabase'

// Session-ID für anonymes Tracking (pro Browser-Session)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('kr_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('kr_session_id', sessionId)
  }
  return sessionId
}

// UTM-Parameter aus URL extrahieren
export function getUtmParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    referrer: document.referrer || undefined,
  }
}

// Event tracken (fire-and-forget)
export async function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>,
  leadId?: string
) {
  // Immer in die Console loggen (für Entwicklung)
  console.log(`[KR Event] ${eventName}`, eventData || '')

  if (!isSupabaseConfigured()) return

  try {
    await supabase.from('events').insert({
      event_name: eventName,
      event_data: eventData || null,
      lead_id: leadId || null,
      session_id: getSessionId(),
      page_path: window.location.pathname,
    })
  } catch (err) {
    console.warn('Event tracking failed:', err)
  }
}

// Lead / Waitlist-Eintrag speichern
export async function submitLead(data: {
  email: string
  first_name?: string
  quiz_result_type?: string
  quiz_answers?: Record<string, string>
  biggest_challenge?: string
  interest?: string[]
  consent: boolean
}) {
  const utm = getUtmParams()

  if (!isSupabaseConfigured()) {
    console.log('[KR] Lead would be saved:', { ...data, ...utm })
    return { success: true, id: 'local-dev' }
  }

  const { data: result, error } = await supabase
    .from('leads')
    .insert({
      ...data,
      ...utm,
    })
    .select('id')
    .single()

  if (error) {
    // Duplikat-E-Mail: Update statt Insert
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          quiz_result_type: data.quiz_result_type,
          quiz_answers: data.quiz_answers,
          biggest_challenge: data.biggest_challenge,
          interest: data.interest,
        })
        .eq('email', data.email)

      if (updateError) throw updateError
      return { success: true, id: 'updated' }
    }
    throw error
  }

  return { success: true, id: result.id }
}
