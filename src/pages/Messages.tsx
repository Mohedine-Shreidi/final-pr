import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getChatsForUser, getMessagesForChat, sendMessage, subscribeToMessages } from '../services/chatService';
import type { Chat, Message } from '../types';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadChats();
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      const sub = subscribeToMessages(activeChat.id, (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => { sub.unsubscribe(); };
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    if (!user) return;
    setLoading(true);
    const fetchedChats = await getChatsForUser(user.id);
    
    // Fetch user names for the 'other' user in each chat
    const enrichedChats = await Promise.all(fetchedChats.map(async (chat) => {
      const otherId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;
      const { data } = await supabase.from('profiles').select('name').eq('id', otherId).single();
      return {
        ...chat,
        otherUserName: data?.name || 'Unknown User'
      };
    }));

    setChats(enrichedChats);
    setLoading(false);
  };

  const loadMessages = async (chatId: string) => {
    const msgs = await getMessagesForChat(chatId);
    setMessages(msgs);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;
    
    const msgContent = newMessage.trim();
    setNewMessage('');
    
    // Optimistic UI update
    const optimisticMsg: Message = {
      id: Date.now().toString(),
      chatId: activeChat.id,
      senderId: user.id,
      content: msgContent,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    await sendMessage(activeChat.id, user.id, msgContent);
  };

  if (!user) {
    return <div className="p-8 text-center text-gray-400">Please log in to view messages.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
      {/* Sidebar: Chat List */}
      <div className="w-1/3 border-r flex flex-col" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MessageSquare size={20} className="text-cyan-500" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="text-center p-4 text-xs text-gray-500 animate-pulse">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="text-center p-4 text-xs text-gray-500">No messages yet. Start a chat from the Sharing or Lost & Found sections.</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                style={{
                  background: activeChat?.id === chat.id ? 'var(--bg-card)' : 'transparent',
                  border: activeChat?.id === chat.id ? '1px solid var(--border-color)' : '1px solid transparent',
                }}
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={18} className="text-cyan-500" />
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{chat.otherUserName}</h3>
                  {chat.context && (
                    <p className="text-[10px] truncate" style={{ color: 'var(--color-primary-500)' }}>{chat.context}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className="flex-1 flex flex-col relative" style={{ background: 'var(--bg-card)' }}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3 z-10" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <UserIcon size={18} className="text-cyan-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{activeChat.otherUserName}</h3>
                {activeChat.context && <p className="text-[10px]" style={{ color: 'var(--color-primary-500)' }}>Regarding: {activeChat.context}</p>}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'rounded-tr-sm text-white' : 'rounded-tl-sm'}`}
                      style={{
                        background: isMe ? 'var(--color-primary-600)' : 'var(--bg-secondary)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      {msg.content}
                      <div className="text-[9px] mt-1 opacity-60 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary px-4 rounded-xl flex items-center justify-center disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-cyan-500" />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your Messages</h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Select a conversation from the sidebar to start chatting, or browse the Sharing and Lost & Found sections to contact someone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
