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
chamada à API, já com os 29 veículos e o usuário admin. A estrutura é **auto-curada**: na
inicialização são executados `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para todas as colunas
do módulo de manutenção, de forma que um banco criado por uma versão anterior do app (onde
`CREATE TABLE IF NOT EXISTS` não acrescenta colunas novas) volte a aceitar lançamentos sem
intervenção manual. Falhas na migração de dados antigos ou na carga inicial **não** derrubam
a API: ficam registradas no log e o salvamento continua funcionando. A tabela `manutencoes` concentra
as **ordens de serviço de manutenção** e trata a **troca de óleo** como um tipo
(`TROCA DE ÓLEO`). Trocas de óleo antigas (tabela `oil_changes`) são migradas
automaticamente para `manutencoes` na primeira execução, sem ação manual.

## 🧾 Histórico de manutenção por veículo

No **Painel Geral**, clicar em **qualquer parte do cartão** do veículo abre o **histórico daquele
veículo**; a **edição do veículo** fica no botão de lápis (✏️) do próprio cartão. As placas das
tabelas de **Veículos**, **Manutenção** e **Troca de Óleo** também abrem o histórico.

O histórico mostra:

- dados do veículo (grupo, ano, hodômetro atual, combustível e status);
- resumo em chips: total de manutenções, trocas de óleo, custo acumulado, data da última
  manutenção e próxima manutenção programada (km);
- **gráfico de custo por mês** (últimos 12 meses com registros) — clicar numa barra filtra a
  tabela por aquele mês;
- **linha do tempo** cronológica com o intervalo em km desde a intervenção anterior, os dias
  parado por OS e a média de km entre manutenções;
- filtros rápidos: **Todos**, **Manutenções** e **Trocas de óleo**;
- cada registro mostra tipo, serviço, peças/óleo, oficina, hodômetro, status da OS, custo e
  datas de entrada/saída, com botões para **editar** e **excluir**;
- ações: **Nova manutenção** e **Troca de óleo** (já com o veículo selecionado),
  **Exportar CSV** do histórico e **Atualizar** (recarrega do servidor);
- ao abrir, o histórico busca as ordens de serviço direto na API, garantindo os dados mais
  recentes mesmo que outro computador tenha lançado a manutenção.

O restante do cartão continua abrindo a **edição do veículo**; a placa é que abre o histórico.
`Esc` fecha o modal.

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
> 🔎 **Diagnóstico de erros**: respostas 500 da API trazem a causa vinda do Postgres
> (`{"error":"Erro no servidor: column \"itens\" of relation \"manutencoes\" does not exist","sqlstate":"42703"}`)
> e o mesmo texto sai no log da função na Vercel (`[API] POST /api/manutencoes → ...`), em vez
> de um genérico "Erro interno no servidor.". `INSERT` com colisão de id (`23505`) é refazido
> automaticamente, evitando erro ao lançar duas OS no mesmo instante.
> Quando o erro não vem da API (página da plataforma, bloqueio de proxy/firewall,
> timeout), o aviso mostra o status HTTP e um trecho da resposta
> (`Não foi possível salvar: Erro na API (HTTP 403) — ... Pode ser bloqueio da
> rede/proxy — fale com o TI.`), com dicas conforme o caso.
>
> ⏱️ **Tempo**: a inicialização do banco roda em paralelo (criações, ajustes,
> migração e seed), o limite da função na Vercel é de 60s (`maxDuration`) e cada
> ida ao Neon tem teto de 20s — estourando, a API responde JSON 504 e o registro
> entra na fila offline em vez de falhar sem explicação. O navegador aguarda cada
> chamada por até 30s. A API nunca devolve HTML: até falhas fora do fluxo normal
> viram JSON 500.
>
> 🛡️ **Anti-cache (v3.8)**: respostas velhas presas em cache (CDN, proxy
> corporativo, navegador) faziam um lançamento "sumir" ou devolviam 404 antigo.
> Agora a API é blindada em três camadas: (1) toda resposta JSON sai com
> `Cache-Control: no-store`; (2) toda chamada do front leva `?_t=<timestamp>`,
> tornando cada URL única; (3) se um `POST /api/manutencoes` recebe 404 **fora
> da API** (resposta não-JSON, típica de página de erro/proxy/cache), o front
> repete automaticamente no alias `/api/manutencao`. Além disso, todo erro da
> API mostra a tag `[cache HIT]` / `[cache MISS]` — HIT indica que a resposta
> veio de uma camada de cache, MISS que veio direto da origem.
