import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    if (pin.length < 4) {
      setError('密码至少4位');
      return;
    }
    if (pin !== confirmPin) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    await register(pin, phone);
    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary font-serif mb-2">创建账号</h1>
          <p className="text-sm text-muted">所有日记数据仅保存在你的设备上</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium mb-1">设置密码</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
              placeholder="至少4位"
              required
              minLength={4}
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
            {loading ? '注册中...' : '开始使用'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          已有账号？{' '}
          <Link to="/login" className="text-primary">登录</Link>
        </p>
      </div>
    </div>
  );
}
