import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTarotCredits, purchaseTarotCredit, useTarotCredit, PRICING } from '@/lib/membership';
import { purchaseProduct } from '@/lib/payment';
import { callDoubaoAI, getAiConfig } from '@/lib/ai';

const TAROT_CARDS = [
  { name: '愚者', meaning: '新的开始、自由、冒险', reversed: '鲁莽、冲动、犹豫不决', emoji: '🃏' },
  { name: '魔术师', meaning: '创造力、意志力、自信', reversed: '欺骗、缺乏方向', emoji: '🎩' },
  { name: '女祭司', meaning: '直觉、潜意识、内在智慧', reversed: '忽视内心声音、表面化', emoji: '🌙' },
  { name: '女皇', meaning: '丰盛、母性、自然之美', reversed: '依赖、创造力受阻', emoji: '👑' },
  { name: '皇帝', meaning: '权威、稳定、领导力', reversed: '控制欲、僵化', emoji: '🏛' },
  { name: '教皇', meaning: '传统、精神指引、信仰', reversed: '打破常规、独立思考', emoji: '📿' },
  { name: '恋人', meaning: '爱情、和谐、关系选择', reversed: '不和谐、价值观冲突', emoji: '💕' },
  { name: '战车', meaning: '胜利、决心、前进动力', reversed: '失控、方向不明', emoji: '⚔' },
  { name: '力量', meaning: '勇气、耐心、内在力量', reversed: '自我怀疑、软弱', emoji: '🦁' },
  { name: '隐者', meaning: '内省、独处、寻找真理', reversed: '孤立、逃避现实', emoji: '🏔' },
  { name: '命运之轮', meaning: '转变、机遇、命运循环', reversed: '抗拒变化、运气不佳', emoji: '🎡' },
  { name: '正义', meaning: '公平、真相、因果', reversed: '不公平、逃避责任', emoji: '⚖' },
  { name: '倒吊人', meaning: '放下、新视角、等待', reversed: '拖延、无谓牺牲', emoji: '🙃' },
  { name: '死神', meaning: '结束与新生、转变', reversed: '抗拒改变、恐惧', emoji: '🦋' },
  { name: '节制', meaning: '平衡、耐心、调和', reversed: '失衡、过度', emoji: '🏺' },
  { name: '恶魔', meaning: '束缚、执念、物质诱惑', reversed: '解脱、觉醒', emoji: '🔗' },
  { name: '塔', meaning: '突变、觉醒、打破旧有', reversed: '逃避危机、恐惧变化', emoji: '⚡' },
  { name: '星星', meaning: '希望、灵感、内心平静', reversed: '失望、缺乏信心', emoji: '⭐' },
  { name: '月亮', meaning: '幻觉、潜意识、不安', reversed: '走出迷雾、真相浮现', emoji: '🌕' },
  { name: '太阳', meaning: '快乐、成功、活力', reversed: '暂时阴霾、过度乐观', emoji: '☀' },
  { name: '审判', meaning: '觉醒、重生、自我评估', reversed: '自我怀疑、拒绝改变', emoji: '📯' },
  { name: '世界', meaning: '圆满、成就、完整', reversed: '未完成、缺乏总结', emoji: '🌍' },
];

export default function TarotPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'picking' | 'reveal'>('intro');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isReversed, setIsReversed] = useState<boolean[]>([]);
  const [shuffledIndexes, setShuffledIndexes] = useState<number[]>([]);
  const [credits, setCredits] = useState(getTarotCredits);
  const [purchasing, setPurchasing] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiReading, setAiReading] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  async function handleBuyCredit() {
    setPurchasing(true);
    setMsg('');
    const payment = await purchaseProduct('halfdiary_tarot');
    if (payment.success) {
      const result = purchaseTarotCredit();
      setCredits(result.credits);
      setMsg('购买成功！');
    } else {
      setMsg(payment.error || '支付失败，请重试');
    }
    setPurchasing(false);
  }

  function startReading() {
    if (credits <= 0) return;
    // Consume one credit
    const ok = useTarotCredit();
    if (!ok) {
      setMsg('次数不足，请先购买');
      return;
    }
    setCredits(getTarotCredits());
    setMsg('');

    // Shuffle card indexes
    const indexes = Array.from({ length: TAROT_CARDS.length }, (_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    setShuffledIndexes(indexes);
    setSelectedCards([]);
    setIsReversed([]);
    setPhase('picking');
  }

  function pickCard(idx: number) {
    if (selectedCards.length >= 3) return;
    if (selectedCards.includes(idx)) return;
    const newSelected = [...selectedCards, idx];
    const newReversed = [...isReversed, Math.random() > 0.6];
    setSelectedCards(newSelected);
    setIsReversed(newReversed);
    if (newSelected.length === 3) {
      setTimeout(() => {
        setPhase('reveal');
        fetchAiReading(newSelected, newReversed);
      }, 600);
    }
  }

  async function fetchAiReading(cards: number[], reversed: boolean[]) {
    setAiLoading(true);
    setAiReading('');
    setAiError('');
    try {
      const config = await getAiConfig();
      if (!config) {
        setAiError('请先在 AI 陪伴中配置豆包 API');
        return;
      }
      const cardDetails = cards.map((cardIdx, i) => {
        const realIdx = shuffledIndexes[cardIdx];
        const card = TAROT_CARDS[realIdx];
        return `${labels[i]}：${card.name}（${reversed[i] ? '逆位' : '正位'}）- ${reversed[i] ? card.reversed : card.meaning}`;
      }).join('\n');

      const systemPrompt = `你是一位温柔且富有洞察力的塔罗牌解读师。用户抽取了三张牌（过去、现在、未来），请提供一段个性化的深度解读。
要求：
1. 结合三张牌之间的联系，而不是独立解释每张牌
2. 语言温暖、有诗意，给人力量和希望
3. 约200-300字
4. 结尾给出一句鼓励的话`;

      const result = await callDoubaoAI(systemPrompt, `我抽到的三张牌：\n${cardDetails}`);
      setAiReading(result);
    } catch {
      setAiError('AI 解读暂时不可用，请查看基础解读');
    } finally {
      setAiLoading(false);
    }
  }

  function reset() {
    setPhase('intro');
    setSelectedCards([]);
    setIsReversed([]);
    setAiReading('');
    setAiError('');
    setCredits(getTarotCredits());
  }

  const labels = ['过去', '现在', '未来'];

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted">&larr; 返回</button>

      <div className="text-center">
        <div className="text-4xl mb-2">🔮</div>
        <h1 className="text-xl font-semibold font-serif">塔罗牌占卜</h1>
        <p className="text-xs text-muted mt-1">倾听内心的声音，探索情绪的方向</p>
      </div>

      {phase === 'intro' && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              塔罗牌是一面镜子，映照你内心深处的情绪与直觉。
              闭上眼睛，深呼吸，然后选择三张牌。
            </p>
            <div className="flex justify-center gap-6 text-xs text-muted">
              <span>🕐 过去</span>
              <span>🔮 现在</span>
              <span>✨ 未来</span>
            </div>
          </div>

          {/* 购买 / 余额 */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">占卜次数</p>
                <p className="text-[10px] text-muted">¥{PRICING.tarot.price}/次</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{credits} <span className="text-xs font-normal text-muted">次</span></p>
              </div>
            </div>
            <button
              onClick={handleBuyCredit}
              disabled={purchasing}
              className="w-full py-2.5 border border-primary text-primary rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {purchasing ? '处理中...' : `购买占卜次数 ¥${PRICING.tarot.price}`}
            </button>
          </div>

          {msg && (
            <div className="bg-success/10 text-success text-xs px-4 py-2.5 rounded-xl text-center">{msg}</div>
          )}

          <button
            onClick={startReading}
            disabled={credits <= 0}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {credits > 0 ? '开始占卜（消耗1次）' : '请先购买占卜次数'}
          </button>
        </div>
      )}

      {phase === 'picking' && (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted">
            请选择 3 张牌（已选 {selectedCards.length}/3）
          </p>
          <div className="flex justify-center gap-2 mb-3">
            {labels.map((label, i) => (
              <div
                key={label}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  i < selectedCards.length
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background border-border text-muted'
                }`}
              >
                {label} {i < selectedCards.length ? '✓' : '?'}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {shuffledIndexes.map((_, idx) => {
              const isSelected = selectedCards.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => pickCard(idx)}
                  disabled={isSelected || selectedCards.length >= 3}
                  className={`aspect-[2/3] rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary scale-95'
                      : selectedCards.length >= 3
                        ? 'bg-gray-100 border-border opacity-40'
                        : 'bg-gradient-to-br from-indigo-100 to-purple-100 border-border hover:border-primary/50 active:scale-95'
                  }`}
                >
                  {isSelected ? '✦' : '?'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="space-y-4">
          {selectedCards.map((cardIdx, i) => {
            const realCardIdx = shuffledIndexes[cardIdx];
            const card = TAROT_CARDS[realCardIdx];
            const reversed = isReversed[i];
            return (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 space-y-2"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted font-medium">{labels[i]}</span>
                  {reversed && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">逆位</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl ${reversed ? 'rotate-180' : ''}`}>{card.emoji}</span>
                  <div>
                    <p className="text-base font-semibold font-serif">{card.name}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      {reversed ? card.reversed : card.meaning}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI 深度解读 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔮</span>
              <h3 className="text-sm font-medium font-serif">AI 深度解读</h3>
            </div>
            {aiLoading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-muted ml-2">正在解读你的牌面...</span>
              </div>
            ) : aiError ? (
              <p className="text-xs text-amber-600">{aiError}</p>
            ) : aiReading ? (
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{aiReading}</p>
            ) : null}
          </div>

          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <p className="text-xs text-muted leading-relaxed">
              塔罗牌仅供娱乐和自我反思，不代表真实预测。
              如有情绪困扰，请寻求专业帮助。
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium"
          >
            再来一次
          </button>
        </div>
      )}
    </div>
  );
}
