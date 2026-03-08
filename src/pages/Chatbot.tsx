import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Chatbot() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch('/api/user/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.apiKey);
        }
      } catch (e) {
        console.error('Failed to fetch API key', e);
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExport = () => {
    const chatText = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // You can change this or make it selectable
          messages: [...messages, userMessage],
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.choices[0].message]);
      } else {
        const error = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.error?.message || 'Failed to get response'}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">{t('Loading API Key...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg font-semibold text-gray-900">{t('AI Chat Assistant')}</h1>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title={t('Export Chat')}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('Export')}</span>
          </button>
        )}
      </div>

      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4 border-x border-gray-200">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            {t('Start a conversation by typing a message below.')}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 ml-3' : 'bg-white border border-gray-200 mr-3'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-gray-600" />}
                </div>
                <div className={`px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 mr-3 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-900 flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Type your message...')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">{t('Send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
