import { supabase, isSupabaseConfigured } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

export type UserRole = 'member' | 'partner' | 'operator' | 'super_admin'

export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  return (user.user_metadata?.role as UserRole) || null
}

export function isAdmin(user: User | null): boolean {
  const role = getUserRole(user)
  return role === 'super_admin' || role === 'operator'
}

export function isMember(user: User | null): boolean {
  const role = getUserRole(user)
  return role === 'member' || role === 'partner' || isAdmin(user)
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signInWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.auth.signOut()
}
