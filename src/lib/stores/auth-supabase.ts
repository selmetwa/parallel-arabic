import { writable } from 'svelte/store'
import { supabase } from '$lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

// Auth stores
export const session = writable<Session | null>(null)
export const user = writable<User | null>(null)
export const loading = writable(true)

// Initialize auth state
export function initSupabaseAuth() {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
    session.set(initialSession)
    user.set(initialSession?.user ?? null)
    loading.set(false)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.set(newSession)
    user.set(newSession?.user ?? null)
    loading.set(false)
  })

  return () => subscription.unsubscribe()
}

// Helper functions
export function isLoggedIn(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = session.subscribe((currentSession) => {
      resolve(!!currentSession)
      unsubscribe()
    })
  })
}

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = user.subscribe((currentUser) => {
      resolve(currentUser)
      unsubscribe()
    })
  })
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  return error
}
