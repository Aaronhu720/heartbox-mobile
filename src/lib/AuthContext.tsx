import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { hasUser, verifyPin, createUser } from './db';

interface AuthState {
  isLoading: boolean;
  isRegistered: boolean;
  userId: string | null;
  privacyUnlocked: boolean;
  login: (pin: string) => Promise<boolean>;
  register: (pin: string, email?: string) => Promise<boolean>;
  logout: () => void;
  setPrivacyUnlocked: (v: boolean) => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [privacyUnlocked, setPrivacyUnlockedState] = useState(false);

  useEffect(() => {
    hasUser().then(exists => {
      setIsRegistered(exists);
      const saved = sessionStorage.getItem('halfdiary-uid');
      if (saved) setUserId(saved);
      setIsLoading(false);
    });
  }, []);

  async function login(pin: string): Promise<boolean> {
    const uid = await verifyPin(pin);
    if (uid) {
      setUserId(uid);
      sessionStorage.setItem('halfdiary-uid', uid);
      return true;
    }
    return false;
  }

  async function register(pin: string, email?: string): Promise<boolean> {
    const uid = await createUser(pin, email);
    setUserId(uid);
    setIsRegistered(true);
    sessionStorage.setItem('halfdiary-uid', uid);
    return true;
  }

  function logout() {
    setUserId(null);
    setPrivacyUnlockedState(false);
    sessionStorage.removeItem('halfdiary-uid');
  }

  return (
    <AuthContext.Provider value={{
      isLoading, isRegistered, userId, privacyUnlocked,
      login, register, logout,
      setPrivacyUnlocked: setPrivacyUnlockedState,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
