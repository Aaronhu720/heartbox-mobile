import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { createOrder, pollOrderStatus, type PayChannel, type CreateOrderResponse } from '@/lib/payment-api';
import { purchaseMembership, purchaseSmsCredit, purchaseTarotCredit, purchaseNameTestCredit, PRICING } from '@/lib/membership';

type Step = 'choose' | 'qrcode' | 'success' | 'error';

const PRODUCT_INFO: Record<string, { name: string; price: number; icon: string }> = {
  halfdiary_monthly:  { name: '月度会员', price: PRICING.monthly.price, icon: '✦' },
  halfdiary_yearly:   { name: '年度会员', price: PRICING.yearly.price, icon: '♛' },
  halfdiary_sms:      { name: '延迟短信', price: PRICING.sms.price, icon: '✉' },
  halfdiary_tarot:    { name: '塔罗占卜', price: PRICING.tarot.price, icon: '🔮' },
  halfdiary_nametest: { name: '姓名测试', price: PRICING.nametest.price, icon: '💕' },
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product') || 'halfdiary_yearly';

  const [step, setStep] = useState<Step>('choose');
  const [channel, setChannel] = useState<PayChannel>('wechat');
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

  const product = PRODUCT_INFO[productId];

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createOrder(productId, channel);
      setOrder(result);
      setStep('qrcode');

      const stop = pollOrderStatus(result.orderNo, (data) => {
        activateProduct(data.productId || productId);
        setStep('success');
      });
      setStopPolling(() => stop);
    } catch (err: any) {
      setError(err.message || '创建订单失败');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }, [productId, channel]);

  useEffect(() => {
    return () => { stopPolling?.(); };
  }, [stopPolling]);

  function activateProduct(pid: string) {
    if (pid === 'halfdiary_monthly') purchaseMembership('monthly');
    else if (pid === 'halfdiary_yearly') purchaseMembership('yearly');
    else if (pid === 'halfdiary_sms') purchaseSmsCredit();
    else if (pid === 'halfdiary_tarot') purchaseTarotCredit();
    else if (pid === 'halfdiary_nametest') purchaseNameTestCredit();
  }

  if (!product) {
    return (
      <div className="max-w-sm mx-auto p-6 text-center">
        <p className="text-muted">无效的商品</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm">返回</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-6">
      <button onClick={() => {
        stopPolling?.();
        if (step === 'qrcode') setStep('choose');
        else navigate(-1);
      }} className="text-sm text-muted">
        &larr; {step === 'qrcode' ? '重新选择' : '返回'}
      </button>

      {/* 商品信息 */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">{product.icon}</span>
        </div>
        <h1 className="text-lg font-semibold font-serif">{product.name}</h1>
        <p className="text-2xl font-bold text-primary mt-1">¥{product.price}</p>
      </div>

      {/* 选择支付方式 */}
      {step === 'choose' && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-center">选择支付方式</h2>

          <div className="space-y-3">
            <label
              onClick={() => setChannel('wechat')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                channel === 'wechat' ? 'border-green-500 bg-green-50' : 'border-border bg-card'
              }`}
            >
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.46 6.46 0 0 1-.271-1.845c0-3.584 3.424-6.494 7.645-6.494.259 0 .514.013.768.034C16.894 4.542 13.137 2.188 8.691 2.188zm-2.6 4.17c.58 0 1.049.47 1.049 1.049 0 .58-.47 1.049-1.049 1.049-.58 0-1.049-.47-1.049-1.049 0-.58.47-1.049 1.049-1.049zm5.392 0c.58 0 1.049.47 1.049 1.049 0 .58-.47 1.049-1.049 1.049-.58 0-1.049-.47-1.049-1.049 0-.58.47-1.049 1.049-1.049zM15.876 9.6c-3.572 0-6.468 2.503-6.468 5.59 0 3.088 2.896 5.59 6.468 5.59.714 0 1.4-.104 2.042-.297a.62.62 0 0 1 .515.07l1.368.8a.234.234 0 0 0 .12.039c.115 0 .21-.095.21-.213 0-.052-.02-.103-.034-.153l-.281-1.065a.426.426 0 0 1 .154-.48C21.44 18.33 22.344 16.634 22.344 15.19c0-3.087-2.896-5.59-6.468-5.59zm-2.205 3.38c.418 0 .756.338.756.756s-.338.756-.756.756-.756-.338-.756-.756.338-.756.756-.756zm4.41 0c.418 0 .756.338.756.756s-.338.756-.756.756-.756-.338-.756-.756.338-.756.756-.756z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">微信支付</p>
                <p className="text-[10px] text-muted">使用微信扫码支付</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                channel === 'wechat' ? 'border-green-500' : 'border-gray-300'
              }`}>
                {channel === 'wechat' && <div className="w-3 h-3 rounded-full bg-green-500" />}
              </div>
            </label>

            <label
              onClick={() => setChannel('alipay')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                channel === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-border bg-card'
              }`}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                  <path d="M21.422 15.358c-1.573-.787-3.31-1.57-4.14-1.96-.407-.19-.763-.355-.763-.355s-.503.903-1.35 1.754c-1.07 1.07-2.377 1.573-3.14.907-.987-.863-.358-2.683 1.2-4.637.49-.614 1.08-1.18 1.733-1.657-.14-.34-.28-.68-.43-1.007H9.85v-.79h3.29v-1.34H9.85V4.93H8.58v1.343H5.26v.79h3.32v1.34H5.26v.79h5.14c.15.37.29.73.42 1.077a14.35 14.35 0 0 0-3.79.97c-2.32 1.09-3.49 2.8-3.04 4.31.36 1.22 1.71 1.89 3.5 1.73 1.88-.16 3.47-1.17 4.62-2.57.43.21 3.43 1.65 5.06 2.51 1.14.6 2.08 1.12 2.08 1.12l1.19-2.45s-.6-.34-1.56-.9l-.46-.27zM8.94 17.48c-1.45.14-2.35-.28-2.58-1.05-.32-1.05.7-2.35 2.38-3.15a11.6 11.6 0 0 1 3.16-.92c-.93 1.89-2.15 4.45-2.96 5.12z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">支付宝</p>
                <p className="text-[10px] text-muted">使用支付宝扫码支付</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                channel === 'alipay' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {channel === 'alipay' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </div>
            </label>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loading ? '正在创建订单...' : `确认支付 ¥${product.price}`}
          </button>
        </div>
      )}

      {/* 二维码展示 */}
      {step === 'qrcode' && order && (
        <div className="space-y-4 text-center">
          <div className={`inline-block p-1 rounded-lg ${
            channel === 'wechat' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-xs font-medium mb-2 ${
              channel === 'wechat' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {channel === 'wechat' ? '微信' : '支付宝'}扫码支付
            </p>
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={order.qrUrl || order.payUrl}
                size={200}
                level="M"
                includeMargin
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted">
              请使用{channel === 'wechat' ? '微信' : '支付宝'}扫描二维码完成支付
            </p>
            <p className="text-xs text-muted">
              订单号：{order.orderNo}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <p className="text-xs text-primary">等待支付中...</p>
            </div>
          </div>
        </div>
      )}

      {/* 支付成功 */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold font-serif">支付成功！</h2>
          <p className="text-sm text-muted">{product.name} 已开通</p>
          <button
            onClick={() => navigate('/membership')}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium"
          >
            返回会员中心
          </button>
        </div>
      )}

      {/* 支付失败 */}
      {step === 'error' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold font-serif">支付失败</h2>
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => { setError(''); setStep('choose'); }}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium"
          >
            重新支付
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted text-center px-4">
        支付即表示同意《用户服务协议》和《隐私政策》。如有问题请联系客服。
      </p>
    </div>
  );
}
