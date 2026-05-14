import { useState } from 'react';
import { getDailyQuote, getRandomQuote, CATEGORY_LABELS, type HealingQuote } from '@/lib/healing';

export default function DailyQuoteCard() {
  const [quote, setQuote] = useState<HealingQuote>(getDailyQuote);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleRefresh() {
    setIsAnimating(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsAnimating(false);
    }, 300);
  }

  const categoryInfo = CATEGORY_LABELS[quote.category];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/10 p-4">
      {/* 装饰元素 */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/5" />
      <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-accent/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💝</span>
            <span className="text-xs font-medium text-primary">今日暖心话</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-xs text-muted hover:text-primary active:scale-95 transition-all flex items-center gap-1"
          >
            <span className={`inline-block transition-transform duration-300 ${isAnimating ? 'rotate-180' : ''}`}>↻</span>
            换一句
          </button>
        </div>

        <p
          className={`text-sm leading-relaxed font-medium transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          "{quote.text}"
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: quote.category === 'heartbreak' ? '#FEE2E2' : quote.category === 'self-love' ? '#EDE9FE' : quote.category === 'warmth' ? '#FEF3C7' : '#D1FAE5',
              color: quote.category === 'heartbreak' ? '#EF4444' : quote.category === 'self-love' ? '#7C3AED' : quote.category === 'warmth' ? '#D97706' : '#059669',
            }}
          >
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
          <span className="text-[10px] text-muted">— Half日记</span>
        </div>
      </div>
    </div>
  );
}
