// ==========================================
// FROTA PRO v3.0 - Configuração Supabase
// ==========================================
// INSTRUÇÕES:
// 1. Crie uma conta em https://supabase.com (gratuito)
// 2. Crie um novo projeto
// 3. Vá em Project Settings > API
// 4. Copie a "URL" e a "anon public" API Key
// 5. Cole abaixo substituindo os placeholders
// 6. Execute o script supabase-setup.sql no SQL Editor
//
// Enquanto não configurar, o sistema funciona em MODO LOCAL
// (dados salvos no navegador via localStorage)

const CONFIG = {
  // SUBSTITUA pelos valores reais do seu projeto Supabase:
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_KEY: 'SUA-CHAVE-ANON-PUBLIC-AQUI',

  VERSION: '3.0',
  APP_NAME: 'Frota Pro',

  // Login local (funciona sem internet/backend)
  LOCAL_USER: 'admin',
  LOCAL_PASS: 'admin2025',

  // Detecta se o Supabase foi configurado
  get isConfigured() {
    const url = this.SUPABASE_URL;
    const key = this.SUPABASE_KEY;
    return url && key && !url.includes('SEU-PROJETO') && !key.includes('SUA-CHAVE');
  }
};