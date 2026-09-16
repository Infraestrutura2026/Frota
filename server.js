'use strict';

// ============================================================
// FROTA PRO v3.8.8 — Controle de Frota (grupos S2, S3 e S4)
// Servidor Node nativo: API REST + arquivos estáticos.
//
// Persistência:
//  • DATABASE_URL definida  → Neon (Postgres) — produção/Vercel
//  • DATABASE_URL ausente   → data/db.json (modo local/dev)
// Tabelas criadas automaticamente + seed na primeira chamada.
//
// v3.8 — anti-cache da API: toda resposta JSON sai com
// Cache-Control: no-store para nenhuma camada intermediária
// (CDN/proxy/browser) servir resposta velha da API. O front
// ainda acrescenta ?_t=<timestamp> em cada chamada.
//
// v3.8.1 — GET /api/echo: a função devolve exatamente o que RECEBEU
// da rede (path, método, host, cabeçalhos de proxy). Serve para flagrar
// rede que altera a requisição no caminho — proxy corporativo/firewall
// que troca POST por GET, reescreve o path, troca o Host, come o corpo
// ou injeta cabeçalhos. Se /api/echo não responder JSON da API, a
// resposta está vindo de outra coisa (proxy, cache, firewall).
//
// v3.8.2 — correção de segurança no GET /api/echo: o endpoint é público
// (não pede login) e estava ecoando as credenciais que a própria Vercel
// injeta na requisição — `x-vercel-oidc-token` (JWT que autentica o
// projeto, validade de 2h), `x-vercel-proxy-signature` (Bearer) e a
// assinatura `sig=` dentro de `forwarded`. Qualquer pessoa que abrisse a
// URL levava a credencial do projeto. Agora: lista de redação ampliada,
// redação também pelo NOME do cabeçalho (token/signature/secret/senha…),
// `sig=` trocada dentro de `forwarded`, dump completo dos cabeçalhos só
// com `?completo=1` e a lista `campos_omitidos` para que omissão não seja
// confundida com ausência do cabeçalho.
//
// v3.8.3 — versão que acompanha a correção da exclusão perdida por 404 da
// plataforma. O sintoma, em produção: "Não foi possível excluir: Erro na API
// (HTTP 404) — The page could not be found NOT_FOUND gru1::... [cache MISS]".
// Esse corpo é a página NOT_FOUND da Vercel (HTML), não o JSON da API: a
// requisição nem chegava à função, mas o app tratava como erro definitivo e
// DESCARTAVA a exclusão. A correção está no front (js/app.js): rota
// alternativa /api/manutencao para qualquer método, distinção entre 404 da
// API (JSON) e 404 fora dela (HTML) e, no segundo caso, a exclusão é
// enfileirada em vez de perdida. O servidor não muda de comportamento.
//
// v3.8.4 — solução para manter o sistema SEMPRE online:
//  • Ponto de entrada api/index.js + reconfiguração de rewrites na Vercel
//    evitam que rotas da API caiam na página NOT_FOUND da plataforma.
//  • Resolução de pathname no server.js suporta cabeçalhos x-matched-path /
//    x-forwarded-url da Vercel e atende GET /api direto como status.
//  • Retentativa automática transparente em falhas transitórias de rede
//    ou despertar do banco Neon, impedindo falso status offline ao salvar.
//  • Heartbeat automático e sincronização em segundo plano das filas locais.
//
// v3.8.5 — edição SEMPRE online. A edição de um registro caía em modo offline
// quando o PATCH/PUT não chegava à função (proxy/firewall corporativo que só
// deixa passar GET e POST, respondendo 405/403) ou quando o id editado não
// existia no banco (registro criado no dispositivo enquanto estava offline —
// id local de timestamp > 1e11): a API devolvia 404, o front avisava "Sem
// conexão com a API" e o registro ia para a fila.
//  • Resolução de método (reqMethod): aceita o cabeçalho
//    `X-HTTP-Method-Override` e o parâmetro `?_method=`, permitindo que o front
//    mande POST onde PATCH/PUT/DELETE são bloqueados.
//  • As rotas de atualização (/api/manutencoes/:id, /api/vehicles/:id,
//    /api/trocas-oleo/:id) aceitam PATCH/PUT e também POST com id informado
//    (no path ou no corpo).
//  • updateManutencao e updateVehicle viram UPSERT: se o id não existir no
//    banco, o registro é GRAVADO em vez de devolver 404. Id local (>1e11) não
//    caberia na coluna INTEGER: o banco atribui o próximo id livre e o front
//    adota o id devolvido na resposta.
//
// v3.8.6 — exclusão SEMPRE online + usuários à prova de rede. A exclusão
// caía no mesmo buraco da edição: DELETE barrado pela rede (405/403 ou
// conexão derrubada) virava \"Sem conexão com a API\" e o registro voltava
// para a tela. Agora:
//  • front: DELETE também sai com X-HTTP-Method-Override e, ao receber
//    405/403 ou falha de rede, é repetido como POST + override — a API
//    executa a exclusão normalmente. Vale para manutenções, veículos e filas.
//  • API: /api/users/:id aceita POST com id (path ou corpo) como atualização
//    (upsert), igual a /api/vehicles e /api/manutencoes. DELETE via override
//    já funcionava, mas agora a rota de usuários também entra no mesmo padrão.
//  • insertUser / updateUser viram upsert com suporte a id fixo e id local
//    (>1e11), evitando \"duplicate key\" em corrida e permitindo que edições
//    offline sejam gravadas com id real depois.
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

const VERSION = '3.8.8';

// v3.8.5 — id local "de timestamp" (Date.now(), sempre > 1e11): registro criado
// no dispositivo enquanto a API estava fora do ar. Ele nunca existiu no banco e
// nem caberia na coluna INTEGER do Postgres (máximo 2.147.483.647), então
// consultá-lo só gastaria uma viagem ao Neon (e o Postgres devolveria
// "value out of range for type integer"). Serve também de critério de upsert:
// id assim = o registro precisa ser GRAVADO, não procurado.
const ID_TEMPORARIO_MIN = 1e11;
function idTemporarioLocal(id) {
  const n = Number(id);
  return !Number.isInteger(n) || n < 1 || n > ID_TEMPORARIO_MIN;
}

// v3.8.5 — método EFETIVO da requisição. Proxies corporativos, firewalls e
// gateways que só liberam GET/POST respondem 405/403 a PATCH/PUT/DELETE (e
// alguns reescrevem o método no caminho). Com o override, o front manda POST +
// `X-HTTP-Method-Override: PATCH` (ou `?_method=PATCH`) e a API executa a
// operação pedida. Só métodos conhecidos são aceitos: um valor inventado no
// cabeçalho é ignorado em favor do método real.
const METODOS_VALIDOS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
function primeiroValor(v) { return Array.isArray(v) ? v[0] : v; }
function resolveReqMethod(req, requestUrl) {
  const real = String((req && req.method) || 'GET').toUpperCase();
  const headers = (req && req.headers) || {};
  const doCabecalho = String(primeiroValor(headers['x-http-method-override']) || '').trim().toUpperCase();
  let doQuery = '';
  try {
    doQuery = String(primeiroValor(requestUrl.searchParams.get('_method')) || '').trim().toUpperCase();
  } catch (_) { /* URL sem searchParams: ignora */ }
  for (const candidato of [doCabecalho, doQuery]) {
    if (candidato && METODOS_VALIDOS.has(candidato)) return candidato;
  }
  return real;
}

// Id vindo do front: o campo pode chegar como número, string ou ausente.
function idDoCorpo(body) {
  if (!body || typeof body !== 'object') return null;
  const bruto = body.id ?? body._id;
  if (bruto === null || bruto === undefined || bruto === '') return null;
  const n = Number(bruto);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Tempo máximo de UMA ida ao banco. O driver da Neon fala por HTTP (cada query =
// 1 fetch) e não tem timeout próprio: com o banco suspenso/lento, a função ficava
// pendurada até a Vercel matá-la e devolver uma página HTML de erro — que o front
// mostrava como o críptico "Erro na API", sem dizer nada. Com o limite, a API
// responde JSON 504 e o app enfileira o registro para sincronizar depois.
const NEON_QUERY_TIMEOUT_MS = 20000;

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

// Senhas são gravadas como SHA-256. Um valor que já é um hash de 64 hex é preservado,
// para não "hashear o hash" quando a API é usada para editar um usuário sem trocar a senha.
function hashSenha(s) {
  const t = String(s == null ? '' : s).trim();
  if (!t) return '';
  return /^[0-9a-f]{64}$/i.test(t) ? t.toLowerCase() : sha256(t);
}

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
  const { neon, neonConfig } = require('@neondatabase/serverless');
  const baseFetch = neonConfig.fetchFunction || fetch;
  neonConfig.fetchFunction = async (url, opts) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NEON_QUERY_TIMEOUT_MS);
    try {
      return await baseFetch(url, { ...(opts || {}), signal: ctrl.signal });
    } catch (e) {
      if (e && (e.name === 'AbortError' || /abort/i.test(String((e && e.message) || e)))) {
        const err = new Error('Tempo esgotado ao falar com o banco de dados. Tente novamente.');
        err.statusCode = 504;
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };
  sql = neon(DATABASE_URL);
}

// ---------- Modo Neon (Postgres) ----------

let neonInitPromise = null;

// Estrutura da tabela de manutenções (ordens de serviço). Os ALTER TABLE abaixo são
// o ponto importante: CREATE TABLE IF NOT EXISTS nunca acrescenta colunas a uma tabela
// que já existe no banco. Em um Neon criado por uma versão anterior do app, o INSERT
// passava a referenciar colunas inexistentes e todo salvamento de manutenção virava
// erro 500. O "ADD COLUMN IF NOT EXISTS" auto-cura o banco na primeira chamada.
const MANUT_SCHEMA = `CREATE TABLE IF NOT EXISTS manutencoes (
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
const MANUT_HEAL = `ALTER TABLE manutencoes
  ADD COLUMN IF NOT EXISTS vehicle_id INTEGER,
  ADD COLUMN IF NOT EXISTS veiculo_id INTEGER,
  ADD COLUMN IF NOT EXISTS placa TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT,
  ADD COLUMN IF NOT EXISTS data DATE,
  ADD COLUMN IF NOT EXISTS data_saida DATE,
  ADD COLUMN IF NOT EXISTS hodometro INTEGER,
  ADD COLUMN IF NOT EXISTS proxima_manutencao INTEGER,
  ADD COLUMN IF NOT EXISTS servico TEXT,
  ADD COLUMN IF NOT EXISTS itens TEXT,
  ADD COLUMN IF NOT EXISTS oficina TEXT,
  ADD COLUMN IF NOT EXISTS custo NUMERIC,
  ADD COLUMN IF NOT EXISTS status_os TEXT,
  ADD COLUMN IF NOT EXISTS tipo_oleo TEXT,
  ADD COLUMN IF NOT EXISTS quantidade NUMERIC,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;

async function ensureNeon() {
  if (!neonInitPromise) {
    neonInitPromise = (async () => {
      // 1) Estrutura. Os statements são independentes entre si e rodam em PARALELO:
      //    numa função serverless fria, cada await é uma viagem HTTP até o Neon
      //    (~100–300 ms cada, mais a retomada do banco suspenso). Em série, o cold
      //    start somava segundos e estourava o tempo máximo da função bem na hora de
      //    salvar — a Vercel matava a execução e devolvia HTML em vez de JSON.
      await Promise.all([
        sql`CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY,
          placa TEXT, grupo TEXT, marca TEXT, modelo TEXT,
          ano INTEGER, cor TEXT, hodometro INTEGER,
          status TEXT, combustivel TEXT, capacidade INTEGER,
          created_at TIMESTAMPTZ DEFAULT now()
        )`,
        sql`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          nome TEXT, usuario TEXT, senha TEXT, role TEXT, ativo INTEGER
        )`,
        // O módulo de Troca de Óleo é auto-inicializável. Os ALTER abaixo cobrem
        // bancos Neon criados por uma versão anterior do módulo.
        sql`CREATE TABLE IF NOT EXISTS oil_changes (
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
        )`,
        // Módulo Manutenção (ordens de serviço) — a Troca de Óleo é um tipo.
        sql.query(MANUT_SCHEMA),
        sql`CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT
        )`
      ]);

      // 2) Auto-cura da estrutura: acrescenta colunas que faltarem em bancos antigos.
      //    Cada ajuste é isolado: uma falha pontual não derruba a API inteira.
      await Promise.all([
        `ALTER TABLE oil_changes ADD COLUMN IF NOT EXISTS horimetro INTEGER`,
        MANUT_HEAL
      ].map((heal) =>
        sql.query(heal).catch((e) => {
          console.error('[API] Ajuste de estrutura ignorado:', reasonDaFalha(e));
        })
      ));

      // 3) Passos que NÃO podem impedir o salvamento: migração antiga e carga inicial.
      //    São independentes (tabelas distintas) e rodam em paralelo, cada um com
      //    seu próprio isolamento de falha.
      const migrateOil = (async () => {
        try {
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
        } catch (e) {
          console.error('[API] Migração oil_changes → manutencoes ignorada:', reasonDaFalha(e));
        }
      })();
      const seedInitial = (async () => {
        try {
          await seedNeonIfEmpty();
        } catch (e) {
          console.error('[API] Seed inicial ignorado:', reasonDaFalha(e));
        }
      })();
      await Promise.all([migrateOil, seedInitial]);
    })().catch((e) => { neonInitPromise = null; throw e; });
  }
  return neonInitPromise;
}

// Carga inicial (29 veículos + admin) apenas quando o banco está vazio.
// Feita em uma única instrução por tabela, com ON CONFLICT para repetir sem dano.
async function seedNeonIfEmpty() {
  // Contagens independentes rodam juntas (1 viagem em vez de 2 no cold start).
  const [vc, uc] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM vehicles`,
    sql`SELECT COUNT(*)::int AS n FROM users`
  ]);
  const jobs = [];
  if (Number(vc[0] && vc[0].n) === 0) {
    jobs.push(sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
      SELECT * FROM unnest(${INITIAL_VEHICLES.map((v) => v.id)}::int[], ${INITIAL_VEHICLES.map((v) => v.placa)}::text[],
        ${INITIAL_VEHICLES.map((v) => v.grupo)}::text[], ${INITIAL_VEHICLES.map((v) => v.marca)}::text[],
        ${INITIAL_VEHICLES.map((v) => v.modelo)}::text[], ${INITIAL_VEHICLES.map((v) => v.ano)}::int[],
        ${INITIAL_VEHICLES.map((v) => v.cor)}::text[], ${INITIAL_VEHICLES.map((v) => v.hodometro)}::int[],
        ${INITIAL_VEHICLES.map((v) => v.status)}::text[], ${INITIAL_VEHICLES.map((v) => v.combustivel)}::text[],
        ${INITIAL_VEHICLES.map((v) => v.capacidade)}::int[])
      ON CONFLICT (id) DO NOTHING`);
  }
  if (Number(uc[0] && uc[0].n) === 0) {
    jobs.push(sql`INSERT INTO users (id, nome, usuario, senha, role, ativo)
      SELECT * FROM unnest(${INITIAL_USERS.map((u) => u.id)}::int[], ${INITIAL_USERS.map((u) => u.nome)}::text[],
        ${INITIAL_USERS.map((u) => u.usuario)}::text[], ${INITIAL_USERS.map((u) => u.senha)}::text[],
        ${INITIAL_USERS.map((u) => u.role)}::text[], ${INITIAL_USERS.map((u) => u.ativo)}::int[])
      ON CONFLICT (id) DO NOTHING`);
  }
  await Promise.all(jobs);
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

// ---------- Ids sequenciais no Postgres ----------
// O app usa "MAX(id)+1" em vez de uma sequence. Dois computadores salvando no mesmo
// instante podiam calcular o mesmo id → "duplicate key value violates unique
// constraint" → o lançamento da manutenção virava erro. A colisão é refazida com o
// próximo id livre (é isso que retryDuplicateKey faz).
const ID_TABLES = new Set(['manutencoes', 'vehicles', 'users', 'oil_changes']);

async function nextRowId(table) {
  if (!ID_TABLES.has(table)) throw new Error(`Tabela não permitida: ${table}`);
  const rows = await sql.query(`SELECT COALESCE(MAX(id), 0) + 1 AS nid FROM ${table}`);
  const id = Number(rows && rows[0] && rows[0].nid);
  if (!Number.isInteger(id) || id < 1) throw new Error('Não foi possível obter o próximo id.');
  return id;
}

function isUniqueViolation(e) {
  const code = String((e && (e.code || e.sqlState)) || '');
  return code === '23505' || /duplicate key value/i.test(reasonDaFalha(e));
}

async function retryDuplicateKey(fn, tentativas = 8) {
  let lastError;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn(i);
    } catch (e) {
      lastError = e;
      if (!isUniqueViolation(e)) throw e;
      // Espera com jitter: com pausas determinísticas, salvamentos simultâneos de
      // computadores diferentes repetem a colisão em lockstep (todos recalculam o
      // mesmo MAX(id)+1 e tentam o mesmo id de novo ao mesmo tempo). A
      // aleatoriedade dessincroniza as tentativas e resolve o conflito.
      const espera = 50 * (i + 1) + Math.floor(Math.random() * 120);
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  throw lastError;
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

async function insertManutencao(body, idPreferido = null) {
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
  // v3.8.5 — id informado = o registro já tem lugar marcado no banco (edição de
  // algo que não estava lá). Um id local de timestamp (>1e11) NÃO serve: não
  // caberia na coluna INTEGER, então o banco atribui o próximo id livre e o
  // front passa a usar o id devolvido na resposta.
  const idFixo = idTemporarioLocal(idPreferido) ? null : Number(idPreferido);
  if (sql) {
    await ensureNeon();
    if (idFixo) {
      // Upsert pelo id: se outro computador gravou o mesmo registro entre a
      // consulta e o INSERT, o ON CONFLICT atualiza em vez de estourar
      // "duplicate key value violates unique constraint" na cara do usuário.
      const rows = await sql`INSERT INTO manutencoes
        (id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes)
        VALUES (${idFixo}, ${data.vehicle_id}, ${data.veiculo_id}, ${data.placa}, ${data.tipo}, ${data.data}, ${data.data_saida},
          ${data.hodometro}, ${data.proxima_manutencao}, ${data.servico}, ${data.itens}, ${data.oficina}, ${data.custo},
          ${data.status_os}, ${data.tipo_oleo}, ${data.quantidade}, ${data.observacoes})
        ON CONFLICT (id) DO UPDATE SET
          vehicle_id = EXCLUDED.vehicle_id, veiculo_id = EXCLUDED.veiculo_id, placa = EXCLUDED.placa,
          tipo = EXCLUDED.tipo, data = EXCLUDED.data, data_saida = EXCLUDED.data_saida,
          hodometro = EXCLUDED.hodometro, proxima_manutencao = EXCLUDED.proxima_manutencao,
          servico = EXCLUDED.servico, itens = EXCLUDED.itens, oficina = EXCLUDED.oficina, custo = EXCLUDED.custo,
          status_os = EXCLUDED.status_os, tipo_oleo = EXCLUDED.tipo_oleo, quantidade = EXCLUDED.quantidade,
          observacoes = EXCLUDED.observacoes
        RETURNING *`;
      if (!rows[0]) {
        const error = new Error('A manutenção foi enviada, mas não foi devolvida pelo banco.');
        error.statusCode = 500;
        throw error;
      }
      return publicManutencao(rows[0]);
    }
    const row = await retryDuplicateKey(async () => {
      const id = await nextRowId('manutencoes');
      const rows = await sql`INSERT INTO manutencoes
        (id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes)
        VALUES (${id}, ${data.vehicle_id}, ${data.veiculo_id}, ${data.placa}, ${data.tipo}, ${data.data}, ${data.data_saida},
          ${data.hodometro}, ${data.proxima_manutencao}, ${data.servico}, ${data.itens}, ${data.oficina}, ${data.custo},
          ${data.status_os}, ${data.tipo_oleo}, ${data.quantidade}, ${data.observacoes})
        RETURNING *`;
      return rows[0];
    });
    if (!row) {
      const error = new Error('A manutenção foi enviada, mas não foi devolvida pelo banco.');
      error.statusCode = 500;
      throw error;
    }
    return publicManutencao(row);
  }
  const arr = loadFile().manutencoes;
  const idx = idFixo ? arr.findIndex((item) => Number(item.id) === idFixo) : -1;
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...data, id: arr[idx].id };
    saveFile();
    return publicManutencao(arr[idx]);
  }
  const item = { id: idFixo || nextId(arr), ...data, created_at: new Date().toISOString() };
  arr.push(item);
  saveFile();
  return publicManutencao(item);
}

async function updateManutencao(id, body) {
  const idNum = Number(id);
  const temporario = idTemporarioLocal(idNum);
  let current = null;
  // v3.8.5 — id local (>1e11) nem é procurado: não existe no banco e não
  // caberia na coluna INTEGER. Vai direto para o upsert abaixo.
  if (!temporario) {
    if (sql) {
      await ensureNeon();
      const rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
        FROM manutencoes WHERE id = ${idNum}`;
      current = rows[0];
    } else {
      current = (loadFile().manutencoes || []).find((item) => Number(item.id) === idNum);
    }
  }
  // v3.8.5 — UPSERT em vez de 404. O id não está no banco (registro lançado em
  // outro dispositivo que ainda não subiu, apagado por outro computador, ou id
  // local de timestamp): GRAVA o registro. Antes a resposta era 404, o front
  // mostrava "Sem conexão com a API" e a edição caía em modo offline — o
  // usuário digitava e o registro parecia perdido. Um id real é reaproveitado;
  // um id local recebe o próximo id livre (o front adota o id da resposta).
  if (!current) return insertManutencao(body || {}, temporario ? null : idNum);
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
      WHERE id = ${idNum}`;
    const rows = await sql`SELECT id, vehicle_id, veiculo_id, placa, tipo, data, data_saida, hodometro, proxima_manutencao, servico, itens, oficina, custo, status_os, tipo_oleo, quantidade, observacoes, created_at
      FROM manutencoes WHERE id = ${idNum}`;
    return publicManutencao(rows[0]);
  }
  const arr = loadFile().manutencoes;
  const index = arr.findIndex((item) => Number(item.id) === idNum);
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

async function insertVehicle(body, idPreferido = null) {
  const d = sanitizeVehicle(body);
  if (!d.placa) { const e = new Error('Placa é obrigatória.'); e.statusCode = 400; throw e; }
  // v3.8.5 — id informado = o veículo já tem lugar marcado no banco. Id local de
  // timestamp (>1e11) não cabe na coluna INTEGER: o banco atribui o próximo id
  // livre e o front adota o id devolvido.
  const idFixo = idTemporarioLocal(idPreferido) ? null : Number(idPreferido);
  if (sql) {
    await ensureNeon();
    if (idFixo) {
      // Upsert pelo id (mesma razão do INSERT de manutenções): outro computador
      // pode ter cadastrado o mesmo registro entre a consulta e a gravação.
      const rows = await sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
        VALUES (${idFixo}, ${d.placa}, ${d.grupo}, ${d.marca}, ${d.modelo}, ${d.ano}, ${d.cor}, ${d.hodometro}, ${d.status}, ${d.combustivel}, ${d.capacidade})
        ON CONFLICT (id) DO UPDATE SET
          placa = EXCLUDED.placa, grupo = EXCLUDED.grupo, marca = EXCLUDED.marca, modelo = EXCLUDED.modelo,
          ano = EXCLUDED.ano, cor = EXCLUDED.cor, hodometro = EXCLUDED.hodometro,
          status = EXCLUDED.status, combustivel = EXCLUDED.combustivel, capacidade = EXCLUDED.capacidade
        RETURNING id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade`;
      if (rows[0]) return rows[0];
      const error = new Error('O veículo foi enviado, mas não foi devolvido pelo banco.');
      error.statusCode = 500;
      throw error;
    }
    const salvo = await retryDuplicateKey(async () => {
      const nid = await nextRowId('vehicles');
      const rows = await sql`INSERT INTO vehicles (id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade)
        VALUES (${nid}, ${d.placa}, ${d.grupo}, ${d.marca}, ${d.modelo}, ${d.ano}, ${d.cor}, ${d.hodometro}, ${d.status}, ${d.combustivel}, ${d.capacidade})
        RETURNING id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade`;
      return rows[0] || { id: nid, ...d };
    });
    return salvo;
  }
  const arr = loadFile().vehicles;
  const idx = idFixo ? arr.findIndex((v) => Number(v.id) === idFixo) : -1;
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...d, id: arr[idx].id };
    saveFile();
    return arr[idx];
  }
  const novo = { id: idFixo || nextId(arr), ...d };
  arr.push(novo);
  saveFile();
  return novo;
}

async function updateVehicle(id, body) {
  body = body || {};
  const idNum = Number(id);
  const temporario = idTemporarioLocal(idNum);
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
  // v3.8.5 — id local (>1e11, criado neste dispositivo enquanto estava sem
  // conexão) não existe no banco: grava em vez de responder 404 → antes isso
  // deixava a edição em modo offline e o veículo parecia perdido.
  if (temporario) return insertVehicle(body, null);
  if (sql) {
    await ensureNeon();
    const cur = await sql`SELECT id, placa, grupo, marca, modelo, ano, cor, hodometro, status, combustivel, capacidade FROM vehicles WHERE id = ${idNum}`;
    // v3.8.5 — UPSERT: o id não está no banco. Grava com esse mesmo id, para a
    // edição do usuário não virar 404 (e o front não cair em modo offline).
    if (cur.length === 0) return insertVehicle(body, idNum);
    const m = { ...cur[0], ...sets };
    await sql`UPDATE vehicles SET
      placa = ${m.placa}, grupo = ${m.grupo}, marca = ${m.marca}, modelo = ${m.modelo},
      ano = ${m.ano}, cor = ${m.cor}, hodometro = ${m.hodometro},
      status = ${m.status}, combustivel = ${m.combustivel}, capacidade = ${m.capacidade}
      WHERE id = ${idNum}`;
    return m;
  }
  const arr = loadFile().vehicles;
  const idx = arr.findIndex((v) => Number(v.id) === idNum);
  if (idx === -1) return insertVehicle(body, idNum); // upsert
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

async function insertUser(body, idPreferido = null) {
  body = body || {};
  const u = {
    nome: String(body.nome || '').trim(),
    usuario: String(body.usuario || '').trim(),
    senha: hashSenha(body.senha),
    role: String(body.role || 'user'),
    ativo: body.ativo === undefined ? 1 : intOrNull(body.ativo) ?? 1
  };
  if (!u.nome || !u.usuario || !u.senha) { const e = new Error('Nome, usuário e senha são obrigatórios.'); e.statusCode = 400; throw e; }
  // v3.8.6 — id informado = usuário já tem lugar marcado (edição offline / upsert)
  const idFixo = idTemporarioLocal(idPreferido) ? null : Number(idPreferido);
  if (sql) {
    await ensureNeon();
    if (idFixo) {
      const rows = await sql`INSERT INTO users (id, nome, usuario, senha, role, ativo)
        VALUES (${idFixo}, ${u.nome}, ${u.usuario}, ${u.senha}, ${u.role}, ${u.ativo})
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, usuario = EXCLUDED.usuario, senha = EXCLUDED.senha, role = EXCLUDED.role, ativo = EXCLUDED.ativo
        RETURNING id, nome, usuario, role, ativo`;
      if (rows[0]) return rows[0];
      const error = new Error('O usuário foi enviado, mas não foi devolvido pelo banco.');
      error.statusCode = 500;
      throw error;
    }
    return await retryDuplicateKey(async () => {
      const nid = await nextRowId('users');
      const rows = await sql`INSERT INTO users (id, nome, usuario, senha, role, ativo) VALUES (${nid}, ${u.nome}, ${u.usuario}, ${u.senha}, ${u.role}, ${u.ativo}) RETURNING id, nome, usuario, role, ativo`;
      return rows[0] || { id: nid, nome: u.nome, usuario: u.usuario, role: u.role, ativo: u.ativo };
    });
  }
  const arr = loadFile().users;
  const idx = idFixo ? arr.findIndex((x) => Number(x.id) === idFixo) : -1;
  if (idx >= 0) {
    const novaSenha = u.senha ? u.senha : arr[idx].senha;
    arr[idx] = { ...arr[idx], nome: u.nome, usuario: u.usuario, senha: novaSenha, role: u.role, ativo: u.ativo, id: arr[idx].id };
    saveFile();
    const { senha, ...pub } = arr[idx];
    return pub;
  }
  const novo = { id: idFixo || nextId(arr), ...u };
  arr.push(novo);
  saveFile();
  const { senha, ...pub } = novo;
  return pub;
}

async function updateUser(id, body) {
  body = body || {};
  const idNum = Number(id);
  const temporario = idTemporarioLocal(idNum);
  if (temporario) return insertUser(body, null);
  // senha vazia/ausente = manter a que já está no banco; senão, gravar o hash.
  const novaSenha = body.senha === undefined || String(body.senha).trim() === '' ? undefined : hashSenha(body.senha);
  if (sql) {
    await ensureNeon();
    const cur = await sql`SELECT * FROM users WHERE id = ${idNum}`;
    if (cur.length === 0) {
      // v3.8.6 — UPSERT: id não está no banco, grava com esse mesmo id
      return insertUser(body, idNum);
    }
    const m = { ...cur[0], ...body, id: idNum, senha: novaSenha === undefined ? cur[0].senha : novaSenha };
    // Garante que nome/usuario não fiquem vazios no update parcial
    if (!String(m.nome || '').trim() || !String(m.usuario || '').trim()) {
      const e = new Error('Nome e usuário são obrigatórios.');
      e.statusCode = 400;
      throw e;
    }
    await sql`UPDATE users SET nome = ${m.nome}, usuario = ${m.usuario}, senha = ${m.senha}, role = ${m.role}, ativo = ${m.ativo} WHERE id = ${idNum}`;
    return { id: m.id, nome: m.nome, usuario: m.usuario, role: m.role, ativo: m.ativo };
  }
  const arr = loadFile().users;
  const idx = arr.findIndex((x) => Number(x.id) === idNum);
  if (idx === -1) return insertUser(body, idNum); // upsert arquivo
  arr[idx] = { ...arr[idx], ...body, id: arr[idx].id, senha: novaSenha === undefined ? arr[idx].senha : novaSenha };
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

// v3.8 — toda resposta da API proíbe cache explicitamente: intermediários
// (Vercel Edge, proxies corporativos, navegador) não podem servir uma
// resposta antiga no lugar da atual. É isso que impede o "salvou mas não
// aparece" causado por 200/404 velhos presos em cache.
function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}
function invalidJsonError() {
  const err = new Error('JSON inválido no corpo da requisição.');
  err.statusCode = 400;
  return err;
}

// ============================================================
// v3.8.1 — Espelho da rede (GET /api/echo)
// ============================================================
// A função devolve EXATAMENTE o que recebeu: path, método, host, query e
// cabeçalhos de proxy. É a prova dos nove contra rede que altera a
// requisição no caminho. Sintomas que este endpoint expõe:
//   • POST que chega como GET (proxy que "normaliza" método e perde o corpo);
//   • path reescrito (/api/manutencoes → /api/manutencao, ou barras a mais);
//   • Host trocado por proxy transparente (X-Forwarded-Host ≠ Host);
//   • corpo comido no caminho (Content-Length que não chega);
//   • resposta que nem passou pela Vercel (ausência de x-vercel-id).
// Se /api/echo NÃO devolver este JSON, quem respondeu foi outra coisa
// (página da plataforma, proxy, firewall, cache da rede) — não a API.

// Nunca ecoar credenciais: um endpoint de diagnóstico não pode virar
// vazamento de sessão.
const ECHO_REDACT = new Set([
  'cookie', 'set-cookie', 'authorization', 'proxy-authorization',
  'x-api-key', 'x-auth-token', 'x-vercel-signature', 'x-csrf-token',
  // v3.8.2 — credenciais injetadas pela própria Vercel na requisição:
  // o OIDC é um JWT que autentica o PROJETO (validade de 2h) e a
  // proxy-signature é um Bearer da plataforma. Ecoá-los em endpoint
  // público equivale a publicar a credencial do projeto.
  'x-vercel-oidc-token', 'x-vercel-proxy-signature', 'x-vercel-proxy-signature-ts'
]);

// Rede de segurança para nomes que ainda não existem: qualquer cabeçalho cujo
// NOME cheire a credencial é redigido, mesmo fora da lista acima.
const ECHO_REDACT_NAME = /(token|signature|secret|password|passwd|api-?key|chave|senha|assertion|bearer|credential)/i;

const ECHO_REDACTED = '***omitido***';

function echoDeveRedigir(name) {
  const lower = String(name).toLowerCase();
  return ECHO_REDACT.has(lower) || ECHO_REDACT_NAME.test(lower);
}

// `forwarded` (RFC 7239) carrega dados úteis de diagnóstico (for=, host=,
// proto=) junto com a assinatura `sig=` da Vercel. Preserva o que ajuda e
// omite só a assinatura.
function echoSanitizarForwarded(value) {
  const troca = (v) => String(v).replace(/(\bsig\s*=\s*)("[^"]*"|[^;,\s]+)/gi, `$1${ECHO_REDACTED}`);
  return Array.isArray(value) ? value.map(troca) : troca(value);
}

// Redige um conjunto de cabeçalhos, devolvendo também os nomes suprimidos —
// para que "omitido" nunca seja confundido com "o cabeçalho não veio".
function echoRedigir(headers) {
  const saida = {};
  const omitidos = [];
  for (const name of Object.keys(headers)) {
    const lower = name.toLowerCase();
    if (echoDeveRedigir(lower)) {
      saida[name] = ECHO_REDACTED;
      omitidos.push(lower);
    } else if (lower === 'forwarded') {
      const limpo = echoSanitizarForwarded(headers[name]);
      saida[name] = limpo;
      if (String(limpo) !== String(headers[name])) omitidos.push('forwarded.sig');
    } else {
      saida[name] = headers[name];
    }
  }
  return { headers: saida, omitidos };
}

// Teto para ler o corpo no /api/echo (ver comentário em echoDiagnostics).
const ECHO_BODY_TIMEOUT_MS = 5000;
const ECHO_BODY_TIMEOUT = Symbol('echo-body-timeout');

async function echoDiagnostics(req, requestUrl) {
  const h = req.headers || {};
  const get = (name) => (h[name] === undefined ? null : h[name]);
  // v3.8.5 — além do método que CHEGOU (req.method, que é o que este espelho
  // existe para mostrar), informa qual método a API vai EXECUTAR: o override
  // (X-HTTP-Method-Override / ?_method=) muda o comportamento sem mudar o que a
  // rede entregou.
  const reqMethod = resolveReqMethod(req, requestUrl);
  const overrideCabecalho = get('x-http-method-override');
  const overrideQuery = requestUrl.searchParams.get('_method');

  // Só os cabeçalhos que denunciam intermediários no caminho.
  const proxyHeaders = {};
  for (const name of Object.keys(h)) {
    if (/^(forwarded|via|x-forwarded-|x-real-ip|x-vercel-|x-nf-|cf-|true-client-ip|x-client-ip)/i.test(name)) {
      proxyHeaders[name] = h[name];
    }
  }

  // A redação vale para os DOIS blocos: o OIDC começa com `x-vercel-`, logo
  // também cai em `cabecalhos_de_proxy`.
  const proxyRedigido = echoRedigir(proxyHeaders);
  const todosRedigido = echoRedigir(h);

  // O dump completo dos cabeçalhos passa a ser opcional: por padrão só os de
  // proxy (já redigidos) aparecem; o resto exige ?completo=1.
  const completo = ['1', 'true', 'sim', 'yes'].includes(
    String(requestUrl.searchParams.get('completo') || '').toLowerCase()
  );
  const allHeaders = completo
    ? todosRedigido.headers
    : '(omitido — acrescente ?completo=1 à URL para ver todos)';

  const camposOmitidos = Array.from(new Set([...proxyRedigido.omitidos, ...todosRedigido.omitidos])).sort();

  // Corpo: só faz sentido ler quando há corpo. Se a rede comeu o corpo, o
  // Content-Length anunciado não bate com o que chegou — e isso aparece aqui.
  // O teto existe porque um Content-Length MENTIROSO (a rede anuncia mais
  // bytes do que entrega) deixaria a requisição pendurada esperando dados que
  // nunca chegam: o navegador ficaria carregando até estourar o tempo da
  // função. Com o limite, o /api/echo SEMPRE responde — e responde dizendo
  // que o corpo não chegou, que é exatamente o dado que se quer ver.
  let body = null;
  let bodyError = null;
  let bodyIncomplete = false;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    let timer = null;
    try {
      body = await Promise.race([
        parseBody(req),
        new Promise((resolve) => {
          timer = setTimeout(() => resolve(ECHO_BODY_TIMEOUT), ECHO_BODY_TIMEOUT_MS);
        })
      ]);
      if (body === ECHO_BODY_TIMEOUT) {
        body = null;
        bodyIncomplete = true;
        bodyError = `O corpo não chegou completo em ${ECHO_BODY_TIMEOUT_MS}ms (conexão interrompida ou Content-Length maior do que o enviado).`;
      }
    } catch (e) {
      bodyError = (e && e.message) || 'falha ao ler o corpo da requisição.';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const declaredLength = get('content-length');
  const arrivedLength = body === null || body === undefined
    ? 0
    : Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body));

  const warnings = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    warnings.push(`A requisição chegou como ${req.method} — se foi aberta no navegador, algum intermediário trocou o método.`);
  }
  if (declaredLength && arrivedLength && Number(declaredLength) > arrivedLength) {
    warnings.push(`Corpo truncado no caminho: Content-Length anunciava ${declaredLength} bytes, chegaram ${arrivedLength}.`);
  }
  if (!declaredLength && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    warnings.push(`${req.method} chegou SEM Content-Length: a rede pode ter removido o corpo da requisição.`);
  }
  const fwdHost = get('x-forwarded-host');
  if (fwdHost && h.host && fwdHost !== h.host) {
    warnings.push(`Host reescrito no caminho: Host="${h.host}", mas X-Forwarded-Host="${fwdHost}".`);
  }
  if (get('via')) {
    warnings.push(`Requisição passou por proxy declarado em Via="${get('via')}".`);
  }
  if (!get('x-vercel-id')) {
    warnings.push('Sem x-vercel-id: esta requisição NÃO foi identificada pela Vercel — pode ter sido respondida por proxy, cache ou firewall da rede.');
  }
  if (bodyError) {
    warnings.push(`Corpo da requisição ilegível: ${bodyError}`);
  }
  if (bodyIncomplete) {
    warnings.push(`Corpo incompleto: Content-Length anunciava ${declaredLength} bytes, mas a requisição travou esperando o resto — sintoma clássico de rede que trunca/envia corpo pela metade.`);
  }

  return {
    ok: true,
    version: VERSION,
    o_que_e: 'JSON gerado pela própria API (server.js). Se isto não aparecer, a resposta veio de outra coisa — proxy, cache da rede, firewall ou página da plataforma.',
    recebido: {
      metodo: req.method,
      metodo_efetivo: reqMethod,
      metodo_override: {
        cabecalho_x_http_method_override: overrideCabecalho ? String(primeiroValor(overrideCabecalho)) : null,
        query_method: overrideQuery || null,
        usado: reqMethod !== String(req.method || 'GET').toUpperCase()
      },
      path: requestUrl.pathname,
      query_string: requestUrl.search || '',
      query: Object.fromEntries(requestUrl.searchParams.entries()),
      http_version: req.httpVersion,
      url_completa: requestUrl.pathname + (requestUrl.search || '')
    },
    host: {
      host: get('host') || null,
      x_forwarded_host: fwdHost,
      x_forwarded_proto: get('x-forwarded-proto'),
      x_forwarded_port: get('x-forwarded-port'),
      x_forwarded_for: get('x-forwarded-for'),
      x_real_ip: get('x-real-ip')
    },
    cabecalhos_de_proxy: proxyRedigido.headers,
    cabecalhos: allHeaders,
    cabecalhos_completos: completo,
    campos_omitidos: camposOmitidos,
    corpo: {
      content_length_anunciado: declaredLength === null ? null : Number(declaredLength),
      content_length_recebido: arrivedLength,
      conteudo: body,
      erro: bodyError
    },
    plataforma: {
      vercel: !!process.env.VERCEL,
      regiao: process.env.VERCEL_REGION || null,
      vercel_url: process.env.VERCEL_URL || null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ? String(process.env.VERCEL_GIT_COMMIT_SHA).slice(0, 7) : null,
      node: process.version,
      banco: sql ? 'neon (Postgres)' : 'arquivo local (data/db.json)'
    },
    avisos: warnings,
    recebido_em: new Date().toISOString()
  };
}

function parseBody(req) {
  // Na Vercel, o runtime lê o corpo antes de chamar a função e o expõe em
  // req.body (getter preguiçoso: o acesso pode lançar se o JSON for inválido).
  // Aceitar as duas formas — corpo já parseado ou stream — garante o salvamento
  // igual no ambiente local e na nuvem.
  let preParsed;
  let hasPreParsed = false;
  try {
    if (req.body !== undefined && req.body !== null) { preParsed = req.body; hasPreParsed = true; }
  } catch (e) {
    return Promise.reject(invalidJsonError());
  }
  if (hasPreParsed) {
    if (typeof preParsed === 'object' && !Buffer.isBuffer(preParsed)) return Promise.resolve(preParsed);
    if (typeof preParsed === 'string') {
      if (!preParsed) return Promise.resolve({});
      try {
        return Promise.resolve(JSON.parse(preParsed));
      } catch (e) {
        return Promise.reject(invalidJsonError());
      }
    }
    // Buffer ou outro tipo: cai para a leitura da stream abaixo.
  }
  return new Promise((ok, fail) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { ok(body ? JSON.parse(body) : {}); }
      catch (e) { fail(invalidJsonError()); }
    });
    req.on('error', fail);
  });
}

// Erros do Postgres chegam como 500 genéricos ("Erro interno no servidor."), o que
// torna impossível diagnosticar à distância. Além de logar, o texto devolvido pelo
// navegador passa a trazer a causa real (coluna inexistente, violação de chave etc.).
function reasonDaFalha(e) {
  if (!e) return '';
  // NeonDbError pode chegar com message vazio (resposta fora do formato esperado):
  // junta o que houver (detail/hint/nome) para nunca perder a causa do erro.
  const partes = [e.message, e.detail, e.hint].filter(Boolean).map(String);
  if (!partes.length) partes.push(String(e.name && e.name !== 'Error' ? e.name : (e.stack ? String(e.stack).split('\n')[0] : e)));
  return partes
    .join(' — ')
    .replace(/^NeonDbError$/, 'Erro do banco de dados (Neon/Postgres)')
    // O driver embrulha falhas de conexão ("Error connecting to database: Error: ...");
    // tira o embrulho para a mensagem ficar legível no aviso do navegador.
    .replace(/^Error connecting to database:\s*(Error:\s*)?/i, '')
    .slice(0, 400);
}

function apiError(res, req, pathname, e) {
  let code = e && e.statusCode ? e.statusCode : 500;
  const motivo = reasonDaFalha(e) || 'Erro interno no servidor.';
  const sqlstate = String((e && (e.code || e.sqlState)) || '');
  const took = req && req._t0 ? ` (${Date.now() - req._t0}ms)` : '';
  // Falha de CONEXÃO com o banco (timeout dos 20s, Neon suspenso/inacessível) não é
  // erro de SQL: vira 504 para o front tratar como "API fora do ar" (salva local e
  // sincroniza depois) em vez de erro genérico.
  if (code === 500 && /connecting to database|tempo esgotado ao falar com o banco|fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test([e && e.message, motivo].filter(Boolean).join(' '))) {
    code = 504;
  }
  // v3.8.5 — o log mostra o método EFETIVO (o override vale) e, entre
  // parênteses, o método que a rede entregou quando são diferentes: sem isso,
  // um POST + X-HTTP-Method-Override: PATCH apareceria como POST no log e
  // esconderia a operação que realmente falhou.
  const metodoLog = (req && req._reqMethod) || req.method;
  const metodoRede = req && req.method;
  const marcaMetodo = metodoLog !== metodoRede ? `${metodoLog}<-${metodoRede}` : metodoLog;
  if (code >= 500) {
    console.error(`[API] ${marcaMetodo} ${pathname} → ${motivo}${sqlstate ? ` (sqlstate ${sqlstate})` : ''}${took}`);
    if (process.env.API_DEBUG === '1') console.error(e);
    return json(res, code, { error: `Erro no servidor: ${motivo}`, sqlstate: sqlstate || undefined });
  }
  // 4xx também vão para o log: uma epidemia de "Veículo é obrigatório." sem pista
  // no log é impossível de diagnosticar à distância.
  console.warn(`[API] ${marcaMetodo} ${pathname} → ${code} ${motivo}${took}`);
  return json(res, code, { error: motivo });
}

// Última rede de segurança: um erro lançado fora do fluxo normal (ex.: URL
// malformada, resposta já enviada) nunca pode travar a função serverless nem
// devolver HTML — a resposta é sempre JSON.
function respondFatal(res, e) {
  console.error('[API] Falha fora do fluxo:', (e && e.stack) || e);
  try {
    json(res, 500, { error: `Erro no servidor: ${reasonDaFalha(e) || 'falha inesperada.'}` });
  } catch (_) {
    try { res.end(); } catch (_) { /* já respondida */ }
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

async function handleRequest(req, res) {
  req._t0 = Date.now();
  if (req.method === 'OPTIONS') {
    // v3.8.5 — o preflight libera o cabeçalho de override: é ele que permite
    // enviar POST onde a rede bloqueia PATCH/PUT/DELETE.
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-HTTP-Method-Override', 'Cache-Control': 'no-store' });
    return res.end();
  }
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url, `http://${host}`);
  let pathname = requestUrl.pathname;

  // Em deploys serverless (Vercel) com rewrite para /api, recupera o path original
  if (pathname === '/api' || pathname === '/api/' || pathname === '/api/index.js' || pathname === '/api/[...path]') {
    const rawOrig = req.headers['x-matched-path'] || req.headers['x-forwarded-url'] || req.headers['x-vercel-matched-path'] || req.originalUrl;
    if (rawOrig && typeof rawOrig === 'string') {
      try {
        const parsed = new URL(rawOrig, `http://${host}`);
        if (parsed.pathname && parsed.pathname !== '/api' && parsed.pathname !== '/api/' && parsed.pathname !== '/api/index.js' && parsed.pathname !== '/api/[...path]') {
          pathname = parsed.pathname;
        }
      } catch {
        const clean = rawOrig.split('?')[0];
        if (clean && clean !== '/api' && clean !== '/api/' && clean !== '/api/index.js' && clean !== '/api/[...path]') {
          pathname = clean;
        }
      }
    }
  }

  const query = Object.fromEntries(requestUrl.searchParams.entries());

  // v3.8.5 — método EFETIVO: X-HTTP-Method-Override / ?_method= têm precedência
  // sobre o método que chegou (o front usa isso quando a rede bloqueia
  // PATCH/PUT/DELETE com 405/403). `req.method` continua sendo o que a rede
  // entregou — é ele que o /api/echo mostra.
  const reqMethod = resolveReqMethod(req, requestUrl);
  req._reqMethod = reqMethod; // usado no log da API (apiError)

  try {
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const cleanPath = pathname.replace(/^\/api\/?/, '');
      const parts = cleanPath.split('/').filter(Boolean);
      const resource = parts[0] || 'status';
      const idBruto = parts[1] ? parseInt(parts[1], 10) : null;
      // id inválido no caminho (texto, zero, negativo) é tratado como "sem id":
      // nunca vira um alvo de UPDATE/DELETE sem sentido.
      const id = Number.isInteger(idBruto) && idBruto > 0 ? idBruto : null;

      // v3.8.1 — espelho da rede. Aceita QUALQUER método de propósito: se a
      // rede trocar POST por GET no caminho, este JSON mostra o método que
      // realmente chegou à função (não o que o navegador enviou).
      if (resource === 'echo') {
        return json(res, 200, await echoDiagnostics(req, requestUrl));
      }

      if (resource === 'status') {
        const vehicles = await listVehicles();
        const manutencoes = await listManutencoes();
        return json(res, 200, { online: true, version: VERSION, db: sql ? 'neon' : 'file', counts: { vehicles: vehicles.length, manutencoes: manutencoes.length, trocas_oleo: manutencoes.filter((m) => m.tipo === 'TROCA DE ÓLEO').length } });
      }
      if (resource === 'data' && reqMethod === 'GET') {
        return json(res, 200, { vehicles: await listVehicles(), users: (await listUsers()).map(stripSenha) });
      }
      if (resource === 'seed' && reqMethod === 'POST') {
        await seedVehicles();
        return json(res, 200, { success: true });
      }
      if (resource === 'login' && reqMethod === 'POST') {
        const body = await parseBody(req);
        const user = await checkLogin(body.usuario, body.senha);
        if (!user) return json(res, 401, { error: 'Usuário ou senha incorretos.' });
        return json(res, 200, user);
      }

      if (resource === 'trocas-oleo' || resource === 'oil-changes') {
        if (reqMethod === 'GET' && (parts[1] === 'relatorio' || parts[1] === 'relatorio-mensal')) {
          return json(res, 200, await monthlyOilReport(query));
        }
        if (reqMethod === 'GET' && !id) return json(res, 200, await listOilChanges(query));
        if (reqMethod === 'GET' && id) {
          const all = await listOilChanges();
          const item = all.find((change) => Number(change.id) === id);
          return item ? json(res, 200, item) : json(res, 404, { error: 'Not found' });
        }
        // v3.8.5 — gravação/edição: POST insere; PATCH/PUT (e POST com o id
        // informado no path ou no corpo) ATUALIZAM — e o update é upsert, então
        // um id que não está no banco é gravado em vez de devolver 404.
        if (reqMethod === 'POST' || reqMethod === 'PATCH' || reqMethod === 'PUT') {
          const corpo = await parseBody(req);
          const alvo = id || idDoCorpo(corpo);
          if (alvo) {
            const upd = await updateOilChange(alvo, corpo);
            return upd ? json(res, 200, upd) : json(res, 201, await insertOilChange(corpo));
          }
          if (reqMethod === 'POST') return json(res, 201, await insertOilChange(corpo));
        }
        if (reqMethod === 'DELETE' && id) {
          return (await deleteOilChange(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'relatorio-mensal' && reqMethod === 'GET') {
        return json(res, 200, await monthlyOilReport(query));
      }

      if (resource === 'manutencoes' || resource === 'manutencao') {
        if (reqMethod === 'GET' && !id) return json(res, 200, await listManutencoes(query));
        if (reqMethod === 'GET' && id) {
          const all = await listManutencoes();
          const item = all.find((m) => Number(m.id) === id);
          return item ? json(res, 200, item) : json(res, 404, { error: 'Not found' });
        }
        // v3.8.5 — edição à prova de rede: PATCH/PUT atualizam; POST também
        // atualiza quando o id vem informado (path ou corpo), o que cobre o
        // POST + X-HTTP-Method-Override: PATCH usado quando a rede bloqueia o
        // método real. POST sem id continua sendo criação (201).
        if (reqMethod === 'POST' || reqMethod === 'PATCH' || reqMethod === 'PUT') {
          const corpo = await parseBody(req);
          const alvo = id || idDoCorpo(corpo);
          if (alvo) {
            const upd = await updateManutencao(alvo, corpo);
            return upd ? json(res, 200, upd) : json(res, 201, await insertManutencao(corpo));
          }
          if (reqMethod === 'POST') return json(res, 201, await insertManutencao(corpo));
        }
        if (reqMethod === 'DELETE' && id) {
          return (await deleteManutencao(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'vehicles') {
        if (reqMethod === 'GET' && !id) return json(res, 200, await listVehicles());
        if (reqMethod === 'GET' && id) {
          const all = await listVehicles();
          const it = all.find((v) => Number(v.id) === id);
          return it ? json(res, 200, it) : json(res, 404, { error: 'Not found' });
        }
        // v3.8.5 — idem manutenções: PATCH/PUT e POST com id informado são
        // atualização (upsert); POST sem id é cadastro.
        if (reqMethod === 'POST' || reqMethod === 'PATCH' || reqMethod === 'PUT') {
          const corpo = await parseBody(req);
          const alvo = id || idDoCorpo(corpo);
          if (alvo) {
            const upd = await updateVehicle(alvo, corpo);
            return upd ? json(res, 200, upd) : json(res, 201, await insertVehicle(corpo));
          }
          if (reqMethod === 'POST') return json(res, 201, await insertVehicle(corpo));
        }
        if (reqMethod === 'DELETE' && id) {
          return (await deleteVehicle(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      if (resource === 'users') {
        if (reqMethod === 'GET' && !id) return json(res, 200, (await listUsers()).map(stripSenha));
        if (reqMethod === 'GET' && id) {
          const all = await listUsers();
          const it = all.find((x) => Number(x.id) === id);
          return it ? json(res, 200, stripSenha(it)) : json(res, 404, { error: 'Not found' });
        }
        // v3.8.6 — usuários à prova de rede: POST com id (path ou corpo) = atualização (upsert),
        // igual a vehicles/manutencoes. Permite POST + X-HTTP-Method-Override: PATCH/DELETE
        // quando a rede bloqueia o método real.
        if (reqMethod === 'POST' || reqMethod === 'PATCH' || reqMethod === 'PUT') {
          const corpo = await parseBody(req);
          const alvo = id || idDoCorpo(corpo);
          if (alvo) {
            const upd = await updateUser(alvo, corpo);
            return upd ? json(res, 200, upd) : json(res, 201, await insertUser(corpo, alvo));
          }
          if (reqMethod === 'POST') return json(res, 201, await insertUser(corpo));
        }
        if (reqMethod === 'DELETE' && id) {
          return (await deleteUser(id)) ? json(res, 200, { success: true }) : json(res, 404, { error: 'Not found' });
        }
        return json(res, 405, { error: 'Method not allowed' });
      }

      return json(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    return apiError(res, req, pathname, e);
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
}

// Toda requisição passa por aqui: qualquer falha — inclusive fora do fluxo
// normal da API — vira resposta JSON em vez de travar a função serverless.
function serve(req, res) {
  handleRequest(req, res).catch((fatal) => respondFatal(res, fatal));
}

const server = http.createServer(serve);

// Execução local: node server.js
if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(` FROTA PRO v${VERSION} — http://${HOST}:${PORT} — banco: ${sql ? 'Neon (Postgres)' : 'arquivo local'}`));
}

// Execução serverless (Vercel): chama o handler direto e garante resposta JSON
// até em falha fatal — nunca HTML, nunca travamento.
module.exports = (req, res) => serve(req, res);
