-- ============================================================
-- CBSH Digital Library v3 — Complete Database Schema
-- Project: vwognhqqhnxdhczmuufy
-- Run in Supabase SQL Editor (paste all at once)
-- ============================================================

-- ============================
-- STEP 1: TABLES
-- ============================

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insforge_uid        TEXT UNIQUE,
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  role                TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','email_verified','approved','denied')),
  profile_picture_url TEXT,
  phone               TEXT,
  department          TEXT,
  bio                 TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  subject           TEXT NOT NULL,
  semester          INT,
  tags              TEXT,
  insforge_file_key TEXT,
  file_type         TEXT CHECK (file_type IN ('pdf','image')),
  file_size         BIGINT,
  mime_type         TEXT,
  download_count    INT DEFAULT 0,
  uploaded_by       UUID REFERENCES users(id),
  upload_date       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  subject       TEXT NOT NULL,
  description   TEXT,
  duration      INT NOT NULL,
  passing_marks INT NOT NULL,
  total_marks   INT NOT NULL,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  option_a       TEXT NOT NULL,
  option_b       TEXT NOT NULL,
  option_c       TEXT NOT NULL,
  option_d       TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  marks          INT DEFAULT 1,
  question_order INT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              UUID REFERENCES quizzes(id),
  student_id           UUID REFERENCES users(id),
  score                INT NOT NULL,
  total_marks          INT NOT NULL,
  percentage           DECIMAL(5,2) NOT NULL,
  status               TEXT CHECK (status IN ('pass','fail')),
  time_taken           INT,
  answers_json         JSONB,
  correct_answers_json JSONB,
  attempt_date         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  material_id   UUID REFERENCES materials(id),
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  material_id UUID REFERENCES materials(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  priority    TEXT DEFAULT 'normal' CHECK (priority IN ('normal','important','urgent')),
  target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all','students','teachers','admins')),
  created_by  UUID REFERENCES users(id),
  expiry_date TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- STEP 2: INDEXES
-- ============================

CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role);
CREATE INDEX IF NOT EXISTS idx_materials_subject     ON materials(subject);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_status        ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id   ON quiz_attempts(student_id);

-- ============================
-- STEP 3: RPC FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_users',     (SELECT COUNT(*) FROM users WHERE status = 'approved'),
    'total_materials', (SELECT COUNT(*) FROM materials),
    'total_quizzes',   (SELECT COUNT(*) FROM quizzes WHERE status = 'published'),
    'pending_users',   (SELECT COUNT(*) FROM users WHERE status IN ('pending','email_verified')),
    'pass_rate', (
      SELECT COALESCE(
        ROUND((COUNT(*) FILTER (WHERE status='pass')::DECIMAL / NULLIF(COUNT(*),0)) * 100, 1), 0
      ) FROM quiz_attempts
    ),
    'materials_by_subject', (
      SELECT COALESCE(json_agg(s), '[]'::json)
      FROM (SELECT subject, COUNT(*) AS count FROM materials GROUP BY subject ORDER BY count DESC) s
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_download_count(material_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE materials SET download_count = download_count + 1 WHERE id = material_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- STEP 4: RLS HELPER FUNCTIONS
-- ============================
-- NOTE: Set up Clerk JWT Template named "supabase" FIRST before enabling RLS

CREATE OR REPLACE FUNCTION auth_clerk_id() RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub'
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE insforge_uid = (auth.jwt() ->> 'sub')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
  SELECT id FROM users WHERE insforge_uid = (auth.jwt() ->> 'sub')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================
-- STEP 5: ENABLE RLS
-- ============================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================
-- STEP 6: RLS POLICIES
-- ============================

-- USERS
CREATE POLICY "own_read"       ON users FOR SELECT USING (insforge_uid = auth_clerk_id());
CREATE POLICY "admin_read_all" ON users FOR SELECT USING (auth_user_role() = 'admin');
CREATE POLICY "admin_update"   ON users FOR UPDATE USING (auth_user_role() = 'admin');
CREATE POLICY "own_update"     ON users FOR UPDATE USING (insforge_uid = auth_clerk_id());

-- MATERIALS
CREATE POLICY "read_approved"   ON materials FOR SELECT USING (auth_user_role() IN ('admin','teacher','student'));
CREATE POLICY "teacher_insert"  ON materials FOR INSERT WITH CHECK (auth_user_role() = 'teacher' AND uploaded_by = auth_user_id());
CREATE POLICY "teacher_update"  ON materials FOR UPDATE USING (auth_user_role() = 'teacher' AND uploaded_by = auth_user_id());
CREATE POLICY "delete_material" ON materials FOR DELETE USING (auth_user_role() = 'admin' OR (auth_user_role() = 'teacher' AND uploaded_by = auth_user_id()));

-- QUIZZES
CREATE POLICY "student_published"  ON quizzes FOR SELECT USING (auth_user_role() = 'student' AND status = 'published');
CREATE POLICY "teacher_admin_all"  ON quizzes FOR SELECT USING (auth_user_role() IN ('teacher','admin'));
CREATE POLICY "teacher_quiz_write" ON quizzes FOR INSERT WITH CHECK (auth_user_role() = 'teacher' AND created_by = auth_user_id());
CREATE POLICY "teacher_quiz_edit"  ON quizzes FOR UPDATE USING (auth_user_role() = 'teacher' AND created_by = auth_user_id());
CREATE POLICY "teacher_quiz_del"   ON quizzes FOR DELETE USING (auth_user_role() = 'teacher' AND created_by = auth_user_id());

-- QUESTIONS (no direct client access — all via API routes using service role)

-- QUIZ ATTEMPTS
CREATE POLICY "student_own_attempts"   ON quiz_attempts FOR SELECT USING (auth_user_role() = 'student' AND student_id = auth_user_id());
CREATE POLICY "teacher_admin_attempts" ON quiz_attempts FOR SELECT USING (auth_user_role() IN ('teacher','admin'));

-- DOWNLOADS
CREATE POLICY "own_downloads"   ON downloads FOR SELECT USING (user_id = auth_user_id());
CREATE POLICY "admin_downloads" ON downloads FOR SELECT USING (auth_user_role() = 'admin');
CREATE POLICY "insert_download" ON downloads FOR INSERT  WITH CHECK (user_id = auth_user_id());

-- BOOKMARKS
CREATE POLICY "own_bookmarks_r" ON bookmarks FOR SELECT USING (user_id = auth_user_id());
CREATE POLICY "own_bookmarks_i" ON bookmarks FOR INSERT  WITH CHECK (user_id = auth_user_id());
CREATE POLICY "own_bookmarks_d" ON bookmarks FOR DELETE  USING (user_id = auth_user_id());

-- NOTIFICATIONS
CREATE POLICY "own_notif_read"   ON notifications FOR SELECT USING (user_id = auth_user_id());
CREATE POLICY "own_notif_update" ON notifications FOR UPDATE USING (user_id = auth_user_id());

-- ANNOUNCEMENTS
CREATE POLICY "read_announce" ON announcements FOR SELECT
  USING (
    auth_user_role() IN ('admin','teacher','student')
    AND (expiry_date IS NULL OR expiry_date > NOW())
    AND (target_role = 'all' OR target_role = auth_user_role() || 's')
  );
CREATE POLICY "admin_announce_all" ON announcements FOR ALL USING (auth_user_role() = 'admin');

-- ============================
-- STEP 7: STORAGE POLICIES
-- ============================

-- Ensure storage schema policies are created for standard buckets
CREATE POLICY "Allow read cbsh-library" ON storage.objects FOR SELECT USING (bucket_id = 'cbsh-library');
CREATE POLICY "Allow insert cbsh-library" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cbsh-library');
CREATE POLICY "Allow update cbsh-library" ON storage.objects FOR UPDATE USING (bucket_id = 'cbsh-library');
CREATE POLICY "Allow delete cbsh-library" ON storage.objects FOR DELETE USING (bucket_id = 'cbsh-library');

CREATE POLICY "Allow read cbsh-public" ON storage.objects FOR SELECT USING (bucket_id = 'cbsh-public');
CREATE POLICY "Allow insert cbsh-public" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cbsh-public');
CREATE POLICY "Allow update cbsh-public" ON storage.objects FOR UPDATE USING (bucket_id = 'cbsh-public');
CREATE POLICY "Allow delete cbsh-public" ON storage.objects FOR DELETE USING (bucket_id = 'cbsh-public');

-- ============================
-- DONE — Verify with:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
-- ============================
