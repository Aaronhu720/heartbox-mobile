import { useState, useRef, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { isMember } from '@/lib/membership';
import PaywallModal from '@/components/PaywallModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const WELCOME_PROMPTS = ['今天感觉怎么样？', '有什么想说的吗？', '我在这里，随时可以倾听。', '最近还好吗？'];

const SYSTEM_PROMPT = `你是 Half日记 的 AI 情感陪伴助手，一个温柔、耐心、充满同理心的倾听者。

你的使命：陪伴正在经历失恋、分手、情感创伤的用户，用温柔、不评判的方式倾听他们的感受。

你的风格：说话温柔、克制、有温度，像一位老朋友。语言简洁，每次回复不超过150字，使用中文回复。

重要原则：你不是心理咨询师，当用户有严重心理问题时，温柔地建议他们寻求专业帮助。绝对不鼓励用户冲动联系前任。如果检测到用户有自伤倾向，立即提供心理援助热线：400-161-9995`;

export default function AiCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  if (!isMember()) {
    return <PaywallModal feature="AI 陪伴" onClose={() => window.history.back()} />;
  }
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    Preferences.get({ key: 'ai-api-key' }).then(r => { if (r.value) setApiKey(r.value); });
    Preferences.get({ key: 'ai-model-id' }).then(r => { if (r.value) setModelId(r.value); });
  }, []);

  async function saveConfig() {
    await Preferences.set({ key: 'ai-api-key', value: apiKey });
    await Preferences.set({ key: 'ai-model-id', value: modelId });
    setShowConfig(false);
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (!apiKey || !modelId) {
      setShowConfig(true);
      return;
    }

    setError('');
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;
    let fullContent = '';

    try {
      const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          max_tokens: 512,
          temperature: 0.8,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`AI 服务错误 (${res.status})`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'data: [DONE]') break;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, content: fullContent, isStreaming: true };
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, content: fullContent, isStreaming: false };
        return updated;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '连接失败');
      setMessages(prev => prev.filter(m => !m.isStreaming));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, apiKey, modelId]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.isStreaming) {
        if (last.content) updated[updated.length - 1] = { ...last, isStreaming: false };
        else updated.pop();
      }
      return updated;
    });
  };

  if (showConfig) {
    return (
      <div className="max-w-sm mx-auto py-10 px-4">
        <h2 className="text-lg font-semibold font-serif mb-4">配置 AI 服务</h2>
        <p className="text-xs text-muted mb-4">需要配置豆包 API 才能使用 AI 陪伴功能。密钥仅保存在你的设备上。</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-card text-base" placeholder="你的 API Key" />
          </div>
          <div>
            <label className="block text-sm mb-1">模型 ID</label>
            <input type="text" value={modelId} onChange={e => setModelId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-card text-base" placeholder="ep-xxxxxx" />
          </div>
          <button onClick={saveConfig} className="w-full py-2.5 bg-primary text-white rounded-xl text-sm">保存并继续</button>
          <button onClick={() => setShowConfig(false)} className="w-full py-2 text-sm text-muted">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-lg mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8D5C4] to-[#C9B3A0] flex items-center justify-center text-base">💛</div>
          <div>
            <h1 className="font-semibold text-sm">AI 陪伴</h1>
            <p className="text-[10px] text-muted">豆包情感助手</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setShowConfig(true)} className="px-2 py-1 text-[10px] border border-border rounded text-muted">配置</button>
          <button onClick={() => { if (isStreaming) handleStop(); setMessages([]); setError(''); }}
            className="px-2 py-1 text-[10px] border border-border rounded text-muted">新对话</button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">💛</div>
            <h2 className="text-lg font-medium font-serif mb-1">你好，我在这里</h2>
            <p className="text-xs text-muted max-w-xs leading-relaxed mb-6">无论是想念、痛苦还是释怀，都可以和我说说。</p>
            <div className="grid grid-cols-2 gap-2 max-w-xs w-full">
              {WELCOME_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => setInput(prompt)}
                  className="text-xs text-muted bg-card border border-border rounded-xl px-3 py-2.5 text-left">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                msg.role === 'user' ? 'bg-primary/10' : 'bg-gradient-to-br from-[#E8D5C4] to-[#C9B3A0]'
              }`}>
                {msg.role === 'user' ? '🙂' : '💛'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-card border border-border rounded-tl-sm'
              }`}>
                {msg.content || (msg.isStreaming ? (
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : '')}
                {msg.isStreaming && msg.content && (
                  <span className="inline-block w-0.5 h-4 bg-muted animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="mx-auto mb-2 px-3 py-1.5 bg-danger/10 text-danger text-xs rounded-lg max-w-sm text-center">{error}</div>
      )}

      <div className="border-t border-border pt-3 pb-2 safe-bottom">
        <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-3 py-2.5">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="说说你的感受…"
            className="flex-1 bg-transparent text-sm resize-none outline-none min-h-[24px] max-h-[100px]"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button onClick={handleStop} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted">
              <span className="w-3 h-3 bg-current rounded-sm" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted text-center mt-1.5">AI 不能替代专业心理咨询 · 如需帮助请拨打 400-161-9995</p>
      </div>
    </div>
  );
}
