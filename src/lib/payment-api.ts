const API_BASE = import.meta.env.VITE_PAYMENT_API || 'https://halfdiary-website.vercel.app';

export type PayChannel = 'wechat' | 'alipay';

export interface CreateOrderResponse {
  success: boolean;
  orderNo: string;
  qrUrl: string;
  payUrl: string;
  channel: PayChannel;
  productId: string;
  price: number;
  productName: string;
  error?: string;
}

export interface OrderStatusResponse {
  orderNo: string;
  status: 'pending' | 'paid';
  productId?: string;
  paidAt?: string;
}

export async function createOrder(
  productId: string,
  channel: PayChannel,
  userId?: string,
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/api/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, channel, userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '网络错误' }));
    throw new Error(err.error || '创建订单失败');
  }

  return res.json();
}

export async function checkOrderStatus(orderNo: string): Promise<OrderStatusResponse> {
  const res = await fetch(`${API_BASE}/api/order-status?orderNo=${encodeURIComponent(orderNo)}`);

  if (!res.ok) {
    throw new Error('查询订单失败');
  }

  return res.json();
}

export function pollOrderStatus(
  orderNo: string,
  onPaid: (data: OrderStatusResponse) => void,
  intervalMs = 3000,
  maxAttempts = 100,
): () => void {
  let attempts = 0;
  let stopped = false;

  const timer = setInterval(async () => {
    if (stopped) return;
    attempts++;

    try {
      const data = await checkOrderStatus(orderNo);
      if (data.status === 'paid') {
        stopped = true;
        clearInterval(timer);
        onPaid(data);
      }
    } catch {}

    if (attempts >= maxAttempts) {
      stopped = true;
      clearInterval(timer);
    }
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
