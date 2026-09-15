import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MutableTokenProvider } from '../core/auth/MutableTokenProvider';
import { AuthTokenStore } from '../core/auth/AuthTokenStore';
import { SecureAuthTokenStore } from '../core/auth/SecureAuthTokenStore';
import { AuthenticatedUser } from '../domain/repositories/AccountRepository';
import { tokenProvider } from '../di/container';

type AuthSession = {
  user: AuthenticatedUser | null;
  bootstrapping: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
  signIn: (user: AuthenticatedUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSession>({
  user: null,
  bootstrapping: true,
  setUser: () => undefined,
  signIn: async () => undefined,
  signOut: async () => undefined,
});

type ProviderProps = {
  children: ReactNode;
  store?: AuthTokenStore;
  authTokenProvider?: MutableTokenProvider;
};

const defaultStore = new SecureAuthTokenStore();

export const AuthSessionProvider = ({
  children,
  store = defaultStore,
  authTokenProvider = tokenProvider,
}: ProviderProps) => {
  const [user, setUserState] = useState<AuthenticatedUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const session = await store.load();
        if (cancelled) return;
        if (session) {
          authTokenProvider.setToken(session.token);
          setUserState({
            token: session.token,
            username: session.username,
            email: session.email,
          });
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [authTokenProvider, store]);

  const setUser = useCallback(
    (next: AuthenticatedUser | null) => {
      if (next) {
        authTokenProvider.setToken(next.token);
        setUserState(next);
        void store.save({ token: next.token, username: next.username, email: next.email });
        return;
      }
      authTokenProvider.setToken(null);
      setUserState(null);
      void store.clear();
    },
    [authTokenProvider, store]
  );

  const signIn = useCallback(
    async (next: AuthenticatedUser) => {
      authTokenProvider.setToken(next.token);
      await store.save({ token: next.token, username: next.username, email: next.email });
      setUserState(next);
    },
    [authTokenProvider, store]
  );

  const signOut = useCallback(async () => {
    authTokenProvider.setToken(null);
    await store.clear();
    setUserState(null);
  }, [authTokenProvider, store]);

  const value = useMemo(
    () => ({ user, bootstrapping, setUser, signIn, signOut }),
    [user, bootstrapping, setUser, signIn, signOut]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
};

export const useAuthSession = () => useContext(AuthSessionContext);
