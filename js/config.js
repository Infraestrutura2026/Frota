// ==========================================
// FROTA PRO v3.1 — Configuração do Sistema
// ==========================================
// INSTRUÇÕES:
// Para ativar a sincronização em nuvem via Supabase:
// 1. Crie um projeto em https://supabase.com
// 2. Vá em Project Settings > API
// 3. Copie a URL e a chave 'anon public' e cole abaixo.
//
// Enquanto não configurado, o sistema funciona 100% em MODO LOCAL
// com todos os 29 veículos de Marília salvos e operacionais no navegador.

const CONFIG = {
  // Insira sua URL e Key do Supabase aqui (se for usar na nuvem):
  SUPABASE_URL: '',
  SUPABASE_KEY: '',

  VERSION: '3.1',
  APP_NAME: 'Frota Pro',

  // Login padrão (funciona em qualquer dispositivo/ambiente)
  LOCAL_USER: 'admin',
  LOCAL_PASS: 'admin2025',

  // Detecta se o Supabase foi preenchido com URL e chave válidas
  get isConfigured() {
    const url = (this.SUPABASE_URL || '').trim();
    const key = (this.SUPABASE_KEY || '').trim();
    return Boolean(url && key && !url.includes('SEU-PROJETO') && !key.includes('SUA-CHAVE') && url.startsWith('http'));
  }
};
