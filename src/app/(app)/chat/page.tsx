'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';

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
  isDeleted?: boolean;
  isPalestrinha?: boolean;
}

const CACHE_KEY = 'futebol-chat-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadCachedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const { messages, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return [];
    return messages;
  } catch {
    return [];
  }
}

function saveCachedMessages(messages: Message[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ messages, timestamp: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>(() => loadCachedMessages());
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [palestrinhaTyping, setPalestrinhaTyping] = useState(false);
  const [palestrinhaHistory, setPalestrinhaHistory] = useState<{ role: string; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const lastFetchIdRef = useRef<string | null>(null);

  // Edit/Delete state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

  const isMaster = user?.role === 'master';

  // Track message count for toast notifications
  const prevMessageCountRef = useRef<number>(0);
  const isInitialLoad = useRef(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/messages');
      const data = await res.json();
      const fetchedMessages: Message[] = data.messages || [];

      // Smart merge: only add truly new messages, preserve local state
      setMessages((prev) => {
        // Build a map of existing messages by ID
        const existingMap = new Map(prev.map((m) => [m.id, m]));

        // Track IDs that come from the server
        const serverIds = new Set(fetchedMessages.map((m) => m.id));

        // Start with all server messages (they are the source of truth)
        const merged: Message[] = [...fetchedMessages];

        // Add any local-only messages (optimistic sends not yet on server,
        // or palestrinha messages from older response not yet on server)
        for (const local of prev) {
          if (!serverIds.has(local.id)) {
            merged.push(local);
          }
        }

        // Sort by createdAt
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Cache the merged result
        saveCachedMessages(merged);

        return merged;
      });

      // Toast on new messages from others (not bot, not own, not initial load)
      const newCount = fetchedMessages.length;
      if (!isInitialLoad.current && prevMessageCountRef.current > 0 && newCount > prevMessageCountRef.current) {
        const newest = fetchedMessages.slice(prevMessageCountRef.current);
        for (const msg of newest) {
          const isBot = msg.authorId === 'palestrinha-bot' || msg.author?.id === 'palestrinha-bot';
          const isOwn = msg.authorId === user?.id;
          const isDeleted = msg.isDeleted;
          if (!isBot && !isOwn && !isDeleted) {
            toast.info(`${msg.author.name}: ${msg.content.slice(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
          }
        }
      }

      prevMessageCountRef.current = newCount;
      isInitialLoad.current = false;
    } catch {
      // Silently fail - use cached messages
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, palestrinhaTyping]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingMsgId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMsgId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [activeMenuId]);

  const isPalestrinhaMention = (text: string) => {
    const lower = text.toLowerCase().trim();
    return lower.startsWith('@palestrinha') || /\s@palestrinha($|\s)/i.test(text);
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

      // If server saved the message, use it. Otherwise create local version.
      if (data.message) {
        const botMsg: Message = {
          id: data.message.id,
          content: data.message.content,
          createdAt: data.message.createdAt,
          authorId: data.message.authorId,
          author: data.message.author,
          isPalestrinha: true,
        };
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === botMsg.id)) return prev;
          const updated = [...prev, botMsg];
          updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          saveCachedMessages(updated);
          return updated;
        });
      } else {
        // Fallback: local-only message
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
        setMessages((prev) => {
          const updated = [...prev, botMsg];
          saveCachedMessages(updated);
          return updated;
        });
      }

      setPalestrinhaHistory((prev) => [
        ...prev.slice(-10),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.error('Palestrinha error:', err);
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
        // Message saved to DB, fetch to get the server version
        await fetchMessages();

        if (isPalestrinhaMention(msg)) {
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

  const handleEditSave = async () => {
    if (!editingMsgId || !editContent.trim()) return;
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingMsgId, content: editContent.trim() }),
      });
      if (res.ok) {
        toast.success('Mensagem editada');
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMsgId ? { ...m, content: editContent.trim() } : m))
        );
        saveCachedMessages(messages);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao editar');
      }
    } catch {
      toast.error('Erro ao editar mensagem');
    } finally {
      setEditingMsgId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?id=${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Mensagem eliminada');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, isDeleted: true, content: 'Esta mensagem foi eliminada' }
              : m
          )
        );
        saveCachedMessages(messages);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao eliminar');
      }
    } catch {
      toast.error('Erro ao eliminar mensagem');
    } finally {
      setDeletingMsgId(null);
      setActiveMenuId(null);
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
  const isBotMessage = (msg: Message) => msg.isPalestrinha || msg.authorId === 'palestrinha-bot' || msg.author?.id === 'palestrinha-bot';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Chat Geral</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Society Futebol Nº5</p>
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

          const own = isOwnMessage(msg.authorId);
          const showMenu = own || isMaster;
          const isEditingThis = editingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${own ? 'flex-row-reverse' : ''}`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className={`text-xs ${own ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                    {msg.author.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 online-dot" />
              </div>
              <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 ${own ? 'justify-end' : ''}`}>
                  <span className="text-xs text-zinc-400 font-medium">{msg.author.name}</span>
                  <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
                </div>

                {isEditingThis ? (
                  /* Edit mode */
                  <div className="flex items-center gap-1.5">
                    <Input
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') { setEditingMsgId(null); setEditContent(''); }
                      }}
                      className={`h-9 text-sm ${own ? 'bg-emerald-600/20 border-emerald-500/40 text-white' : 'bg-zinc-800 border-zinc-700 text-white'}`}
                      maxLength={1000}
                    />
                    <Button size="icon" variant="ghost" onClick={handleEditSave} className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingMsgId(null); setEditContent(''); }} className="h-9 w-9 text-zinc-400 hover:bg-zinc-700 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative group">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        own
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md'
                          : 'glass-card rounded-bl-md text-zinc-200'
                      } ${msg.isDeleted ? 'opacity-50 italic' : ''}`}
                    >
                      {msg.content}
                    </div>

                    {/* Action menu button */}
                    {showMenu && !msg.isDeleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                        }}
                        className={`absolute top-1 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          own ? 'left-1 bg-emerald-800/60 hover:bg-emerald-800' : 'right-1 bg-zinc-700/60 hover:bg-zinc-700'
                        }`}
                      >
                        <MoreVertical className="w-3 h-3 text-zinc-300" />
                      </button>
                    )}

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {activeMenuId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -5 }}
                          className={`absolute top-8 z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg overflow-hidden ${
                            own ? 'left-0' : 'right-0'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {own && (
                            <button
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditContent(msg.content);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          )}
                          {(own || isMaster) && (
                            <button
                              onClick={() => {
                                setDeletingMsgId(msg.id);
                                setActiveMenuId(null);
                                handleDelete(msg.id);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
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
