// -.-.-.-
import React, { useEffect, useState, useRef } from 'react';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Loader } from '@components/ui/Loader';
import { MessageBubble } from '@components/chat/MessageBubble';
import { MessageInput } from '@components/chat/MessageInput';
import { chatService } from '@services/chatService';
import { useAuth } from '@hooks/useAuth';
import { useSocket } from '@hooks/useSocket';

// -.-.-.-
export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);
  
  // -.-.-.-
  useEffect(() => {
    loadMessages();
  }, []);
  
  // -.-.-.-
  useEffect(() => {
    if (!socket) return;
    
    // Join chat room
    socket.emit('join-chat', 'general');
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      console.log('[Chat] New message via socket:', message);
      setMessages(prev => [...prev, message]);
    });
    
    // Listen for deleted messages
    socket.on('message-deleted', (messageId) => {
      console.log('[Chat] Message deleted via socket:', messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });
    
    return () => {
      socket.off('new-message');
      socket.off('message-deleted');
      socket.emit('leave-chat', 'general');
    };
  }, [socket]);
  
  // -.-.-.-
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // -.-.-.-
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // -.-.-.-
  const loadMessages = async () => {
    try {
      const data = await chatService.getMessages('general', 100);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
 const handleSendMessage = async (content) => {
  setSending(true);
  try {
    const newMessage = await chatService.sendMessage(content, 'text', 'general');
    // If socket is not connected, update messages state manually
    if (!socket?.connected) {
      setMessages(prev => [...prev, newMessage]);
    }
  } catch (error) {
    console.error('[Chat] Failed to send message:', error);
  } finally {
    setSending(false);
  }
};
  
  // -.-.-.-
  const handleDeleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      // Message will be removed via socket
    } catch (error) {
      console.error('[Chat] Failed to delete message:', error);
    }
  };
  
  if (loading) return <Loader fullScreen message="A carregar chat..." />;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Container style={{ flex: 1, overflow: 'auto', paddingBottom: '80px' }}>
        <Header title="Chat Geral" />
        
        <div className="flex flex-col gap-sm">
          {(messages || []).length === 0 ? (
            <div className="text-center py-xl">
              <p className="text-muted">Nenhuma mensagem ainda. Começa a conversa!</p>
            </div>
          ) : (
            (messages || []).map((message) => (
              <MessageBubble
                key={message?._id}
                message={message}
                isMe={message?.author?._id === user?._id}
                canDelete={message?.author?._id === user?._id || isAdmin}
                onDelete={handleDeleteMessage}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </Container>
      
      <MessageInput onSend={handleSendMessage} loading={sending} />
    </div>
  );
};
