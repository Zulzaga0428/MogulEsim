import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { API_BASE } from '@/lib/api';
import { BRAND } from '@/brand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS_MN = [
  'Миний утас eSIM дэмждэг үү? (маркаа бич)',
  'eSIM хэрхэн суулгах вэ?',
  'Ямар улс дэмждэг вэ?',
  'QPay яаж төлөх вэ?',
];

const QUICK_QUESTIONS_EN = [
  'Does my phone support eSIM? (tell me your model)',
  'How to install eSIM?',
  'Which countries are supported?',
  'How to pay with QPay?',
];

export function AiChat() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: messages }),
      });

      if (!res.ok) {
        // 429/413 carry a sentence meant for the visitor; show it as the reply.
        const body = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || 'Network error');
      }

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
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.content,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      const reason = err instanceof Error && err.message !== 'Network error' ? err.message : null;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: reason ?? (lang === 'mn' ? 'Алдаа гарлаа. Дахин оролдоно уу.' : 'An error occurred. Please try again.'),
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  const quickQuestions = lang === 'mn' ? QUICK_QUESTIONS_MN : QUICK_QUESTIONS_EN;

  return (
    <>
      {/* Float button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-4 z-50 w-13 h-13 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
        style={{ background: 'var(--brand)', width: 52, height: 52 }}
        title={lang === 'mn' ? 'AI туслагч' : 'AI Assistant'}
      >
        {open ? (
          <X className="w-5 h-5 text-[#111]" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-[#111]" />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
              <span className="text-[8px] font-extrabold" style={{ color: '#111' }}>AI</span>
            </span>
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-3xl border border-border/60 shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh', background: 'hsl(var(--background))' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40" style={{ background: 'hsl(var(--card))' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
              <Bot className="w-4 h-4" style={{ color: '#111' }} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-tight">{BRAND.name} AI</p>
              <p className="text-[11px] text-muted-foreground">{lang === 'mn' ? 'eSIM туслагч · Онлайн' : 'eSIM Assistant · Online'}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ minHeight: 200 }}>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'var(--brand-soft)' }}>
                    <Bot className="w-3 h-3" style={{ color: '#111' }} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground max-w-[85%]" style={{ background: 'hsl(var(--card))' }}>
                    {lang === 'mn'
                      ? `Сайн байна уу! Би ${BRAND.name}-ийн AI туслагч. eSIM-ийн талаар асуулт байвал надаас асуугаарай 😊`
                      : `Hi! I'm the ${BRAND.name} AI assistant. Ask me anything about eSIM! 😊`}
                  </div>
                </div>

                {/* Quick questions */}
                <div className="pl-8 space-y-1.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95"
                      style={{
                        // Brand-tinted chips, black text: yellow text on white was unreadable.
                        borderColor: 'var(--brand-border)',
                        color: '#111',
                        background: 'var(--brand-soft)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'var(--brand-soft)' }}>
                      <Bot className="w-3 h-3" style={{ color: '#111' }} />
                    </div>
                  )}
                  <div
                    className="rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap"
                    style={msg.role === 'user'
                      ? { background: 'var(--brand)', color: 'var(--on-brand)', borderBottomRightRadius: 4 }
                      : { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', borderBottomLeftRadius: 4 }
                    }
                  >
                    {msg.content || (msg.role === 'assistant' && loading && i === messages.length - 1
                      ? <span className="inline-flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      : '')}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-border/40 flex gap-2 items-center" style={{ background: 'hsl(var(--card))' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={1000}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
              placeholder={lang === 'mn' ? 'Асуулт бичнэ үү...' : 'Ask a question...'}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: 'var(--brand)' }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-[#111] animate-spin" />
                : <Send className="w-3.5 h-3.5 text-[#111]" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
