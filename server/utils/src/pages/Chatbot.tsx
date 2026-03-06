import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Chatbot() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
      });
      
      // Replay history (simplified)
      for (const msg of messages) {
        await chat.sendMessage({ message: msg.text });
      }
      
      const response = await chat.sendMessage({ message: userMsg });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `请求出错: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              AI 智能助手
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">
                Gemini 3.1 Pro
              </span>
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">随时为您解答问题、提供创意灵感</p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 custom-scrollbar relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-gray-100">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">您好！我是您的 AI 助手</h3>
            <p className="text-gray-500 max-w-md">
              我由强大的 Gemini 3.1 Pro 模型驱动。您可以问我任何问题，或者让我帮您写代码、写文章、做翻译。
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {['帮我写一封正式的商务邮件', '解释一下量子计算的原理', '用 React 写一个计数器组件', '推荐几本关于人工智能的书籍'].map((suggestion, idx) => (
                <button 
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-indigo-300 hover:shadow-sm hover:text-indigo-700 transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-6 max-w-4xl mx-auto pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 ml-4' : 'bg-white border border-gray-200 mr-4'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-6 h-6 text-indigo-600" />}
                </div>
                <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] flex-row">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white border border-gray-200 mr-4 flex items-center justify-center shadow-sm">
                  <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm flex items-center">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的问题，按 Enter 发送，Shift + Enter 换行..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-gray-700 text-[15px] custom-scrollbar"
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm flex-shrink-0 mb-0.5"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400">AI 可能会生成不准确的信息，请注意甄别。</span>
        </div>
      </div>
    </div>
  );
}
