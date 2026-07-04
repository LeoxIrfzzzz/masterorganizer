import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, getCurrentUser, Message } from '../db/store';
import { Send, MessageSquare } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const user = getCurrentUser();
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    setMessages(getMessages());
  };

  useEffect(() => {
    loadMessages();
    window.addEventListener('local-db-updated', loadMessages);
    return () => window.removeEventListener('local-db-updated', loadMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    sendMessage(user.id, user.name || 'Unknown', input);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
      <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <MessageSquare /> Communications Network
      </h1>
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem' }}>
          {messages.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5 }}>No messages in the network.</p> : null}
          {messages.map(msg => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start', 
                maxWidth: '70%',
                background: isMe ? 'var(--glow-color)' : 'rgba(255,255,255,0.05)',
                color: isMe ? '#000' : '#fff',
                padding: '1rem',
                borderRadius: '8px',
                borderBottomRightRadius: isMe ? '0' : '8px',
                borderBottomLeftRadius: isMe ? '8px' : '0',
                boxShadow: isMe ? 'var(--glow-shadow)' : 'none'
              }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.3rem', fontWeight: 'bold' }}>{msg.senderName}</div>
                <div>{msg.text}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem', textAlign: 'right' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <input 
            type="text" 
            className="form-control" 
            style={{ flex: 1 }} 
            placeholder="Broadcast message..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
