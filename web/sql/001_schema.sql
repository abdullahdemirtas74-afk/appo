-- AppO — schéma Postgres (fondation)
-- Appliquer avec: psql "$DATABASE_URL" -f sql/001_schema.sql
-- La bascule complète JSON → Postgres se fera progressivement.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('client', 'pro', 'admin')),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended BOOLEAN NOT NULL DEFAULT FALSE,
  locale TEXT DEFAULT 'fr',
  client_kind TEXT,
  organization_name TEXT,
  organization_siret TEXT,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  privacy_consent_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT,
  indicative_price NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS service_cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pros (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  company TEXT NOT NULL,
  siret TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km NUMERIC(8,2),
  online BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  starting_price NUMERIC(12,2),
  rating NUMERIC(4,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES users(id),
  pro_id TEXT REFERENCES pros(id),
  category_id TEXT REFERENCES categories(id),
  status TEXT NOT NULL,
  city TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'none',
  invoice_id TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  pro_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  tip NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  pro_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'issued',
  currency TEXT NOT NULL DEFAULT 'EUR',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  pro_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_client ON missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_pro ON missions(pro_id);
CREATE INDEX IF NOT EXISTS idx_missions_city ON missions(city);
CREATE INDEX IF NOT EXISTS idx_pros_city ON pros(city);
