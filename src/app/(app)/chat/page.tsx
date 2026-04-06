'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isPalestrinha?: boolean;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [palestrinhaTyping, setPalestrinhaTyping] = useState(false);
  const [palestrinhaHistory, setPalestrinhaHistory] = useState<{ role: string; content: string }[]>([]);
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
  }, [messages, palestrinhaTyping]);

  const isPalestrinhaMention = (text: string) => {
    const lower = text.toLowerCase().trim();
    return lower.includes('@palestrinha') || lower.includes('palestrinha');
  };

  const triggerPalestrinha = async (userMessage: string) => {
    setPalestrinhaTyping(true);
    try {
      const res = await fetch('/api/chat/palestrinha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: palestrinhaHistory,
          playerNames: [],
        }),
      });

      const data = await res.json();

      // Add bot message to local state
      const botMsg: Message = {
        id: `palestrinha-${Date.now()}`,
        content: data.reply,
        createdAt: new Date().toISOString(),
        authorId: 'palestrinha-bot',
        author: {
          id: 'palestrinha-bot',
          name: 'Palestrinha 🧑‍💼',
          avatar: null,
        },
        isPalestrinha: true,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update history
      setPalestrinhaHistory((prev) => [
        ...prev.slice(-10),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.reply },
      ]);
    } catch {
      // Silently fail
    } finally {
      setPalestrinhaTyping(false);
    }
  };

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

        // Check for Palestrinha mention
        if (isPalestrinhaMention(msg)) {
          // Small delay for natural feel
          setTimeout(() => {
            triggerPalestrinha(msg);
          }, 800);
        }
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

  const handleMentionPalestrinha = () => {
    const current = newMessage.trim();
    setNewMessage(current ? `${current} @palestrinha ` : '@palestrinha ');
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (authorId: string) => authorId === user?.id;
  const isBotMessage = (msg: Message) => msg.isPalestrinha || msg.authorId === 'palestrinha-bot';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Chat Geral</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
          </div>
          <Button
            onClick={handleMentionPalestrinha}
            variant="outline"
            size="sm"
            className="text-amber-400 border-amber-400/30 hover:bg-amber-400/10 transition-all duration-200 text-xs"
          >
            <span className="mr-1">🧑‍💼</span> Palestrinha
          </Button>
        </div>
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

        {messages.map((msg) => {
          if (isBotMessage(msg)) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className="relative shrink-0">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="text-xs bg-amber-500/20 text-amber-400">
                      🧑‍💼
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="max-w-[80%] items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-amber-400 font-semibold">Palestrinha</span>
                    <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-bl-md text-zinc-200">
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isOwnMessage(msg.authorId) ? 'flex-row-reverse' : ''}`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className={`text-xs ${isOwnMessage(msg.authorId) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                    {msg.author.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
          );
        })}

        {/* Palestrinha typing indicator */}
        <AnimatePresence>
          {palestrinhaTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2.5"
            >
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="text-xs bg-amber-500/20 text-amber-400">
                    🧑‍💼
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="max-w-[80%] items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-amber-400 font-semibold">Palestrinha</span>
                </div>
                <div className="rounded-2xl px-3.5 py-2.5 text-sm shadow-sm bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-bl-md">
                  <div className="flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    />
                    <span className="text-zinc-500 text-xs ml-1">Palestrinha está a digitar...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 pt-2">
        <div className="glass-card rounded-2xl flex gap-2 p-2">
          <Button
            type="button"
            onClick={handleMentionPalestrinha}
            variant="ghost"
            size="sm"
            className="text-amber-400 hover:bg-amber-400/10 rounded-xl px-2 shrink-0"
          >
            🧑‍💼
          </Button>
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
