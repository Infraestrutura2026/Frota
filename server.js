const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

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
  { id: 26, placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 27, placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
  { id: 28, placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
  { id: 29, placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
];

function loadDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = { vehicles: INITIAL_VEHICLES, users: [{ id:1, nome:'Administrador', usuario:'admin', senha:'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a', role:'admin', ativo:1 }] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.vehicles || data.vehicles.length === 0) data.vehicles = INITIAL_VEHICLES;
    return data;
  } catch { return { vehicles: INITIAL_VEHICLES, users: [] }; }
}

let db = loadDatabase();
function saveDatabase() {
  // Na Vercel o filesystem é somente leitura: a falha é ignorada.
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); return true; }
  catch { return false; }
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}
function parseBody(req) {
  return new Promise((ok, fail) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { ok(body ? JSON.parse(body) : {}); } catch (e) { fail(e); } });
  });
}

const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.json':'application/json' };

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE','Access-Control-Allow-Headers':'Content-Type' });
    return res.end();
  }
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (pathname.startsWith('/api/')) {
    const parts = pathname.replace('/api/','').split('/');
    const resource = parts[0], id = parts[1] ? parseInt(parts[1]) : null;

    if (resource === 'status') return json(res, 200, { online:true, version:'3.2', counts:{vehicles:db.vehicles.length} });
    if (resource === 'data' && req.method === 'GET') return json(res, 200, db);
    if (resource === 'seed' && req.method === 'POST') { db.vehicles = INITIAL_VEHICLES; saveDatabase(); return json(res, 200, { success:true }); }

    if (!['vehicles','users'].includes(resource)) return json(res, 404, { error:'Not found' });
    const col = db[resource];

    if (req.method === 'GET' && !id) return json(res, 200, col);
    if (req.method === 'GET' && id) { const it = col.find(x=>x.id===id); return it ? json(res,200,it) : json(res,404,{error:'Not found'}); }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const nid = body.id || (col.length>0 ? Math.max(...col.map(x=>x.id||0))+1 : 1);
      col.push({ ...body, id:nid, created_at:new Date().toISOString() });
      saveDatabase(); return json(res, 201, col[col.length-1]);
    }
    if ((req.method==='PATCH'||req.method==='PUT') && id) {
      const body = await parseBody(req);
      const idx = col.findIndex(x=>x.id===id);
      if (idx===-1) return json(res,404,{error:'Not found'});
      col[idx] = { ...col[idx], ...body, id }; saveDatabase(); return json(res,200,col[idx]);
    }
    if (req.method === 'DELETE' && id) {
      const idx = col.findIndex(x=>x.id===id);
      if (idx===-1) return json(res,404,{error:'Not found'});
      col.splice(idx,1); saveDatabase(); return json(res,200,{success:true});
    }
    return json(res, 405, { error:'Method not allowed' });
  }

  let filePath = path.join(__dirname, pathname==='/'?'index.html':pathname);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) filePath = path.join(__dirname, 'index.html');
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-store','Access-Control-Allow-Origin':'*' };
    fs.readFile(filePath, (e, content) => {
      if (e) { res.writeHead(500); return res.end('Error'); }
      res.writeHead(200, headers); res.end(content);
    });
  });
});

// Execução local: node server.js
if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(` FROTA PRO v3.2 — http://${HOST}:${PORT}`));
}

// Exporta o handler para execução serverless (Vercel)
module.exports = (req, res) => server.emit('request', req, res);