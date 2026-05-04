-- =====================================================
-- 002_profiles.sql
-- Consolidated migration for profiles table, RLS, RPC, and trigger
-- =====================================================

-- -----------------------------------------------------
-- 1. Create profiles table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  student_id      TEXT UNIQUE,
  campus_building TEXT DEFAULT 'General Campus',
  bio             TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'staff', 'admin')),
  reputation      INTEGER NOT NULL DEFAULT 100 CHECK (reputation >= 0),
  is_verified     BOOLEAN DEFAULT FALSE,
  is_suspended    BOOLEAN DEFAULT FALSE,
  notif_matches   BOOLEAN DEFAULT TRUE,
  notif_claims    BOOLEAN DEFAULT TRUE,
  notif_messages  BOOLEAN DEFAULT FALSE,
  notif_frequency TEXT DEFAULT 'realtime'
                    CHECK (notif_frequency IN ('realtime', 'daily', 'weekly')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 2. Enable Row Level Security
-- -----------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 3. Helper function to check admin role (bypasses RLS)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- -----------------------------------------------------
-- 4. RLS Policies
-- -----------------------------------------------------

-- Public read (safe columns only – frontend must not select sensitive ones)
CREATE POLICY "Public read profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin full access (uses auth_is_admin() helper)
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
CREATE POLICY "Admin full access profiles" ON profiles
  FOR ALL USING (auth_is_admin());

-- Optional: allow inserts for the trigger (though trigger bypasses RLS)
CREATE POLICY "Enable insert for trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------
-- 5. RPC function to create a profile (used by frontend and trigger)
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, reputation, role)
  VALUES (user_id, user_name, user_email, 100, 'student')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- -----------------------------------------------------
-- 6. Trigger function that calls create_user_profile
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS handle_new_user_trigger() CASCADE;
CREATE OR REPLACE FUNCTION handle_new_user_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_user_profile(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- 7. Attach trigger to auth.users
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_trigger();