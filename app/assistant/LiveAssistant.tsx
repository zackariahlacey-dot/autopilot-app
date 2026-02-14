'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  toolInvocations?: any[];
  retryable?: boolean;
};

export default function LiveAssistant({ userId, vehicleId }: { userId: string; vehicleId?: string }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm AUTOPILOT, your AI automotive assistant powered by GPT-4o. I have access to your vehicle data and can help with maintenance, finding shops, and diagnosing issues. What can I help you with today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Determine error type and message
      let errorMessage = '⚠️ Connection lost. Retrying...';
      let isRetryable = true;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '🔌 Network connection lost. Please check your internet and try again.';
      } else if (error instanceof Error && error.message.includes('Failed')) {
        errorMessage = '⚠️ Unable to reach AI assistant. Retrying in a moment...';
      }
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { 
                ...msg, 
                role: 'error',
                content: errorMessage,
                retryable: isRetryable
              }
            : msg
        )
      );
      
      // Don't auto-retry to prevent infinite loops
      // User can retry manually by re-sending the message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-tesla-black rounded-2xl overflow-hidden">
      {/* Messages - Modern Messaging App Style */}
      <div className="flex-1 overflow-y-auto space-y-4 p-6 bg-gradient-to-b from-tesla-black to-tesla-card">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-blue to-electric-cyan flex items-center justify-center flex-shrink-0 shadow-lg shadow-electric-blue/30">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            )}
            
            {msg.role === 'error' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-xl ${
                msg.role === 'user'
                  ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20'
                  : msg.role === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-200'
                  : 'glass-card text-white border border-white/10'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {msg.content.split('\n').map((line, i) => {
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* AI Thinking Animation - Pulse Effect */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-blue to-electric-cyan flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-electric-blue/50">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 glass-card border border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-electric-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-electric-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-electric-glow animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-zinc-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Modern Messaging Style */}
      <div className="border-t border-white/10 p-4 glass-nav">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <textarea
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask me anything about your car..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl glass-card border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-electric-blue/50 focus:ring-2 focus:ring-electric-blue/20 disabled:opacity-50 resize-none"
            rows={2}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-electric-blue hover:bg-[#0060d3] text-white font-bold transition-all shadow-lg shadow-electric-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Thinking
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-zinc-500 mt-2">
          Powered by GPT-4o • Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
