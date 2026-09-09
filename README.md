# Frota

Sistema interno de **controle de frota de veículos** — Polícia Penal do Estado de São Paulo.

## 📁 Estrutura

```
Frota/
├── index.html     → interface do sistema (PWA)
├── server.js      → servidor Express (API REST + arquivos estáticos)
├── package.json   → dependências e scripts
├── vercel.json    → configuração de deploy na Vercel
├── manifest.json  → manifesto PWA
├── .gitignore
├── css/
│   └── style.css  → estilos da interface
├── js/
│   ├── config.js  → configurações do front-end
│   └── app.js     → lógica do front-end (CRUD, filtros, estatísticas)
├── data/
│   └── db.json    → banco de dados JSON (dados iniciais)
└── images/
    └── brasao-policia-penal-sp.png → brasão oficial
```

## 🚀 Como executar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.

## ☁️ Deploy na Vercel

O `vercel.json` roteia todas as requisições para o `server.js` (Express).

> ⚠️ Na Vercel o sistema de arquivos é somente leitura: a API lê o `db.json`,
> mas as alterações são persistidas no navegador (localStorage) como fallback.

## 🔌 API

| Método | Rota             | Descrição              |
|--------|------------------|------------------------|
| GET    | `/api/frota`     | Lista todos os veículos|
| GET    | `/api/frota/:id` | Busca um veículo       |
| POST   | `/api/frota`     | Cadastra um veículo    |
| PUT    | `/api/frota/:id` | Atualiza um veículo    |
| DELETE | `/api/frota/:id` | Exclui um veículo      |
