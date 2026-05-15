/**
 * 支付层 — cordova-plugin-purchase (CdvPurchase)
 *
 * 原生环境使用 Google Play Billing / Apple IAP
 * 浏览器环境降级为模拟支付（开发用）
 */

import { Capacitor } from '@capacitor/core';

export type ProductId =
  | 'halfdiary_monthly'
  | 'halfdiary_yearly'
  | 'halfdiary_sms'
  | 'halfdiary_tarot'
  | 'halfdiary_nametest';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const PRODUCT_PRICES: Record<ProductId, { price: number; currency: string; label: string }> = {
  halfdiary_monthly:  { price: 19.9,  currency: 'CNY', label: '月度会员' },
  halfdiary_yearly:   { price: 199,   currency: 'CNY', label: '年度会员' },
  halfdiary_sms:      { price: 2.9,   currency: 'CNY', label: '短信发送' },
  halfdiary_tarot:    { price: 9.9,   currency: 'CNY', label: '塔罗牌占卜' },
  halfdiary_nametest: { price: 9.9,   currency: 'CNY', label: '姓名测试' },
};

const SUBSCRIPTION_IDS: ProductId[] = ['halfdiary_monthly', 'halfdiary_yearly'];
const CONSUMABLE_IDS: ProductId[] = ['halfdiary_sms', 'halfdiary_tarot', 'halfdiary_nametest'];

let storeReady = false;
let initPromise: Promise<void> | null = null;

function getCdvPurchase(): any {
  return (window as any).CdvPurchase;
}

/**
 * 初始化支付商店 — 在 App 启动时调用一次
 */
export async function initializeStore(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (storeReady) return;
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve) => {
    const CdvPurchase = getCdvPurchase();
    if (!CdvPurchase) {
      console.warn('[Payment] CdvPurchase not available');
      resolve();
      return;
    }

    const store = CdvPurchase.store;
    const { ProductType, Platform } = CdvPurchase;

    store.verbosity = CdvPurchase.LogLevel.WARNING;

    const platform = Capacitor.getPlatform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

    for (const id of SUBSCRIPTION_IDS) {
      store.register({ id, type: ProductType.PAID_SUBSCRIPTION, platform });
    }

    for (const id of CONSUMABLE_IDS) {
      store.register({ id, type: ProductType.CONSUMABLE, platform });
    }

    store.when()
      .approved((transaction: any) => transaction.verify())
      .verified((receipt: any) => receipt.finish());

    store.initialize([platform]).then(() => {
      storeReady = true;
      console.log('[Payment] Store initialized');
      resolve();
    }).catch((err: any) => {
      console.error('[Payment] Store init failed', err);
      resolve();
    });
  });

  return initPromise;
}

/**
 * 发起支付
 */
export async function purchaseProduct(productId: ProductId): Promise<PaymentResult> {
  if (!Capacitor.isNativePlatform()) {
    await new Promise(r => setTimeout(r, 800));
    const txId = `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[Payment] Simulated purchase: ${productId}`);
    return { success: true, transactionId: txId };
  }

  await initializeStore();

  const CdvPurchase = getCdvPurchase();
  if (!CdvPurchase) return { success: false, error: '支付服务不可用' };

  const store = CdvPurchase.store;
  const product = store.get(productId);
  if (!product) return { success: false, error: '商品不存在，请检查网络' };

  const offer = product.getOffer();
  if (!offer) return { success: false, error: '无法获取商品信息' };

  return new Promise<PaymentResult>((resolve) => {
    let settled = false;

    function done(result: PaymentResult) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    const monitorFinished = store.when().finished((transaction: any) => {
      const match = transaction.products?.some((p: any) => p.id === productId);
      if (match) {
        monitorFinished.unsubscribe();
        done({ success: true, transactionId: transaction.transactionId || 'ok' });
      }
    });

    offer.order()
      .then((error: any) => {
        if (error) {
          monitorFinished.unsubscribe();
          done({ success: false, error: error.message || '支付取消' });
        }
      })
      .catch((err: any) => {
        monitorFinished.unsubscribe();
        done({ success: false, error: err?.message || '支付失败' });
      });

    setTimeout(() => {
      monitorFinished.unsubscribe();
      done({ success: false, error: '支付超时，请重试' });
    }, 120_000);
  });
}

/**
 * 恢复购买（订阅类）
 */
export async function restorePurchases(): Promise<{ activeSubscriptions: ProductId[] }> {
  if (!Capacitor.isNativePlatform()) {
    return { activeSubscriptions: [] };
  }

  await initializeStore();

  const CdvPurchase = getCdvPurchase();
  if (!CdvPurchase) return { activeSubscriptions: [] };

  const store = CdvPurchase.store;
  await store.restorePurchases();

  const active: ProductId[] = [];
  for (const id of SUBSCRIPTION_IDS) {
    const product = store.get(id);
    if (product?.owned) active.push(id);
  }

  return { activeSubscriptions: active };
}

/**
 * 获取商品的实际价格（从商店获取，包含本地化货币）
 */
export function getProductPrice(productId: ProductId): string | null {
  if (!Capacitor.isNativePlatform()) return null;

  const CdvPurchase = getCdvPurchase();
  if (!CdvPurchase) return null;

  const product = CdvPurchase.store.get(productId);
  const offer = product?.getOffer();
  return offer?.pricingPhases?.[0]?.price || product?.pricing?.price || null;
}

export function isPaymentAvailable(): boolean {
  if (!Capacitor.isNativePlatform()) return true;
  return !!getCdvPurchase();
}

export function isIOSPlatform(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

export function useNativeIAP(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
