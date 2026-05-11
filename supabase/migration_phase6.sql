-- ============================================================
-- CivicHub Phase 6 Migration: Admin Moderation & Confirmation
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ===================== ADD is_confirmed COLUMNS =====================

-- Reports: add is_confirmed (defaults true for backward compat — reports go through status workflow)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Lost & Found: require admin confirmation
ALTER TABLE lost_found_posts ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Shared Items: require admin confirmation
ALTER TABLE shared_items ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Accessibility Points: require admin confirmation
ALTER TABLE accessibility_points ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Obstacles: require admin confirmation
ALTER TABLE obstacles ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- ===================== CREATE ADMIN ACCOUNT =====================

-- First, create admin via auth (do this in Supabase Dashboard > Auth > Users > Add User)
-- Email: admin@civichub.com / Password: Admin@2026!
-- Then run this to set the role to admin:

-- After creating the user in Supabase Auth, get their UUID and run:
-- UPDATE profiles SET role = 'admin', name = 'CivicHub Admin', trust_score = 100 WHERE email = 'admin@civichub.com';

-- ===================== ADMIN RLS POLICIES =====================

-- Allow admins to update ANY report (for status changes and moderation)
CREATE POLICY "Admins can update all reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to delete reports
CREATE POLICY "Admins can delete reports" ON reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to update any lost_found posts
CREATE POLICY "Admins can update all L&F posts" ON lost_found_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to update any shared items
CREATE POLICY "Admins can update all shared items" ON shared_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to delete shared items
CREATE POLICY "Admins can delete shared items" ON shared_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to update any obstacle
CREATE POLICY "Admins can update all obstacles" ON obstacles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to update any accessibility point
CREATE POLICY "Admins can update all accessibility points" ON accessibility_points FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to update any profile (for role management)
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow admins to read all notifications (for monitoring)
CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
