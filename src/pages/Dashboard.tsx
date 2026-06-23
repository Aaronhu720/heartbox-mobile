import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getEntries, getLetters, type DiaryEntry } from '@/lib/db';
import { MOOD_TAGS } from '@/lib/safety';
import AdBanner from '@/components/AdBanner';
import DailyQuoteCard from '@/components/DailyQuoteCard';
import { isMember } from '@/lib/membership';

export default function DashboardPage() {
  const { userId, nickname, updateNickname } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayEntry, setTodayEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [{ entries: e }, letters] = await Promise.all([
        getEntries(userId!, { limit: 5 }),
        getLetters(userId!, 'locked'),
      ]);
      setEntries(e);
      setPendingCount(letters.length);
      if (!nickname) setShowNicknamePrompt(true);

      const today = new Date().toISOString().split('T')[0];
      setTodayEntry(e.find(entry => entry.createdAt.startsWith(today)) || null);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-muted">加载中...</div>;

  const getMoodLabel = (tag: string) => MOOD_TAGS.find(t => t.value === tag)?.label || tag;
  const getMoodColor = (tag: string) => MOOD_TAGS.find(t => t.value === tag)?.color || '#9CA3AF';

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const recentAvg = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length).toFixed(1)
    : '--';

  async function handleSetNickname() {
    if (nicknameInput.trim()) {
      await updateNickname(nicknameInput.trim());
    }
    setShowNicknamePrompt(false);
  }

  return (
    <div className="space-y-5 pb-6">
      {showNicknamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="bg-card rounded-2xl p-6 w-full max-w-xs shadow-lg">
            <h2 className="text-lg font-semibold text-center font-serif mb-1">给自己取个名字吧</h2>
            <p className="text-xs text-muted text-center mb-4">可以是昵称、花名，或任何你喜欢的称呼</p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-base text-center"
              placeholder="比如：小半、阿晴、匿名树洞…"
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleSetNickname}
              className="w-full mt-3 py-2.5 bg-primary text-white rounded-xl text-sm"
            >
              {nicknameInput.trim() ? '就叫这个' : '先跳过'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold font-serif">
          {nickname ? `${nickname}，你好` : '你好'}
        </h1>
        <p className="text-xs text-muted mt-1">{dateStr}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary text-secondary-fg flex items-center justify-center text-sm">
              {todayEntry ? '✓' : '○'}
            </div>
            <div>
              <p className="text-[10px] text-muted">今日</p>
              <p className="font-medium text-xs">{todayEntry ? '已记录' : '未记录'}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info text-info-fg flex items-center justify-center text-sm">☺</div>
            <div>
              <p className="text-[10px] text-muted">心情</p>
              <p className="font-medium text-xs">{recentAvg}/10</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">✉</div>
            <div>
              <p className="text-[10px] text-muted">信件</p>
              <p className="font-medium text-xs">{pendingCount} 封</p>
            </div>
          </div>
        </div>
      </div>

      <DailyQuoteCard />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium font-serif">快捷操作</h2>
        <Link
          to="/entry/new"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
        >
          写日记
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/calendar', icon: '▦', label: '情绪日历', bg: 'bg-secondary', fg: 'text-secondary-fg', pro: false },
          { href: '/trends', icon: '◠', label: '情绪趋势', bg: 'bg-info', fg: 'text-info-fg', pro: true },
          { href: '/letters', icon: '✉', label: '延迟信件', bg: 'bg-primary/10', fg: 'text-primary', pro: false },
          { href: '/healing', icon: '🫂', label: '疗愈空间', bg: 'bg-[#FEE2E2]', fg: 'text-[#EF4444]', pro: false },
          { href: '/ai', icon: '♡', label: 'AI 陪伴', bg: 'bg-accent/30', fg: 'text-primary', pro: true },
        ].map(item => (
          <Link
            key={item.href}
            to={item.pro && !isMember() ? '/membership' : item.href}
            className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5 active:scale-[0.98] transition-transform relative"
          >
            <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.fg} flex items-center justify-center text-base`}>
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
            {item.pro && !isMember() && (
              <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full">PRO</span>
            )}
          </Link>
        ))}
      </div>

      <AdBanner slot="dashboard" />

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-3 font-serif">最近日记</h3>
        {entries.length === 0 ? (
          <p className="text-xs text-muted">还没有日记记录</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map(entry => (
              <Link key={entry.id} to={`/entry/${entry.id}`} className="block">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getMoodColor(entry.moodTag) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted">
                        {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getMoodColor(entry.moodTag) + '20',
                          color: getMoodColor(entry.moodTag),
                        }}
                      >
                        {getMoodLabel(entry.moodTag)}
                      </span>
                      <span className="text-[10px] text-muted">{entry.moodScore}分</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
