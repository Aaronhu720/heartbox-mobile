import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getEntryWithLetters, deleteEntry } from '@/lib/db';
import { MOOD_TAGS } from '@/lib/safety';

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getEntryWithLetters>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !id) return;
    getEntryWithLetters(userId, id).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [userId, id]);

  if (loading) return <div className="py-20 text-center text-muted">加载中...</div>;
  if (!data) return <div className="py-20 text-center text-muted">日记不存在</div>;

  const { entry, scheduledLetter, futureSelfLetter, isTimeLocked } = data;
  const moodTag = MOOD_TAGS.find(t => t.value === entry.moodTag);

  async function handleDelete() {
    if (!userId || !id) return;
    if (!confirm('确定要删除这篇日记吗？')) return;
    await deleteEntry(userId, id);
    navigate('/dashboard');
  }

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted mb-4 inline-block">
        ← 返回
      </button>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold font-serif">{entry.title}</h1>
            <p className="text-xs text-muted mt-1">
              {new Date(entry.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          {moodTag && (
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: moodTag.bg, color: moodTag.color }}
            >
              {moodTag.emoji} {moodTag.label} · {entry.moodScore}分
            </span>
          )}
        </div>

        {isTimeLocked ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-muted">这封信还未到开启时间</p>
            {futureSelfLetter && (
              <p className="text-xs text-muted mt-2">
                将在 {new Date(futureSelfLetter.unlockAt).toLocaleDateString('zh-CN')} 开启
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {entry.content}
          </div>
        )}

        {entry.wantsToContact && (
          <div className="mt-4 px-3 py-2 bg-primary/5 rounded-lg text-xs text-primary">
            💌 写这篇时想联系对方
          </div>
        )}

        {scheduledLetter && (
          <div className="mt-4 p-3 bg-info/30 rounded-lg text-xs">
            <p className="font-medium text-info-fg">延迟发送信件</p>
            <p className="text-muted mt-1">
              给 {scheduledLetter.recipientName} · 状态: {scheduledLetter.status}
            </p>
            <p className="text-muted">
              计划: {new Date(scheduledLetter.scheduledAt).toLocaleString('zh-CN')}
            </p>
          </div>
        )}

        {futureSelfLetter && !isTimeLocked && (
          <div className="mt-4 p-3 bg-accent/20 rounded-lg text-xs">
            <p className="font-medium">写给未来的自己</p>
            <p className="text-muted mt-1">
              {futureSelfLetter.isUnlocked ? '已开启' : `将在 ${new Date(futureSelfLetter.unlockAt).toLocaleDateString('zh-CN')} 开启`}
            </p>
          </div>
        )}
      </div>

      {!entry.isLocked && (
        <button
          onClick={handleDelete}
          className="mt-4 text-sm text-danger"
        >
          删除日记
        </button>
      )}
    </div>
  );
}
