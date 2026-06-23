import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginByPhone, sendCode, login } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [usePassword, setUsePassword] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendCode() {
    setError('');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setLoading(true);
    const result = await sendCode(phone);
    setLoading(false);
    if (result.ok) {
      setCodeSent(true);
      setCountdown(60);
    } else {
      setError(result.error || '发送失败');
    }
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setLoading(true);
    const result = await loginByPhone(phone, code);
    setLoading(false);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error || '登录失败');
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(pin);
    setLoading(false);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('密码错误');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary font-serif mb-2">Half日记</h1>
          <p className="text-sm text-muted">欢迎回来</p>
        </div>

        {!usePassword ? (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
                placeholder="请输入手机号"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-card text-base"
                  placeholder="6位验证码"
                  required
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0 || phone.length !== 11}
                  className="px-4 py-3 bg-primary/10 text-primary rounded-xl text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-primary text-white rounded-xl text-base disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录 / 注册'}
            </button>

            <p className="text-center text-xs text-muted">
              未注册的手机号将自动创建账号
            </p>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
                placeholder="输入你的密码"
                required
                minLength={4}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl text-base disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <button
            onClick={() => { setUsePassword(!usePassword); setError(''); }}
            className="text-sm text-primary"
          >
            {usePassword ? '手机号验证码登录' : '使用密码登录'}
          </button>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          还没有账号？{' '}
          <Link to="/register" className="text-primary">注册</Link>
        </p>
      </div>
    </div>
  );
}
