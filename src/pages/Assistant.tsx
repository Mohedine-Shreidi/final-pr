import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MapPin, AlertTriangle, Search, Package, Accessibility, Cpu } from 'lucide-react';
import { processMessageWithAI, isOpenAIConfigured } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  toolUsed?: string;
  timestamp: Date;
}

const suggestions = [
  { icon: MapPin, text: 'Find nearest open pharmacy', color: '#10b981' },
  { icon: AlertTriangle, text: 'Any water leak reports near me?', color: '#f59e0b' },
  { icon: Search, text: 'Has anyone found a black wallet?', color: '#8b5cf6' },
  { icon: Package, text: 'What items are available to borrow?', color: '#f97316' },
  { icon: Accessibility, text: 'Wheelchair accessible route to City Hall', color: '#3b82f6' },
  { icon: Cpu, text: 'What can you help me with?', color: '#06b6d4' },
];

/* ---- Simple Markdown Renderer ---- */
function renderMarkdown(text: string, navigate: (path: string) => void): JSX.Element {
  const parts = text.split('\n');

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset?.route) {
      e.preventDefault();
      navigate(target.dataset.route);
    }
  };

  return (
    <>
      {parts.map((line, i) => {
        // Bold
        let processed = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong>$1</strong>'
        );

        // Italic
        processed = processed.replace(
          /\*(.*?)\*/g,
          '<em>$1</em>'
        );

        // Inline code
        processed = processed.replace(
          /`(.*?)`/g,
          '<code style="background: rgba(6,182,212,0.1); padding: 1px 4px; border-radius: 4px; font-size: 12px;">$1</code>'
        );

        // Links - convert [text](path) to clickable links
        processed = processed.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          (_, linkText, href) => {
            if (href.startsWith('/')) {
              return `<a href="#" data-route="${href}" style="color: var(--color-primary-400); text-decoration: underline; cursor: pointer;">${linkText}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener" style="color: var(--color-primary-400); text-decoration: underline;">${linkText}</a>`;
          }
        );

        // Numbered lists
        const listMatch = line.match(/^(\d+)\.\s(.+)/);
        if (listMatch) {
          return (
            <div key={i} className="flex gap-2 my-0.5" style={{ paddingLeft: '4px' }}>
              <span className="text-cyan-400 font-semibold flex-shrink-0">{listMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} onClick={handleClick} />
            </div>
          );
        }

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 my-0.5" style={{ paddingLeft: '4px' }}>
              <span className="text-cyan-400 flex-shrink-0">•</span>
              <span
                dangerouslySetInnerHTML={{ __html: processed.replace(/^[-•]\s/, '') }}
                onClick={handleClick}
              />
            </div>
          );
        }

        // Empty line
        if (!line.trim()) return <div key={i} className="h-2" />;

        return (
          <div
            key={i}
            className="my-0.5"
            dangerouslySetInnerHTML={{ __html: processed }}
            onClick={handleClick}
          />
        );
      })}
    </>
  );
}

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, role: 'assistant',
      content: "Hello! 👋 I'm your **CivicHub AI Assistant**, powered by intelligent tool-calling.\n\nI can search the platform's live data to help you:\n\n- 🗺️ **Find resources** — hospitals, pharmacies, shelters nearby\n- 📝 **Search reports** — community issues and their status\n- 🔍 **Lost & Found** — search for or post lost/found items\n- ♿ **Accessibility** — find wheelchair-friendly routes\n\nTry asking me something!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const query = input.trim();
    setInput('');
    setIsTyping(true);

    // Build conversation history for OpenAI context
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10) // Keep last 10 messages for context
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await processMessageWithAI(query, history);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        toolUsed: response.toolUsed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant' as const,
        content: "I'm sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        {/* Chat header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}>
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>CivicHub AI Assistant</h3>
              <p className="text-xs flex items-center gap-1" style={{ color: '#10b981' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online — Tool-calling enabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>GPT-4o Ready</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: msg.role === 'assistant'
                    ? 'linear-gradient(135deg, #2563eb, #60a5fa)'
                    : 'linear-gradient(135deg, #0e7490, #06b6d4)',
                }}>
                {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
              </div>
              <div className="max-w-[80%]">
                {/* Tool used badge */}
                {msg.toolUsed && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="badge text-[9px] font-mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-primary-500)' }}>
                      <Cpu size={10} className="mr-1" /> {msg.toolUsed}
                    </span>
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'var(--color-primary-500)' : 'var(--bg-tertiary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : undefined,
                  }}>
                  {msg.role === 'assistant' ? renderMarkdown(msg.content, navigate) : msg.content}
                </div>
                <div className="mt-1 text-[10px] px-1" style={{ color: 'var(--text-tertiary)', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}>
                <Bot size={16} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: 'var(--color-primary-500)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Try asking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s.text)}
                  className="btn btn-secondary text-xs gap-1.5 group">
                  <s.icon size={13} style={{ color: s.color }} />
                  <span className="group-hover:text-cyan-400 transition-colors">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about community services..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              disabled={isTyping}
            />
            <button onClick={handleSend} disabled={!input.trim() || isTyping}
              className="btn btn-primary p-2 rounded-xl disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
            AI searches live platform data using tool-calling. Add OpenAI key in .env for full GPT-4o.
          </p>
        </div>
      </div>
    </div>
  );
}
