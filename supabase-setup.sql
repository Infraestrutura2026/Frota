-- ==========================================
-- FROTA PRO v3.0 - Setup do Supabase
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. Criar tabela de usuários (login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir usuário padrão admin/admin2025
INSERT INTO users (username, password, name) 
VALUES ('admin', 'admin2025', 'Administrador')
ON CONFLICT (username) DO NOTHING;

-- 2. Criar tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  placa TEXT NOT NULL,
  grupo TEXT,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  cor TEXT,
  chassi TEXT,
  renavam TEXT,
  hodometro INTEGER DEFAULT 0,
  capacidade INTEGER,
  combustivel TEXT DEFAULT 'FLEX',
  status TEXT DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela de abastecimentos
CREATE TABLE IF NOT EXISTS fueling (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT,
  motorista TEXT,
  litros NUMERIC,
  valor NUMERIC,
  km INTEGER,
  posto TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Criar tabela de manutenções
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT,
  tipo TEXT,
  descricao TEXT,
  custo NUMERIC,
  oficina TEXT,
  status TEXT DEFAULT 'PENDENTE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Criar tabela de quilometragem
CREATE TABLE IF NOT EXISTS km_records (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT,
  km_anterior INTEGER,
  km_atual INTEGER,
  motorista TEXT,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Criar tabela de motoristas
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh TEXT,
  cnh_vencimento DATE,
  categoria TEXT DEFAULT 'B',
  telefone TEXT,
  status TEXT DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- PERMISSÕES (RLS - Row Level Security)
-- ==========================================
-- Desabilitar RLS para simplificar (apenas para uso interno/institucional)
-- Se precisar de segurança por usuário, habilite RLS e crie políticas

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE fueling DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE km_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- Habilitar a extensão para UUID se necessário
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- POLÍTICA DE CORS (se necessário configurar manualmente)
-- Vá em API > Settings no Supabase e adicione seu domínio à lista de allowed origins
-- ==========================================