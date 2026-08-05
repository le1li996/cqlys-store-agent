-- ============================================================
-- 门店经营智脑 · Supabase 表结构
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  email         TEXT DEFAULT '',
  company_name  TEXT DEFAULT '',
  salt          TEXT NOT NULL,
  hash          TEXT NOT NULL,
  name          TEXT NOT NULL,
  plan          TEXT DEFAULT '试用版',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 登录令牌表
CREATE TABLE IF NOT EXISTS tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 验证码表（email 作为主键）
CREATE TABLE IF NOT EXISTS codes (
  email       TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  expires_at  BIGINT NOT NULL
);

-- 文件元数据表
CREATE TABLE IF NOT EXISTS files (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  size         BIGINT NOT NULL,
  mime         TEXT,
  owner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  storage_path TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);

-- ============================================================
-- Storage Bucket（文件存储）
-- 在 Supabase Dashboard → Storage → New Bucket 中创建：
--   名称：uploads
--   公开：否（Private）
-- ============================================================

-- ============================================================
-- 迁移：已有 Supabase 数据库执行以下语句来升级
-- ============================================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';
-- ALTER TABLE codes DROP CONSTRAINT IF EXISTS codes_pkey;
-- ALTER TABLE codes ADD COLUMN IF NOT EXISTS email TEXT;
-- UPDATE codes SET email = phone WHERE email IS NULL;
-- ALTER TABLE codes DROP COLUMN IF EXISTS phone;
-- ALTER TABLE codes ADD PRIMARY KEY (email);
