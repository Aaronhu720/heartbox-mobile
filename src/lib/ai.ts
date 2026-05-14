import { Preferences } from '@capacitor/preferences';

export const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

export async function getAiConfig(): Promise<{ apiKey: string; modelId: string } | null> {
  const [keyResult, modelResult] = await Promise.all([
    Preferences.get({ key: 'ai-api-key' }),
    Preferences.get({ key: 'ai-model-id' }),
  ]);
  if (keyResult.value && modelResult.value) {
    return { apiKey: keyResult.value, modelId: modelResult.value };
  }
  return null;
}

export async function callDoubaoAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const config = await getAiConfig();
  if (!config) throw new Error('AI 服务未配置');

  const res = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      max_tokens: 1024,
      temperature: 0.85,
    }),
  });

  if (!res.ok) throw new Error(`AI 服务错误 (${res.status})`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回内容为空');
  return content;
}
