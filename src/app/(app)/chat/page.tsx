'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <h1 className="text-2xl font-bold text-white">Chat Geral</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">💬</span>
            <p className="text-zinc-500 mt-2">Sem mensagens ainda</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${isOwnMessage(msg.authorId) ? 'flex-row-reverse' : ''}`}
          >
            <Avatar className="w-8 h-8 mt-1 shrink-0">
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                {msg.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={`max-w-[75%] ${isOwnMessage(msg.authorId) ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(msg.authorId) ? 'justify-end' : ''}`}>
                <span className="text-xs text-zinc-400 font-medium">{msg.author.name}</span>
                <span className="text-xs text-zinc-600">{formatTime(msg.createdAt)}</span>
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isOwnMessage(msg.authorId)
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
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
      <form onSubmit={handleSend} className="p-4 pt-2 border-t border-zinc-800 bg-zinc-950">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreve uma mensagem..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-full"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-teal-600 hover:bg-teal-500 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
          >
            ➤
          </Button>
        </div>
      </form>
    </div>
  );
}
