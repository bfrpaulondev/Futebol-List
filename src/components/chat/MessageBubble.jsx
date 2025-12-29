// -.-.-.-
import React from 'react';
import { Avatar } from '@components/ui/Avatar';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// -.-.-.-
export const MessageBubble = ({ 
  message, 
  isMe, 
  onDelete,
  canDelete 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        gap: 'var(--space-sm)',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-md)'
      }}
    >
      {/* Avatar */}
      <Avatar 
        src={message.author.avatar} 
        name={message.author.name} 
        size="sm"
      />
      
      {/* Bubble */}
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)'
      }}>
        {/* Name (only for others) */}
        {!isMe && (
          <span className="text-xs text-muted font-semibold">
            {message.author.name}
          </span>
        )}
        
        {/* Content */}
        <div style={{
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: isMe 
            ? 'linear-gradient(135deg, var(--color-green), var(--color-teal))'
            : 'rgba(30, 41, 59, 0.8)',
          color: isMe ? 'var(--text-dark)' : 'var(--text-primary)',
          border: isMe ? 'none' : '1px solid var(--border-color)'
        }}>
          {message.type === 'gif' ? (
            <img 
              src={message.gifUrl} 
              alt="GIF" 
              style={{ 
                maxWidth: '200px', 
                borderRadius: 'var(--radius-sm)' 
              }}
            />
          ) : (
            <p style={{ margin: 0, wordBreak: 'break-word' }}>
              {message.content}
            </p>
          )}
        </div>
        
        {/* Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          justifyContent: isMe ? 'flex-end' : 'flex-start'
        }}>
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(message._id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-error)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'inherit'
              }}
            >
              Apagar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
