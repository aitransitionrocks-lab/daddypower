import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () =>
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0

// Nur initialisieren wenn konfiguriert – verhindert Crash bei fehlenden Env-Variablen
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        // Auth-Methoden brauchen ein gültiges Objekt
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
            signOut: () => Promise.resolve({ error: null }),
          }
        }
        // from().insert/select/etc als No-op
        if (prop === 'from') {
          const noopChain: Record<string, unknown> = {}
          const handler = () => new Proxy(noopChain, {
            get: () => handler,
          })
          // Finale Aufrufe geben leere Daten zurück
          noopChain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null, count: 0 })
          return () => new Proxy(noopChain, { get: (_t, p) => {
            if (p === 'then') return noopChain.then
            return () => new Proxy(noopChain, { get: (_t2, p2) => {
              if (p2 === 'then') return noopChain.then
              return () => new Proxy(noopChain, { get: (_t3, p3) => {
                if (p3 === 'then') return noopChain.then
                return () => Promise.resolve({ data: null, error: null, count: 0 })
              }})
            }})
          }})
        }
        if (prop === 'storage') {
          return { from: () => ({ upload: () => Promise.resolve({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
        }
        return () => Promise.resolve({ data: null, error: null })
      },
    })
