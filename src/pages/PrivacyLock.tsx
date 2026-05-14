import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { verifyPrivacyLock } from '@/lib/db';

export default function PrivacyLockPage() {
  const navigate = useNavigate();
  const { userId, setPrivacyUnlocked } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError('');

    const ok = await verifyPrivacyLock(userId, password);
    if (ok) {
      setPrivacyUnlocked(true);
      navigate('/dashboard');
    } else {
      setError('密码错误');
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl mb-4">
        🔒
      </div>
      <h2 className="text-lg font-semibold font-serif mb-2">验证隐私密码</h2>
      <p className="text-sm text-muted mb-6">请输入隐私密码以查看内容</p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {error && <div className="bg-danger/10 text-danger text-sm px-3 py-2 rounded-lg">{error}</div>}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-xl bg-card text-base"
          placeholder="隐私密码"
          required
          autoFocus
        />
        <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl text-base">
          验证
        </button>
      </form>
    </div>
  );
}
