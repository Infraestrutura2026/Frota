# Frota Pro v3.0 — Sistema de Gestão de Frotas
**Complexo Penal de Marília — Secretaria da Administração Penitenciária**

Sistema completo para gestão operacional e controle de frotas com suporte híbrido: **Nuvem (Supabase / PostgreSQL)** e **Modo Local (Offline-First via PWA)**, mantendo os 29 veículos institucionais e todo o histórico de operações.

---

## 🚀 Principais Recursos e Melhorias Implementadas

1. **Arquitetura Híbrida Resiliente (Online & Offline Real):**
   - Conexão em nuvem via **Supabase API REST (PostgreSQL)**.
   - **Fallback automático transparente:** Se a internet ou o Supabase caírem, o sistema opera normalmente no navegador via `localStorage` sem travar a interface.
   - Sincronização de dados e pré-carga automática dos 29 veículos oficiais.

2. **Controle Integrado de Hodômetro (Odômetro Automático):**
   - Ao lançar uma viagem ou abastecimento, o sistema compara a quilometragem e **atualiza automaticamente o hodômetro do veículo** no cadastro geral.
   - Preenchimento inteligente: ao selecionar uma placa, o sistema busca e preenche o odômetro atual como KM de saída.
   - Cálculo instantâneo da distância percorrida e alerta contra inconsistências (KM retorno menor que KM saída).

3. **CRUD Completo em Todos os Módulos:**
   - **Veículos:** Cadastro, edição, busca e exclusão com proteção para administradores.
   - **Abastecimento:** Registro e edição com cálculo automático do preço por litro (R$/L) e odômetro do veículo.
   - **Manutenção:** Registro e edição de ordens de serviço (Preventiva, Corretiva, Revisões), custo e fornecedor/oficina.
   - **Quilometragem / Viagens:** Registro completo com KM de saída, retorno, motorista e finalidade da viagem.
   - **Motoristas:** Cadastro completo com monitoramento de validade da CNH e suporte para condutores em processo de renovação.
   - **Usuários:** Perfis de Administrador e Operador com hashing SHA-256.

4. **Painel Geral (Dashboard) com Ações Rápidas e Alertas:**
   - Botões de atalho no topo para agilizar os lançamentos diários.
   - **Banner de Alertas Proativos:** Notifica imediatamente sobre motoristas com CNH vencida ou a vencer nos próximos 30 dias e veículos em oficina.
   - Indicadores de total da frota, veículos ativos, manutenções, gastos mensais com combustível e KM rodado no mês.

5. **12 Relatórios Gerenciais com Exportação e Impressão Oficial:**
   - Custo total por veículo (combustível + oficina).
   - Consumo médio (KM/L).
   - Manutenções detalhadas.
   - Vencimento de CNH com ordenação por urgência.
   - Veículos parados / em arrolamento / em manutenção.
   - Quilometragem rodada por motorista e por período.
   - Disponibilidade da frota e utilização por grupos (S2, S3, S4).
   - **Exportação para Excel (CSV em UTF-8 com BOM).**
   - **Impressão Oficial / PDF:** Layout formatado para folha A4 com cabeçalho institucional do Governo do Estado de São Paulo e campos para assinatura do Responsável e do Condutor.

---

## 📁 Estrutura do Projeto

```
Frota/
├── index.html          # Interface PWA responsiva (Dashboard, Módulos, Modais e Impressão)
├── css/style.css       # Folha de estilos completa (Design moderno dark, alertas, toasts e print)
├── js/
│   ├── config.js       # Configurações de API do Supabase e parâmetros da versão
│   └── app.js          # Lógica completa (CRUD, relatórios, fallback offline, auto-odômetro)
├── images/             # Ícones PWA (72x72 até 512x512)
├── manifest.json       # Manifesto PWA para instalação como app no desktop/celular
├── sw.js               # Service Worker com estratégia Network-First e cache offline
├── supabase-setup.sql  # Script DDL com tabelas, restrições UNIQUE e índices de alta performance
└── README.md           # Documentação completa
```

---

## ☁️ Publicação na Vercel com Neon (produção)

Para disponibilizar o sistema na internet com dados compartilhados entre os computadores, use **Vercel + Neon PostgreSQL**. O arquivo `api/[...path].js` mantém as rotas `/api/*` e substitui o armazenamento local em JSON por um banco persistente.

1. Crie um projeto gratuito no [Neon](https://neon.tech) e copie a **connection string** PostgreSQL.
2. Na Vercel, importe o repositório `Infraestrutura2026/Frota` ou execute `npx vercel login` e `npx vercel --prod`.
3. Cadastre a variável `DATABASE_URL` no projeto da Vercel para os ambientes **Production**, **Preview** e **Development**.
4. Faça o deploy. Na primeira requisição, a API cria a tabela `frota_records` e carrega automaticamente os 29 veículos e o usuário administrador inicial.
5. Valide a publicação acessando `/api/status`; a resposta deve informar `online: true` e `mode: "neon"`.

> A connection string do Neon é um segredo: ela deve ficar somente nas variáveis de ambiente da Vercel e nunca no código ou no Git. O servidor local continua usando `data/db.json` para desenvolvimento.

## 🛠️ Configuração e Execução

### Acesso Rápido Local (Desenvolvimento / Teste)
O sistema pode ser executado em qualquer servidor HTTP estático (ou abrindo `index.html` diretamente):
```bash
python3 -m http.server 8080
```
Acesse no navegador: `http://localhost:8080`

### Usuário Padrão para Login:
- **Usuário:** `admin`
- **Senha:** `admin2025`

### Configuração com Supabase (Opcional para Sincronização em Nuvem):
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Execute o conteúdo do arquivo `supabase-setup.sql` no **SQL Editor**.
3. Em **Project Settings > API**, copie a **URL** e a **anon public API Key**.
4. Configure os valores no arquivo `js/config.js`:
   ```javascript
   SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
   SUPABASE_KEY: 'SUA-CHAVE-ANON-PUBLIC',
   ```

---

## 📋 Veículos Oficiais Pré-Cadastrados (Complexo Penal de Marília)

O sistema já vem integrado com o catálogo oficial dos **29 veículos** (GM Spin, Renault Master, Ford F-4000, Mercedes Comil, Toyota Hilux SW4, Iveco Daily, GM S10, Tiggo 8, Mitsubishi Outlander, etc.), organizados por grupos (S2, S3, S4).
