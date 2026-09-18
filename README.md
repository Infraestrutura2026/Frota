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
│   ├── index.js        → ponto de entrada principal /api na Vercel (usa server.js)
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

## 🛢️ Troca de óleo — intervalo fixo de 10.000 km e aviso no painel

**Toda troca de óleo vale por 10.000 km.** A regra é aplicada nas duas pontas:

- **No formulário** (`Manutenção` → tipo *Troca de óleo*, ou
  **Troca de Óleo → Registrar troca**), o campo **“Próxima troca (km)”** é
  **calculado e somente leitura**: `hodômetro + 10.000 km`. O hodômetro já vem
  preenchido com o km do cadastro do veículo, e o valor é recalculado enquanto o
  operador digita — não há como gravar uma troca com intervalo diferente.
- **Na API** (`server.js`), `insertManutencao` / `updateManutencao` aplicam a
  mesma regra (`aplicaIntervaloTrocaOleo`), então o intervalo também vale para
  lançamentos que sobem pela **fila offline** do navegador ou por chamada direta
  em `/api/manutencoes` e `/api/trocas-oleo`. `GET /api/status` informa o valor
  vigente em `intervalo_troca_oleo_km`.

Para mudar o intervalo (ex.: 15.000 km), altere `OIL_INTERVAL_KM` nos **dois**
arquivos: `server.js` e `js/app.js`.

O **hodômetro do cadastro do veículo** é o “km atual” usado no cálculo: toda OS
lançada com km maior atualiza o veículo (`sincronizaHodometroVeiculo`, nunca
diminui), e o front faz o mesmo no cache local.

### Onde o aviso aparece

| Tela | O que mostra |
|---|---|
| **Painel Geral** | Card **“Troca de óleo — próxima troca”** com o resumo (`N vencidas · N próximas · N sem troca registrada`) e a lista dos veículos que pedem atenção (clicar abre o histórico; **◉ Trocar** já abre a troca de óleo do veículo). Cada cartão de veículo tem a linha da troca de óleo em **caixa alta**, só com o estado e a próxima troca — ex.: `✅ TROCA EM DIA. PRÓXIMA TROCA COM 62.952 KM`, `⚠️ TROCA PRÓXIMA. FALTAM 631 KM PARA OS 93.000 KM`, `⛔ TROCA VENCIDA. PREVISTA PARA 50.000 KM — VENCIDA HÁ 2.906 KM` e `◉ SEM TROCA REGISTRADA` — com faixa amarela/vermelha na lateral quando está próxima ou vencida. |
| **Menu lateral** | Selo vermelho no item **Troca de Óleo** com a quantidade de veículos pedindo atenção. |
| **Veículos** | Coluna **“Troca de óleo”** com a situação (badge + faltam/vencidos) e o botão **◉** para registrar a troca direto na linha. |
| **Troca de Óleo** | Tabela **“Situação da frota — próxima troca”** (última troca, hodômetro, próxima troca, situação e ação), contador de vencidas/próximas e a coluna **“Próxima troca”** no histórico de registros. |
| **Histórico do veículo** | Chip com a situação atual da troca de óleo. |

Estados exibidos: **✅ Troca em dia** (mais de 1.000 km para vencer),
**⚠️ Troca próxima** (faltam 1.000 km ou menos), **⛔ Troca vencida** (passou dos
10.000 km — mostra quantos km além), **◉ Sem troca registrada** (nenhum registro
no sistema) e **◉ Sem hodômetro** (última troca sem km lançado).

Regras de lançamento: um hodômetro **menor** que o da última troca é recusado
(dado inconsistente) e uma troca lançada **antes** de completar os 10.000 km pede
confirmação — é permitida (troca antecipada é decisão da oficina), mas fica
registrada com o aviso.

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

### Roteamento: API primeiro

O `vercel.json` declara o fallback do SPA (`/((?!api/).*) → /index.html`) e,
**antes dele**, uma regra explícita de API:

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/:path*" },
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

A ordem importa: se o fallback do SPA vier primeiro (ou se a exclusão da API
falhar), um `POST /api/manutencoes` é respondido pelo `index.html` — volta HTML
em vez de JSON, com 404/405 — e o salvamento quebra sem explicação. Com a regra
`/api/:path*` na frente, todo caminho de API é resolvido pela função antes de o
fallback ser considerado.

### 🔬 Sonda de POST em produção (GitHub Actions)

O workflow `.github/workflows/api-post-check.yml` sonda a API **de fora** da
rede da corporação (os runners do GitHub saem pela internet comum). É ele que
responde à pergunta que não dá para responder de dentro do escritório:

> *O POST quebra por causa da nossa rede ou por causa da Vercel?*

- **Rodando no GitHub, o POST funciona** → quem altera a requisição é a rede
  interna (proxy/firewall trocando método, path ou corpo). Leve o resumo ao TI.
- **Rodando no GitHub, o POST falha igual** → o problema está na API/Vercel.

Como rodar: **Actions → "API POST check (produção)" → Run workflow**. Aceita
`base_url` (padrão `https://frota-psi.vercel.app`). Opcionalmente marca
`sonda_completa = true` para criar **e apagar** uma OS de teste, provando o
caminho completo de escrita no banco — a remoção roda por `trap`, inclusive se
a etapa falhar no meio. Também há uma execução agendada em dias úteis às 09:00
de Brasília, que roda **somente** as sondas leituras (`/api/echo`), sem tocar
no banco.

## 🔌 API

| Método       | Rota                | Descrição                      |
|--------------|---------------------|--------------------------------|
| GET          | `/api/status`       | Status + banco em uso (neon/file) |
| GET          | `/api/echo`         | **Espelho da rede**: devolve o que a função recebeu (path, método, host, query, corpo e cabeçalhos de proxy). `?completo=1` inclui o dump de **todos** os cabeçalhos — sempre sem credenciais |
| GET          | `/api/data`         | Veículos + usuários (sem senha)|
| POST         | `/api/login`        | Login `{usuario, senha}`       |
| POST         | `/api/seed`         | Recria os 29 veículos iniciais |
| GET          | `/api/vehicles`     | Lista veículos                 |
| GET          | `/api/vehicles/:id` | Busca um veículo               |
| POST         | `/api/vehicles`     | Cadastra um veículo            |
| PATCH/PUT    | `/api/vehicles/:id` | Atualiza um veículo (upsert: id inexistente é gravado) |
| POST         | `/api/vehicles/:id` | Atualiza um veículo (equivale a PATCH/PUT; aceita `X-HTTP-Method-Override` / `?_method=`) |
| DELETE       | `/api/vehicles/:id` | Exclui um veículo              |
| idem         | `/api/users`        | Mesmas operações p/ usuários   |
| GET          | `/api/manutencoes`  | Lista manutenções (filtros: `tipo`, `status_os`, `mes`, `ano`, `q`, `placa`, `vehicle_id`) |
| POST         | `/api/manutencoes`  | Registra uma manutenção / ordem de serviço (com `id` no corpo, atualiza) |
| PATCH/PUT    | `/api/manutencoes/:id` | Edita um registro (upsert: id inexistente é gravado) |
| POST         | `/api/manutencoes/:id` | Edita um registro (equivale a PATCH/PUT; aceita `X-HTTP-Method-Override` / `?_method=`) |
| DELETE       | `/api/manutencoes/:id` | Exclui um registro          |
| GET          | `/api/trocas-oleo`  | Lista trocas de óleo (= manutenções do tipo `TROCA DE ÓLEO`) |
| POST         | `/api/trocas-oleo`  | Registra uma troca de óleo (com `id` no corpo, atualiza) |
| PATCH/PUT    | `/api/trocas-oleo/:id` | Edita um registro (upsert: id inexistente é gravado) |
| POST         | `/api/trocas-oleo/:id` | Edita um registro (equivale a PATCH/PUT; aceita `X-HTTP-Method-Override` / `?_method=`) |
| DELETE       | `/api/trocas-oleo/:id` | Exclui um registro          |
| GET          | `/api/trocas-oleo/relatorio-mensal` | Relatório mensal |

> 🛢️ **Troca de óleo — intervalo fixo (v3.9.0)**: toda troca de óleo gravada
> (POST/PATCH em `/api/manutencoes`, `/api/trocas-oleo` ou `/api/manutencao`)
> sai com `proxima_manutencao = hodômetro + 10.000 km`, mesmo que o cliente
> mande outro valor — ver a seção “Troca de óleo — intervalo fixo de 10.000 km e
> aviso no painel”.
>
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
> 🪞 **Espelho da rede — `GET /api/echo` (v3.8.1 / v3.8.2)**: quando a suspeita é que a
> *rede* altera a requisição no caminho, este endpoint devolve exatamente o que
> a **função** recebeu: `metodo`, `path`, `query`, `host`, `x-forwarded-*`,
> `via`, o corpo recebido e a plataforma (deploy/região/banco). Comparar com o
> que o navegador enviou revela, em um JSON, **quem mudou o quê**:
>
> | Sintoma no `/api/echo` | O que significa |
> |---|---|
> | `"metodo": "GET"` num POST | um intermediário trocou o método e perdeu o corpo |
> | `path` diferente do pedido | proxy/firewall reescrevendo a URL |
> | `Host` ≠ `X-Forwarded-Host` | proxy transparente no caminho |
> | `content_length_anunciado` > `content_length_recebido` | rede truncando o corpo |
> | POST sem `Content-Length` | rede removendo o payload |
> | sem `x-vercel-id` | a resposta **não** passou pela Vercel |
>
> Aceita qualquer método de propósito (para flagrar troca de POST→GET) e
> responde sempre — mesmo que o corpo anunciado nunca chegue, devolve o aviso
> em vez de deixar a requisição pendurada.
>
> 🔐 **Credenciais nunca são ecoadas (v3.8.2)**: o `/api/echo` é público (não
> pede login), então nada que autentique alguém pode sair nele. Saem como
> `***omitido***`: `cookie`, `authorization`, `proxy-authorization` e as
> credenciais que a **própria Vercel injeta** na requisição —
> `x-vercel-oidc-token` (JWT que autentica o projeto, validade de 2h),
> `x-vercel-proxy-signature` e `x-vercel-proxy-signature-ts`. Além da lista
> fixa, qualquer cabeçalho cujo **nome** contenha `token`, `signature`,
> `secret`, `password`/`passwd`, `api-key`, `chave`, `senha`, `assertion`,
> `bearer` ou `credential` é redigido automaticamente, o que cobre nomes novos
> que apareçam no futuro. No `forwarded`, só a assinatura é trocada
> (`sig=***omitido***`) — `for=`, `host=` e `proto=` continuam visíveis. A
> redação vale para `cabecalhos_de_proxy` **e** `cabecalhos`.
>
> 🧾 **Dump completo é opcional (v3.8.2)**: por padrão o campo `cabecalhos`
> vem como `"(omitido — acrescente ?completo=1 à URL para ver todos)"` e só o
> bloco `cabecalhos_de_proxy` (já redigido) aparece. Para ver todos os
> cabeçalhos, abra `/api/echo?completo=1` — as credenciais continuam
> omitidas mesmo assim. O campo `campos_omitidos` lista os nomes suprimidos,
> para que omissão não seja confundida com **ausência** do cabeçalho. Seguem
> visíveis os campos úteis ao diagnóstico: `x-vercel-id`, `x-forwarded-*`,
> `x-real-ip`, `x-vercel-ip-city` e `x-vercel-ja4-digest`.
>
> 🔎 **`x-vercel-id` nos erros (v3.8.1)**: toda resposta que passa pela Vercel
> carrega `x-vercel-id` (região + deploy). Quando a resposta de erro **não**
> vem da API, a mensagem agora informa isso: mostra `[x-vercel-id: gru1::...]`
> se passou pela plataforma, ou `[sem x-vercel-id] — a resposta NÃO veio da API
> na Vercel: veio de proxy, firewall, cache ou página da plataforma.` quando não
> passou. É o que separa "a função falhou" de "alguém no caminho respondeu no
> lugar da função".
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
>
> 🗑️ **Exclusão não se perde mais com 404 da plataforma (v3.8.3)**: em produção
> aparecia `Não foi possível excluir: Erro na API (HTTP 404) — The page could
> not be found NOT_FOUND gru1::... [cache MISS]`. Esse corpo é a **página
> NOT_FOUND da Vercel** (HTML), não o JSON da API — a requisição **nem chegava
> à função** (deploy trocando no meio, rewrite perdido, proxy no caminho) — e,
> ainda assim, o app tratava como erro definitivo e **descartava a exclusão**,
> deixando o registro na tela como se nada tivesse acontecido. Agora:
>
> - o alias `/api/manutencao` cobre **qualquer método** da família
>   (`/manutencoes[/:id]` → `/manutencao[/:id]`, query preservada), não só o
>   POST: GET, POST, PATCH/PUT e DELETE ganham a segunda tentativa quando o
>   404 não veio da nossa API;
> - cada erro carrega `doNosso` (a resposta veio da nossa API? = `content-type`
>   é JSON). **404 fora de JSON vira indisponibilidade**: a exclusão é
>   enfileirada e repetida automaticamente, em vez de perdida;
> - **404 vindo da API** (JSON `{"error":"Not found"}`) na exclusão de
>   manutenção ou veículo é tratado como "já não existe": a exclusão é
>   concluída e o registro sai da tela (e sai da fila o que ainda apontava para
>   aquele id, para a fila não travar);
> - nas filas de sincronização, o atalho "404 = já não existe" **só** vale para
>   404 da nossa API — 404 da plataforma mantém o item na fila;
> - a mensagem passou a dizer a verdade:
>   `A requisição não chegou à API (404 da plataforma, não da função) — o
>   registro NÃO foi alterado no servidor. Exclusão enfileirada neste
>   dispositivo — será repetida automaticamente assim que a API responder.`
>
> ⚡ **Sistema sempre online e auto-recuperação (v3.8.4)**:
> - **Ponto de entrada canônico `api/index.js` + rewrites corrigidos na Vercel**: rotas da API (`/api/*`) agora contam com `api/index.js` e regras de rewrite explícitas no `vercel.json` (`/api/(.*)` → `/api`), impedindo que chamadas de API caiam na página NOT_FOUND 404 da Vercel;
> - **Resolução inteligente de rota**: `server.js` detecta e desembala os cabeçalhos de rewrite da Vercel (`x-matched-path` e `x-forwarded-url`) e atende requisições diretas a `/api` com o status do sistema;
> - **Retentativa transparente em falhas transitórias**: oscilações rápidas de rede e tempo de despertar do banco Neon (cold-start / 502 / 503 / 504) passam por retentativa automática no front-end antes de qualquer erro ser disparado, impedindo que salvamentos entrem em falso modo offline;
> - **Heartbeat automático em segundo plano**: verificação periódica a cada 10s (em offline) ou 30s (em online) que detecta a volta da API e drena as filas pendentes (`flushMaintenanceQueue` e `flushVehicleQueue`) sem intervenção manual;
> - **Reconexão imediata por eventos**: reconexão e sincronização instantâneas ao detectar sinal de rede no navegador (`window online`) ou quando o usuário volta para a aba (`visibilitychange`);
> - **Badge de status interativo**: o indicador `● Offline` / `● Online` agora é clicável e exibe a quantidade de registros pendentes (`● Offline (1 pendente)`). Clicar no badge força teste imediato de conexão e sincronização.
>
> ✏️ **Edição sempre online (v3.8.5)**: a edição de um registro não cai mais em modo offline nem mostra "Sem conexão com a API". Eram dois caminhos que terminavam no mesmo aviso — `PATCH` barrado pela rede (proxy corporativo/firewall que só libera GET/POST responde **405**/**403**, e alguns nem respondem, derrubando a conexão) e `PATCH` para um **id que não existe no banco** (registro criado no dispositivo enquanto estava sem conexão, com id local de timestamp `> 1e11`, ou registro apagado em outro computador) — que devolvia **404** e mandava o salvamento para a fila. Agora:
>
> - **método efetivo no servidor (`reqMethod`)**: a API aceita o cabeçalho `X-HTTP-Method-Override` e o parâmetro `?_method=` (nessa ordem), então um `POST` pode executar `PATCH`/`PUT`/`DELETE` — útil quando a rede bloqueia o método real. O `/api/echo` mostra `metodo`, `metodo_efetivo` e `metodo_override`, e o log da API registra `PATCH<-POST` quando os dois diferem;
> - **override automático no front**: todo `PATCH`/`PUT`/`DELETE` do `api()` já sai com `X-HTTP-Method-Override`, e um `PATCH`/`PUT` que receba **405**/**403** ou falhe na rede é repetido automaticamente como **POST** com o mesmo cabeçalho, sobre o mesmo caminho;
> - **rotas de atualização aceitam POST com id**: `/api/manutencoes/:id`, `/api/vehicles/:id` e `/api/trocas-oleo/:id` tratam `PATCH`/`PUT` **e** `POST` com id informado (no path ou no corpo) como atualização; `POST` sem id continua sendo criação (`201`);
> - **upsert em `updateManutencao` / `updateVehicle`**: se o id não estiver no banco — ou for um id local `> 1e11`, que não caberia na coluna `INTEGER` (máx. 2.147.483.647) — o registro é **gravado** (com o mesmo id quando ele é real; com o próximo id livre quando é local, e o front adota o id devolvido na resposta) em vez de devolver **404**. A gravação usa `ON CONFLICT (id) DO UPDATE`, então duas máquinas salvando o mesmo id ao mesmo tempo também não estouram "duplicate key";
> - **front não cai mais em offline ao editar**: `saveMaintenance` e `saveVehicle` mandam `POST` direto quando o registro editado é pendente de sincronização ou tem id local `> 1e11`, e repetem por `POST` (upsert) se um `PATCH` devolver **404** da própria API — a interface permanece online e nenhum registro é enfileirado por engano;
> - **fila de sincronização não trava**: em `flushMaintenanceQueue` e `flushVehicleQueue`, um `update` com id local sai por `POST` e um **404** da API é repetido por `POST`, gravando o registro no banco remoto em vez de deixá-lo preso no dispositivo repetindo o mesmo `PATCH` para sempre.
>
> 🗑️ **Exclusão sempre online + usuários à prova de rede (v3.8.6)**: a v3.8.5 blindou a **edição** (PATCH/PUT), mas a **exclusão** (DELETE) caía no mesmo buraco — proxy/firewall corporativo que só libera GET/POST responde **405**/**403** a DELETE, e alguns nem respondem, derrubando a conexão. O usuário clicava em excluir, via \"Sem conexão com a API\" e o registro voltava para a tela. Agora:
>
> - **DELETE com fallback para POST no front**: `METODOS_COM_FALLBACK_POST` passa a incluir `DELETE`. Todo DELETE já sai com `X-HTTP-Method-Override: DELETE`; se receber **405**/**403** ou falhar na rede, é repetido automaticamente como **POST** com o mesmo cabeçalho, sobre o mesmo caminho — a API executa a exclusão normalmente. Vale para manutenções, veículos e para as filas offline (`flushMaintenanceQueue` / `flushVehicleQueue`).
> - **API: `/api/users/:id` à prova de rede e com upsert**: antes só aceitava `POST` para criação e `PATCH/PUT` para edição. Agora aceita `POST`/`PATCH`/`PUT` com id (no path ou no corpo) como atualização, igual a `/api/vehicles` e `/api/manutencoes`. `insertUser` e `updateUser` viram upsert com suporte a id fixo e id local `>1e11` (evita \"duplicate key\" em corrida e permite que edições offline sejam gravadas com id real depois). DELETE via `X-HTTP-Method-Override` já funcionava pelo `reqMethod`, mas agora a rota de usuários entra no mesmo padrão documentado.
> - **Mensagens e logs**: o log da API já registrava `DELETE<-POST` quando o override é usado, e o `/api/echo` já mostrava `metodo_efetivo` — agora DELETE também se beneficia desse diagnóstico.
