-- ==========================================
-- FROTA PRO v3.0 — Setup do Banco de Dados Supabase (PostgreSQL)
-- Complexo Penal de Marília — Gestão de Frotas
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'operador',
  ativo INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário administrador padrão
INSERT INTO users (username, password, name, role, ativo) 
VALUES ('admin', 'admin2025', 'Administrador da Frota', 'admin', 1)
ON CONFLICT (username) DO NOTHING;

-- 2. TABELA DE VEÍCULOS (com unicidade de placa)
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS fueling (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT NOT NULL,
  motorista TEXT,
  litros NUMERIC(10,2),
  valor NUMERIC(10,2),
  km INTEGER,
  posto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE MANUTENÇÕES
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT NOT NULL,
  tipo TEXT DEFAULT 'Preventiva',
  descricao TEXT,
  custo NUMERIC(10,2) DEFAULT 0.00,
  oficina TEXT,
  status TEXT DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE REGISTROS DE QUILOMETRAGEM / VIAGENS
CREATE TABLE IF NOT EXISTS km_records (
  id SERIAL PRIMARY KEY,
  data DATE,
  placa TEXT NOT NULL,
  km_anterior INTEGER DEFAULT 0,
  km_atual INTEGER DEFAULT 0,
  motorista TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE MOTORISTAS / CONDUTORES
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh TEXT,
  cnh_vencimento DATE,
  categoria TEXT DEFAULT 'B',
  telefone TEXT,
  status TEXT DEFAULT 'ATIVO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES DE ALTA PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles (placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles (status);
CREATE INDEX IF NOT EXISTS idx_fueling_placa ON fueling (placa);
CREATE INDEX IF NOT EXISTS idx_fueling_data ON fueling (data);
CREATE INDEX IF NOT EXISTS idx_maintenance_placa ON maintenance (placa);
CREATE INDEX IF NOT EXISTS idx_maintenance_data ON maintenance (data);
CREATE INDEX IF NOT EXISTS idx_km_records_placa ON km_records (placa);
CREATE INDEX IF NOT EXISTS idx_km_records_data ON km_records (data);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers (status);

-- ==========================================
-- PERMISSÕES (RLS - Row Level Security)
-- ==========================================
-- Para implantações internas e rápidas, o RLS pode ficar desabilitado:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE fueling DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE km_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- RECOMENDAÇÃO DE SEGURANÇA PARA PRODUÇÃO:
-- Se desejar habilitar proteção avançada por usuário autenticado, execute:
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir leitura para todos autenticados" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Permitir escrita para todos autenticados" ON vehicles FOR ALL USING (auth.role() = 'authenticated');
