/**
 * 支付抽象层
 *
 * 当前：模拟支付（本地测试用）
 * 上线前：替换为 Google Play Billing / Apple IAP
 *
 * Google Play Billing 接入步骤：
 * 1. 注册 Google Play Console ($25)
 * 2. 上传 AAB 到内部测试轨道
 * 3. 在"应用内商品"中创建商品：
 *    - halfdiary_monthly (订阅, ¥19.9/月)
 *    - halfdiary_yearly  (订阅, ¥199/年)
 *    - halfdiary_sms     (一次性, ¥0.99)
 *    - halfdiary_tarot   (一次性, ¥9.9)
 *    - halfdiary_nametest (一次性, ¥9.9)
 * 4. 安装 cordova-plugin-purchase 或自定义 Capacitor 插件
 * 5. 将下方 simulatePayment 替换为真实支付调用
 */

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

// 商品价格表（与 Google Play Console 中的设置需保持一致）
export const PRODUCT_PRICES: Record<ProductId, { price: number; currency: string; label: string }> = {
  halfdiary_monthly:  { price: 19.9,  currency: 'CNY', label: '月度会员' },
  halfdiary_yearly:   { price: 199,   currency: 'CNY', label: '年度会员' },
  halfdiary_sms:      { price: 0.99,  currency: 'CNY', label: '短信发送' },
  halfdiary_tarot:    { price: 9.9,   currency: 'CNY', label: '塔罗牌占卜' },
  halfdiary_nametest: { price: 9.9,   currency: 'CNY', label: '姓名测试' },
};

/**
 * 发起支付
 *
 * 当前为模拟实现，直接返回成功。
 * 上线时替换为真实 Google Play Billing 调用。
 */
export async function purchaseProduct(productId: ProductId): Promise<PaymentResult> {
  // === 模拟支付 ===
  // TODO: 替换为真实支付SDK
  //
  // 真实实现示例:
  // const { Purchases } = await import('@capawesome/capacitor-android-billing');
  // const result = await Purchases.purchaseProduct({ productId });
  // return { success: result.success, transactionId: result.transactionId };

  await new Promise(r => setTimeout(r, 800)); // 模拟网络延迟

  const txId = `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  console.log(`[Payment] Simulated purchase: ${productId} - ¥${PRODUCT_PRICES[productId].price}`);

  return {
    success: true,
    transactionId: txId,
  };
}

/**
 * 恢复购买（订阅类）
 * 用于用户重装应用后恢复会员状态
 */
export async function restorePurchases(): Promise<{ activeSubscriptions: ProductId[] }> {
  // TODO: 替换为真实恢复逻辑
  console.log('[Payment] Restore purchases (simulated)');
  return { activeSubscriptions: [] };
}

/**
 * 检查支付环境是否可用
 */
export function isPaymentAvailable(): boolean {
  // TODO: 真实环境中检测 Google Play Services 是否可用
  return true;
}
