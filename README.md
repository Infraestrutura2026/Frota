# Frota Pro v3.0 — Versão Online (Supabase)

Sistema de Gestão de Frotas com backend real via **Supabase** (PostgreSQL + API REST), mantendo todos os 29 veículos do Complexo Penal de Marília e todas as funcionalidades originais.

## O que mudou na versão online?

| Recurso | Local (v3.0) | Online (v3.0) |
|---------|-------------|---------------|
| Backend | Google Apps Script / localStorage | **Supabase API REST** |
| Banco de dados | Nenhum (planilha ou local) | **PostgreSQL real** |
| Multiusuário | Não | **Sim** (tabela `users`) |
| Persistência | Apenas neste navegador | **Nuvem — acessível de qualquer dispositivo** |
| Offline | Funciona sem internet | **Fallback local** se Supabase não estiver configurado |

## Estrutura do projeto

```
frota-online/
├── index.html          # Interface PWA (login, dashboard, módulos)
├── css/style.css       # Estilos completos
├── js/
│   ├── config.js       # URL e chave do Supabase (CONFIGURE AQUI)
│   └── app.js          # Lógica com Supabase + fallback local
├── images/             # Ícones PWA (192, 512, favicon)
├── manifest.json       # Manifesto PWA
├── sw.js               # Service Worker (offline cache)
├── supabase-setup.sql  # DDL para criar tabelas no Supabase
└── README.md           # Este arquivo
```

## Como colocar online (passo a passo)

### 1. Criar conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Clique em **"New Project"** e dê um nome (ex: `frota-pro`)
4. Aguarde a criação (1-2 minutos)

### 2. Criar as tabelas

1. No painel do Supabase, vá em **SQL Editor** (ícone de terminal)
2. Cole TODO o conteúdo do arquivo `supabase-setup.sql`
3. Clique em **Run** — as tabelas serão criadas automaticamente

### 3. Obter URL e chave da API

1. Vá em **Project Settings > API**
2. Copie a **URL** (ex: `https://abcde1234567890.supabase.co`)
3. Copie a **anon public** API Key (ex: `eyJhbGciOiJIUzI1NiIs...`)

### 4. Configurar o app

Abra o arquivo `js/config.js` e substitua os valores:

```js
SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
SUPABASE_KEY: 'SUA-CHAVE-ANON-PUBLIC-AQUI',
```

### 5. Hospedar os arquivos estáticos

O Frota Pro é um **PWA estático** (HTML/CSS/JS). Você pode hospedar em qualquer lugar:

| Opção | Como fazer |
|-------|-----------|
| **Vercel** (recomendado) | Arraste a pasta `frota-online` em [vercel.com](https://vercel.com) |
| **Netlify** | Arraste a pasta em [netlify.com](https://netlify.com) |
| **GitHub Pages** | Suba em um repo e ative Pages nas configurações |
| **Servidor próprio** | Envie os arquivos via FTP para `/public_html/` |
| **Supabase Storage** | Hospede direto no Storage do próprio Supabase |

### 6. Configurar CORS (se necessário)

1. No Supabase, vá em **API > Settings**
2. Adicione o domínio onde hospedou o app em **Allowed Origins**
3. Exemplo: `https://meu-frota.vercel.app`

### 7. Acessar o sistema

1. Abra a URL onde hospedou
2. Login padrão: `admin` / `admin2025`
3. Pronto! Todos os dados serão salvos no Supabase

## Tabelas do banco de dados

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (login) |
| `vehicles` | Cadastro de veículos (29 iniciais) |
| `fueling` | Registros de abastecimento |
| `maintenance` | Ordens de manutenção |
| `km_records` | Lançamentos de quilometragem |
| `drivers` | Cadastro de motoristas |

## Modo Offline (fallback)

Se o Supabase não estiver configurado (ou estiver fora do ar), o app **automaticamente cai para modo local**:
- Dados salvos no `localStorage` do navegador
- Funciona 100% sem internet
- Quando o Supabase voltar, basta sincronizar (importar)

## Dicas de segurança

- **Mude a senha padrão** do usuário `admin` após o primeiro acesso
- Para produção, habilite **Row Level Security (RLS)** no Supabase e crie políticas por usuário
- Use **HTTPS** obrigatoriamente (Vercel/Netlify já fazem isso)
- Faça backup periódico do banco via Supabase Dashboard > Database > Backups

## Suporte

Se precisar de ajuda para configurar o Supabase ou hospedar o app, é só pedir!

---

**Frota Pro v3.0** — Complexo Penal de Marília 🚗