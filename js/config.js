// ==========================================
// FROTA PRO v3.0 - Configuração
// ==========================================
// INSTRUÇÕES:
// 1. Implante o Apps Script como Web App (Deploy > New deployment)
// 2. Copie a URL e cole abaixo, substituindo a URL de exemplo
// 3. Enquanto não configurar, o sistema funciona em MODO LOCAL
//    (dados salvos no navegador)

const CONFIG = {
  // SUBSTITUA pela URL real do seu Web App do Google Apps Script:
  API_URL: 'https://script.google.com/macros/s/AKfycbyK1xHl0AdnpC8DFWI2qeIc_P5JxumNuQdHXGUp5UkJREz1LEMYAb3QxqRZhIdz-nYd_A/exec',

  VERSION: '3.0',
  APP_NAME: 'Frota Pro',

  // Login local (funciona sem internet/backend)
  LOCAL_USER: 'admin',
  LOCAL_PASS: 'admin2025',

  // Detecta se a URL foi configurada
  get isConfigured() {
    return this.API_URL && !this.API_URL.includes('YOUR_GOOGLE_SCRIPT_URL_HERE');
  }
};
