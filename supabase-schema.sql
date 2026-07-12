-- ============================================
-- Buku Poin UFO UGM - Supabase Database Schema
-- Run this in Supabase SQL Editor (New Query)
-- ============================================

-- 1. Members (pre-registered anggota + verified users)
CREATE TABLE IF NOT EXISTS members (
  nsa TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  angkatan INTEGER NOT NULL,
  divisi TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Registrants (CUFOs / calon anggota)
CREATE TABLE IF NOT EXISTS registrants (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  nim TEXT,
  password TEXT,
  year TEXT,
  major TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on email for login
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrants_email ON registrants(email);

-- 3. Activities
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  registrant_id INTEGER REFERENCES registrants(id) ON DELETE CASCADE,
  activity_type_id INTEGER NOT NULL,
  activity_name TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  activity_date_end TEXT,
  role TEXT,
  location TEXT,
  documentation_images TEXT[],
  points INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Kelompoks
CREATE TABLE IF NOT EXISTS kelompoks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pemandu_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kelompok assignments (CUFO -> Kelompok)
CREATE TABLE IF NOT EXISTS kelompok_assignments (
  id SERIAL PRIMARY KEY,
  kelompok_id INTEGER REFERENCES kelompoks(id) ON DELETE CASCADE,
  registrant_id INTEGER REFERENCES registrants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pemandu assignments (Pemandu -> CUFO)
CREATE TABLE IF NOT EXISTS pemandu_assignments (
  id SERIAL PRIMARY KEY,
  pemandu_id INTEGER NOT NULL,
  registrant_id INTEGER NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Locations (for autocomplete)
CREATE TABLE IF NOT EXISTS locations (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Free users (self-registered CUFOs)
CREATE TABLE IF NOT EXISTS free_users (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Standalone pemandus (admin-managed, not from member list)
CREATE TABLE IF NOT EXISTS standalone_pemandus (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  expertise TEXT,
  max_mentees INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Seed Default Locations
-- ============================================
INSERT INTO locations (name) VALUES
  ('Sekretariat UFO UGM'),
  ('Sekretariat Bersama N58 UGM'),
  ('Auditorium FMIPA UGM'),
  ('Grha Sabha Pramana UGM'),
  ('Balairung UGM'),
  ('Perpustakaan Pusat UGM'),
  ('Museum UGM'),
  ('Taman Budaya Yogyakarta'),
  ('Jogja National Museum'),
  ('Galeri Nasional Indonesia Yogyakarta'),
  ('Taman Sari Yogyakarta'),
  ('Candi Prambanan'),
  ('Candi Borobudur'),
  ('Malioboro'),
  ('Taman Pelangi Jogja'),
  ('Lapangan Pancasila UGM'),
  ('Gelanggang Mahasiswa UGM')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Enable Row Level Security (RLS) - optional
-- Uncomment if you want basic access control
-- ============================================
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kelompoks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kelompok_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pemandu_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE free_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE standalone_pemandus ENABLE ROW LEVEL SECURITY;

-- Allow all access (simplified - no auth required)
-- CREATE POLICY "allow_all" ON members FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON registrants FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON activities FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON kelompoks FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON kelompok_assignments FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON pemandu_assignments FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON locations FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON free_users FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON standalone_pemandus FOR ALL USING (true) WITH CHECK (true);
