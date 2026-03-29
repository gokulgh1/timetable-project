-- ============================================================
-- TimetableAI — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name TEXT NOT NULL DEFAULT 'Anna University Affiliated College',
  acad_year TEXT NOT NULL DEFAULT '2025–2026',
  current_sem TEXT NOT NULL DEFAULT 'odd', -- 'odd' or 'even'
  odd_sem_start TEXT DEFAULT 'July',
  odd_sem_end TEXT DEFAULT 'November',
  even_sem_start TEXT DEFAULT 'January',
  even_sem_end TEXT DEFAULT 'May',
  pre_lunch_duration INTEGER DEFAULT 50,
  post_lunch_duration INTEGER DEFAULT 45,
  short_break_duration INTEGER DEFAULT 10,
  lunch_duration INTEGER DEFAULT 45,
  allow_pairs BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTIONS TABLE (year-wise)
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dept_code TEXT NOT NULL REFERENCES departments(code) ON DELETE CASCADE,
  year TEXT NOT NULL, -- 'I Year', 'II Year', 'III Year', 'IV Year'
  name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  class_teacher_id UUID, -- FK to teachers, set later
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dept_code, year, name)
);

-- ============================================================
-- SUBJECTS TABLE (year-wise per dept)
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  dept_code TEXT NOT NULL REFERENCES departments(code) ON DELETE CASCADE,
  year TEXT NOT NULL,
  is_lab BOOLEAN DEFAULT false,
  weekly_periods INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, dept_code, year)
);

-- ============================================================
-- TEACHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id TEXT UNIQUE NOT NULL, -- e.g. 'T001'
  name TEXT NOT NULL,
  dept_code TEXT NOT NULL REFERENCES departments(code) ON DELETE CASCADE,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHER SUBJECTS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  dept_code TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_code, dept_code, year)
);

-- ============================================================
-- TIMETABLES TABLE (saved selected timetables per section)
-- ============================================================
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dept_code TEXT NOT NULL REFERENCES departments(code) ON DELETE CASCADE,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  grid JSONB NOT NULL, -- 5 days x 8 periods grid stored as JSON
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dept_code, year, section)
);

-- ============================================================
-- TEACHER TIMETABLES (auto-derived)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  dept_code TEXT NOT NULL,
  grid JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, dept_code)
);

-- ============================================================
-- Add class teacher FK after teachers table exists
-- ============================================================
ALTER TABLE sections ADD CONSTRAINT fk_class_teacher
  FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_timetables ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read everything
CREATE POLICY "Allow authenticated read" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON teacher_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON timetables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON teacher_timetables FOR SELECT TO authenticated USING (true);

-- Allow admin role to write (you can configure roles in Supabase dashboard)
CREATE POLICY "Allow admin write" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON teacher_subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON timetables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write" ON teacher_timetables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DEFAULT SETTINGS
-- ============================================================
INSERT INTO settings (college_name, acad_year, current_sem)
VALUES ('Anna University Affiliated College', '2025–2026', 'odd')
ON CONFLICT DO NOTHING;
