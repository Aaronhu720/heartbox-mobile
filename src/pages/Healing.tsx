import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HEARTBREAK_STAGES,
  getQuotesByCategory,
  getRandomQuote,
  CATEGORY_LABELS,
  type HealingQuote,
  type HealingStage,
} from '@/lib/healing';
import { isMember } from '@/lib/membership';
import { canUseDaily, incrementDailyCount, getRemainingDaily } from '@/lib/dailyLimit';

type Tab = 'stages' | 'quotes';

const DAILY_LIMIT = 10;

export default function HealingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stages');
  const [selectedStage, setSelectedStage] = useState<HealingStage | null>(null);
  const [quoteCategory, setQuoteCategory] = useState<HealingQuote['category']>('warmth');
  const [showPaywall, setShowPaywall] = useState(false);

  function checkLimit(): boolean {
    if (isMember()) return true;
    if (!canUseDaily('healing', DAILY_LIMIT)) {
      setShowPaywall(true);
      return false;
    }
    incrementDailyCount('healing');
    return true;
  }

  function handleSelectStage(stage: HealingStage) {
    if (!checkLimit()) return;
    setSelectedStage(stage);
  }

  if (showPaywall) {
    return (
      <div className="max-w-sm mx-auto py-10 px-4 text-center space-y-5">
        <div className="text-5xl">🫂</div>
        <h2 className="text-lg font-semibold font-serif">今日免费次数已用完</h2>
        <p className="text-sm text-muted">疗愈空间每天免费使用 {DAILY_LIMIT} 次，升级会员可无限使用。</p>
        <button onClick={() => navigate('/membership')} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium">查看会员方案</button>
        <button onClick={() => navigate('/dashboard')} className="w-full py-2.5 text-sm text-muted">返回首页</button>
      </div>
    );
  }

  if (selectedStage) {
    return <StageDetail stage={selectedStage} onBack={() => setSelectedStage(null)} />;
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="text-muted hover:text-primary text-lg">←</Link>
        <h1 className="text-xl font-semibold font-serif">疗愈空间</h1>
      </div>

      <p className="text-xs text-muted">
        在这里，我们陪你走过每一个艰难的时刻。无论是失恋、迷茫还是低落，你都不是一个人。
      </p>

      {!isMember() && (
        <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center justify-between">
          <span>今日剩余：{getRemainingDaily('healing', DAILY_LIMIT)}/{DAILY_LIMIT} 次</span>
          <Link to="/membership" className="text-primary font-medium">升级会员</Link>
        </div>
      )}

      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('stages')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'stages' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}
        >
          💔 失恋疗愈
        </button>
        <button
          onClick={() => setTab('quotes')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'quotes' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}
        >
          ✨ 疗愈语录
        </button>
      </div>

      {tab === 'stages' ? (
        <StagesView onSelect={handleSelectStage} />
      ) : (
        <QuotesView category={quoteCategory} onCategoryChange={setQuoteCategory} checkLimit={checkLimit} />
      )}
    </div>
  );
}

// ========== 失恋五阶段视图 ==========
function StagesView({ onSelect }: { onSelect: (s: HealingStage) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-2">走出失恋的五个阶段</h3>
        <p className="text-xs text-muted leading-relaxed">
          失恋后的情绪变化是有规律的。心理学家将这个过程分为五个阶段。了解你正处于哪个阶段，能帮助你更好地疗愈自己。
        </p>
      </div>

      {/* 阶段时间线 */}
      <div className="space-y-0">
        {HEARTBREAK_STAGES.map((stage, idx) => (
          <button
            key={stage.id}
            onClick={() => onSelect(stage)}
            className="w-full text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-3">
              {/* 时间线 */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: stage.bgColor }}
                >
                  {stage.emoji}
                </div>
                {idx < HEARTBREAK_STAGES.length - 1 && (
                  <div className="w-0.5 h-full min-h-[40px] bg-border my-1" />
                )}
              </div>
              {/* 内容 */}
              <div className="flex-1 pb-4">
                <div className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm" style={{ color: stage.color }}>
                      {stage.name}
                    </h4>
                    <span className="text-xs text-muted">查看详情 →</span>
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{stage.description}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 鼓励卡片 */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 text-center">
        <p className="text-2xl mb-2">🌈</p>
        <p className="text-sm font-medium">记住：每个阶段都是暂时的</p>
        <p className="text-xs text-muted mt-1">你一定会走出来，变成更好的自己。</p>
      </div>
    </div>
  );
}

// ========== 阶段详情 ==========
function StageDetail({ stage, onBack }: { stage: HealingStage; onBack: () => void }) {
  return (
    <div className="space-y-4 pb-6">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm">
        ← 返回
      </button>

      {/* 阶段标题 */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: stage.bgColor }}
      >
        <div className="text-4xl mb-2">{stage.emoji}</div>
        <h2 className="text-lg font-semibold" style={{ color: stage.color }}>{stage.title}</h2>
        <p className="text-xs mt-2 opacity-80" style={{ color: stage.color }}>{stage.description}</p>
      </div>

      {/* 建议 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-3 flex items-center gap-1.5">
          <span>💡</span> 度过这个阶段的建议
        </h3>
        <div className="space-y-2.5">
          {stage.tips.map((tip, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: stage.color }}>
                {i + 1}.
              </span>
              <p className="text-xs text-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 自我肯定语 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-medium text-sm mb-3 flex items-center gap-1.5">
          <span>🫂</span> 对自己说
        </h3>
        <div className="space-y-2">
          {stage.affirmations.map((aff, i) => (
            <div
              key={i}
              className="rounded-lg p-3 text-xs leading-relaxed"
              style={{
                backgroundColor: stage.bgColor,
                color: stage.color,
              }}
            >
              "{aff}"
            </div>
          ))}
        </div>
      </div>

      {/* 底部鼓励 */}
      <div className="text-center py-2">
        <p className="text-xs text-muted">
          {stage.id < 5
            ? `坚持住，下一个阶段「${HEARTBREAK_STAGES[stage.id].name}」在等着你 →`
            : '🎉 你已经走到了最后一个阶段，为自己骄傲！'
          }
        </p>
      </div>

      {/* 写日记 CTA */}
      <Link
        to="/entry/new"
        className="block w-full py-3 bg-primary text-white rounded-xl text-center text-sm font-medium"
      >
        写下此刻的感受
      </Link>
    </div>
  );
}

// ========== 疗愈语录视图 ==========
function QuotesView({
  category,
  onCategoryChange,
  checkLimit,
}: {
  category: HealingQuote['category'];
  onCategoryChange: (c: HealingQuote['category']) => void;
  checkLimit: () => boolean;
}) {
  const categories: HealingQuote['category'][] = ['warmth', 'heartbreak', 'self-love', 'growth', 'emotion', 'life'];
  const quotes = getQuotesByCategory(category);
  const [randomQuote, setRandomQuote] = useState(getRandomQuote());

  return (
    <div className="space-y-4">
      {/* 随机语录卡片 */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-5 text-center">
        <p className="text-2xl mb-3">🎲</p>
        <p className="text-sm font-medium leading-relaxed">"{randomQuote.text}"</p>
        <button
          onClick={() => { if (checkLimit()) setRandomQuote(getRandomQuote()); }}
          className="mt-3 text-xs text-primary font-medium"
        >
          ↻ 换一句
        </button>
      </div>

      {/* 分类选择 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map(cat => {
          const info = CATEGORY_LABELS[cat];
          return (
            <button
              key={cat}
              onClick={() => { if (checkLimit()) onCategoryChange(cat); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === cat ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}
            >
              {info.emoji} {info.label}
            </button>
          );
        })}
      </div>

      {/* 语录列表 */}
      <div className="space-y-2">
        {quotes.map((q, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3.5">
            <p className="text-sm leading-relaxed">"{q.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
