# 🚗 Frota Pro v3.0

Sistema de Gestão de Frotas para o **Complexo Penal de Marília**.

## 📋 Funcionalidades

- ✅ Dashboard com KPIs
- ✅ Cadastro de veículos (29 veículos importados da planilha)
- ✅ Controle de abastecimento
- ✅ Registro de manutenção
- ✅ Quilometragem (KM)
- ✅ Cadastro de motoristas
- ✅ Relatórios visuais
- ✅ Importação de dados da planilha
- ✅ PWA (Progressive Web App)
- ✅ Backend via Google Sheets + Apps Script

## 🚀 Instalação

1. Faça upload desta pasta para o **GitHub Pages** (raiz do repositório).
2. Crie uma planilha Google Sheets com as abas: `Veiculos`, `Abastecimento`, `Manutencao`, `Quilometragem`, `Motoristas`.
3. Abra o editor Apps Script (Extensões > Apps Script) e cole o conteúdo de `apps-script/code.gs`.
4. Implante como Web App (Deploy > New deployment > Web app). Copie a URL.
5. Abra `js/config.js` e substitua `YOUR_GOOGLE_SCRIPT_URL_HERE` pela URL do Web App.
6. Acesse a URL do GitHub Pages — o sistema já estará funcional!

## 📱 PWA

Acesse pelo celular e adicione à tela inicial para instalar como app nativo.

## 📁 Estrutura

```
frota/
├── index.html
├── manifest.json
├── sw.js
├── css/style.css
├── js/config.js
├── js/app.js
├── images/icon-*.png
└── apps-script/code.gs
```

## 🛠️ Tecnologias

- HTML5, CSS3, Vanilla JS
- Google Sheets API (via Apps Script)
- PWA / Service Worker

---
Frota Pro v3.0 — Complexo Penal de Marília
