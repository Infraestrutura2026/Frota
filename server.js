'use strict';

// ============================================================
// FROTA PRO v3.3 — Controle de Frota (grupos S2, S3 e S4)
// Servidor Node nativo: API REST + arquivos estáticos.
//
// Persistência:
//  • DATABASE_URL definida  → Neon (Postgres) — produção/Vercel
//  • DATABASE_URL ausente   → data/db.json (modo local/dev)
// Tabelas criadas automaticamente + seed na primeira chamada.
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

const VERSION = '3.5';

// Hash legado mantido para compatibilidade com bancos antigos.
const LEGACY_ADMIN_HASH = 'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a';

const INITIAL_VEHICLES = [
  { id: 1, placa: 'CUQ3I89', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 52952, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 2, placa: 'CUW3J07', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 92369, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 3, placa: 'TIT8E83', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 52906, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 4, placa: 'TIV8C29', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 80003, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 5, placa: 'TJY6A21', grupo: 'S2', marca: 'RENAULT', modelo: 'MASTER MINIBUS', ano: 2025, cor: 'BRANCA', hodometro: 57902, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
  { id: 6, placa: 'TLM2D25', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 57662, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 7, placa: 'FJF0688', grupo: 'S3', marca: 'FORD', modelo: 'F-4000', ano: 2018, cor: 'BRANCA', hodometro: 169633, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 8, placa: 'BRZ7720', grupo: 'S4', marca: 'GMC', modelo: '12170', ano: 1996, cor: 'BRANCA', hodometro: 311382, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 9, placa: 'BVZ5E97', grupo: 'S4', marca: 'MERCEDES-BENZ', modelo: 'COMIL SVELTO U', ano: 1999, cor: 'PRETA', hodometro: 242225, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 40 },
  { id: 10, placa: 'CFY2G52', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRATA', hodometro: 154152, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 11, placa: 'CFY2G97', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRETA', hodometro: 246909, status: 'ARROLAMENTO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 12, placa: 'CMW9549', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 7012', ano: 2004, cor: 'BRANCA', hodometro: 106805, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 13, placa: 'CST0H92', grupo: 'S4', marca: 'IVECO', modelo: 'GCLASS 150', ano: 2020, cor: 'FANTASIA', hodometro: 33669, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 34 },
  { id: 14, placa: 'DJL7937', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 70C16', ano: 2011, cor: 'PRATA', hodometro: 167185, status: 'ARROLAMENTO', combustivel: 'DIESEL', capacidade: 20 },
  { id: 15, placa: 'EEF7G88', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2010, cor: 'PRATA', hodometro: 602982, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 16, placa: 'FCK5196', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 466636, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 17, placa: 'FCW8I62', grupo: 'S4', marca: 'CITROEN', modelo: 'JUMPY GREE AMB', ano: 2022, cor: 'BRANCA', hodometro: 110240, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
  { id: 18, placa: 'FJG7158', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 265891, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 19, placa: 'FKE6H32', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 282733, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 20, placa: 'FKN6069', grupo: 'S4', marca: 'FORD', modelo: 'CARGO 816 S', ano: 2018, cor: 'PRATA', hodometro: 218324, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
  { id: 21, placa: 'FML8H43', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 221400, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 22, placa: 'FMM5G11', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 248248, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 23, placa: 'FRR1B42', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 259728, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 24, placa: 'FSH3I13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 282851, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 25, placa: 'FSW4013', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 485585, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 26, placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'PRATA', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 27, placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 28, placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
  { id: 29, placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
];

function sha256(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

const INITIAL_USERS = [
  { id: 1, nome: 'Administrador', usuario: 'admin', senha: sha256('admin2025'), role: 'admin', ativo: 1 }
];

function intOrNull(v) { const n = parseInt(v, 10); return Number.isNaN(n) ? null : n; }
function nextId(arr) { return arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1; }

// ============================================================
// Camada de dados
// ============================================================

let sql = null;
if (DATABASE_URL) {
  const { neon } = require('@neondatabase/serverless');
  sql = neon(DATABASE_URL);
}

// ---------- Modo Neon (Postgres) ----------

let neonInitPromise = null;
function ensureNeon() {
  if (!neonInitPromise) {
    neonInitPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY,
        placa TEXT, grupo TEXT, marca TEXT, modelo TEXT,
        ano INTEGER, cor TEXT, hodometro INTEGER,
        status TEXT, combustivel TEXT, capacidade INTEGER,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        nome TEXT, usuario TEXT, senha TEXT, role TEXT, ativo INTEGER
      )`;
      // O módulo de Troca de Óleo é auto-inicializável. O ALTER também cobre
      // bancos Neon criados por uma versão anterior do módulo.
      await sql`CREATE TABLE IF NOT EXISTS oil_changes (
        id INTEGER PRIMARY KEY,
        vehicle_id INTEGER,
        veiculo_id INTEGER,
        placa TEXT,
        data DATE,
        data_troca DATE,
        tipo_oleo TEXT,
        oleo TEXT,
        quantidade NUMERIC,
        hodometro INTEGER,
        horimetro INTEGER,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`ALTER TABLE oil_changes ADD COLUMN IF NOT EXISTS horimetro INTEGER`;
      // Módulo Manutenção (ordens de serviço) — a Troca de Óleo é um tipo.
      await sql`CREATE TABLE IF NOT EXISTS manutencoes (
        id INTEGER PRIMARY KEY,
        vehicle_id INTEGER, veiculo_id INTEGER, placa TEXT,
        tipo TEXT,
        data DATE, data_saida DATE,
        hodometro INTEGER, proxima_manutencao INTEGER,
        servico TEXT, itens TEXT, oficina TEXT,
        custo NUMERIC, status_os TEXT,
        tipo_oleo TEXT, quantidade NUMERIC,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )`;
      // Migração única: traz as trocas de óleo antigas para o novo módulo.
      const migrated = await sql`SELECT value FROM meta WHERE key = 'oil_migrated'`;
      if (migrated.length === 0) {
        await sql`INSERT INTO manutencoes
          (id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at)
          SELECT id, COALESCE(vehicle_id, veiculo_id), COALESCE(vehicle_id, veiculo_id), placa,
            'TROCA DE ÓLEO', COALESCE(data, data_troca), NULL, hodometro, NULL,
            'Troca de óleo', NULL, NULL, NULL, 'CONCLUÍDA',
            COALESCE(tipo_oleo, oleo), quantidade, observacoes, created_at
          FROM oil_changes ON CONFLICT (id) DO NOTHING`;
        await sql`INSERT INTO meta (key, value) VALUES ('oil_migrated', '1') ON CONFLICT (key) DO NOTHING`;
      }
      const vc = await sql`SELECT COUNT(*)::int AS n FROM vehicles`;
      if (vc[0].n === 0) {
        for (const v of INITIAL_VEHICLES) {
          await sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
            VALUES (${v.id}, ${v.placa}, ${v.grupo}, ${v.marca}, ${v.modelo}, ${v.ano}, ${v.cor}, ${v.hodometro}, ${v.status}, ${v.combustivel}, ${v.capacidade})`;
        }
      }
      const uc = await sql`SELECT COUNT(*)::int AS n FROM users`;
      if (uc[0].n === 0) {
        for (const u of INITIAL_USERS) {
          await sql`INSERT INTO users (id, nome, usuario, senha, role, ativo)
            VALUES (${u.id}, ${u.nome}, ${u.usuario}, ${u.senha}, ${u.role}, ${u.ativo})`;
        }
      }
    })().catch((e) => { neonInitPromise = null; throw e; });
  }
  return neonInitPromise;
}

// ---------- Modo arquivo (data/db.json) ----------

let dbFile = null;
function loadFile() {
  if (dbFile) return dbFile;
  if (!fs.existsSync(DATA_DIR)) { try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {} }
  if (!fs.existsSync(DB_FILE)) {
    const initial = { vehicles: INITIAL_VEHICLES, users: INITIAL_USERS, oil_changes: [], manutencoes: [] };
    try { fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2)); } catch {}
    dbFile = initial;
    return dbFile;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!Array.isArray(data.vehicles) || data.vehicles.length === 0) data.vehicles = INITIAL_VEHICLES;
    if (!Array.isArray(data.users)) data.users = INITIAL_USERS;
    if (!Array.isArray(data.oil_changes)) data.oil_changes = [];
    // Migração única do modo arquivo: trocas de óleo antigas viram manutenções.
    if (!Array.isArray(data.manutencoes)) {
      data.manutencoes = (data.oil_changes || []).map((c) => ({
        id: Number(c.id),
        vehicle_id: c.vehicle_id ?? c.veiculo_id ?? null,
        veiculo_id: c.vehicle_id ?? c.veiculo_id ?? null,
        placa: c.placa || null,
        tipo: 'TROCA DE ÓLEO',
        data: dateOnly(c.data ?? c.data_troca),
        data_saida: null,
        hodometro: c.hodometro ?? null,
        proxima_manutencao: null,
        servico: 'Troca de óleo',
        itens: null,
        oficina: null,
        custo: null,
        status_os: 'CONCLUÍDA',
        tipo_oleo: c.tipo_oleo || c.oleo || null,
        quantidade: c.quantidade ?? null,
        observacoes: c.observacoes || null,
        created_at: c.created_at || new Date().toISOString()
      }));
    }
    dbFile = data;
  } catch {
    dbFile = { vehicles: INITIAL_VEHICLES, users: INITIAL_USERS, oil_changes: [], manutencoes: [] };
  }
  return dbFile;
}
function saveFile() {
  // Na Vercel o filesystem é somente leitura: a falha é ignorada.
  try { fs.writeFileSync(DB_FILE, JSON.stringify(dbFile, null, 2)); } catch {}
}

// ---------- Operações unificadas ----------

const V_COLS = 'id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade';
const MAN_COLS = 'id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// ============================================================
// Manutenções (ordens de serviço) — a Troca de Óleo é um tipo
// ============================================================

const MAN_TIPOS = ['PREVENTIVA', 'CORRETIVA', 'EMERGENCIAL', 'REVISÃO', 'RECALL', 'TROCA DE ÓLEO'];
const MAN_STATUS = ['EM ANDAMENTO', 'CONCLUÍDA', 'AGUARDANDO PEÇA', 'CANCELADA'];

function manutencaoData(body) {
  body = body || {};
  const vehicleId = intOrNull(body.vehicle_id ?? body.veiculo_id ?? body.vehicleId ?? body.veiculoId);
  const placa = String(body.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || null;
  const rawTipo = String(body.tipo || '').trim().toUpperCase();
  const tipo = MAN_TIPOS.includes(rawTipo) ? rawTipo : 'PREVENTIVA';
  const data = dateOnly(body.data ?? body.data_entrada ?? body.data_troca ?? body.date) || todayISO();
  const dataSaida = dateOnly(body.data_saida ?? body.dataSaida);
  const hodometro = intOrNull(body.hodometro ?? body.km ?? body.mileage);
  const proxima = intOrNull(body.proxima_manutencao ?? body.proximaManutencao ?? body.proxima);
  const servico = body.servico ?? body.descricao ?? null;
  const itens = body.itens ?? body.pecas ?? null;
  const oficina = body.oficina ?? body.responsavel ?? null;
  const custo = numberOrNull(body.custo ?? body.valor ?? body.cost);
  const rawStatus = String(body.status_os ?? body.statusOs ?? 'CONCLUÍDA').trim().toUpperCase();
  const statusOs = MAN_STATUS.includes(rawStatus) ? rawStatus : 'CONCLUÍDA';
  const tipoOleo = String(body.tipo_oleo ?? body.oleo ?? '').trim().toUpperCase() || null;
  const quantidade = numberOrNull(body.quantidade ?? body.litros ?? body.quantity);
  const observacoes = body.observacoes ?? body.observacao ?? body.notes ?? null;
  return {
    vehicle_id: vehicleId,
    veiculo_id: vehicleId,
    placa,
    tipo,
    data,
    data_entrada: data,
    data_saida: dataSaida,
    hodometro,
    proxima_manutencao: proxima,
    servico: servico ? String(servico).trim() : null,
    itens: itens ? String(itens).trim() : null,
    oficina: oficina ? String(oficina).trim() : null,
    custo,
    status_os: statusOs,
    tipo_oleo: tipoOleo,
    oleo: tipoOleo,
    quantidade,
    observacoes: observacoes ? String(observacoes).trim() : null
  };
}

function publicManutencao(row) {
  if (!row) return null;
  const vehicleId = row.vehicle_id ?? row.veiculo_id;
  const data = dateOnly(row.data ?? row.data_troca);
  const tipoOleo = row.tipo_oleo || row.oleo || null;
  return {
    id: Number(row.id),
    vehicle_id: vehicleId === null || vehicleId === undefined ? null : Number(vehicleId),
    veiculo_id: vehicleId === null || vehicleId === undefined ? null : Number(vehicleId),
    placa: row.placa || null,
    tipo: row.tipo || null,
    data,
    data_entrada: data,
    data_saida: dateOnly(row.data_saida),
    hodometro: numberOrNull(row.hodometro),
    proxima_manutencao: numberOrNull(row.proxima_manutencao),
    servico: row.servico || null,
    itens: row.itens || null,
    oficina: row.oficina || null,
    custo: numberOrNull(row.custo),
    status_os: row.status_os || null,
    tipo_oleo: tipoOleo,
    oleo: tipoOleo,
    quantidade: numberOrNull(row.quantidade),
    observacoes: row.observacoes || null,
    created_at: row.created_at || null
  };
}

function manutencaoMatches(item, filters) {
  const data = item.data || '';
  const month = String(filters.mes ?? filters.month ?? '').replace(/[^0-9]/g, '');
  const year = String(filters.ano ?? filters.year ?? '').replace(/[^0-9]/g, '');
  if (month && data.slice(5, 7) !== month.padStart(2, '0')) return false;
  if (year && data.slice(0, 4) !== year) return false;
  if (filters.tipo && String(item.tipo || '').toUpperCase() !== String(filters.tipo).toUpperCase()) return false;
  if (filters.status_os && String(item.status_os || '').toUpperCase() !== String(filters.status_os).toUpperCase()) return false;
  const vehicleId = filters.vehicle_id ?? filters.veiculo_id;
  if (vehicleId && Number(item.vehicle_id) !== Number(vehicleId)) return false;
  if (filters.placa && !String(item.placa || '').toLowerCase().includes(String(filters.placa).toLowerCase())) return false;
  const search = filters.q || filters.busca;
  if (search) {
    const haystack = `${item.placa || ''} ${item.servico || ''} ${item.tipo_oleo || ''} ${item.oficina || ''} ${item.observacoes || ''}`.toLowerCase();
    if (!haystack.includes(String(search).toLowerCase())) return false;
  }
  return true;
}

async function listManutencoes(filters = {}) {
  let rows;
  if (sql) {
    await ensureNeon();
    rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
      FROM manutencoes ORDER BY data DESC NULLS LAST, id DESC`;
  } else {
    rows = loadFile().manutencoes || [];
  }
  return rows.map(publicManutencao).filter((item) => manutencaoMatches(item, filters));
}

async function completeManutencaoVehicle(data) {
  if ((data.vehicle_id && !data.placa) || (data.placa && !data.vehicle_id)) {
    const vehicles = await listVehicles();
    const found = vehicles.find((vehicle) =>
      (data.vehicle_id && Number(vehicle.id) === Number(data.vehicle_id)) ||
      (data.placa && String(vehicle.placa || '').toUpperCase() === data.placa)
    );
    if (found) {
      data.vehicle_id = Number(found.id);
      data.veiculo_id = Number(found.id);
      data.placa = String(found.placa || data.placa).toUpperCase();
    }
  }
  return data;
}

async function insertManutencao(body) {
  const data = await completeManutencaoVehicle(manutencaoData(body));
  if (!data.vehicle_id && !data.placa) {
    const error = new Error('Veículo é obrigatório.');
    error.statusCode = 400;
    throw error;
  }
  if (data.tipo === 'TROCA DE ÓLEO' && !data.servico) data.servico = 'Troca de óleo';
  if (data.tipo !== 'TROCA DE ÓLEO' && !data.servico) {
    const error = new Error('Serviço/descrição é obrigatório.');
    error.statusCode = 400;
    throw error;
  }
  if (sql) {
    await ensureNeon();
    const ids = await sql`SELECT COALESCE(MAX(id), 0) + 1 AS nid FROM manutencoes`;
    const id = Number(ids[0].nid);
    await sql`INSERT INTO manutencoes
      (id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes)
      VALUES (${id}, ${data.vehicle_id}, ${data.veiculo_id}, ${data.placa}, ${data.tipo}, ${data.data}, ${data.data_saida},
        ${data.hodometro}, ${data.proxima_manutencao}, ${data.servico}, ${data.itens}, ${data.oficina}, ${data.custo},
        ${data.status_os}, ${data.tipo_oleo}, ${data.quantidade}, ${data.observacoes})`;
    const rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
      FROM manutencoes WHERE id = ${id}`;
    return publicManutencao(rows[0]);
  }
  const arr = loadFile().manutencoes;
  const item = { id: nextId(arr), ...data, created_at: new Date().toISOString() };
  arr.push(item);
  saveFile();
  return publicManutencao(item);
}

async function updateManutencao(id, body) {
  let current;
  if (sql) {
    await ensureNeon();
    const rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
      FROM manutencoes WHERE id = ${id}`;
    current = rows[0];
  } else {
    current = (loadFile().manutencoes || []).find((item) => Number(item.id) === Number(id));
  }
  if (!current) return null;
  const merged = await completeManutencaoVehicle(manutencaoData({ ...current, ...(body || {}) }));
  if (!merged.vehicle_id && !merged.placa) {
    const error = new Error('Veículo é obrigatório.');
    error.statusCode = 400;
    throw error;
  }
  if (merged.tipo === 'TROCA DE ÓLEO' && !merged.servico) merged.servico = 'Troca de óleo';
  if (merged.tipo !== 'TROCA DE ÓLEO' && !merged.servico) {
    const error = new Error('Serviço/descrição é obrigatório.');
    error.statusCode = 400;
    throw error;
  }
  if (sql) {
    await sql`UPDATE manutencoes SET
      vehicle_id = ${merged.vehicle_id}, veiculo_id = ${merged.veiculo_id}, placa = ${merged.placa},
      tipo = ${merged.tipo}, data = ${merged.data}, data_saida = ${merged.data_saida},
      hodometro = ${merged.hodometro}, proxima_manutencao = ${merged.proxima_manutencao},
      servico = ${merged.servico}, itens = ${merged.itens}, oficina = ${merged.oficina}, custo = ${merged.custo},
      status_os = ${merged.status_os}, tipo_oleo = ${merged.tipo_oleo}, quantidade = ${merged.quantidade}, observacoes = ${merged.observacoes}
      WHERE id = ${id}`;
    const rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
      FROM manutencoes WHERE id = ${id}`;
    return publicManutencao(rows[0]);
  }
  const arr = loadFile().manutencoes;
  const index = arr.findIndex((item) => Number(item.id) === Number(id));
  arr[index] = { ...arr[index], ...merged, id: arr[index].id };
  saveFile();
  return publicManutencao(arr[index]);
}

async function deleteManutencao(id) {
  if (sql) {
    await ensureNeon();
    const rows = await sql`DELETE FROM manutencoes WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
  const arr = loadFile().manutencoes;
  const index = arr.findIndex((item) => Number(item.id) === Number(id));
  if (index === -1) return false;
  arr.splice(index, 1);
  saveFile();
  return true;
}

// ---------- Compatibilidade: Troca de Óleo (alias sobre manutenções) ----------
const listOilChanges = (filters = {}) => listManutencoes({ ...filters, tipo: 'TROCA DE ÓLEO' });
const insertOilChange = (body) => insertManutencao({ ...(body || {}), tipo: 'TROCA DE ÓLEO' });
const updateOilChange = (id, body) => updateManutencao(id, { ...(body || {}), tipo: 'TROCA DE ÓLEO' });
const deleteOilChange = deleteManutencao;

async function monthlyOilReport(filters = {}) {
  const now = new Date();
  const mes = String(filters.mes ?? filters.month ?? now.getUTCMonth() + 1).padStart(2, '0');
  const ano = String(filters.ano ?? filters.year ?? now.getUTCFullYear());
  const items = await listManutencoes({ ...filters, tipo: 'TROCA DE ÓLEO', mes, ano });
  const porVeiculo = {};
  for (const item of items) {
    const key = item.placa || `Veículo ${item.vehicle_id || 'sem identificação'}`;
    if (!porVeiculo[key]) porVeiculo[key] = { placa: item.placa, vehicle_id: item.vehicle_id, total: 0, quantidade: 0 };
    porVeiculo[key].total += 1;
    porVeiculo[key].quantidade += Number(item.quantidade || 0);
  }
  return {
    mes,
    ano,
    periodo: `${ano}-${mes}`,
    total: items.length,
    total_trocas: items.length,
    total_quantidade: items.reduce((sum, item) => sum + Number(item.quantidade || 0), 0),
    por_veiculo: Object.values(porVeiculo),
    trocas: items
  };
}

async function listVehicles() {
  if (sql) {
    await ensureNeon();
    return sql`SELECT id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade FROM vehicles ORDER BY id`;
  }
  return loadFile().vehicles;
}

async function listUsers() {
  if (sql) {
    await ensureNeon();
    return sql`SELECT id, nome, usuario, senha, role, ativo FROM users ORDER BY id`;
  }
  return loadFile().users || [];
}

function sanitizeVehicle(b) {
  b = b || {};
  return {
    placa: String(b.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8),
    grupo: String(b.grupo || '').trim().toUpperCase(),
    marca: b.marca ? String(b.marca) : null,
    modelo: b.modelo ? String(b.modelo) : null,
    ano: intOrNull(b.ano),
    cor: b.cor ? String(b.cor).toUpperCase() : null,
    hodometro: intOrNull(b.hodometro) ?? 0,
    status: String(b.status || 'ATIVO').toUpperCase(),
    combustivel: b.combustivel ? String(b.combustivel).toUpperCase() : null,
    capacidade: intOrNull(b.capacidade)
  };
}

async function insertVehicle(body) {
  const d = sanitizeVehicle(body);
  if (!d.placa) { const e = new Error('Placa é obrigatória.'); e.statusCode = 400; throw e; }
  if (sql) {
    await ensureNeon();
    const rows = await sql`SELECT COALESCE(MAX(id), 0) + 1 AS nid FROM vehicles`;
    const nid = rows[0].nid;
    await sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
      VALUES (${nid}, ${d.placa}, ${d.grupo}, ${d.marca}, ${d.modelo}, ${d.ano}, ${d.cor}, ${d.hodometro}, ${d.status}, ${d.combustivel}, ${d.capacidade})`;
    return { id: nid, ...d };
  }
  const arr = loadFile().vehicles;
  const novo = { id: nextId(arr), ...d };
  arr.push(novo);
  saveFile();
  return novo;
}

async function updateVehicle(id, body) {
  body = body || {};
  // PATCH parcial: só altera os campos enviados
  const sets = {};
  if (body.placa !== undefined) sets.placa = String(body.placa).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (body.grupo !== undefined) sets.grupo = String(body.grupo).trim().toUpperCase();
  if (body.marca !== undefined) sets.marca = body.marca ? String(body.marca) : null;
  if (body.modelo !== undefined) sets.modelo = body.modelo ? String(body.modelo) : null;
  if (body.ano !== undefined) sets.ano = intOrNull(body.ano);
  if (body.cor !== undefined) sets.cor = body.cor ? String(body.cor).toUpperCase() : null;
  if (body.hodometro !== undefined) sets.hodometro = intOrNull(body.hodometro) ?? 0;
  if (body.status !== undefined) sets.status = String(body.status || 'ATIVO').toUpperCase();
  if (body.combustivel !== undefined) sets.combustivel = body.combustivel ? String(body.combustivel).toUpperCase() : null;
  if (body.capacidade !== undefined) sets.capacidade = intOrNull(body.capacidade);
  if (sql) {
    await ensureNeon();
    const cur = await sql`SELECT id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade FROM vehicles WHERE id = ${id}`;
    if (cur.length === 0) return null;
    const m = { ...cur[0], ...sets };
    await sql`UPDATE vehicles SET
      placa = ${m.placa}, grupo = ${m.grupo}, marca = ${m.marca}, modelo = ${m.modelo},
      ano = ${m.ano}, cor = ${m.cor}, hodometro = ${m.hodometro},
      status = ${m.status}, combustivel = ${m.combustivel}, capacidade = ${m.capacidade}
      WHERE id = ${id}`;
    return m;
  }
  const arr = loadFile().vehicles;
  const idx = arr.findIndex((v) => Number(v.id) === Number(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...sets, id: arr[idx].id };
  saveFile();
  return arr[idx];
}

async function deleteVehicle(id) {
  if (sql) {
    await ensureNeon();
    const rows = await sql`DELETE FROM vehicles WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
  const arr = loadFile().vehicles;
  const idx = arr.findIndex((v) => Number(v.id) === Number(id));
  if (idx === -1) return false;
  arr.splice(idx, 1);
  saveFile();
  return true;
}

async function seedVehicles() {
  if (sql) {
    await ensureNeon();
    await sql`DELETE FROM vehicles`;
    for (const v of INITIAL_VEHICLES) {
      await sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
        VALUES (${v.id}, ${v.placa}, ${v.grupo}, ${v.marca}, ${v.modelo}, ${v.ano}, ${v.cor}, ${v.hodometro}, ${v.status}, ${v.combustivel}, ${v.capacidade})`;
    }
    return true;
  }
  loadFile().vehicles = INITIAL_VEHICLES.map((v) => ({ ...v }));
  saveFile();
  return true;
}

async function insertUser(body) {
  body = body || {};
  const u = {
    nome: String(body.nome || '').trim(),
    usuario: String(body.usuario || '').trim(),
    senha: String(body.senha || ''),
    role: String(body.role || 'user'),
    ativo: body.ativo === undefined ? 1 : intOrNull(body.ativo) ?? 1
  };
  if (!u.nome || !u.usuario || !u.senha) { const e = new Error('Nome, usuário e senha são obrigatórios.'); e.statusCode = 400; throw e; }
  if (sql) {
    await ensureNeon();
    const rows = await sql`SELECT COALESCE(MAX(id), 0) + 1 AS nid FROM users`;
    const nid = rows[0].nid;
    await sql`INSERT INTO users (id, nome, usuario, senha, role, ativo) VALUES (${nid}, ${u.nome}, ${u.usuario}, ${u.senha}, ${u.role}, ${u.ativo})`;
    return { id: nid, nome: u.nome, usuario: u.usuario, role: u.role, ativo: u.ativo };
  }
  const arr = loadFile().users;
  const novo = { id: nextId(arr), ...u };
  arr.push(novo);
  saveFile();
  const { senha, ...pub } = novo;
  return pub;
}

async function updateUser(id, body) {
  body = body || {};
  if (sql) {
    await ensureNeon();
    const cur = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (cur.length === 0) return null;
    const m = { ...cur[0], ...body, id };
    await sql`UPDATE users SET nome = ${m.nome}, usuario = ${m.usuario}, senha = ${m.senha}, role = ${m.role}, ativo = ${m.ativo} WHERE id = ${id}`;
    return { id: m.id, nome: m.nome, usuario: m.usuario, role: m.role, ativo: m.ativo };
  }
  const arr = loadFile().users;
  const idx = arr.findIndex((x) => Number(x.id) === Number(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...body, id: arr[idx].id };
  saveFile();
  const { senha, ...pub } = arr[idx];
  return pub;
}

async function deleteUser(id) {
  if (sql) {
    await ensureNeon();
    const rows = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
  const arr = loadFile().users;
  const idx = arr.findIndex((x) => Number(x.id) === Number(id));
  if (idx === -1) return false;
  arr.splice(idx, 1);
  saveFile();
  return true;
}

async function checkLogin(usuario, senhaPlain) {
  const u = String(usuario || '').trim();
  const p = String(senhaPlain || '');
  if (!u || !p) return null;
  const h = sha256(p);
  const users = await listUsers();
  const found = users.find((x) =>
    String(x.usuario).toLowerCase() === u.toLowerCase() &&
    Number(x.ativo) === 1 &&
    (x.senha === h || x.senha === p || (u.toLowerCase() === 'admin' && (p === 'admin' || p === 'admin2025') && (x.senha === LEGACY_ADMIN_HASH || x.senha === sha256('admin2025'))))
  );
  if (!found) return null;
  return { id: found.id, nome: found.nome, usuario: found.usuario, role: found.role };
}

function stripSenha(u) { if (!u) return u; const { senha, ...pub } = u; return pub; }

// ============================================================
// HTTP
// ============================================================

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}
function parseBody(req) {
  return new Promise((ok, fail) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { ok(body ? JSON.parse(body) : {}); } catch (e) { fail(e); } });
    req.on('error', fail);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;
  const query = Object.fromEntries(requestUrl.searchParams.entries());

  try {
    if (pathname.startsWith('/api/')) {
      const parts = pathname.replace('/api/', '').split('/');
      const resource = parts[0], id = parts[1] ? parseInt(parts[1], 10) : null;

      if (resource === 'status') {
        const vehicles = await listVehicles();
        const manutencoes = await listManutencoes();
        return json(res, 200, { online: true, version: VERSION, db: sql ? 'neon' : 'file', counts: { vehicles: vehicles.length, manutencoes: manutencoes.length, trocas_oleo: manutencoes.filter((m) => m.tipo === 'TROCA DE ÓLEO').length } });
      }
      if (resource === 'data' && req.method === 'GET') {
        return json(res, 200, { vehicles: await listVehicles(), users: (await listUsers()).map(stripSenha) });
      }
      if (resource === 'seed' && req.method === 'POST') {
        await seedVehicles();
        return json(res, 200, { success: true });
      }
      if (resource === 'login' && req.method === 'POST') {
        const body = await parseBody(req);
        const user = await checkLogin(body.usuario, body.senha);
        if (!user) return json(res, 401, { error: 'Usuário ou senha incorretos.' });
        return json(res, 200, user);
      }

      if (resource === 'trocas-oleo' || resource === 'oil-changes') {
        if (req.method === 'GET' && (parts[1] === 'relatorio' || parts[1] === 'relatorio-mensal')) {
          return json(res, 200, await monthlyOilReport(query));
        }
        if (req.method === 'GET' && !id) return json(res, 200, await listOilChanges(query));
        if (req.method === 'GET' && id) {
          const all = await listOilChanges();
          const item = all.find((change) => Number(change.id) === id);
          return item ? json(res, 200, item) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'POST') return json(res, 201, await insertOilChange(await parseBody(req)));
        if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
          const upd = await updateOilChange(id, await parseBody(req));
          return upd ? json(res, 200, upd) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'DELETE' && id) {
          return (await deleteOilChange(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'relatorio-mensal' && req.method === 'GET') {
        return json(res, 200, await monthlyOilReport(query));
      }

      if (resource === 'manutencoes' || resource === 'manutencao') {
        if (req.method === 'GET' && !id) return json(res, 200, await listManutencoes(query));
        if (req.method === 'GET' && id) {
          const all = await listManutencoes();
          const item = all.find((m) => Number(m.id) === id);
          return item ? json(res, 200, item) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'POST') return json(res, 201, await insertManutencao(await parseBody(req)));
        if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
          const upd = await updateManutencao(id, await parseBody(req));
          return upd ? json(res, 200, upd) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'DELETE' && id) {
          return (await deleteManutencao(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'vehicles') {
        if (req.method === 'GET' && !id) return json(res, 200, await listVehicles());
        if (req.method === 'GET' && id) {
          const all = await listVehicles();
          const it = all.find((v) => Number(v.id) === id);
          return it ? json(res, 200, it) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'POST') return json(res, 201, await insertVehicle(await parseBody(req)));
        if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
          const upd = await updateVehicle(id, await parseBody(req));
          return upd ? json(res, 200, upd) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'DELETE' && id) {
          return (await deleteVehicle(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'users') {
        if (req.method === 'GET' && !id) return json(res, 200, (await listUsers()).map(stripSenha));
        if (req.method === 'GET' && id) {
          const all = await listUsers();
          const it = all.find((x) => Number(x.id) === id);
          return it ? json(res, 200, stripSenha(it)) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'POST') return json(res, 201, await insertUser(await parseBody(req)));
        if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
          const upd = await updateUser(id, await parseBody(req));
          return upd ? json(res, 200, upd) : json(res, 404, { error: 'Not found' });
        }
        if (req.method === 'DELETE' && id) {
          return (await deleteUser(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      return json(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    const code = e.statusCode || 500;
    if (code === 500) console.error('[API] Erro interno:', e);
    return json(res, code, { error: code === 500 ? 'Erro interno no servidor.' : e.message });
  }

  // ---------- Arquivos estáticos ----------
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) filePath = path.join(__dirname, 'index.html');
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' };
    fs.readFile(filePath, (e, content) => {
      if (e) { res.writeHead(500); return res.end('Error'); }
      res.writeHead(200, headers); res.end(content);
    });
  });
});

// Execução local: node server.js
if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(` FROTA PRO v${VERSION} — http://${HOST}:${PORT} — banco: ${sql ? 'Neon (Postgres)' : 'arquivo local'}`));
}

// Exporta o handler para execução serverless (Vercel)
module.exports = (req, res) => server.emit('request', req, res);
