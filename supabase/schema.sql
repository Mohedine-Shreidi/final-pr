-- ============================================================
-- CivicHub Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== PROFILES =====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'volunteer', 'authority', 'admin')),
  trust_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== RESOURCES =====================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'pharmacy', 'shelter', 'water', 'fuel')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'limited')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  last_verified TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== REPORTS =====================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('roads', 'lighting', 'water_leaks', 'garbage', 'hazards')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'in_progress', 'resolved')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  votes INTEGER DEFAULT 0,
  voted_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== LOST & FOUND =====================
CREATE TABLE IF NOT EXISTS lost_found_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('ids', 'keys', 'pets', 'electronics', 'documents', 'bags', 'clothing', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'claimed', 'closed')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  date_lost_found TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== SHARED ITEMS =====================
CREATE TABLE IF NOT EXISTS shared_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Other',
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'poor')),
  available BOOLEAN DEFAULT true,
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== BORROW REQUESTS =====================
CREATE TABLE IF NOT EXISTS borrow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES shared_items(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  borrower_name TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'returned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== ITEM REVIEWS =====================
CREATE TABLE IF NOT EXISTS item_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES shared_items(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== ACCESSIBILITY POINTS =====================
CREATE TABLE IF NOT EXISTS accessibility_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ramp', 'elevator', 'restroom', 'entrance', 'parking', 'pathway')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== OBSTACLES =====================
CREATE TABLE IF NOT EXISTS obstacles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stairs', 'construction', 'narrow_path', 'broken_ramp', 'no_curb_cut', 'steep_slope')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT DEFAULT '',
  permanent BOOLEAN DEFAULT false,
  confirmations INTEGER DEFAULT 0,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== NOTIFICATIONS =====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'system' CHECK (type IN ('match', 'report_update', 'borrow_request', 'system', 'crowd_update')),
  read BOOLEAN DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== ROW LEVEL SECURITY =====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE obstacles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Resources: readable by all, writable by authenticated
CREATE POLICY "Resources are viewable by everyone" ON resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create resources" ON resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports: readable by all, writable by creator
CREATE POLICY "Reports are viewable by everyone" ON reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);

-- Lost & Found: readable by all
CREATE POLICY "L&F posts are viewable by everyone" ON lost_found_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create L&F posts" ON lost_found_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own L&F posts" ON lost_found_posts FOR UPDATE USING (auth.uid() = user_id);

-- Shared Items: readable by all
CREATE POLICY "Shared items are viewable by everyone" ON shared_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create shared items" ON shared_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own shared items" ON shared_items FOR UPDATE USING (auth.uid() = user_id);

-- Borrow Requests: read/write for involved parties
CREATE POLICY "Borrow requests are viewable by everyone" ON borrow_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create borrow requests" ON borrow_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Involved users can update borrow requests" ON borrow_requests FOR UPDATE USING (true);

-- Reviews: readable by all
CREATE POLICY "Reviews are viewable by everyone" ON item_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON item_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Accessibility: readable by all, writable by authenticated
CREATE POLICY "Accessibility points viewable by everyone" ON accessibility_points FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create points" ON accessibility_points FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update points" ON accessibility_points FOR UPDATE USING (true);

-- Obstacles: readable by all
CREATE POLICY "Obstacles are viewable by everyone" ON obstacles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create obstacles" ON obstacles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update obstacles" ON obstacles FOR UPDATE USING (true);

-- Notifications: users see only their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
