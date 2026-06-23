import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { hasUser, verifyPin, createUser, getUserPhone } from './db';

interface AuthState {
  isLoading: boolean;
  isRegistered: boolean;
  userId: string | null;
  phone: string | null;
  privacyUnlocked: boolean;
  login: (pin: string) => Promise<boolean>;
  register: (pin: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  setPrivacyUnlocked: (v: boolean) => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [privacyUnlocked, setPrivacyUnlockedState] = useState(false);

  useEffect(() => {
    hasUser().then(exists => {
      setIsRegistered(exists);
      const saved = sessionStorage.getItem('halfdiary-uid');
      if (saved) {
        setUserId(saved);
        getUserPhone().then(p => { if (p) setPhone(p); });
      }
      setIsLoading(false);
    });
  }, []);

  async function login(pin: string): Promise<boolean> {
    const uid = await verifyPin(pin);
    if (uid) {
      setUserId(uid);
      sessionStorage.setItem('halfdiary-uid', uid);
      const p = await getUserPhone();
      if (p) setPhone(p);
      return true;
    }
    return false;
  }

  async function register(pin: string, phoneNum?: string): Promise<boolean> {
    const uid = await createUser(pin, phoneNum);
    setUserId(uid);
    setIsRegistered(true);
    if (phoneNum) setPhone(phoneNum);
    sessionStorage.setItem('halfdiary-uid', uid);
    return true;
  }

  function logout() {
    setUserId(null);
    setPhone(null);
    setPrivacyUnlockedState(false);
    sessionStorage.removeItem('halfdiary-uid');
  }

  return (
    <AuthContext.Provider value={{
      isLoading, isRegistered, userId, phone, privacyUnlocked,
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
