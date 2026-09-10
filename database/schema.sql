CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS credit_requests (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  credit_type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  identity_file JSONB NOT NULL,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_requests_created_at_idx ON credit_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS credit_requests_status_idx ON credit_requests (status);

CREATE TABLE IF NOT EXISTS account_requests (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  account_type TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_requests_created_at_idx ON account_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_at_idx ON newsletter_subscribers (created_at DESC);

-- connect-pg-simple crée automatiquement la table user_sessions lorsqu’il est configuré avec createTableIfMissing=true.
