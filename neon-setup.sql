-- Frota Pro — Banco de produção no Neon PostgreSQL
-- A API da Vercel cria as tabelas e carrega o catálogo inicial automaticamente.
-- Este arquivo é opcional, mas pode ser executado no SQL Editor do Neon antes do deploy.

CREATE TABLE IF NOT EXISTS frota_records (
  id BIGSERIAL PRIMARY KEY,
  resource TEXT NOT NULL CHECK (resource IN ('vehicles', 'fueling', 'maintenance', 'km_records', 'drivers', 'users')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frota_records_resource
  ON frota_records (resource);

CREATE INDEX IF NOT EXISTS idx_frota_records_resource_id
  ON frota_records (resource, id);

CREATE TABLE IF NOT EXISTS frota_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
