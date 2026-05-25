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
import { useNavigate } from 'react-router-dom';
import type {
  User,
  Session,
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  error: Error | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    profileLoading: false,
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
        const { data, error }: Awaited<typeof fetchPromise> = await Promise.race([
          fetchPromise,
          timeoutPromise,
        ]);
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        console.log('[Auth] profile loaded');
        return data;
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
          profileLoading: true,
          isAdmin: false,
          error: null,
        });
        // Then fetch profile (with timeout) – do not await
        const profile = await fetchProfile(session.user.id);
        if (!isMounted.current) return;
        setState((prev) => ({
          ...prev,
          profile,
          profileLoading: false,
          isAdmin: profile?.role === 'admin',
        }));

        // If the OAuth redirect left an auth hash fragment (e.g. #access_token=... or just #),
        // clear only the hash while preserving the current route and query string.
        try {
          if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
            const isOAuthHash =
              hash === '#' ||
              hashParams.has('access_token') ||
              hashParams.has('refresh_token') ||
              hashParams.has('expires_in') ||
              hashParams.has('token_type') ||
              hashParams.has('type');

            if (isOAuthHash) {
              window.history.replaceState(
                window.history.state,
                document.title,
                `${window.location.pathname}${window.location.search}`
              );
            }
          }
        } catch (err) {
          console.warn('[Auth] unable to clear OAuth redirect hash:', err);
        }
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          profileLoading: false,
          isAdmin: false,
          error: null,
        });
      }
    },
    [fetchProfile, navigate]
  );

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setState((prev) => ({ ...prev, loading: true, profileLoading: true }));
      const profile = await fetchProfile(session.user.id);
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        profile,
        isAdmin: profile?.role === 'admin',
        loading: false,
        profileLoading: false,
      }));
    } else {
      setState((prev) => ({ ...prev, profileLoading: false }));
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

  // On mount: if the app was returned to a hash URL (e.g. '/#') check for an
  // existing session and, if present, replace the URL to '/inventory'. This
  // ensures OAuth callback hashes don't leave the router at '/#'.
  useEffect(() => {
    const tryReplaceHash = async () => {
      if (typeof window === 'undefined') return;
      if (!window.location.hash) return;
      // Only consider root path or empty pathname
      const path = window.location.pathname || '/';
      if (path !== '/' && path !== '') return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/inventory', { replace: true });
        }
      } catch (err) {
        console.warn('[Auth] error checking session for hash replace:', err);
      }
    };
    tryReplaceHash();
  }, [navigate]);

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
