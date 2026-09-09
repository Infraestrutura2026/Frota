# Frota Pro

Sistema de **controle de frota** — grupos S2, S3 e S4 (29 veículos).

## 📁 Estrutura

```
Frota/
├── index.html          → interface (login, dashboard, cadastro de veículos)
├── server.js           → servidor Node nativo (API REST + arquivos estáticos)
├── package.json        → scripts e metadados (sem dependências externas)
├── vercel.json         → configuração de deploy na Vercel
├── manifest.json       → manifesto PWA
├── css/
│   └── style.css       → estilos da interface
├── js/
│   ├── config.js       → configurações do front-end
│   └── app.js          → lógica do front-end (login, dashboard, CRUD)
├── api/
│   └── [...path].js    → função serverless /api/* na Vercel (usa server.js)
└── data/
    └── db.json         → banco de dados JSON
```

## 🚀 Como executar localmente

```bash
npm start
```

Acesse `http://localhost:8080`.
Login padrão: **admin / admin2025**

## ☁️ Deploy na Vercel

O `vercel.json` envia `/api/*` para a função `api/[...path].js` (que usa o
mesmo código do `server.js`) e o restante para os arquivos estáticos.

## 🔌 API

| Método       | Rota                | Descrição                    |
|--------------|---------------------|------------------------------|
| GET          | `/api/status`       | Status da API + contadores   |
| GET          | `/api/data`         | Banco completo (JSON)        |
| GET          | `/api/vehicles`     | Lista veículos               |
| GET          | `/api/vehicles/:id` | Busca um veículo             |
| POST         | `/api/vehicles`     | Cadastra um veículo          |
| PATCH/PUT    | `/api/vehicles/:id` | Atualiza um veículo          |
| DELETE       | `/api/vehicles/:id` | Exclui um veículo            |
| idem         | `/api/users`        | Mesmas operações p/ usuários |
