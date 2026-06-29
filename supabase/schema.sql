-- ==========================================
-- Buku Poin UFO UGM - Database Schema
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, this is for role mapping)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  union_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(320) UNIQUE,
  avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'mentor', 'psdm')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Types (Master Data - 24 types)
CREATE TABLE IF NOT EXISTS activity_types (
  id SERIAL PRIMARY KEY,
  number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  points INT NOT NULL,
  requires_role VARCHAR(3) NOT NULL DEFAULT 'no' CHECK (requires_role IN ('yes', 'no')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrants (Calon Anggota)
CREATE TABLE IF NOT EXISTS registrants (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  year VARCHAR(20) NOT NULL,
  major VARCHAR(255) NOT NULL,
  faculty VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentors
CREATE TABLE IF NOT EXISTS mentors (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  nip VARCHAR(50),
  expertise VARCHAR(255),
  max_mentees INT NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Assignments
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id SERIAL PRIMARY KEY,
  mentor_id INT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  registrant_id INT NOT NULL UNIQUE REFERENCES registrants(id) ON DELETE CASCADE,
  assigned_by INT REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  registrant_id INT NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  activity_type_id INT NOT NULL REFERENCES activity_types(id),
  activity_name VARCHAR(255) NOT NULL,
  activity_date DATE NOT NULL,
  activity_date_end DATE,
  role VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  documentation_url TEXT,
  documentation_images JSONB DEFAULT '[]',
  points INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by INT REFERENCES mentors(id)
);

-- Activity Verifications (Audit Log)
CREATE TABLE IF NOT EXISTS activity_verifications (
  id SERIAL PRIMARY KEY,
  activity_id INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  mentor_id INT NOT NULL REFERENCES mentors(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Activity Types (24 types)
INSERT INTO activity_types (number, name, points, requires_role) VALUES
(1, 'Diksar', 25, 'no'),
(2, 'Pameris Pameran Dikjut', 20, 'no'),
(3, 'Panitia Pameran Dikjut', 20, 'yes'),
(4, 'Piket Sekre Akbar', 10, 'no'),
(5, 'Diklat Wajib & Umum', 10, 'no'),
(6, 'Ketua Kelas Pameran Pra Pelantikan', 5, 'yes'),
(7, 'Event Hunting', 10, 'no'),
(8, 'Piket Sekre', 10, 'no'),
(9, 'Ikut Presentasi Karya Pameris (Pra-pel)', 3, 'no'),
(10, 'Menjadi Divisi DDD di kepanitiaan', 5, 'yes'),
(11, 'Memenangkan Lomba Fotografi/Videografi', 10, 'no'),
(12, 'Mengikuti Lomba Fotografi/Videografi', 2, 'no'),
(13, 'Submit Karya untuk pameran', 3, 'no'),
(14, 'Membantu dokumentasi UKM / komunitas di UGM', 3, 'no'),
(15, 'Berpartisipasi Dalam Kegiatan HUT UFO', 2, 'no'),
(16, 'Kurasi Pameran', 3, 'no'),
(17, 'Hunting individu', 2, 'no'),
(18, 'Hunting bareng UFO/CUFO (min. 3 orang)', 5, 'no'),
(19, 'Main ke Sekre UFO (min. 2 jam)', 2, 'no'),
(20, 'Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)', 5, 'no'),
(21, 'Mengunjungi Pameran', 2, 'no'),
(22, 'Mengunjungi Pameran bersama UFO/CUFO', 5, 'no'),
(23, 'Mengikuti One Week Challenge (poin dihitung perhari)', 1, 'no'),
(24, 'Kegiatan lain Sesuai Kebijakan/Persetujuan Ketua UFO (tentative)', 0, 'no');

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (open read, restricted write)
CREATE POLICY "activity_types_read" ON activity_types FOR SELECT USING (true);

-- Note: In production, add proper RLS policies for each table
-- based on user roles and ownership
