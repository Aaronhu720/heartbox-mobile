const MEMBERSHIP_KEY = 'halfdiary-membership';

export type MembershipPlan = 'free' | 'monthly' | 'yearly';

export interface PurchaseRecord {
  id: string;
  purchasedAt: string;
  amount: number;
  type: 'sms' | 'tarot' | 'nametest';
}

export interface MembershipState {
  plan: MembershipPlan;
  expiresAt: string | null;
  purchasedAt: string | null;
  smsCredits: number;
  tarotCredits: number;
  nameTestCredits: number;
  purchaseHistory: PurchaseRecord[];
  // Legacy field kept for compat
  smsPurchaseHistory?: PurchaseRecord[];
}

export const PRICING = {
  monthly: { price: 19.9, label: '月度会员', period: '月' },
  yearly: { price: 199, label: '年度会员', period: '年', saving: '17% OFF' },
  sms: { price: 2.9, label: '延迟短信', limit: 500 },
  tarot: { price: 9.9, label: '塔罗牌占卜' },
  nametest: { price: 9.9, label: '姓名测试' },
} as const;

export const MEMBER_FEATURES = [
  { key: 'ai', label: 'AI 陪伴对话', icon: '♡', freeLimit: '不可用' },
  { key: 'trends', label: '情绪趋势图表', icon: '◠', freeLimit: '不可用' },
  { key: 'export', label: '数据导出', icon: '↓', freeLimit: '不可用' },
  { key: 'noAds', label: '去除广告', icon: '✦', freeLimit: '有广告' },
] as const;

function getState(): MembershipState {
  const saved = localStorage.getItem(MEMBERSHIP_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate legacy data
      if (!parsed.tarotCredits) parsed.tarotCredits = 0;
      if (!parsed.nameTestCredits) parsed.nameTestCredits = 0;
      if (!parsed.purchaseHistory) parsed.purchaseHistory = parsed.smsPurchaseHistory || [];
      return parsed;
    } catch { /* fall through */ }
  }
  return {
    plan: 'free', expiresAt: null, purchasedAt: null,
    smsCredits: 0, tarotCredits: 0, nameTestCredits: 0,
    purchaseHistory: [],
  };
}

function saveState(state: MembershipState) {
  localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(state));
}

export function getMembership(): MembershipState {
  const state = getState();
  if (state.plan !== 'free' && state.expiresAt) {
    if (new Date(state.expiresAt) < new Date()) {
      state.plan = 'free';
      state.expiresAt = null;
      saveState(state);
    }
  }
  return state;
}

export function isMember(): boolean {
  return getMembership().plan !== 'free';
}

export function canUseFeature(feature: string): boolean {
  if (feature === 'diary' || feature === 'calendar' || feature === 'letters_view' || feature === 'future_self') return true;
  return isMember();
}

export function purchaseMembership(plan: 'monthly' | 'yearly'): MembershipState {
  const state = getState();
  const now = new Date();
  const expires = new Date();

  if (plan === 'monthly') {
    expires.setMonth(expires.getMonth() + 1);
  } else {
    expires.setFullYear(expires.getFullYear() + 1);
  }

  state.plan = plan;
  state.purchasedAt = now.toISOString();
  state.expiresAt = expires.toISOString();
  saveState(state);
  return state;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// SMS credits
export function purchaseSmsCredit(): { success: boolean; credits: number } {
  const state = getState();
  state.smsCredits += 1;
  state.purchaseHistory.push({ id: makeId(), purchasedAt: new Date().toISOString(), amount: PRICING.sms.price, type: 'sms' });
  saveState(state);
  return { success: true, credits: state.smsCredits };
}

export function useSmsCredit(): boolean {
  const state = getState();
  if (state.smsCredits <= 0) return false;
  state.smsCredits -= 1;
  saveState(state);
  return true;
}

export function getSmsCredits(): number {
  return getState().smsCredits;
}

// Tarot credits
export function purchaseTarotCredit(): { success: boolean; credits: number } {
  const state = getState();
  state.tarotCredits += 1;
  state.purchaseHistory.push({ id: makeId(), purchasedAt: new Date().toISOString(), amount: PRICING.tarot.price, type: 'tarot' });
  saveState(state);
  return { success: true, credits: state.tarotCredits };
}

export function useTarotCredit(): boolean {
  const state = getState();
  if (state.tarotCredits <= 0) return false;
  state.tarotCredits -= 1;
  saveState(state);
  return true;
}

export function getTarotCredits(): number {
  return getState().tarotCredits;
}

// Name test credits
export function purchaseNameTestCredit(): { success: boolean; credits: number } {
  const state = getState();
  state.nameTestCredits += 1;
  state.purchaseHistory.push({ id: makeId(), purchasedAt: new Date().toISOString(), amount: PRICING.nametest.price, type: 'nametest' });
  saveState(state);
  return { success: true, credits: state.nameTestCredits };
}

export function useNameTestCredit(): boolean {
  const state = getState();
  if (state.nameTestCredits <= 0) return false;
  state.nameTestCredits -= 1;
  saveState(state);
  return true;
}

export function getNameTestCredits(): number {
  return getState().nameTestCredits;
}

export function restoreMembership(data: MembershipState) {
  saveState(data);
}
