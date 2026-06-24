import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('密码至少4位');
      return;
    }
    if (pin !== confirmPin) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    await register(pin);
    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary font-serif mb-2">开始使用</h1>
          <p className="text-sm text-muted">无需注册，设置一个密码即可</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">设置密码</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
              placeholder="至少4位，用于保护你的日记"
              required
              minLength={4}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
              placeholder="再次输入密码"
              required
              minLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl text-base disabled:opacity-50"
          >
            {loading ? '创建中...' : '开始记录'}
          </button>

          <p className="text-center text-xs text-muted">
            不收集任何个人信息，所有数据仅存在你的设备上
          </p>
        </form>

      </div>
    </div>
  );
}
