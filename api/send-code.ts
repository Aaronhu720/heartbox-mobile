import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const CODES_STORE: Record<string, { code: string; expires: number; attempts: number }> = {};

const RATE_LIMIT: Record<string, number> = {};

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持POST请求' });

  const { phone } = req.body || {};

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }

  const now = Date.now();
  const lastSent = RATE_LIMIT[phone] || 0;
  if (now - lastSent < 60000) {
    const wait = Math.ceil((60000 - (now - lastSent)) / 1000);
    return res.status(429).json({ error: `请${wait}秒后再试` });
  }

  const code = generateCode();
  CODES_STORE[phone] = { code, expires: now + 5 * 60 * 1000, attempts: 0 };
  RATE_LIMIT[phone] = now;

  const smsOk = await sendSms(phone, code);

  if (!smsOk) {
    return res.status(500).json({ error: '短信发送失败，请稍后重试' });
  }

  return res.status(200).json({ success: true, message: '验证码已发送' });
}

async function sendSms(phone: string, code: string): Promise<boolean> {
  const accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME;
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE;

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    console.log(`[DEV MODE] 验证码 ${code} -> ${phone}`);
    return true;
  }

  const params: Record<string, string> = {
    Action: 'SendSms',
    Version: '2017-05-25',
    RegionId: 'cn-hangzhou',
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    AccessKeyId: accessKeyId,
  };

  const sortedKeys = Object.keys(params).sort();
  const canonicalized = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(canonicalized)}`;
  const signature = crypto
    .createHmac('sha1', accessKeySecret + '&')
    .update(stringToSign)
    .digest('base64');

  params.Signature = signature;

  try {
    const resp = await fetch('https://dysmsapi.aliyuncs.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    const data = await resp.json();
    return data.Code === 'OK';
  } catch (e) {
    console.error('SMS send error:', e);
    return false;
  }
}

export { CODES_STORE };
