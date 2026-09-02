// Vercel Serverless API + Neon PostgreSQL
// Mantém a mesma API REST utilizada pelo front-end local.
const { neon } = require('@neondatabase/serverless');
const initialData = require('../data/db.json');

const COLLECTIONS = ['vehicles', 'fueling', 'maintenance', 'km_records', 'drivers', 'users'];
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;

let schemaPromise;
let seedPromise;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
}

function getPath(req) {
  return new URL(req.url || '/', 'http://localhost').pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean);
}

function asRecord(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: Number(row.id),
    created_at: row.created_at
  };
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

async function ensureSchema() {
  if (!sql) throw new Error('DATABASE_URL não configurada na Vercel.');
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS frota_records (
          id BIGSERIAL PRIMARY KEY,
          resource TEXT NOT NULL CHECK (resource IN ('vehicles', 'fueling', 'maintenance', 'km_records', 'drivers', 'users')),
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_frota_records_resource ON frota_records (resource)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_frota_records_resource_id ON frota_records (resource, id)`;
    })().catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function ensureSeeded() {
  await ensureSchema();
  if (!seedPromise) {
    seedPromise = (async () => {
      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM frota_records`;
      if (Number(count) > 0) return;

      // O marcador evita que duas requisições iniciais insiram o catálogo em duplicidade.
      await sql`
        CREATE TABLE IF NOT EXISTS frota_meta (
          key TEXT PRIMARY KEY,
          value TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const claimed = await sql`
        INSERT INTO frota_meta (key, value)
        VALUES ('initial-seed', 'running')
        ON CONFLICT (key) DO NOTHING
        RETURNING key
      `;
      if (!claimed.length) return;

      for (const resource of COLLECTIONS) {
        const rows = Array.isArray(initialData[resource]) ? initialData[resource] : [];
        for (const row of rows) {
          const data = { ...row };
          delete data.id;
          delete data.created_at;
          await sql`
            INSERT INTO frota_records (resource, data)
            VALUES (${resource}, ${JSON.stringify(data)}::jsonb)
          `;
        }
      }
    })().catch(error => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function getCollection(resource) {
  const rows = await sql`
    SELECT id, data, created_at
    FROM frota_records
    WHERE resource = ${resource}
    ORDER BY id
  `;
  return rows.map(asRecord);
}

async function getOne(resource, id) {
  const rows = await sql`
    SELECT id, data, created_at
    FROM frota_records
    WHERE resource = ${resource} AND id = ${id}
    LIMIT 1
  `;
  return rows[0] ? asRecord(rows[0]) : null;
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  if (!sql) return send(res, 503, {
    online: false,
    error: 'Banco de dados não configurado. Adicione DATABASE_URL nas variáveis da Vercel.'
  });

  const parts = getPath(req);
  const resource = parts[0];
  const id = parts[1] ? Number(parts[1]) : null;

  if (parts.length > 2 || (parts[1] && !Number.isInteger(id))) {
    return send(res, 400, { error: 'Rota inválida.' });
  }

  try {
    await ensureSeeded();

    if (resource === 'status' && req.method === 'GET') {
      const counts = await sql`
        SELECT resource, COUNT(*)::int AS count
        FROM frota_records
        GROUP BY resource
      `;
      const result = Object.fromEntries(COLLECTIONS.map(name => [name, 0]));
      counts.forEach(row => { result[row.resource] = Number(row.count); });
      return send(res, 200, {
        online: true,
        mode: 'neon',
        version: '3.1',
        name: 'Frota Pro — Complexo Penal de Marília',
        counts: result
      });
    }

    if (resource === 'data' && req.method === 'GET') {
      const collections = await Promise.all(COLLECTIONS.map(getCollection));
      return send(res, 200, Object.fromEntries(COLLECTIONS.map((name, index) => [name, collections[index]])));
    }

    if (resource === 'seed' && req.method === 'POST') {
      await sql`DELETE FROM frota_records WHERE resource = 'vehicles'`;
      const rows = Array.isArray(initialData.vehicles) ? initialData.vehicles : [];
      for (const row of rows) {
        const data = { ...row };
        delete data.id;
        delete data.created_at;
        await sql`
          INSERT INTO frota_records (resource, data)
          VALUES ('vehicles', ${JSON.stringify(data)}::jsonb)
        `;
      }
      return send(res, 200, { success: true, message: '29 veículos restaurados com sucesso' });
    }

    if (!COLLECTIONS.includes(resource)) {
      return send(res, 404, { error: `Recurso '${resource || ''}' não encontrado.` });
    }

    if (req.method === 'GET' && id === null) {
      return send(res, 200, await getCollection(resource));
    }

    if (req.method === 'GET' && id !== null) {
      const row = await getOne(resource, id);
      return row ? send(res, 200, row) : send(res, 404, { error: 'Registro não encontrado' });
    }

    if (req.method === 'POST' && id === null) {
      const body = await readBody(req);
      const data = { ...(body || {}) };
      delete data.id;
      delete data.created_at;
      const rows = await sql`
        INSERT INTO frota_records (resource, data)
        VALUES (${resource}, ${JSON.stringify(data)}::jsonb)
        RETURNING id, data, created_at
      `;
      return send(res, 201, asRecord(rows[0]));
    }

    if ((req.method === 'PATCH' || req.method === 'PUT') && id !== null) {
      const current = await getOne(resource, id);
      if (!current) return send(res, 404, { error: 'Registro não encontrado' });
      const body = await readBody(req);
      const data = { ...current, ...(body || {}) };
      delete data.id;
      delete data.created_at;
      const rows = await sql`
        UPDATE frota_records
        SET data = ${JSON.stringify(data)}::jsonb
        WHERE resource = ${resource} AND id = ${id}
        RETURNING id, data, created_at
      `;
      return send(res, 200, asRecord(rows[0]));
    }

    if (req.method === 'DELETE' && id !== null) {
      const rows = await sql`
        DELETE FROM frota_records
        WHERE resource = ${resource} AND id = ${id}
        RETURNING id
      `;
      return rows.length ? send(res, 200, { success: true }) : send(res, 404, { error: 'Registro não encontrado' });
    }

    return send(res, 405, { error: 'Método não suportado' });
  } catch (error) {
    console.error('Neon API error:', error);
    return send(res, 500, { error: 'Erro ao acessar o banco de dados.' });
  }
}

module.exports = handle;
