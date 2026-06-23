import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { hasUser, verifyPin, createUser, createUserByPhone, getUserPhone } from './db';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface AuthState {
  isLoading: boolean;
  isRegistered: boolean;
  userId: string | null;
  phone: string | null;
  privacyUnlocked: boolean;
  login: (pin: string) => Promise<boolean>;
  loginByPhone: (phone: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  sendCode: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  register: (pin: string, email?: string) => Promise<boolean>;
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
      const savedPhone = sessionStorage.getItem('halfdiary-phone');
      if (saved) setUserId(saved);
      if (savedPhone) setPhone(savedPhone);
      setIsLoading(false);
    });
  }, []);

  async function login(pin: string): Promise<boolean> {
    const uid = await verifyPin(pin);
    if (uid) {
      setUserId(uid);
      sessionStorage.setItem('halfdiary-uid', uid);
      const p = await getUserPhone();
      if (p) {
        setPhone(p);
        sessionStorage.setItem('halfdiary-phone', p);
      }
      return true;
    }
    return false;
  }

  async function sendCode(phoneNum: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const resp = await fetch(`${API_BASE}/api/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum }),
      });
      const data = await resp.json();
      if (resp.ok) return { ok: true };
      return { ok: false, error: data.error || '发送失败' };
    } catch {
      return { ok: false, error: '网络错误，请检查网络连接' };
    }
  }

  async function loginByPhone(phoneNum: string, code: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const resp = await fetch(`${API_BASE}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum, code }),
      });
      const data = await resp.json();
      if (!resp.ok) return { ok: false, error: data.error || '验证失败' };

      const uid = await createUserByPhone(phoneNum);
      setUserId(uid);
      setPhone(phoneNum);
      setIsRegistered(true);
      sessionStorage.setItem('halfdiary-uid', uid);
      sessionStorage.setItem('halfdiary-phone', phoneNum);
      localStorage.setItem('halfdiary-token', data.token);
      return { ok: true };
    } catch {
      return { ok: false, error: '网络错误，请检查网络连接' };
    }
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
    setPhone(null);
    setPrivacyUnlockedState(false);
    sessionStorage.removeItem('halfdiary-uid');
    sessionStorage.removeItem('halfdiary-phone');
    localStorage.removeItem('halfdiary-token');
  }

  return (
    <AuthContext.Provider value={{
      isLoading, isRegistered, userId, phone, privacyUnlocked,
      login, loginByPhone, sendCode, register, logout,
      setPrivacyUnlocked: setPrivacyUnlockedState,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
