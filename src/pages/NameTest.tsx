import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNameTestCredits, purchaseNameTestCredit, useNameTestCredit, PRICING } from '@/lib/membership';
import { purchaseProduct } from '@/lib/payment';
import { callDoubaoAI, getAiConfig } from '@/lib/ai';

function nameHash(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pairHash(a: string, b: string): number {
  const sorted = [a, b].sort();
  return nameHash(sorted[0] + sorted[1]);
}

interface MatchResult {
  score: number;
  compatibility: string;
  strengths: string;
  challenges: string;
  advice: string;
  luckyColor: { name: string; hex: string };
  elementA: string;
  elementB: string;
  elementMatch: string;
}

const COMPATIBILITIES = [
  '你们之间有一种天然的默契，彼此的性格互补，能在对方身上找到自己缺少的部分。这段关系值得珍惜。',
  '你们的相处模式温暖而自然，像两颗互相环绕的星星。给彼此足够的空间，关系会越来越好。',
  '你们之间存在强烈的吸引力，性格中有很多相似之处。学会欣赏差异，你们会成为最好的搭档。',
  '你们的组合充满活力和创造力，在一起时总能碰撞出新的火花。保持好奇心和尊重。',
  '你们之间有一种深层的情感连接，能够理解彼此内心深处的感受。信任是你们最大的财富。',
  '你们的关系像春天的花园，需要用心浇灌但回报丰厚。耐心和包容是关键。',
  '你们之间有种奇妙的平衡感，一个主动一个温柔，互相成就。享受这种和谐。',
  '你们的缘分深厚，在一起能让彼此变得更好。珍惜每一个共同成长的瞬间。',
];

const STRENGTHS = [
  '你们在沟通上有天然的优势，能够坦诚地表达自己的想法和感受。',
  '你们的价值观高度一致，对未来有相似的期望和目标。',
  '你们在困难时期能够相互支持，是彼此最坚实的后盾。',
  '你们善于制造生活中的小惊喜，让关系始终保持新鲜感。',
  '你们在情感表达上非常同步，能够敏锐地感知对方的需求。',
  '你们有很多共同兴趣，在一起总有聊不完的话题。',
  '你们的性格互补完美，一个理性一个感性，取长补短。',
  '你们在生活节奏上非常合拍，能自然地融入彼此的生活。',
];

const CHALLENGES = [
  '需要注意沟通方式，有时直接的表达可能会伤害对方。学会用温柔的方式说真话。',
  '要避免在小事上过于较真，学会适当让步，大事上保持一致即可。',
  '注意平衡个人空间和亲密时光，过度依赖或过度独立都需要调整。',
  '遇到分歧时不要冷战，及时沟通才能避免误会越来越深。',
  '各自的社交圈可能有差异，尊重彼此的朋友圈很重要。',
  '在金钱观上可能有不同看法，提前沟通期望会减少摩擦。',
  '节奏不同时不要催促对方，给彼此适应和成长的时间。',
  '避免把工作中的压力带入关系中，学会在一起时放松。',
];

const ADVICES = [
  '每周安排一次只属于你们两个人的时光，用心经营这段关系。',
  '多表达感谢和欣赏，不要把对方的付出视为理所当然。',
  '一起设定一个共同目标，在实现的过程中增进感情。',
  '学会在对方需要时给予支持，在对方独处时给予空间。',
  '保持自我成长，最好的关系是两个完整的人在一起。',
  '记录你们之间的美好瞬间，这些会成为未来最珍贵的回忆。',
  '遇到问题时一起面对而不是互相指责，你们是队友不是对手。',
  '保持一点点神秘感和新鲜感，让彼此永远有被惊喜的可能。',
];

const LUCKY_COLORS = [
  { name: '樱花粉', hex: '#FFB7C5' },
  { name: '天空蓝', hex: '#87CEEB' },
  { name: '薄荷绿', hex: '#98FB98' },
  { name: '琥珀金', hex: '#FFBF00' },
  { name: '薰衣草紫', hex: '#B57EDC' },
  { name: '珊瑚橘', hex: '#FF7F50' },
  { name: '翡翠绿', hex: '#50C878' },
  { name: '宝石蓝', hex: '#4169E1' },
];

const ELEMENTS = ['金', '木', '水', '火', '土'];

const ELEMENT_MATCH: Record<string, string> = {
  '金金': '刚柔并济，彼此都很有原则',
  '金木': '需要磨合，但能互相促进成长',
  '金水': '相生相助，非常和谐的组合',
  '金火': '充满激情但需要平衡',
  '金土': '稳固踏实，值得信赖的关系',
  '木木': '生机勃勃，充满成长的力量',
  '木水': '滋养相生，温柔而有力量',
  '木火': '热情洋溢，创造力爆棚',
  '木土': '扎根深处，稳定而有活力',
  '水水': '情感丰富，心灵相通',
  '水火': '水火交融，激情与温柔并存',
  '水土': '包容万物，深沉而稳重',
  '火火': '热情似火，永不无聊',
  '火土': '温暖坚实，给人安全感',
  '土土': '脚踏实地，最稳固的组合',
};

function analyzeMatch(nameA: string, nameB: string): MatchResult {
  const h = pairHash(nameA, nameB);
  const hA = nameHash(nameA);
  const hB = nameHash(nameB);
  const elA = ELEMENTS[(hA >> 2) % ELEMENTS.length];
  const elB = ELEMENTS[(hB >> 2) % ELEMENTS.length];
  const elKey = [elA, elB].sort().join('');

  return {
    score: 60 + (h % 36),
    compatibility: COMPATIBILITIES[h % COMPATIBILITIES.length],
    strengths: STRENGTHS[(h >> 3) % STRENGTHS.length],
    challenges: CHALLENGES[(h >> 6) % CHALLENGES.length],
    advice: ADVICES[(h >> 9) % ADVICES.length],
    luckyColor: LUCKY_COLORS[(h >> 4) % LUCKY_COLORS.length],
    elementA: elA,
    elementB: elB,
    elementMatch: ELEMENT_MATCH[elKey] || '独特的组合，充满未知的可能性',
  };
}

export default function NameTestPage() {
  const navigate = useNavigate();
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [credits, setCredits] = useState(getNameTestCredits);
  const [purchasing, setPurchasing] = useState(false);
  const [msg, setMsg] = useState('');

  const canSubmit = myName.trim().length >= 2 && partnerName.trim().length >= 2 && !analyzing && credits > 0;

  async function handleBuyCredit() {
    setPurchasing(true);
    setMsg('');
    const payment = await purchaseProduct('halfdiary_nametest');
    if (payment.success) {
      const res = purchaseNameTestCredit();
      setCredits(res.credits);
      setMsg('购买成功！');
    } else {
      setMsg(payment.error || '支付失败，请重试');
    }
    setPurchasing(false);
  }

  async function handleAnalyze() {
    if (myName.trim().length < 2 || partnerName.trim().length < 2) return;
    if (credits <= 0) {
      setMsg('次数不足，请先购买');
      return;
    }

    const ok = useNameTestCredit();
    if (!ok) {
      setMsg('次数不足，请先购买');
      return;
    }
    setCredits(getNameTestCredits());
    setMsg('');
    setAnalyzing(true);

    const staticResult = analyzeMatch(myName.trim(), partnerName.trim());

    try {
      const config = await getAiConfig();
      if (config) {
        const systemPrompt = `你是一位姓名配对专家和关系分析师。根据用户提供的两个名字，分析两人的缘分和配对情况。
要求：
1. 每个维度50-80字，语言温暖、浪漫、有洞察力
2. 结合两个名字的含义、音韵、笔画等特征进行配对分析
3. 仅供娱乐参考，给人正面积极、甜蜜的感觉
4. 必须返回严格JSON格式，不要添加任何其他内容

返回格式：{"compatibility":"缘分解析","strengths":"你们的优势","challenges":"需要注意的地方","advice":"相处建议"}`;

        const aiText = await callDoubaoAI(systemPrompt, `请分析这两个名字的配对：「${myName.trim()}」和「${partnerName.trim()}」`);
        const cleaned = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const aiData = JSON.parse(cleaned);
        if (aiData.compatibility && aiData.strengths && aiData.challenges && aiData.advice) {
          setResult({ ...staticResult, ...aiData });
          setAnalyzing(false);
          return;
        }
      }
    } catch {
      // AI failed, fall back to static
    }

    setResult(staticResult);
    setAnalyzing(false);
  }

  function reset() {
    setMyName('');
    setPartnerName('');
    setResult(null);
    setCredits(getNameTestCredits());
  }

  const scoreLabel = result
    ? result.score >= 90 ? '天作之合' : result.score >= 80 ? '非常般配' : result.score >= 70 ? '相当不错' : '需要磨合'
    : '';

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted">&larr; 返回</button>

      <div className="text-center">
        <div className="text-4xl mb-2">💕</div>
        <h1 className="text-xl font-semibold font-serif">姓名配对测试</h1>
        <p className="text-xs text-muted mt-1">输入两个名字，测试你们的缘分指数</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">你的名字</label>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder="输入你的名字..."
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-center text-lg"
                maxLength={20}
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
                &hearts;
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">TA 的名字</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="输入 TA 的名字..."
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-center text-lg"
                maxLength={20}
              />
            </div>

            <p className="text-[10px] text-muted text-center">
              支持中文名、英文名、昵称，每个名字2-20个字符
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">测试次数</p>
                <p className="text-[10px] text-muted">¥{PRICING.nametest.price}/次</p>
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
              {purchasing ? '处理中...' : `购买测试次数 ¥${PRICING.nametest.price}`}
            </button>
          </div>

          {msg && (
            <div className={`text-xs px-4 py-2.5 rounded-xl text-center ${
              msg.includes('成功') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}>{msg}</div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {analyzing ? '配对分析中...' : credits > 0 ? '开始配对（消耗1次）' : '请先购买测试次数'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-xl border border-border p-5 text-center">
            <p className="text-sm text-muted">配对结果</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xl font-bold font-serif">{myName}</span>
              <span className="text-primary text-xl">&hearts;</span>
              <span className="text-xl font-bold font-serif">{partnerName}</span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-primary">{result.score}</p>
              <p className="text-xs text-muted mt-1">{scoreLabel}</p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div>
                <p className="text-base font-bold">{result.elementA}</p>
                <p className="text-[10px] text-muted">{myName}</p>
              </div>
              <div className="text-muted text-[10px]">x</div>
              <div>
                <p className="text-base font-bold">{result.elementB}</p>
                <p className="text-[10px] text-muted">{partnerName}</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: result.luckyColor.hex }} />
                  <p className="text-xs font-medium">{result.luckyColor.name}</p>
                </div>
                <p className="text-[10px] text-muted">CP 幸运色</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🌊</span>
              <h3 className="text-sm font-medium font-serif">五行配对</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">{result.elementMatch}</p>
          </div>

          {[
            { icon: '💫', title: '缘分解析', text: result.compatibility },
            { icon: '💪', title: '你们的优势', text: result.strengths },
            { icon: '💡', title: '需要注意', text: result.challenges },
            { icon: '🌸', title: '相处建议', text: result.advice },
          ].map((section) => (
            <div key={section.title} className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                <h3 className="text-sm font-medium font-serif">{section.title}</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">{section.text}</p>
            </div>
          ))}

          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <p className="text-xs text-muted leading-relaxed">
              姓名配对仅供娱乐参考，真正的感情需要用心经营。祝你们幸福！
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium"
          >
            重新测试
          </button>
        </div>
      )}
    </div>
  );
}
