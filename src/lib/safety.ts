const CRISIS_KEYWORDS = [
  '自杀', '不想活', '想死', '结束生命', '活不下去',
  '自残', '割腕', '跳楼', '吃药自杀',
  'suicide', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'cut myself', 'jump off',
];

export function detectCrisisContent(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

export const SAFETY_MESSAGE = '如果你正在经历强烈痛苦，请拨打心理援助热线 400-161-9995 或联系身边可信任的人。本应用不能替代专业心理咨询。';

export const CRISIS_MESSAGE = '我们注意到你可能正在经历非常艰难的时刻。请立即联系专业帮助：\n\n' +
  '中国24小时心理援助热线：400-161-9995\n' +
  '北京心理危机研究与干预中心：010-82951332\n' +
  '生命热线：400-821-1215\n\n' +
  'Crisis Text Line (US): Text HOME to 741741\n' +
  'National Suicide Prevention Lifeline: 988';

export const MOOD_TAGS = [
  { value: 'missing', label: '想念', color: '#60A5FA', bg: '#DBEAFE', emoji: '💭' },
  { value: 'pain', label: '痛苦', color: '#F87171', bg: '#FEE2E2', emoji: '😢' },
  { value: 'anger', label: '愤怒', color: '#EF4444', bg: '#FEE2E2', emoji: '😤' },
  { value: 'relief', label: '释怀', color: '#34D399', bg: '#D1FAE5', emoji: '😌' },
  { value: 'regret', label: '后悔', color: '#FBBF24', bg: '#FEF3C7', emoji: '😔' },
  { value: 'calm', label: '平静', color: '#818CF8', bg: '#E0E7FF', emoji: '🧘' },
  { value: 'gratitude', label: '感恩', color: '#A78BFA', bg: '#EDE9FE', emoji: '🙏' },
] as const;
