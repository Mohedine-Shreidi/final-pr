-- ============================================================
-- CivicHub Phase 7 Migration: Chat & Content Management
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ===================== CHATS =====================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  context TEXT DEFAULT '', -- e.g., 'item:UUID' or 'lostfound:UUID'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== MESSAGES =====================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== USER REPORTS (Faulty Items/Behavior) =====================
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_id UUID REFERENCES shared_items(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== ROW LEVEL SECURITY =====================
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Chats: users can see/update their own chats
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: users can see/insert messages in their own chats
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))
);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))
);

-- User Reports: users can insert, admins can read/update
CREATE POLICY "Users can create reports" ON user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports" ON user_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update reports" ON user_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ===================== DELETION POLICIES =====================

-- Allow users to delete their own reports
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = user_id);

-- Allow users to delete their own lost & found posts
CREATE POLICY "Users can delete own L&F posts" ON lost_found_posts FOR DELETE USING (auth.uid() = user_id);

-- Allow users to delete their own shared items
CREATE POLICY "Users can delete own shared items" ON shared_items FOR DELETE USING (auth.uid() = user_id);
