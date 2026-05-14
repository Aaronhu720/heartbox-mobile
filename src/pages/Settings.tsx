import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getUserEmail, changePin, setPrivacyLock, exportAllData, deleteAccount } from '@/lib/db';
import { isMember, getMembership } from '@/lib/membership';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const [privacyPassword, setPrivacyPassword] = useState('');
  const [privacyConfirm, setPrivacyConfirm] = useState('');
  const [privacyMsg, setPrivacyMsg] = useState('');
  const [privacyErr, setPrivacyErr] = useState('');

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  useEffect(() => {
    getUserEmail().then(setEmail);
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(''); setPasswordErr('');
    const ok = await changePin(currentPassword, newPassword);
    if (ok) {
      setPasswordMsg('密码已更新');
      setCurrentPassword(''); setNewPassword('');
    } else {
      setPasswordErr('当前密码错误');
    }
  }

  async function handlePrivacyChange(e: React.FormEvent) {
    e.preventDefault();
    setPrivacyMsg(''); setPrivacyErr('');
    if (privacyPassword !== privacyConfirm) { setPrivacyErr('两次密码不一致'); return; }
    if (!userId) return;
    await setPrivacyLock(userId, privacyPassword);
    setPrivacyMsg('隐私密码已更新');
    setPrivacyPassword(''); setPrivacyConfirm('');
  }

  async function handleExport() {
    if (!userId) return;
    const data = await exportAllData(userId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `halfdiary-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    setDeleteErr('');
    const { verifyPin } = await import('@/lib/db');
    const uid = await verifyPin(deletePassword);
    if (!uid) { setDeleteErr('密码错误'); return; }
    await deleteAccount();
    logout();
    navigate('/');
  }

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-6">
      <h1 className="text-xl font-semibold font-serif">设置</h1>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-2">账号信息</h3>
        <p className="text-xs text-muted">邮箱：{email || '未设置'}</p>
        <p className="text-xs text-muted mt-1">数据存储：仅本地设备</p>
      </div>

      <form onSubmit={handlePasswordChange} className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-medium text-sm">修改登录密码</h3>
        {passwordErr && <div className="bg-danger/10 text-danger text-xs px-3 py-2 rounded-lg">{passwordErr}</div>}
        {passwordMsg && <div className="bg-success/10 text-success text-xs px-3 py-2 rounded-lg">{passwordMsg}</div>}
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
          placeholder="当前密码" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" required />
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
          placeholder="新密码（至少4位）" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" required minLength={4} />
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm">更新密码</button>
      </form>

      <form onSubmit={handlePrivacyChange} className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-medium text-sm">设置/修改隐私密码</h3>
        <p className="text-[10px] text-muted">隐私密码用于保护日记内容</p>
        {privacyErr && <div className="bg-danger/10 text-danger text-xs px-3 py-2 rounded-lg">{privacyErr}</div>}
        {privacyMsg && <div className="bg-success/10 text-success text-xs px-3 py-2 rounded-lg">{privacyMsg}</div>}
        <input type="password" value={privacyPassword} onChange={e => setPrivacyPassword(e.target.value)}
          placeholder="新隐私密码（至少4位）" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" required minLength={4} />
        <input type="password" value={privacyConfirm} onChange={e => setPrivacyConfirm(e.target.value)}
          placeholder="确认隐私密码" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" required minLength={4} />
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm">更新隐私密码</button>
      </form>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-2">会员状态</h3>
        {isMember() ? (
          <div>
            <p className="text-xs text-primary font-medium">
              {getMembership().plan === 'monthly' ? '月度' : '年度'}会员
            </p>
            <p className="text-[10px] text-muted mt-1">
              到期：{new Date(getMembership().expiresAt!).toLocaleDateString('zh-CN')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">免费版</p>
            <Link to="/membership" className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg">升级会员</Link>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-2">导出数据</h3>
        <p className="text-[10px] text-muted mb-2">导出所有日记、信件数据为 JSON 文件</p>
        {isMember() ? (
          <button onClick={handleExport} className="px-4 py-2 border border-border rounded-lg text-sm text-muted">导出个人数据</button>
        ) : (
          <Link to="/membership" className="inline-block px-4 py-2 border border-border rounded-lg text-sm text-muted">
            会员专属功能 &rarr;
          </Link>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <h3 className="font-medium text-sm">关于</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">版本</span>
          <span className="text-xs">1.3.0</span>
        </div>
        <a
          href="/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-1"
        >
          <span className="text-xs text-muted">隐私政策</span>
          <span className="text-xs text-primary">&rarr;</span>
        </a>
        <a
          href="mailto:aaronhu720@gmail.com"
          className="flex items-center justify-between py-1"
        >
          <span className="text-xs text-muted">联系开发者</span>
          <span className="text-xs text-primary">&rarr;</span>
        </a>
      </div>

      <div className="bg-card rounded-xl border border-danger/30 p-4">
        <h3 className="font-medium text-sm text-danger mb-2">删除账号</h3>
        <p className="text-[10px] text-muted mb-2">此操作不可恢复，所有数据将被永久删除</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="px-4 py-2 border border-danger text-danger rounded-lg text-sm">删除我的账号</button>
        ) : (
          <div className="space-y-2">
            {deleteErr && <div className="bg-danger/10 text-danger text-xs px-3 py-2 rounded-lg">{deleteErr}</div>}
            <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              placeholder="输入密码确认删除" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" />
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={!deletePassword}
                className="px-4 py-2 bg-danger text-white rounded-lg text-sm disabled:opacity-50">确认删除</button>
              <button onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteErr(''); }}
                className="px-4 py-2 border border-border rounded-lg text-sm">取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
