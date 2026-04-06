'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const msg = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      });

      if (res.ok) {
        await fetchMessages();
      } else {
        setNewMessage(msg);
      }
    } catch {
      setNewMessage(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (authorId: string) => authorId === user?.id;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Chat Geral</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 scrollbar-premium">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl mb-3 block">💬</span>
            <p className="text-zinc-500 text-sm">Sem mensagens ainda</p>
            <p className="text-zinc-600 text-xs mt-1">Sê o primeiro a escrever!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${isOwnMessage(msg.authorId) ? 'flex-row-reverse' : ''}`}
          >
            <div className="relative shrink-0">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className={`text-xs ${isOwnMessage(msg.authorId) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                  {msg.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 online-dot" />
            </div>
            <div className={`max-w-[75%] ${isOwnMessage(msg.authorId) ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(msg.authorId) ? 'justify-end' : ''}`}>
                <span className="text-xs text-zinc-400 font-medium">{msg.author.name}</span>
                <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isOwnMessage(msg.authorId)
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md'
                    : 'glass-card rounded-bl-md text-zinc-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 pt-2">
        <div className="glass-card rounded-2xl flex gap-2 p-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreve uma mensagem..."
            className="flex-1 bg-transparent border-0 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl w-10 h-10 p-0 flex items-center justify-center transition-all duration-200 shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
