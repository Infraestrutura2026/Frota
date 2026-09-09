'use strict';

// ============================================================
// Controle de Frota – Polícia Penal do Estado de São Paulo
// Servidor Express: API REST + arquivos estáticos.
// Compatível com execução local (node server.js) e Vercel.
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(express.json({ limit: '1mb' }));

// ---------- Utilitários de banco (db.json) ----------

function lerDb() {
  const conteudo = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(conteudo);
}

function gravarDb(db) {
  // Na Vercel o sistema de arquivos é somente leitura;
  // o front-end usa localStorage como fallback nesse caso.
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2) + '\n', 'utf8');
  return true;
}

function proximoId(veiculos) {
  return veiculos.reduce((maior, v) => Math.max(maior, Number(v.id) || 0), 0) + 1;
}

// ---------- API ----------

// GET /api/frota – lista todos os veículos
app.get('/api/frota', (req, res) => {
  try {
    const db = lerDb();
    res.json(db.veiculos || []);
  } catch (erro) {
    res.status(500).json({ erro: 'Não foi possível ler o banco de dados.' });
  }
});

// GET /api/frota/:id – um veículo
app.get('/api/frota/:id', (req, res) => {
  try {
    const veiculos = (lerDb().veiculos) || [];
    const veiculo = veiculos.find((v) => String(v.id) === String(req.params.id));
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado.' });
    res.json(veiculo);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar o veículo.' });
  }
});

// POST /api/frota – cadastra veículo
app.post('/api/frota', (req, res) => {
  try {
    const db = lerDb();
    const veiculos = db.veiculos || [];
    const { placa, modelo } = req.body || {};
    if (!placa || !modelo) {
      return res.status(400).json({ erro: 'Placa e modelo são obrigatórios.' });
    }
    const novo = { id: proximoId(veiculos), ...req.body };
    veiculos.push(novo);
    let persistido = true;
    try { gravarDb(db); } catch (e) { persistido = false; }
    res.status(201).json({ veiculo: novo, persistido });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao salvar o veículo.' });
  }
});

// PUT /api/frota/:id – atualiza veículo
app.put('/api/frota/:id', (req, res) => {
  try {
    const db = lerDb();
    const veiculos = db.veiculos || [];
    const indice = veiculos.findIndex((v) => String(v.id) === String(req.params.id));
    if (indice === -1) return res.status(404).json({ erro: 'Veículo não encontrado.' });
    veiculos[indice] = { ...veiculos[indice], ...req.body, id: veiculos[indice].id };
    let persistido = true;
    try { gravarDb(db); } catch (e) { persistido = false; }
    res.json({ veiculo: veiculos[indice], persistido });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar o veículo.' });
  }
});

// DELETE /api/frota/:id – exclui veículo
app.delete('/api/frota/:id', (req, res) => {
  try {
    const db = lerDb();
    const veiculos = db.veiculos || [];
    const indice = veiculos.findIndex((v) => String(v.id) === String(req.params.id));
    if (indice === -1) return res.status(404).json({ erro: 'Veículo não encontrado.' });
    const [removido] = veiculos.splice(indice, 1);
    let persistido = true;
    try { gravarDb(db); } catch (e) { persistido = false; }
    res.json({ removido, persistido });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir o veículo.' });
  }
});

// ---------- Arquivos estáticos (index.html, css/, js/, images/, data/, manifest.json) ----------
app.use(express.static(path.join(__dirname)));

// Fallback: qualquer outra rota cai no index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Execução local: node server.js
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚗 Controle de Frota rodando em http://localhost:${PORT}`);
  });
}

// Exporta o app para a Vercel (@vercel/node)
module.exports = app;
