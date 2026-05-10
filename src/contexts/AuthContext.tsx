/* eslint-disable react-refresh/only-export-components */
// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
} from 'react';
import type { User, Session, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  error: Error | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAdmin: false,
    error: null,
  });

  const isMounted = useRef(true);

  const fetchProfile = useCallback(
    async (userId: string, timeoutMs = 8000): Promise<Profile | null> => {
      console.log('[Auth] fetching profile for', userId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
      );
      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        const { data, error } = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as { data: Profile; error: PostgrestError | null };
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        console.log('[Auth] profile loaded');
        return data as Profile;
      } catch (err) {
        console.error('[Auth] profile fetch error:', err);
        return null;
      }
    },
    []
  );

  const applySession = useCallback(
    async (session: Session | null) => {
      if (!isMounted.current) return;
      if (session?.user) {
        // Immediately set user so the guard does not redirect
        setState({
          user: session.user,
          profile: null,
          session,
          loading: false,
          isAdmin: false,
          error: null,
        });
        // Then fetch profile (with timeout) – do not await
        const profile = await fetchProfile(session.user.id);
        if (!isMounted.current) return;
        setState((prev) => ({
          ...prev,
          profile,
          isAdmin: profile?.role === 'admin',
        }));
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          isAdmin: false,
          error: null,
        });
      }
    },
    [fetchProfile]
  );

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setState((prev) => ({ ...prev, loading: true }));
      const profile = await fetchProfile(session.user.id);
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        profile,
        isAdmin: profile?.role === 'admin',
        loading: false,
      }));
    }
  }, [fetchProfile]);

  useEffect(() => {
    isMounted.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] event:', _event);
      await applySession(session);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted.current && session) applySession(session);
      })
      .catch((err) => console.error('[Auth] getSession warm-up error:', err));

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error('useAuth must be used within an AuthProvider');
  return context;
}