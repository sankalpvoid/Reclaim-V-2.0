import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/core/supabase/client';
import { signedOutWidgetSnapshot } from '@/features/widgets/widgetModel';
import { syncReclaimGlanceWidget } from '@/features/widgets/widgetSync';
import type { Profile } from '@/features/profile/profile';
import {
  getProfile,
  profileKeys,
} from '@/features/profile/profileService';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isReady: boolean;
  authError: Error | null;
  profileError: Error | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const user = session?.user ?? null;

  const profileQuery = useQuery({
    queryKey: profileKeys.byUser(user?.id ?? 'signed-out'),
    queryFn: () => getProfile(user!.id),
    enabled: Boolean(user),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthError(null);

      if (!nextSession) {
        queryClient.clear();
        try {
          syncReclaimGlanceWidget(signedOutWidgetSnapshot);
        } catch {
          // The widget is optional; never block sign-out on it.
        }
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setAuthError(error);
          setSession(null);
          return;
        }
        setSession(data.session);
      })
      .finally(() => {
        if (mounted) setIsInitialized(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const updateAutoRefresh = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    updateAutoRefresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', updateAutoRefresh);

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const isReady = isInitialized && (!user || !profileQuery.isPending);

  const value: AuthContextValue = {
    session,
    user,
    profile: user ? (profileQuery.data ?? null) : null,
    isAuthenticated: Boolean(user),
    isReady,
    authError,
    profileError: profileQuery.error ?? null,
    refreshProfile: async () => {
      await profileQuery.refetch();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
