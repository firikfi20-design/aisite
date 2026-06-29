import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Send, Plus, MessageSquare, Code2, HelpCircle, Trash2,
  Zap, LogOut, Crown, Menu, X, Copy, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODES = [
  { id: 'chat', label: 'Чат', icon: MessageSquare },
  { id: 'code', label: 'Код', icon: Code2 },
  { id: 'qa',   label: 'Q&A', icon: HelpCircle },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-white/40 hover:text-white/70 transition-colors">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function Message({ msg, isStreaming }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 mt-1">
          <Zap size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-brand-500 text-white rounded-tr-sm'
          : 'bg-white/5 border border-white/8 text-white/90 rounded-tl-sm'
      } ${isStreaming ? 'streaming-cursor' : ''}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none"
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={String(children)} />
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="!rounded-xl !text-xs"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-500/90 font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-medium text-white/60">
          Вы
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const { user, logout, getToken } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [streaming, setStreaming] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [requestsUsed, setRequestsUsed] = useState(user?.requests_used || 0);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const API = '/api';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load chat history sidebar
  useEffect(() => {
    fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(setChats).catch(() => {});
  }, []);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      fetch(`${API}/chat/${chatId}/messages`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.json())
        .then(data => { if (data.messages) setMessages(data.messages); })
        .catch(() => {});
    } else {
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [chatId]);

  const createNewChat = async () => {
    const res = await fetch(`${API}/chat/new`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New chat' })
    });
    const chat = await res.json();
    setChats(prev => [chat, ...prev]);
    navigate(`/chat/${chat.id}`);
    setSidebarOpen(false);
    return chat.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    let activeChatId = currentChatId;
    if (!activeChatId) {
      activeChatId = await createNewChat();
    }

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    let assistantContent = '';
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'assistant', content: '', _streaming: true }]);

    try {
      const res = await fetch(`${API}/chat/${activeChatId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, mode })
      });

      if (res.status === 429) {
        setLimitReached(true);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.delta) {
              assistantContent += data.delta;
              setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: assistantContent } : m
              ));
            }
            if (data.done) {
              setRequestsUsed(prev => prev + 1);
              // Refresh chat list for updated titles
              fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${getToken()}` } })
                .then(r => r.json()).then(setChats).catch(() => {});
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _streaming: false } : m));
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    await fetch(`${API}/chat/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    setChats(prev => prev.filter(c => c.id !== id));
    if (String(currentChatId) === String(id)) navigate('/chat');
  };

  const limits = { free: 20, pro: 500, ultra: 99999 };
  const limit = limits[user?.plan] || 20;
  const usagePercent = Math.min(100, (requestsUsed / limit) * 100);

  return (
    <div className="flex h-screen bg-[#0f0f11] text-white overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 h-full w-64 bg-[#16161a] border-r border-white/5
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap size={14} />
            </div>
            <span className="font-semibold">NexAI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          <button onClick={createNewChat} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            <Plus size={16} /> Новый чат
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => { navigate(`/chat/${chat.id}`); setSidebarOpen(false); }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-sm
                ${String(currentChatId) === String(chat.id) ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate">{chat.title}</span>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <p className="text-white/20 text-xs text-center py-4">Чатов пока нет</p>
          )}
        </div>

        {/* User info + usage */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>{requestsUsed} / {limit === 99999 ? '∞' : limit} запросов</span>
              <span className="capitalize text-brand-500">{user?.plan}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40 truncate flex-1">{user?.email}</div>
            <div className="flex items-center gap-2 ml-2">
              <Link to="/upgrade" className="text-white/40 hover:text-white transition-colors" title="Upgrade">
                <Crown size={16} />
              </Link>
              <button onClick={logout} className="text-white/40 hover:text-white transition-colors" title="Выйти">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/40 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${mode === id ? 'bg-brand-500 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Zap size={26} className="text-brand-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Привет! Чем помочь?</h2>
              <p className="text-white/30 text-sm max-w-sm">
                {mode === 'code' ? 'Напишите задачу по программированию' :
                 mode === 'qa' ? 'Задайте любой вопрос' :
                 'Начните новый разговор'}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <Message key={msg.id || i} msg={msg} isStreaming={msg._streaming} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Limit reached banner */}
        {limitReached && (
          <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-medium text-sm">Лимит запросов исчерпан</p>
              <p className="text-white/40 text-xs mt-0.5">Обновитесь для продолжения</p>
            </div>
            <Link to="/upgrade" className="btn-primary text-sm flex items-center gap-1.5">
              <Crown size={14} /> Upgrade
            </Link>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-end gap-3 focus-within:border-brand-500/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'code' ? 'Напишите задачу по программированию...' :
                          mode === 'qa' ? 'Задайте вопрос...' : 'Напишите сообщение...'}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-white/25 text-sm resize-none outline-none max-h-40 leading-relaxed"
              style={{ minHeight: '24px' }}
              onInput={e => {
                e.target.style.height = '24px';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              disabled={streaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-center text-white/15 text-xs mt-2">Enter — отправить · Shift+Enter — перенос строки</p>
        </div>
      </main>
    </div>
  );
}
