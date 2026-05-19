import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, HeadphonesIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ChatMode = 'ai' | 'live';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('ai');
  
  const initialAiMessage: Message = { role: 'assistant', content: 'Halo! Saya asisten AI untuk aplikasi Manajemen Jaringan dan Tagihan Pelanggan. Ada yang bisa saya bantu terkait fitur aplikasi?' };
  const initialLiveMessage: Message = { role: 'assistant', content: 'Halo, dengan Customer Service di sini. Silakan jelaskan kendala atau pertanyaan Anda, saya akan segera membantu.' };

  const [aiMessages, setAiMessages] = useState<Message[]>([initialAiMessage]);
  const [liveMessages, setLiveMessages] = useState<Message[]>([initialLiveMessage]);
  
  const messages = mode === 'ai' ? aiMessages : liveMessages;
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use a ref to store the chat session so history is maintained over multiple turns
  const chatSessionRef = useRef<any>(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    if (mode === 'ai') {
      const newMessages = [...aiMessages, { role: 'user' as const, content: userMessage }];
      setAiMessages(newMessages);

      try {
        const history = newMessages.slice(1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, history })
        });

        if (!res.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await res.json();
        
        if (data.error) {
           throw new Error(data.error);
        }

        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.text || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.' 
        }]);
      } catch (error) {
        console.error("Chat error:", error);
        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Maaf, terjadi kesalahan pada koneksi API Gemini. Silakan coba lagi nanti.' 
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Live Support Mode (Mocked)
      setLiveMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setTimeout(() => {
        setLiveMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Terima kasih atas pesannya. Saat ini tim lapangan sedang menindaklanjuti. Silakan tunggu sebentar...' 
        }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl shadow-primary-500/30 transition-transform duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'}`}
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
        {/* Unread badge mock */}
        <span className="absolute top-0 right-0 -mr-1 -mt-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full"></span>
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[340px] sm:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`} style={{ height: '560px', maxHeight: 'calc(100vh - 48px)' }}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 shrink-0 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {mode === 'ai' ? <Bot className="text-white" size={20} /> : <HeadphonesIcon className="text-white" size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {mode === 'ai' ? 'Asisten Cerdas (AI)' : 'Customer Service'}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs text-primary-100 font-medium tracking-wide">
                    {mode === 'ai' ? 'Online' : 'Membalas cepat'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="bg-black/20 p-1 rounded-lg flex relative">
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 relative z-10 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'ai' ? 'text-primary-700' : 'text-white/80 hover:text-white'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Bot size={14} /> AI
              </div>
            </button>
            <button
              onClick={() => setMode('live')}
              className={`flex-1 relative z-10 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'live' ? 'text-primary-700' : 'text-white/80 hover:text-white'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <HeadphonesIcon size={14} /> Live Agent
              </div>
            </button>
            {/* Sliding background */}
            <div 
              className="absolute inset-1 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out"
              style={{ width: 'calc(50% - 4px)', transform: `translateX(${mode === 'ai' ? '0' : '100%'})` }}
            ></div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : (mode === 'ai' ? 'bg-primary-600 text-white' : 'bg-amber-500 text-white')}`}>
                  {msg.role === 'user' ? <User size={14} /> : (mode === 'ai' ? <Bot size={14} /> : <HeadphonesIcon size={14} />)}
                </div>
                <div className={`p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200/60 text-slate-800 rounded-2xl rounded-tl-sm text-left'}`}>
                  {msg.role === 'user' ? (
                    msg.content.split('\n').map((line, i) => (
                      <span key={i} className="block min-h-[1em]">{line}</span>
                    ))
                  ) : (
                    <div className="markdown-body prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${mode === 'ai' ? 'bg-primary-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {mode === 'ai' ? <Bot size={14} /> : <HeadphonesIcon size={14} />}
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-sm text-sm border border-slate-200/60 bg-white text-slate-400 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'ai' ? "Tanya soal fitur aplikasi..." : "Tulis pesan ke CS..."}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white placeholder:text-slate-500 disabled:opacity-50 transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className={`p-3 text-white rounded-xl disabled:opacity-50 transition-all shadow-sm ${mode === 'ai' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}
            >
              <Send size={18} className={(!input.trim() || isLoading) ? "opacity-50" : ""} />
            </button>
          </form>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              {mode === 'ai' ? 'AI dapat membuat kesalahan. Harap periksa kembali.' : 'Tim kami beroperasi pk. 08:00 - 22:00'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
