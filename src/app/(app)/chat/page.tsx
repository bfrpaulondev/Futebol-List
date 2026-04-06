'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MoreVertical, Pencil, Trash2, X, Check, ImagePlus, Smile, Film } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  type: string;
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

const GIF_OPTIONS = [
  { label: '⚽ Gol!', url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif' },
  { label: '🏆 Vitória', url: 'https://media.giphy.com/media/l0MYyoYPvz22wTXkQ/giphy.gif' },
  { label: '🔥 Furioso', url: 'https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif' },
  { label: '😂 Rir', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' },
  { label: '😭 Chorar', url: 'https://media.giphy.com/media/du3J3cXyzhj75IOgvA/giphy.gif' },
  { label: '🤔 Pensar', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { label: '👏 Aplauso', url: 'https://media.giphy.com/media/4oMoIbIQrvCjm/giphy.gif' },
  { label: '👍 Bom', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif' },
];

const STICKER_OPTIONS = [
  '⚽', '🏆', '🥅', '👟', '🎯', '🔥', '💪', '👏',
  '👎', '🤣', '😭', '🤔', '😎', '🥳', '🫡', '💀', '💩',
];

function loadCachedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const { messages, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return [];
    // Only cache text messages to avoid localStorage bloat
    return (messages as Message[]).filter((m) => m.type === 'text' || !m.type);
  } catch {
    return [];
  }
}

function saveCachedMessages(messages: Message[]) {
  try {
    // Only cache text messages
    const textOnly = messages.filter((m) => m.type === 'text' || !m.type);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ messages: textOnly, timestamp: Date.now() }));
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFetchIdRef = useRef<string | null>(null);

  // Edit/Delete state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

  // Picker state
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [fullViewImage, setFullViewImage] = useState<string | null>(null);

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
        const existingMap = new Map(prev.map((m) => [m.id, m]));
        const serverIds = new Set(fetchedMessages.map((m) => m.id));
        const merged: Message[] = [...fetchedMessages];

        for (const local of prev) {
          if (!serverIds.has(local.id)) {
            merged.push(local);
          }
        }

        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
            const preview = msg.type === 'image' ? '📷 Imagem' : msg.type === 'gif' ? '🎞️ GIF' : msg.type === 'sticker' ? msg.content : msg.content.slice(0, 50);
            toast.info(`${msg.author.name}: ${preview}${msg.type === 'text' && msg.content.length > 50 ? '...' : ''}`);
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

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showGifPicker && !target.closest('.gif-picker-area')) setShowGifPicker(false);
      if (showStickerPicker && !target.closest('.sticker-picker-area')) setShowStickerPicker(false);
    };
    if (showGifPicker || showStickerPicker) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showGifPicker, showStickerPicker]);

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.includes('gif')) {
      toast.error('Apenas imagens e GIFs são permitidos');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem demasiado grande (máx. 5MB)');
      return;
    }

    try {
      setSending(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const isGif = file.type.includes('gif');

        const res = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: isGif ? 'gif' : 'image',
            ...(isGif ? { gifUrl: base64 } : { imageData: base64 }),
          }),
        });

        if (res.ok) {
          await fetchMessages();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Erro ao enviar imagem');
        }
        setSending(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Erro ao processar imagem');
      setSending(false);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gif', gifUrl }),
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao enviar GIF');
      }
    } catch {
      toast.error('Erro ao enviar GIF');
    } finally {
      setSending(false);
    }
  };

  const handleStickerSelect = async (sticker: string) => {
    setShowStickerPicker(false);
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sticker', sticker }),
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao enviar sticker');
      }
    } catch {
      toast.error('Erro ao enviar sticker');
    } finally {
      setSending(false);
    }
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

      if (data.message) {
        const botMsg: Message = {
          id: data.message.id,
          content: data.message.content,
          type: data.message.type || 'text',
          createdAt: data.message.createdAt,
          authorId: data.message.authorId,
          author: data.message.author,
          isPalestrinha: true,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === botMsg.id)) return prev;
          const updated = [...prev, botMsg];
          updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          saveCachedMessages(updated);
          return updated;
        });
      } else {
        const botMsg: Message = {
          id: `palestrinha-${Date.now()}`,
          content: data.reply,
          type: 'text',
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
        body: JSON.stringify({ content: msg, type: 'text' }),
      });

      if (res.ok) {
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
              ? { ...m, isDeleted: true, content: m.type === 'text' ? 'Esta mensagem foi eliminada' : 'Este conteúdo foi eliminado' }
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

  const renderMessageContent = (msg: Message, own: boolean) => {
    if (msg.isDeleted) {
      return <span className="italic opacity-50 text-zinc-400">Este conteúdo foi eliminado</span>;
    }

    const msgType = msg.type || 'text';

    if (msgType === 'image') {
      return (
        <div>
          <img
            src={msg.content}
            alt="Imagem"
            className="max-h-64 rounded-xl cursor-pointer object-cover hover:opacity-90 transition-opacity"
            onClick={() => setFullViewImage(msg.content)}
          />
        </div>
      );
    }

    if (msgType === 'gif') {
      return (
        <div>
          <img
            src={msg.content}
            alt="GIF"
            className="max-h-64 rounded-xl cursor-pointer object-cover hover:opacity-90 transition-opacity"
            onClick={() => setFullViewImage(msg.content)}
          />
        </div>
      );
    }

    if (msgType === 'sticker') {
      return <span className="text-5xl leading-none block text-center py-1">{msg.content}</span>;
    }

    return <span>{msg.content}</span>;
  };

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
                    {renderMessageContent(msg, false)}
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
                      } ${msg.isDeleted ? 'opacity-50' : ''}`}
                    >
                      {renderMessageContent(msg, own)}
                    </div>

                    {/* Action menu button - only for text messages */}
                    {showMenu && !msg.isDeleted && (msg.type === 'text' || !msg.type) && (
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

                    {/* Action menu button for media messages - only delete */}
                    {showMenu && !msg.isDeleted && msg.type && msg.type !== 'text' && (
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
                          {own && (msg.type === 'text' || !msg.type) && (
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

      {/* Full view image modal */}
      <AnimatePresence>
        {fullViewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullViewImage(null)}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={() => setFullViewImage(null)}>
              <X className="w-8 h-8" />
            </button>
            <img
              src={fullViewImage}
              alt="Imagem completa"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 pt-2">
        {/* GIF Picker */}
        <AnimatePresence>
          {showGifPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="gif-picker-area mb-3 overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">Escolhe um GIF</p>
                <div className="grid grid-cols-4 gap-2">
                  {GIF_OPTIONS.map((gif) => (
                    <button
                      key={gif.url}
                      onClick={() => handleGifSelect(gif.url)}
                      className="rounded-xl overflow-hidden border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-200 hover:scale-105 aspect-square"
                    >
                      <img src={gif.url} alt={gif.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticker Picker */}
        <AnimatePresence>
          {showStickerPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="sticker-picker-area mb-3 overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-3">
                <p className="text-xs text-zinc-400 font-medium mb-2">Escolhe um sticker</p>
                <div className="grid grid-cols-7 gap-2">
                  {STICKER_OPTIONS.map((sticker) => (
                    <button
                      key={sticker}
                      onClick={() => handleStickerSelect(sticker)}
                      className="text-2xl p-2 rounded-xl hover:bg-zinc-800/80 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-card rounded-2xl flex gap-1 p-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl px-2 shrink-0"
            title="Enviar imagem"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={() => { setShowGifPicker(!showGifPicker); setShowStickerPicker(false); }}
            variant="ghost"
            size="sm"
            className={`rounded-xl px-2 shrink-0 transition-all duration-200 ${showGifPicker ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-400 hover:text-purple-400 hover:bg-purple-400/10'}`}
            title="Enviar GIF"
          >
            <Film className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={() => { setShowStickerPicker(!showStickerPicker); setShowGifPicker(false); }}
            variant="ghost"
            size="sm"
            className={`rounded-xl px-2 shrink-0 transition-all duration-200 ${showStickerPicker ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10'}`}
            title="Enviar sticker"
          >
            <Smile className="w-5 h-5" />
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
            type="button"
            onClick={handleMentionPalestrinha}
            variant="ghost"
            size="sm"
            className="text-amber-400 hover:bg-amber-400/10 rounded-xl px-2 shrink-0"
            title="Mencionar Palestrinha"
          >
            🧑‍💼
          </Button>
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !sending) || sending}
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
