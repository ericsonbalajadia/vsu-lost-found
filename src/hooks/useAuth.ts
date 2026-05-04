import { useEffect, useState, useCallback } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  error: Error | null  
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAdmin: false,
    error: null,
  })

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as Profile
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      return null
    }
  }, [])

  const setAuthState = useCallback(
    async (session: Session | null) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          isAdmin: profile?.role === 'admin',
          error: null,
        })
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          isAdmin: false,
          error: null,
        })
      }
    },
    [fetchProfile]
  )

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) await setAuthState(session)
      } catch (err) {
        if (isMounted) {
          console.error('Session fetch error:', err)
          setState(prev => ({ ...prev, loading: false, error: err as Error }))
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session) => {
        if (isMounted) await setAuthState(session)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setAuthState])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { ...state, signOut }
}