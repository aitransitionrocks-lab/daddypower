// A/B Testing Hook
// Usage: const variant = useExperiment('headline_v2')
// Returns 'control' | 'variant_a' | null (loading)

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useExperiment(slug: string): string | null {
  const [variant, setVariant] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setVariant('control')
      return
    }

    const sessionId = sessionStorage.getItem('kr_session_id') || crypto.randomUUID()
    sessionStorage.setItem('kr_session_id', sessionId)

    assignVariant(slug, sessionId).then(setVariant)
  }, [slug])

  return variant
}

async function assignVariant(slug: string, sessionId: string): Promise<string> {
  // Check existing assignment
  const { data: existing } = await supabase
    .from('experiment_assignments')
    .select('variant')
    .eq('anonymous_id', sessionId)
    .single()

  if (existing) return existing.variant

  // Get experiment
  const { data: experiment } = await supabase
    .from('experiments')
    .select('id, variants, traffic_pct, status')
    .eq('slug', slug)
    .eq('status', 'running')
    .single()

  if (!experiment) return 'control'

  // Random assignment based on traffic percentage
  const variants = experiment.variants as string[]
  const inTraffic = Math.random() * 100 < (experiment.traffic_pct || 100)

  if (!inTraffic) return 'control'

  const assigned = variants[Math.floor(Math.random() * variants.length)]

  // Save assignment
  await supabase.from('experiment_assignments').insert({
    experiment_id: experiment.id,
    anonymous_id: sessionId,
    variant: assigned,
  })

  return assigned
}
