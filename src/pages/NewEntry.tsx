import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createEntry, createLetter, createFutureLetter } from '@/lib/db';
import { detectCrisisContent } from '@/lib/safety';
import MoodSelector from '@/components/MoodSelector';
import CrisisAlert from '@/components/CrisisAlert';
import { getSmsCredits, useSmsCredit, PRICING, isMember } from '@/lib/membership';
import { getMoodReply } from '@/lib/healing';
import { canUseDaily, incrementDailyCount, getRemainingDaily } from '@/lib/dailyLimit';

type SendMode = 'private' | 'schedule' | 'future-self';
type DeliveryMethod = 'email' | 'sms';

export default function NewEntryPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('calm');
  const [moodScore, setMoodScore] = useState(5);
  const [wantsToContact, setWantsToContact] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>('private');

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [scheduledAt, setScheduledAt] = useState('');
  const [unlockDate, setUnlockDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [healingReply, setHealingReply] = useState('');
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError('');

    if (detectCrisisContent(content) || detectCrisisContent(title)) {
      setShowCrisis(true);
    }

    setLoading(true);

    try {
      const entry = await createEntry(userId, { title, content, moodTag, moodScore, wantsToContact });

      if (sendMode === 'schedule') {
        if (!recipientName || !scheduledAt) {
          setError('请填写收件人姓名和发送时间');
          setLoading(false);
          return;
        }
        if (deliveryMethod === 'email' && !recipientEmail) {
          setError('请填写收件人邮箱');
          setLoading(false);
          return;
        }
        if (deliveryMethod === 'sms' && !recipientPhone) {
          setError('请填写收件人手机号');
          setLoading(false);
          return;
        }
        if (deliveryMethod === 'sms' && content.length > PRICING.sms.limit) {
          setError(`短信内容不能超过${PRICING.sms.limit}字`);
          setLoading(false);
          return;
        }
        if (deliveryMethod === 'sms' && getSmsCredits() <= 0) {
          setError('短信余额不足，请先购买短信额度');
          setLoading(false);
          return;
        }
        if (deliveryMethod === 'sms') {
          useSmsCredit();
        }
        await createLetter(userId, {
          diaryEntryId: entry.id,
          recipientName,
          recipientEmail: deliveryMethod === 'email' ? recipientEmail : '',
          recipientPhone: deliveryMethod === 'sms' ? recipientPhone : '',
          deliveryMethod,
          scheduledAt,
        });
      } else if (sendMode === 'future-self') {
        if (!isMember() && !canUseDaily('future-letter', 3)) {
          setError('今日免费额度已用完（每天3封），升级会员可无限使用');
          setLoading(false);
          return;
        }
        const unlockAt = new Date(unlockDate + 'T00:00:00');
        await createFutureLetter(userId, entry.id, unlockAt.toISOString());
        if (!isMember()) incrementDailyCount('future-letter');
      }

      // 显示智能暖心回复
      const reply = getMoodReply(moodTag, moodScore);
      setHealingReply(reply);
      setSavedEntryId(entry.id);
    } catch {
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  // 保存成功后的暖心回复页面
  if (healingReply && savedEntryId) {
    return (
      <div className="max-w-2xl mx-auto pb-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-5 px-4">
          <div className="text-5xl">💝</div>
          <h2 className="text-lg font-semibold font-serif">日记已保存</h2>
          <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl border border-border p-5 max-w-sm">
            <p className="text-sm leading-relaxed text-center">"{healingReply}"</p>
            <p className="text-[10px] text-muted mt-3 text-right">— Half日记 · 你的疗愈伙伴</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate(`/entry/${savedEntryId}`)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
            >
              查看日记
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-muted"
            >
              回到首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <h1 className="text-xl font-semibold mb-5 font-serif">写日记</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base"
              placeholder="给今天的心情起个标题..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">正文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base min-h-[160px] resize-y"
              placeholder="写下你想说的话..."
              required
            />
          </div>

          <MoodSelector
            selectedTag={moodTag}
            moodScore={moodScore}
            onTagChange={setMoodTag}
            onScoreChange={setMoodScore}
          />

          <div>
            <label className="block text-sm font-medium mb-2">是否想联系对方？</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWantsToContact(false)}
                className={`py-2.5 rounded-xl text-sm transition-all border-2 ${
                  !wantsToContact
                    ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                    : 'bg-background text-muted border-border'
                }`}
              >
                😌 不想联系
              </button>
              <button
                type="button"
                onClick={() => setWantsToContact(true)}
                className={`py-2.5 rounded-xl text-sm transition-all border-2 ${
                  wantsToContact
                    ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                    : 'bg-background text-muted border-border'
                }`}
              >
                💌 想联系对方
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <label className="block text-sm font-medium">保存方式</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'private' as const, label: '保存为私人日记' },
              { value: 'schedule' as const, label: '设置未来发送' },
              { value: 'future-self' as const, label: '写给未来的自己' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSendMode(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  sendMode === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {sendMode === 'schedule' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm mb-1">收件人姓名</label>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" required={sendMode === 'schedule'} />
              </div>
              <div>
                <label className="block text-sm mb-2">发送方式</label>
                <div className="flex gap-2">
                  {([{ value: 'email' as const, label: '邮件', icon: '✉' }, { value: 'sms' as const, label: '短信', icon: '☎' }]).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setDeliveryMethod(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${
                        deliveryMethod === opt.value ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-background border border-border text-muted'
                      }`}>
                      <span>{opt.icon}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {deliveryMethod === 'email' ? (
                <div>
                  <label className="block text-sm mb-1">收件人邮箱</label>
                  <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" placeholder="example@email.com" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">收件人手机号</label>
                    <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base" placeholder="13800138000" />
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-amber-700">
                      ¥{PRICING.sms.price}/条 · 限{PRICING.sms.limit}字 · 余额: {getSmsCredits()}条
                    </span>
                    <Link to="/membership" className="text-xs text-primary font-medium">充值</Link>
                  </div>
                  {content.length > PRICING.sms.limit && (
                    <p className="text-xs text-danger">内容已超过{PRICING.sms.limit}字限制（当前{content.length}字）</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">计划发送日期和时间</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-base"
                  min={new Date().toISOString().slice(0, 16)} />
              </div>
              <p className="text-xs text-muted">到达设定时间后，系统会提醒你确认是否发送，不会自动发送。</p>
            </div>
          )}

          {sendMode === 'future-self' && (
            <div className="space-y-3 pt-2">
              {!isMember() && (
                <p className="text-xs text-muted bg-amber-50 rounded-lg px-3 py-2">
                  今日剩余免费次数：{getRemainingDaily('future-letter', 3)}/3 · <Link to="/membership" className="text-primary">升级会员</Link> 无限使用
                </p>
              )}
              <label className="block text-sm mb-1">选择开启时间</label>
              <div className="flex flex-wrap gap-2">
                {[{ days: 30, label: '30天后' }, { days: 90, label: '90天后' }, { days: 180, label: '半年后' }, { days: 365, label: '1年后' }].map(opt => {
                  const d = new Date();
                  d.setDate(d.getDate() + opt.days);
                  const val = d.toISOString().split('T')[0];
                  return (
                    <button key={opt.days} type="button" onClick={() => setUnlockDate(val)}
                      className={`px-3 py-2 rounded-lg text-sm ${unlockDate === val ? 'bg-primary text-white' : 'bg-background border border-border text-muted'}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-sm mb-1 mt-3">或自定义日期</label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-muted">
                信件将在 {new Date(unlockDate + 'T00:00:00').toLocaleDateString('zh-CN')} 开启。在此之前内容将被锁定，无法查看。
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl text-base disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </form>

      <CrisisAlert show={showCrisis} onClose={() => setShowCrisis(false)} />
    </div>
  );
}
