// ==========================================
// FROTA PRO v3.1 — Servidor Central Online (Node.js)
// Complexo Penal de Marília — Gestão de Frotas
// Permite acesso simultâneo de múltiplos computadores na mesma base
// ==========================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Catálogo dos 29 veículos oficiais do Complexo Penal de Marília
const INITIAL_VEHICLES = [
  { id: 1, placa: 'CUQ3I89', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB170141', renavam: '1411081703', hodometro: 52952, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 2, placa: 'CUW3J07', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SN171682', renavam: '1411079865', hodometro: 92369, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 3, placa: 'TIT8E83', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB195053', renavam: '1408048016', hodometro: 52906, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 4, placa: 'TIV8C29', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB174833', renavam: '1413413584', hodometro: 80003, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 5, placa: 'TJY6A21', grupo: 'S2', marca: 'RENAULT', modelo: 'MASTER MINIBUS', ano: 2025, cor: 'BRANCA', chassi: '93YJ62001SJ015179', renavam: '1413828261', hodometro: 57902, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
  { id: 6, placa: 'TLM2D25', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB179579', renavam: '1413413460', hodometro: 57662, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 7, placa: 'FJF0688', grupo: 'S3', marca: 'FORD', modelo: 'F-4000', ano: 2018, cor: 'BRANCA', chassi: '9BFLF47P8JB012768', renavam: '1136808709', hodometro: 165873, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 8, placa: 'BRZ7720', grupo: 'S4', marca: 'GMC', modelo: '12170', ano: 1996, cor: 'BRANCA', chassi: '1GDM7H1J9TJ516578', renavam: '673310957', hodometro: 311382, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 9, placa: 'BVZ5E97', grupo: 'S4', marca: 'MERCEDES-BENZ', modelo: 'COMIL SVELTO U', ano: 1999, cor: 'PRETA', chassi: '9BM384073WB180715', renavam: '711698007', hodometro: 242225, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 40 },
  { id: 10, placa: 'CFY2G52', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRATA', chassi: '8AJZX62G7D5004683', renavam: '585788421', hodometro: 154152, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 11, placa: 'CFY2G97', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRETA', chassi: '8AJZX62G0D5004217', renavam: '585884404', hodometro: 246909, status: 'ARROLAMENTO', combustivel: 'ETANOL', capacidade: 5 },
  { id: 12, placa: 'CMW9549', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 7012', ano: 2004, cor: 'BRANCA', chassi: '93ZC6680148315934', renavam: '847718328', hodometro: 106805, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
  { id: 13, placa: 'CST0H92', grupo: 'S4', marca: 'IVECO', modelo: 'GCLASS 150', ano: 2020, cor: 'FANTASIA', chassi: '93ZA01LF0L8938076', renavam: '1258031083', hodometro: 33669, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 34 },
  { id: 14, placa: 'DJL7937', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 70C16', ano: 2011, cor: 'PRATA', chassi: '93ZC68B01B8426929', renavam: '408793678', hodometro: 167185, status: 'ARROLAMENTO', combustivel: 'DIESEL', capacidade: 20 },
  { id: 15, placa: 'EEF7G88', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2010, cor: 'PRATA', chassi: '9BG124GJ0AC441989', renavam: '201565498', hodometro: 602982, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 16, placa: 'FCK5196', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC412999', renavam: '1041251359', hodometro: 466636, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 17, placa: 'FCW8I62', grupo: 'S4', marca: 'CITROEN', modelo: 'JUMPY GREE AMB', ano: 2022, cor: 'BRANCA', chassi: '9V7VBBHXGNA802179', renavam: '1281132494', hodometro: 110240, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
  { id: 18, placa: 'FJG7158', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC414069', renavam: '1041251545', hodometro: 265891, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 19, placa: 'FKE6H32', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019144', renavam: '1329600115', hodometro: 282733, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 20, placa: 'FKN6069', grupo: 'S4', marca: 'FORD', modelo: 'CARGO 816 S', ano: 2018, cor: 'PRATA', chassi: '9BFVEADS9JBS44959', renavam: '1148048860', hodometro: 218324, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
  { id: 21, placa: 'FML8H43', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019186', renavam: '1329583393', hodometro: 221400, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 22, placa: 'FMM5G11', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018143', renavam: '1329615686', hodometro: 248248, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 23, placa: 'FRR1B42', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019857', renavam: '1329625185', hodometro: 259728, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 24, placa: 'FSH3I13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018073', renavam: '1329588590', hodometro: 282851, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 25, placa: 'FSW4013', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC412617', renavam: '1041251499', hodometro: 485585, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
  { id: 26, placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018956', renavam: '1329614086', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 27, placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB017004', renavam: '1329625061', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 28, placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', chassi: '93YMAFEXAJJ205006', renavam: '1141330951', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
  { id: 29, placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', chassi: 'JMYXTGF7WLZA00114', renavam: '1216646934', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
];

// Carrega ou inicializa a base de dados central em disco
function loadDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      vehicles: INITIAL_VEHICLES,
      fueling: [],
      maintenance: [],
      km_records: [],
      drivers: [],
      users: [
        {
          id: 1,
          nome: 'Administrador da Frota',
          usuario: 'admin',
          senha: 'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a',
          role: 'admin',
          ativo: 1
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(content);
    if (!data.vehicles || data.vehicles.length === 0) {
      data.vehicles = INITIAL_VEHICLES;
    }
    return data;
  } catch (err) {
    console.error('Erro ao ler DB, recriando:', err);
    return { vehicles: INITIAL_VEHICLES, fueling: [], maintenance: [], km_records: [], drivers: [], users: [] };
  }
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar DB:', err);
  }
}

// Helpers de resposta HTTP
function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Tabela de tipos MIME
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // ========================
  // ROTAS DA API REST (/api/...)
  // ========================
  if (pathname.startsWith('/api/')) {
    const parts = pathname.replace('/api/', '').split('/');
    const resource = parts[0];
    const id = parts[1] ? parseInt(parts[1]) : null;

    // Status da API e integridade
    if (resource === 'status') {
      return jsonResponse(res, 200, {
        online: true,
        mode: 'server',
        version: '3.1',
        name: 'Frota Pro — Complexo Penal de Marília',
        counts: {
          vehicles: db.vehicles.length,
          fueling: db.fueling.length,
          maintenance: db.maintenance.length,
          km_records: db.km_records.length,
          drivers: db.drivers.length,
          users: db.users.length
        }
      });
    }

    // Carregamento consolidado rápido de todas as tabelas
    if (resource === 'data' && req.method === 'GET') {
      return jsonResponse(res, 200, db);
    }

    // Restauração de seed inicial dos 29 veículos
    if (resource === 'seed' && req.method === 'POST') {
      db.vehicles = INITIAL_VEHICLES;
      saveDatabase();
      return jsonResponse(res, 200, { success: true, message: '29 veículos restaurados com sucesso' });
    }

    // Mapeamento de coleções válidas
    const validCollections = ['vehicles', 'fueling', 'maintenance', 'km_records', 'drivers', 'users'];
    if (!validCollections.includes(resource)) {
      return jsonResponse(res, 404, { error: `Recurso '${resource}' não encontrado.` });
    }

    const collection = db[resource];

    // GET /api/:resource
    if (req.method === 'GET' && !id) {
      return jsonResponse(res, 200, collection);
    }

    // GET /api/:resource/:id
    if (req.method === 'GET' && id) {
      const item = collection.find(x => x.id === id);
      if (!item) return jsonResponse(res, 404, { error: 'Registro não encontrado' });
      return jsonResponse(res, 200, item);
    }

    // POST /api/:resource
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const newId = body.id || (collection.length > 0 ? Math.max(...collection.map(x => x.id || 0)) + 1 : 1);
        const newItem = { ...body, id: newId, created_at: new Date().toISOString() };
        collection.push(newItem);
        saveDatabase();
        return jsonResponse(res, 201, newItem);
      } catch (err) {
        return jsonResponse(res, 400, { error: 'JSON inválido' });
      }
    }

    // PATCH / PUT /api/:resource/:id
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
      try {
        const body = await parseJsonBody(req);
        const idx = collection.findIndex(x => x.id === id);
        if (idx === -1) return jsonResponse(res, 404, { error: 'Registro não encontrado' });
        collection[idx] = { ...collection[idx], ...body, id };
        saveDatabase();
        return jsonResponse(res, 200, collection[idx]);
      } catch (err) {
        return jsonResponse(res, 400, { error: 'JSON inválido' });
      }
    }

    // DELETE /api/:resource/:id
    if (req.method === 'DELETE' && id) {
      const idx = collection.findIndex(x => x.id === id);
      if (idx === -1) return jsonResponse(res, 404, { error: 'Registro não encontrado' });
      collection.splice(idx, 1);
      saveDatabase();
      return jsonResponse(res, 200, { success: true });
    }

    return jsonResponse(res, 405, { error: 'Método não suportado' });
  }

  // ========================
  // ARQUIVOS ESTÁTICOS DO FRONT-END
  // ========================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Segurança contra Path Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Acesso proibido');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback para index.html para suporte a SPA
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Desativa cache agressivo em desenvolvimento / visualização
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    };

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Erro interno ao ler arquivo');
      }
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚗 FROTA PRO v3.1 — SERVIDOR ONLINE ATIVO`);
  console.log(`📡 Endereço de Acesso: http://${HOST}:${PORT}`);
  console.log(`👥 Acessível por qualquer computador na rede!`);
  console.log(`====================================================`);
});
