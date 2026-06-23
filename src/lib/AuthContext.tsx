import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { hasUser, verifyPin, createUser, getNickname, setNickname as dbSetNickname } from './db';

interface AuthState {
  isLoading: boolean;
  isRegistered: boolean;
  userId: string | null;
  nickname: string;
  privacyUnlocked: boolean;
  login: (pin: string) => Promise<boolean>;
  register: (pin: string) => Promise<boolean>;
  updateNickname: (name: string) => Promise<void>;
  logout: () => void;
  setPrivacyUnlocked: (v: boolean) => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState('');
  const [privacyUnlocked, setPrivacyUnlockedState] = useState(false);

  useEffect(() => {
    hasUser().then(exists => {
      setIsRegistered(exists);
      const saved = sessionStorage.getItem('halfdiary-uid');
      if (saved) {
        setUserId(saved);
        getNickname().then(n => { if (n) setNicknameState(n); });
      }
      setIsLoading(false);
    });
  }, []);

  async function login(pin: string): Promise<boolean> {
    const uid = await verifyPin(pin);
    if (uid) {
      setUserId(uid);
      sessionStorage.setItem('halfdiary-uid', uid);
      const n = await getNickname();
      if (n) setNicknameState(n);
      return true;
    }
    return false;
  }

  async function register(pin: string): Promise<boolean> {
    const uid = await createUser(pin);
    setUserId(uid);
    setIsRegistered(true);
    sessionStorage.setItem('halfdiary-uid', uid);
    return true;
  }

  async function updateNickname(name: string): Promise<void> {
    await dbSetNickname(name);
    setNicknameState(name);
  }

  function logout() {
    setUserId(null);
    setNicknameState('');
    setPrivacyUnlockedState(false);
    sessionStorage.removeItem('halfdiary-uid');
  }

  return (
    <AuthContext.Provider value={{
      isLoading, isRegistered, userId, nickname, privacyUnlocked,
      login, register, updateNickname, logout,
      setPrivacyUnlocked: setPrivacyUnlockedState,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
