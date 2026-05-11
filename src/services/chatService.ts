import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Chat, Message } from '../types';

export async function getChatsForUser(userId: string): Promise<Chat[]> {
  if (!isSupabaseConfigured) return [];
  
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapChatRow);
}

export async function getOrCreateChat(user1Id: string, user2Id: string, context: string = ''): Promise<Chat | null> {
  if (!isSupabaseConfigured) return null;

  // Check if chat already exists between these two users
  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .limit(1);

  if (existing && existing.length > 0) {
    return mapChatRow(existing[0]);
  }

  // Create new chat
  const { data, error } = await supabase.from('chats').insert({
    user1_id: user1Id,
    user2_id: user2Id,
    context
  }).select().single();

  if (error || !data) {
    console.error('[Chat] Create error:', error);
    return null;
  }
  return mapChatRow(data);
}

export async function getMessagesForChat(chatId: string): Promise<Message[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map(mapMessageRow);
}

export async function sendMessage(chatId: string, senderId: string, content: string): Promise<Message | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content
  }).select().single();

  if (error || !data) {
    console.error('[Chat] Send message error:', error);
    return null;
  }

  // Update chat updated_at
  await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

  return mapMessageRow(data);
}

export function subscribeToMessages(chatId: string, callback: (msg: Message) => void) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };

  const channel = supabase.channel(`chat_${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`
    }, (payload) => {
      callback(mapMessageRow(payload.new));
    })
    .subscribe();

  return channel;
}

function mapChatRow(row: any): Chat {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    context: row.context || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMessageRow(row: any): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at
  };
}
