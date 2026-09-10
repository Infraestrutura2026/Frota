# Frota Pro

Sistema de **controle de frota** — grupos S2, S3 e S4 (29 veículos).
Online (Vercel + Neon) para acesso de vários computadores ao mesmo tempo.

## 📁 Estrutura

```
Frota/
├── index.html          → interface (login, dashboard, cadastro de veículos)
├── server.js           → servidor Node nativo (API REST + arquivos estáticos)
├── package.json        → scripts e dependência (@neondatabase/serverless)
├── vercel.json         → configuração de deploy na Vercel
├── manifest.json       → manifesto PWA
├── css/
│   └── style.css       → estilos da interface
├── js/
│   ├── config.js       → configurações do front-end
│   └── app.js          → lógica do front-end (login, dashboard, CRUD via API)
├── api/
│   └── [...path].js    → função serverless /api/* na Vercel (usa server.js)
└── data/
    └── db.json         → banco local (modo dev, sem DATABASE_URL)
```

## 🗄️ Persistência

| Ambiente | Banco usado |
|---|---|
| `DATABASE_URL` definida (Vercel) | **Neon (Postgres)** — compartilhado entre todos os computadores |
| Sem `DATABASE_URL` (local dev) | `data/db.json` |

As tabelas (`vehicles`, `users` e `manutencoes`) são **criadas automaticamente** na primeira
chamada à API, já com os 29 veículos e o usuário admin. A tabela `manutencoes` concentra
as **ordens de serviço de manutenção** e trata a **troca de óleo** como um tipo
(`TROCA DE ÓLEO`). Trocas de óleo antigas (tabela `oil_changes`) são migradas
automaticamente para `manutencoes` na primeira execução, sem ação manual.

## 🚀 Executar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:8080` — login: **admin / admin2025**

## ☁️ Deploy (Vercel + Neon)

1. **Neon**: crie um projeto em [neon.tech](https://neon.tech) e copie a
   *connection string* (`postgresql://...`).
2. **Vercel**: importe o repositório `Infraestrutura2026/Frota`.
3. Em **Settings → Environment Variables**, adicione:
   - `DATABASE_URL` = *connection string do Neon*
4. Deploy. Pronto — o sistema fica online e os dados são compartilhados.

## 🔌 API

| Método       | Rota                | Descrição                      |
|--------------|---------------------|--------------------------------|
| GET          | `/api/status`       | Status + banco em uso (neon/file) |
| GET          | `/api/data`         | Veículos + usuários (sem senha)|
| POST         | `/api/login`        | Login `{usuario, senha}`       |
| POST         | `/api/seed`         | Recria os 29 veículos iniciais |
| GET          | `/api/vehicles`     | Lista veículos                 |
| GET          | `/api/vehicles/:id` | Busca um veículo               |
| POST         | `/api/vehicles`     | Cadastra um veículo            |
| PATCH/PUT    | `/api/vehicles/:id` | Atualiza um veículo            |
| DELETE       | `/api/vehicles/:id` | Exclui um veículo              |
| idem         | `/api/users`        | Mesmas operações p/ usuários   |
| GET          | `/api/manutencoes`  | Lista manutenções (filtros: `tipo`, `status_os`, `mes`, `ano`, `q`, `placa`, `vehicle_id`) |
| POST         | `/api/manutencoes`  | Registra uma manutenção / ordem de serviço |
| PATCH/DELETE | `/api/manutencoes/:id` | Edita/exclui um registro    |
| GET          | `/api/trocas-oleo`  | Lista trocas de óleo (= manutenções do tipo `TROCA DE ÓLEO`) |
| POST         | `/api/trocas-oleo`  | Registra uma troca de óleo     |
| PATCH/DELETE | `/api/trocas-oleo/:id` | Edita/exclui um registro    |
| GET          | `/api/trocas-oleo/relatorio-mensal` | Relatório mensal |

> 🔒 Senhas ficam hasheadas (SHA-256) e nunca são retornadas pela API.
