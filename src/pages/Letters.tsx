import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getLetters, getFutureLetters, cancelLetter, confirmLetter, type ScheduledLetter, type FutureSelfLetter } from '@/lib/db';
import { getSmsCredits } from '@/lib/membership';
import AdBanner from '@/components/AdBanner';

export default function LettersPage() {
  const { userId } = useAuth();
  const [tab, setTab] = useState<'scheduled' | 'future'>('scheduled');
  const [letters, setLetters] = useState<ScheduledLetter[]>([]);
  const [futureLetters, setFutureLetters] = useState<FutureSelfLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getLetters(userId), getFutureLetters(userId)]).then(([l, f]) => {
      setLetters(l);
      setFutureLetters(f);
      setLoading(false);
    });
  }, [userId]);

  async function handleCancel(letterId: string) {
    if (!userId) return;
    await cancelLetter(userId, letterId);
    setLetters(prev => prev.map(l =>
      l.id === letterId ? { ...l, status: 'cancelled', cancelledAt: new Date().toISOString() } : l
    ));
  }

  async function handleConfirm(letterId: string) {
    if (!userId) return;
    await confirmLetter(userId, letterId);
    setLetters(prev => prev.map(l =>
      l.id === letterId ? { ...l, status: 'sent', sentAt: new Date().toISOString() } : l
    ));
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿', locked: '已锁定', pending_confirmation: '等待确认', sent: '已发送', cancelled: '已取消',
  };
  const statusColors: Record<string, string> = {
    draft: 'text-muted', locked: 'text-primary', pending_confirmation: 'text-danger', sent: 'text-success', cancelled: 'text-muted',
  };

  return (
    <div className="max-w-lg mx-auto pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold font-serif">信件管理</h1>
        <Link to="/membership" className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-lg">
          <span className="text-xs text-primary font-medium">短信余额: {getSmsCredits()}</span>
          <span className="text-primary text-xs">+</span>
        </Link>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('scheduled')}
          className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'scheduled' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}>
          延迟发送 ({letters.length})
        </button>
        <button onClick={() => setTab('future')}
          className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'future' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}>
          写给未来的自己 ({futureLetters.length})
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted text-sm">加载中...</div>
      ) : tab === 'scheduled' ? (
        letters.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted text-sm mb-3">还没有延迟发送的信件</p>
            <Link to="/entry/new" className="text-primary text-sm">写一封 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map(letter => {
              const isOverdue = new Date(letter.scheduledAt) <= new Date();
              const canConfirm = (letter.status === 'locked' || letter.status === 'pending_confirmation') && isOverdue;
              const canCancel = letter.status !== 'sent' && letter.status !== 'cancelled';

              return (
                <div key={letter.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link to={`/entry/${letter.diaryEntryId}`} className="font-medium text-sm">
                        {letter.diaryEntry?.title || '日记'}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">给 {letter.recipientName}</p>
                    </div>
                    <span className={`text-xs font-medium ${statusColors[letter.status]}`}>
                      {statusLabels[letter.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted">
                    计划: {new Date(letter.scheduledAt).toLocaleString('zh-CN')}
                  </p>
                  {isOverdue && letter.status === 'locked' && (
                    <div className="mt-2 p-2 bg-accent/20 rounded-lg">
                      <p className="text-xs">已到发送时间，是否确认发送？</p>
                    </div>
                  )}
                  {(canConfirm || canCancel) && (
                    <div className="flex gap-2 mt-2">
                      {canConfirm && (
                        <button onClick={() => handleConfirm(letter.id)}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-xs">确认发送</button>
                      )}
                      {canCancel && (
                        <button onClick={() => handleCancel(letter.id)}
                          className="px-3 py-1 border border-border rounded-lg text-xs text-muted">取消</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        futureLetters.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted text-sm mb-3">还没有写给未来自己的信</p>
            <Link to="/entry/new" className="text-primary text-sm">写一封 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {futureLetters.map(letter => {
              const canOpen = new Date(letter.unlockAt) <= new Date();
              return (
                <div key={letter.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/entry/${letter.diaryEntryId}`} className="font-medium text-sm">
                        {letter.diaryEntry?.title || '日记'}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        写于 {new Date(letter.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    {letter.isUnlocked || canOpen ? (
                      <span className="text-xs text-success font-medium">可以查看</span>
                    ) : (
                      <span className="text-xs text-muted">🔒 锁定中</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    {letter.isUnlocked ? '已开启' : canOpen ? '已到开启时间，点击标题查看' : `将在 ${new Date(letter.unlockAt).toLocaleDateString('zh-CN')} 开启`}
                  </p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
