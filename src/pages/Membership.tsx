import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMembership, purchaseMembership, purchaseSmsCredit,
  PRICING, MEMBER_FEATURES, type MembershipPlan,
} from '@/lib/membership';
import { purchaseProduct, useNativeIAP, type ProductId } from '@/lib/payment';

export default function MembershipPage() {
  const navigate = useNavigate();
  const [membership, setMembership] = useState(getMembership);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [msg, setMsg] = useState('');

  const isActive = membership.plan !== 'free' && membership.expiresAt && new Date(membership.expiresAt) > new Date();
  const nativeIAP = useNativeIAP();

  async function handleNativePurchase(productId: ProductId) {
    setPurchasing(true);
    setMsg('');
    try {
      const result = await purchaseProduct(productId);
      if (result.success) {
        if (productId === 'halfdiary_monthly') purchaseMembership('monthly');
        else if (productId === 'halfdiary_yearly') purchaseMembership('yearly');
        else if (productId === 'halfdiary_sms') purchaseSmsCredit();
        setMembership(getMembership());
        setMsg('购买成功！');
      } else {
        setMsg(result.error || '购买失败');
      }
    } catch {
      setMsg('购买失败，请重试');
    } finally {
      setPurchasing(false);
    }
  }

  function handlePurchase() {
    const productId = selectedPlan === 'monthly' ? 'halfdiary_monthly' : 'halfdiary_yearly';
    if (nativeIAP) {
      handleNativePurchase(productId as ProductId);
    } else {
      navigate(`/payment?product=${productId}`);
    }
  }

  function handleBuySms() {
    if (nativeIAP) {
      handleNativePurchase('halfdiary_sms');
    } else {
      navigate('/payment?product=halfdiary_sms');
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted">&larr; 返回</button>

      <div className="text-center">
        <h1 className="text-xl font-semibold font-serif">Half日记 会员</h1>
        <p className="text-xs text-muted mt-1">解锁全部功能，获得更好的体验</p>
      </div>

      {isActive && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-primary">
            当前：{membership.plan === 'monthly' ? '月度' : '年度'}会员
          </p>
          <p className="text-xs text-muted mt-1">
            到期时间：{new Date(membership.expiresAt!).toLocaleDateString('zh-CN')}
          </p>
        </div>
      )}

      {msg && (
        <div className="bg-success/10 text-success text-xs px-4 py-2.5 rounded-xl text-center">{msg}</div>
      )}

      {/* 会员方案 */}
      <div className="space-y-3">
        <h2 className="text-base font-medium font-serif">选择方案</h2>

        <div
          onClick={() => setSelectedPlan('yearly')}
          className={`relative bg-card rounded-xl border-2 p-4 cursor-pointer transition-colors ${
            selectedPlan === 'yearly' ? 'border-primary' : 'border-border'
          }`}
        >
          <div className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
            {PRICING.yearly.saving}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium">{PRICING.yearly.label}</p>
              <p className="text-[10px] text-muted mt-0.5">平均 ¥{(PRICING.yearly.price / 12).toFixed(1)}/月</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-primary">¥{PRICING.yearly.price}</span>
              <span className="text-xs text-muted">/{PRICING.yearly.period}</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedPlan('monthly')}
          className={`bg-card rounded-xl border-2 p-4 cursor-pointer transition-colors ${
            selectedPlan === 'monthly' ? 'border-primary' : 'border-border'
          }`}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium">{PRICING.monthly.label}</p>
              <p className="text-[10px] text-muted mt-0.5">按月自动续费</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold">¥{PRICING.monthly.price}</span>
              <span className="text-xs text-muted">/{PRICING.monthly.period}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 会员权益 */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-medium">会员权益</h3>
        {MEMBER_FEATURES.map(f => (
          <div key={f.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{f.icon}</span>
              <span className="text-xs">{f.label}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-muted">{f.freeLimit}</span>
              <span className="text-primary font-medium">✓ 可用</span>
            </div>
          </div>
        ))}
      </div>

      {!isActive && (
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {purchasing ? '处理中...' : `立即开通 ¥${PRICING[selectedPlan].price}/${PRICING[selectedPlan].period}`}
        </button>
      )}

      {/* 短信购买 */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-medium">延迟发送短信</h3>
        <p className="text-[10px] text-muted">
          写下想说的话，设定时间后通过短信发送给对方。冷静之后再决定。
        </p>
        <div className="flex items-center justify-between bg-background rounded-lg p-3">
          <div>
            <p className="text-xs font-medium">¥{PRICING.sms.price}/条</p>
            <p className="text-[10px] text-muted">限{PRICING.sms.limit}字以内</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted">当前余额</p>
            <p className="text-sm font-bold text-primary">{membership.smsCredits} 条</p>
          </div>
        </div>
        <button
          onClick={handleBuySms}
          disabled={purchasing}
          className="w-full py-2.5 border border-primary text-primary rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {purchasing ? '处理中...' : `购买短信 ¥${PRICING.sms.price}`}
        </button>
      </div>

      <p className="text-[10px] text-muted text-center px-4">
        支付即表示同意《用户服务协议》和《隐私政策》。
        会员到期后自动降级为免费版，已有数据不会丢失。
      </p>
    </div>
  );
}
