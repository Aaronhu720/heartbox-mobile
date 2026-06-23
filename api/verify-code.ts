import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { CODES_STORE } from './send-code';

const JWT_SECRET = process.env.JWT_SECRET || 'halfdiary-jwt-secret-2026';

function signToken(phone: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    phone,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持POST请求' });

  const { phone, code } = req.body || {};

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }
  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: '请输入6位验证码' });
  }

  const stored = CODES_STORE[phone];
  if (!stored) {
    return res.status(400).json({ error: '请先获取验证码' });
  }

  if (Date.now() > stored.expires) {
    delete CODES_STORE[phone];
    return res.status(400).json({ error: '验证码已过期，请重新获取' });
  }

  stored.attempts++;
  if (stored.attempts > 5) {
    delete CODES_STORE[phone];
    return res.status(429).json({ error: '验证次数过多，请重新获取验证码' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ error: '验证码错误' });
  }

  delete CODES_STORE[phone];

  const token = signToken(phone);

  return res.status(200).json({
    success: true,
    token,
    phone,
    message: '验证成功',
  });
}
