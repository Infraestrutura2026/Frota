// ==========================================
// FROTA PRO v3.0 — Sistema de Gestão de Frotas
// Complexo Penal de Marília
// Lógica Completa: Modo Online (Supabase) + Fallback Local Robusto
// ==========================================

const App = (function() {
  let token = localStorage.getItem('frota_token');
  let isOnline = false;
  let vehicles = [];
  let fueling = [];
  let maintenance = [];
  let km = [];
  let drivers = [];
  let users = [];
  let currentUser = null;

  let editingVehicle = null;
  let editingFueling = null;
  let editingMaintenance = null;
  let editingKm = null;
  let editingDriver = null;
  let editingUser = null;

  // ========================
  // DADOS DOS 29 VEÍCULOS — COMPLEXO PENAL DE MARÍLIA
  // ========================
  const IMPORT_DATA = [
    { placa: 'CUQ3I89', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB170141', renavam: '1411081703', hodometro: 52952, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'CUW3J07', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SN171682', renavam: '1411079865', hodometro: 92369, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'TIT8E83', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB195053', renavam: '1408048016', hodometro: 52906, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'TIV8C29', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB174833', renavam: '1413413584', hodometro: 80003, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'TJY6A21', grupo: 'S2', marca: 'RENAULT', modelo: 'MASTER MINIBUS', ano: 2025, cor: 'BRANCA', chassi: '93YJ62001SJ015179', renavam: '1413828261', hodometro: 57902, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
    { placa: 'TLM2D25', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', chassi: '9BGJB7520SB179579', renavam: '1413413460', hodometro: 57662, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'FJF0688', grupo: 'S3', marca: 'FORD', modelo: 'F-4000', ano: 2018, cor: 'BRANCA', chassi: '9BFLF47P8JB012768', renavam: '1136808709', hodometro: 165873, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
    { placa: 'BRZ7720', grupo: 'S4', marca: 'GMC', modelo: '12170', ano: 1996, cor: 'BRANCA', chassi: '1GDM7H1J9TJ516578', renavam: '673310957', hodometro: 311382, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 3 },
    { placa: 'BVZ5E97', grupo: 'S4', marca: 'MERCEDES-BENZ', modelo: 'COMIL SVELTO U', ano: 1999, cor: 'PRETA', chassi: '9BM384073WB180715', renavam: '711698007', hodometro: 242225, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 40 },
    { placa: 'CFY2G52', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRATA', chassi: '8AJZX62G7D5004683', renavam: '585788421', hodometro: 154152, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'CFY2G97', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRETA', chassi: '8AJZX62G0D5004217', renavam: '585884404', hodometro: 246909, status: 'ARROLAMENTO', combustivel: 'ETANOL', capacidade: 5 },
    { placa: 'CMW9549', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 7012', ano: 2004, cor: 'BRANCA', chassi: '93ZC6680148315934', renavam: '847718328', hodometro: 106805, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
    { placa: 'CST0H92', grupo: 'S4', marca: 'IVECO', modelo: 'GCLASS 150', ano: 2020, cor: 'FANTASIA', chassi: '93ZA01LF0L8938076', renavam: '1258031083', hodometro: 33669, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 34 },
    { placa: 'DJL7937', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 70C16', ano: 2011, cor: 'PRATA', chassi: '93ZC68B01B8426929', renavam: '408793678', hodometro: 167185, status: 'ARROLAMENTO', combustivel: 'DIESEL', capacidade: 20 },
    { placa: 'EEF7G88', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2010, cor: 'PRATA', chassi: '9BG124GJ0AC441989', renavam: '201565498', hodometro: 602982, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
    { placa: 'FCK5196', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC412999', renavam: '1041251359', hodometro: 466636, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
    { placa: 'FCW8I62', grupo: 'S4', marca: 'CITROEN', modelo: 'JUMPY GREE AMB', ano: 2022, cor: 'BRANCA', chassi: '9V7VBBHXGNA802179', renavam: '1281132494', hodometro: 110240, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
    { placa: 'FJG7158', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC414069', renavam: '1041251545', hodometro: 265891, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
    { placa: 'FKE6H32', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019144', renavam: '1329600115', hodometro: 282733, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FKN6069', grupo: 'S4', marca: 'FORD', modelo: 'CARGO 816 S', ano: 2018, cor: 'PRATA', chassi: '9BFVEADS9JBS44959', renavam: '1148048860', hodometro: 218324, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
    { placa: 'FML8H43', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019186', renavam: '1329583393', hodometro: 221400, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FMM5G11', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018143', renavam: '1329615686', hodometro: 248248, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FRR1B42', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB019857', renavam: '1329625185', hodometro: 259728, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FSH3I13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018073', renavam: '1329588590', hodometro: 282851, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FSW4013', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', chassi: '9BG144DK0FC412617', renavam: '1041251499', hodometro: 485585, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
    { placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB018956', renavam: '1329614086', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', chassi: '95PDCM61DPB017004', renavam: '1329625061', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', chassi: '93YMAFEXAJJ205006', renavam: '1141330951', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
    { placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', chassi: 'JMYXTGF7WLZA00114', renavam: '1216646934', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
  ];

  // ========================
  // NOTIFICAÇÕES (TOAST)
  // ========================
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // ========================
  // SUPABASE API REST HELPERS
  // ========================
  async function sbRequest(table, method, body, id) {
    if (!CONFIG.isConfigured) return null;
    const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}${id ? '?id=eq.' + id : ''}`;
    const headers = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.warn('Supabase error:', res.status, errText);
        return null;
      }
      if (method === 'DELETE') return true;
      return await res.json();
    } catch (e) {
      console.warn('Supabase request error:', e.message);
      return null;
    }
  }

  async function sbGet(table, query) {
    if (!CONFIG.isConfigured) return null;
    const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}?select=*${query ? '&' + query : ''}`;
    const headers = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function sbInsert(table, obj) { return await sbRequest(table, 'POST', obj); }
  async function sbUpdate(table, id, obj) { return await sbRequest(table, 'PATCH', obj, id); }
  async function sbDelete(table, id) { return await sbRequest(table, 'DELETE', null, id); }

  // ========================
  // LOCALSTORAGE HELPERS
  // ========================
  function loadLocal() {
    const storedV = localStorage.getItem('frota_vehicles');
    if (storedV) {
      try {
        vehicles = JSON.parse(storedV);
      } catch (e) { vehicles = []; }
    }
    // Se não houver veículos cadastrados, inicializa automaticamente com os 29 veículos de Marília
    if (!vehicles || vehicles.length === 0) {
      vehicles = IMPORT_DATA.map((v, idx) => ({ ...v, id: idx + 1 }));
      localStorage.setItem('frota_vehicles', JSON.stringify(vehicles));
    }

    try { fueling = JSON.parse(localStorage.getItem('frota_fueling') || '[]'); } catch (e) { fueling = []; }
    try { maintenance = JSON.parse(localStorage.getItem('frota_maintenance') || '[]'); } catch (e) { maintenance = []; }
    try { km = JSON.parse(localStorage.getItem('frota_km') || '[]'); } catch (e) { km = []; }
    try { drivers = JSON.parse(localStorage.getItem('frota_drivers') || '[]'); } catch (e) { drivers = []; }
  }

  function saveLocal() {
    try {
      localStorage.setItem('frota_vehicles', JSON.stringify(vehicles));
      localStorage.setItem('frota_fueling', JSON.stringify(fueling));
      localStorage.setItem('frota_maintenance', JSON.stringify(maintenance));
      localStorage.setItem('frota_km', JSON.stringify(km));
      localStorage.setItem('frota_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.error('Erro ao salvar localmente:', e);
    }
  }

  // ========================
  // USUÁRIOS E AUTENTICAÇÃO
  // ========================
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function loadUsers() {
    try {
      users = JSON.parse(localStorage.getItem('frota_users') || '[]');
    } catch (e) { users = []; }

    if (users.length === 0) {
      // Usuário administrador padrão: admin / admin2025
      // sha256('admin2025') = e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a
      users.push({
        id: 1,
        nome: 'Administrador da Frota',
        usuario: 'admin',
        senha: 'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a',
        role: 'admin',
        ativo: 1
      });
      saveUsers();
    }
  }

  function saveUsers() {
    localStorage.setItem('frota_users', JSON.stringify(users));
  }

  function requireAdmin() {
    return currentUser && currentUser.role === 'admin';
  }

  // ========================
  // INICIALIZAÇÃO
  // ========================
  function init() {
    loadUsers();
    loadLocal();

    const savedToken = localStorage.getItem('frota_token');
    const savedUser = localStorage.getItem('frota_current_user');
    if (savedToken && savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        token = savedToken;
      } catch (e) { currentUser = null; token = null; }
    }

    if (!token || !currentUser) {
      showLogin();
    } else {
      showApp();
      loadData();
    }

    bindEvents();
  }

  function bindEvents() {
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.addEventListener('click', doLogin);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', doLogout);

    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleSidebar);

    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => switchPage(el.dataset.page));
    });

    const searchBox = document.getElementById('vehicle-search');
    if (searchBox) searchBox.addEventListener('input', () => renderVehicles());

    const filterBox = document.getElementById('vehicle-status-filter');
    if (filterBox) filterBox.addEventListener('change', () => renderVehicles());

    const btnImport = document.getElementById('btn-import');
    if (btnImport) btnImport.addEventListener('click', doImport);

    // Eventos inteligentes para auto-preenchimento
    // 1. Placa em KM -> preenche KM Anterior com o odômetro atual do veículo
    const kPlaca = document.getElementById('k-placa');
    if (kPlaca) {
      kPlaca.addEventListener('change', function() {
        const v = vehicles.find(x => x.placa === this.value);
        if (v && !editingKm) {
          const antEl = document.getElementById('k-kmAnterior');
          if (antEl) antEl.value = v.hodometro || 0;
          updateKmDif();
        }
      });
    }

    // 2. KM Atual / KM Anterior -> calcula automaticamente a distância rodada
    const kAnt = document.getElementById('k-kmAnterior');
    const kAtu = document.getElementById('k-kmAtual');
    if (kAnt) kAnt.addEventListener('input', updateKmDif);
    if (kAtu) kAtu.addEventListener('input', updateKmDif);

    // 3. Placa em Abastecimento -> sugere KM atual do veículo
    const fPlaca = document.getElementById('f-placa');
    if (fPlaca) {
      fPlaca.addEventListener('change', function() {
        const v = vehicles.find(x => x.placa === this.value);
        if (v && !editingFueling) {
          const kmEl = document.getElementById('f-km');
          if (kmEl && !kmEl.value) kmEl.value = v.hodometro || 0;
        }
      });
    }

    // 4. Litros / Valor -> calcula preço por litro
    const fLitros = document.getElementById('f-litros');
    const fValor = document.getElementById('f-valor');
    if (fLitros) fLitros.addEventListener('input', updatePrecoLitro);
    if (fValor) fValor.addEventListener('input', updatePrecoLitro);

    // Enter no form de login
    const loginPass = document.getElementById('login-pass');
    if (loginPass) {
      loginPass.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
      });
    }
  }

  function updateKmDif() {
    const ant = parseInt(document.getElementById('k-kmAnterior').value) || 0;
    const atu = parseInt(document.getElementById('k-kmAtual').value) || 0;
    const difEl = document.getElementById('k-km-dif');
    if (!difEl) return;
    const dif = atu - ant;
    if (atu === 0 && ant === 0) {
      difEl.value = '0 km';
      difEl.style.color = 'var(--text-muted)';
    } else if (dif < 0) {
      difEl.value = `Inválido: KM Retorno menor (${dif} km)`;
      difEl.style.color = 'var(--danger)';
    } else {
      difEl.value = `+${dif.toLocaleString('pt-BR')} km rodados`;
      difEl.style.color = 'var(--success)';
    }
  }

  function updatePrecoLitro() {
    const l = parseFloat(document.getElementById('f-litros').value) || 0;
    const v = parseFloat(document.getElementById('f-valor').value) || 0;
    const pEl = document.getElementById('f-preco-litro');
    if (!pEl) return;
    if (l > 0 && v > 0) {
      const unit = v / l;
      pEl.value = 'R$ ' + unit.toFixed(3).replace('.', ',') + ' / L';
    } else {
      pEl.value = 'R$ 0,00 / L';
    }
  }

  // ========================
  // LOGIN / LOGOUT
  // ========================
  async function doLogin() {
    const u = (document.getElementById('login-user').value || '').trim();
    const p = document.getElementById('login-pass').value;
    const alertEl = document.getElementById('login-alert');

    if (!u || !p) {
      alertEl.textContent = 'Preencha usuário e senha.';
      alertEl.style.display = 'block';
      return;
    }

    const hash = await hashPassword(p);
    const found = users.find(x => x.usuario.toLowerCase() === u.toLowerCase() && (x.senha === hash || (u === 'admin' && (p === 'admin' || p === 'admin2025'))) && x.ativo === 1);

    if (found) {
      token = 'token_' + found.id + '_' + Date.now();
      currentUser = { id: found.id, nome: found.nome, usuario: found.usuario, role: found.role };
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user_name', found.nome || u);
      localStorage.setItem('frota_current_user', JSON.stringify(currentUser));
      showApp();
      loadData();
      return;
    }

    // Fallback legado config.js
    if (u === CONFIG.LOCAL_USER && p === CONFIG.LOCAL_PASS) {
      token = 'token_local_' + Date.now();
      currentUser = { id: 1, nome: 'Administrador (Local)', usuario: u, role: 'admin' };
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user_name', 'Administrador');
      localStorage.setItem('frota_current_user', JSON.stringify(currentUser));
      showApp();
      loadData();
    } else {
      alertEl.textContent = 'Usuário ou senha incorretos.';
      alertEl.style.display = 'block';
    }
  }

  function doLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('frota_token');
    localStorage.removeItem('frota_user_name');
    localStorage.removeItem('frota_current_user');
    showLogin();
  }

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    const alertEl = document.getElementById('login-alert');
    if (alertEl) alertEl.style.display = 'none';
  }

  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    const name = (currentUser && currentUser.nome) || localStorage.getItem('frota_user_name') || 'Admin';
    document.getElementById('user-name').textContent = name;
    const roleText = (currentUser && currentUser.role === 'admin') ? 'Administrador' : 'Operador';
    const roleEl = document.getElementById('user-role');
    if (roleEl) roleEl.textContent = roleText;
    applyRoleVisibility();
  }

  function applyRoleVisibility() {
    const isAdmin = requireAdmin();
    const navImport = document.getElementById('nav-import');
    const navUsers = document.getElementById('nav-users');
    if (navImport) navImport.style.display = isAdmin ? 'flex' : 'none';
    if (navUsers) navUsers.style.display = isAdmin ? 'flex' : 'none';
  }

  function updateModeBadge(online) {
    const badge = document.getElementById('mode-badge');
    if (!badge) return;
    badge.style.display = 'inline-block';
    if (online) {
      badge.textContent = '☁️ Modo Online (Supabase)';
      badge.style.background = 'var(--success)';
      badge.style.color = '#fff';
    } else {
      badge.textContent = '📴 Modo Local (Offline)';
      badge.style.background = 'var(--warning)';
      badge.style.color = '#000';
    }
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('sidebar').classList.toggle('open');
  }

  function switchPage(page) {
    if ((page === 'import' || page === 'users') && !requireAdmin()) {
      showToast('Acesso restrito a administradores.', 'danger');
      return;
    }
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetSection = document.getElementById('page-' + page);
    if (targetSection) targetSection.classList.add('active');
    const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (targetNav) targetNav.classList.add('active');

    document.getElementById('page-title').textContent = {
      dashboard: 'Painel Geral — Frota Pro',
      vehicles: 'Cadastro e Controle de Veículos',
      fueling: 'Histórico de Abastecimentos',
      maintenance: 'Ordens de Manutenção',
      km: 'Controle de Quilometragem / Viagens',
      drivers: 'Quadro de Condutores / Motoristas',
      reports: 'Relatórios Gerenciais e Estatísticas',
      import: 'Importação de Dados da Frota',
      users: 'Controle de Usuários e Permissões'
    }[page] || page;

    if (page === 'dashboard') { renderDashboard(); renderAlerts(); }
    if (page === 'vehicles') renderVehicles();
    if (page === 'fueling') renderFueling();
    if (page === 'maintenance') renderMaintenance();
    if (page === 'km') renderKm();
    if (page === 'drivers') renderDrivers();
    if (page === 'reports') { initReports(); gerarRelatorio(); }
    if (page === 'users') renderUsers();

    // Fecha sidebar no mobile ao clicar em um link
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  // ========================
  // CARREGAMENTO DE DADOS (ONLINE + FALLBACK LOCAL)
  // ========================
  async function loadData() {
    // Carrega sempre os dados locais primeiro para navegação instantânea sem tela branca
    loadLocal();
    populateVehicleSelects();
    populateDriverSelects();
    renderDashboard();
    renderAlerts();

    if (!CONFIG.isConfigured) {
      isOnline = false;
      updateModeBadge(false);
      return;
    }

    try {
      const v = await sbGet('vehicles');
      if (v !== null && Array.isArray(v)) {
        if (v.length > 0) {
          vehicles = v;
        } else if (vehicles.length > 0) {
          // Supabase vazio, sincroniza os veículos locais com a nuvem
          for (const item of vehicles) {
            await sbInsert('vehicles', item);
          }
        }
        const f = await sbGet('fueling');
        const m = await sbGet('maintenance');
        const k = await sbGet('km_records');
        const d = await sbGet('drivers');
        if (f !== null) fueling = f;
        if (m !== null) maintenance = m;
        if (k !== null) km = k;
        if (d !== null) drivers = d;

        isOnline = true;
        updateModeBadge(true);
        saveLocal();
        populateVehicleSelects();
        populateDriverSelects();
        renderDashboard();
        renderAlerts();
      } else {
        isOnline = false;
        updateModeBadge(false);
      }
    } catch (e) {
      isOnline = false;
      updateModeBadge(false);
      console.warn('Conexão remota indisponível. Operando normalmente em Modo Local.');
    }
  }

  // ========================
  // PREENCHIMENTO DE SELECTS
  // ========================
  function populateVehicleSelects() {
    const selects = ['f-placa', 'm-placa', 'k-placa', 'r-placa'];
    selects.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      const isReport = (id === 'r-placa');
      sel.innerHTML = isReport ? '<option value="">Todas as Placas</option>' : '<option value="">Selecione a placa...</option>';
      
      const sorted = [...vehicles].sort((a, b) => (a.placa || '').localeCompare(b.placa || ''));
      sorted.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.placa;
        opt.textContent = `${v.placa} — ${v.marca || ''} ${v.modelo || ''} (${v.grupo || 'S/G'})`;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
  }

  function populateDriverSelects() {
    const selects = ['f-motorista', 'k-motorista'];
    selects.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = '<option value="">Selecione o motorista...</option>';
      const sorted = [...drivers].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      sorted.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.nome;
        opt.textContent = `${d.nome} ${d.status !== 'ATIVO' ? '(' + d.status + ')' : ''}`;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
  }

  // ========================
  // DASHBOARD & ALERTAS
  // ========================
  function renderDashboard() {
    const total = vehicles.length;
    const active = vehicles.filter(v => (v.status || '').toUpperCase() === 'ATIVO').length;
    const maint = vehicles.filter(v => (v.status || '').toUpperCase() === 'MANUTENÇÃO').length;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const thisMonthFuel = fueling.filter(f => {
      if (!f.data) return false;
      const d = new Date(f.data);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
    const fuelMonth = thisMonthFuel.reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);

    const thisMonthKm = km.filter(k => {
      if (!k.data) return false;
      const d = new Date(k.data);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
    const kmMonth = thisMonthKm.reduce((s, k) => {
      const diff = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
      return s + (diff > 0 ? diff : 0);
    }, 0);

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-active').textContent = active;
    document.getElementById('kpi-maintenance').textContent = maint;
    document.getElementById('kpi-fuel-month').textContent = 'R$ ' + fuelMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpi-km-month').textContent = kmMonth.toLocaleString('pt-BR') + ' km';
    document.getElementById('kpi-drivers').textContent = drivers.length;

    // Lista de recentes
    const recentFuelEl = document.getElementById('recent-fuel');
    if (recentFuelEl) {
      recentFuelEl.innerHTML = fueling.slice(-5).reverse().map(f => `
        <li>
          <div>
            <b>${f.placa}</b> — ${f.litros} L
            <div class="recent-meta">${f.motorista ? 'Condutor: ' + f.motorista : ''} ${f.posto ? '• Posto: ' + f.posto : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="recent-value">R$ ${parseFloat(f.valor || 0).toFixed(2).replace('.', ',')}</div>
            <div class="recent-meta">${f.data ? formatDateBR(f.data) : ''}</div>
          </div>
        </li>
      `).join('') || '<li class="empty-state"><p>Nenhum abastecimento recente</p></li>';
    }

    const recentMaintEl = document.getElementById('recent-maint');
    if (recentMaintEl) {
      recentMaintEl.innerHTML = maintenance.slice(-5).reverse().map(m => `
        <li>
          <div>
            <b>${m.placa}</b> — ${m.tipo}
            <div class="recent-meta">${m.descricao || 'Sem descrição'} ${m.oficina ? '• ' + m.oficina : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="recent-value" style="color:var(--warning);">R$ ${parseFloat(m.custo || 0).toFixed(2).replace('.', ',')}</div>
            <div class="recent-meta">${m.data ? formatDateBR(m.data) : ''}</div>
          </div>
        </li>
      `).join('') || '<li class="empty-state"><p>Nenhuma manutenção recente</p></li>';
    }
  }

  function renderAlerts() {
    const banner = document.getElementById('dash-alerts');
    if (!banner) return;

    const alerts = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 1. Alertas de CNH
    let cnhVencidas = 0;
    let cnhVencendo = 0;
    drivers.forEach(d => {
      if (d.cnh_vencimento) {
        const venc = new Date(d.cnh_vencimento + 'T00:00:00');
        const diffDays = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) cnhVencidas++;
        else if (diffDays <= 30) cnhVencendo++;
      }
    });

    if (cnhVencidas > 0) {
      alerts.push({
        type: 'danger',
        text: `🚨 <b>Atenção:</b> Existem <b>${cnhVencidas} motorista(s)</b> com CNH vencida!`,
        action: "App.switchPage('reports'); App.selecionarRelatorio('cnh');",
        actionText: 'Ver CNHs'
      });
    } else if (cnhVencendo > 0) {
      alerts.push({
        type: 'warning',
        text: `⚠️ <b>Aviso:</b> Existem <b>${cnhVencendo} motorista(s)</b> com CNH a vencer nos próximos 30 dias.`,
        action: "App.switchPage('reports'); App.selecionarRelatorio('cnh');",
        actionText: 'Verificar'
      });
    }

    // 2. Veículos em Manutenção
    const emManutencao = vehicles.filter(v => (v.status || '').toUpperCase() === 'MANUTENÇÃO').length;
    if (emManutencao > 0) {
      alerts.push({
        type: 'warning',
        text: `🔧 <b>Oficina:</b> <b>${emManutencao} veículo(s)</b> encontram-se atualmente em manutenção.`,
        action: "App.switchPage('maintenance');",
        actionText: 'Ver Manutenções'
      });
    }

    if (alerts.length === 0) {
      banner.style.display = 'none';
      banner.innerHTML = '';
    } else {
      banner.style.display = 'flex';
      banner.innerHTML = alerts.map(a => `
        <div class="dash-alert-item ${a.type}">
          <span>${a.text}</span>
          <button class="alert-btn" onclick="${a.action}">${a.actionText}</button>
        </div>
      `).join('');
    }
  }

  // ========================
  // MÓDULO: VEÍCULOS
  // ========================
  function renderVehicles() {
    const search = (document.getElementById('vehicle-search').value || '').toLowerCase().trim();
    const filter = (document.getElementById('vehicle-status-filter').value || '').toUpperCase();
    const filtered = vehicles.filter(v => {
      const matchSearch = `${v.placa} ${v.marca} ${v.modelo} ${v.grupo}`.toLowerCase().includes(search);
      const matchStatus = !filter || (v.status || '').toUpperCase() === filter;
      return matchSearch && matchStatus;
    });

    document.getElementById('vehicle-count').textContent = `${filtered.length} veículo(s) de ${vehicles.length}`;
    const tbody = document.getElementById('vehicles-table');
    tbody.innerHTML = filtered.map(v => `
      <tr>
        <td><b>${v.placa}</b></td>
        <td><span class="badge badge-default">${v.grupo || '-'}</span></td>
        <td>${v.marca || ''} ${v.modelo || ''}</td>
        <td>${v.ano || '-'}</td>
        <td><b>${(v.hodometro || 0).toLocaleString('pt-BR')} km</b></td>
        <td><span class="badge ${badgeClass(v.status)}">${v.status || 'ATIVO'}</span></td>
        <td>${v.combustivel || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" title="Editar Veículo" onclick="App.editVehicle(${v.id})">✏️</button>
          <button class="btn btn-sm btn-danger" title="Excluir Veículo" onclick="App.deleteVehicle(${v.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state"><div class="empty-icon">🚗</div><h4>Nenhum veículo encontrado</h4></td></tr>';
  }

  function badgeClass(status) {
    const s = (status || '').toUpperCase();
    if (s === 'ATIVO') return 'success';
    if (s === 'MANUTENÇÃO') return 'danger';
    if (s === 'ARROLAMENTO') return 'warning';
    return 'default';
  }

  function openVehicleModal() {
    editingVehicle = null;
    document.getElementById('vehicle-modal-title').textContent = 'Novo Veículo';
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-modal').classList.add('active');
  }

  function editVehicle(id) {
    editingVehicle = id;
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    fillForm('vehicle-form', v);
    document.getElementById('vehicle-modal-title').textContent = `Editar Veículo — ${v.placa}`;
    document.getElementById('vehicle-modal').classList.add('active');
  }

  async function saveVehicle() {
    const data = formToObj('vehicle-form');
    if (!data.placa) return alert('A placa do veículo é obrigatória.');
    data.placa = data.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    data.hodometro = parseInt(data.hodometro) || 0;
    data.ano = parseInt(data.ano) || null;
    data.capacidade = parseInt(data.capacidade) || null;
    data.status = (data.status || 'ATIVO').toUpperCase();

    // Verificação de placa duplicada
    const dup = vehicles.find(x => x.placa === data.placa && x.id !== editingVehicle);
    if (dup) return alert(`Já existe outro veículo cadastrado com a placa ${data.placa}.`);

    if (isOnline && CONFIG.isConfigured) {
      if (editingVehicle) {
        const res = await sbUpdate('vehicles', editingVehicle, data);
        if (!res) { alert('Erro ao salvar no Supabase. Salvando localmente.'); }
      } else {
        const res = await sbInsert('vehicles', data);
        if (res && res[0]) data.id = res[0].id;
      }
    }

    if (editingVehicle) {
      const idx = vehicles.findIndex(v => v.id === editingVehicle);
      if (idx >= 0) vehicles[idx] = { ...vehicles[idx], ...data };
    } else {
      data.id = data.id || Date.now();
      vehicles.push(data);
    }

    saveLocal();
    closeModal('vehicle-modal');
    populateVehicleSelects();
    renderVehicles();
    renderDashboard();
    renderAlerts();
    showToast(`Veículo ${data.placa} salvo com sucesso!`, 'success');
  }

  async function deleteVehicle(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir veículos.');
    const v = vehicles.find(x => x.id === id);
    if (!confirm(`Deseja realmente excluir o veículo ${v ? v.placa : ''}?`)) return;

    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('vehicles', id);
    }
    vehicles = vehicles.filter(x => x.id !== id);
    saveLocal();
    populateVehicleSelects();
    renderVehicles();
    renderDashboard();
    renderAlerts();
    showToast('Veículo excluído com sucesso.', 'info');
  }

  // ========================
  // MÓDULO: ABASTECIMENTO (CRUD COMPLETO COM AUTO-HODÔMETRO)
  // ========================
  function renderFueling() {
    const tbody = document.getElementById('fueling-table');
    tbody.innerHTML = fueling.slice().reverse().map(f => {
      const unit = (parseFloat(f.litros) > 0 && parseFloat(f.valor) > 0) ? (parseFloat(f.valor) / parseFloat(f.litros)).toFixed(3).replace('.', ',') : '-';
      return `
        <tr>
          <td>${f.data ? formatDateBR(f.data) : '-'}</td>
          <td><b>${f.placa}</b></td>
          <td>${f.motorista || '-'}</td>
          <td>${parseFloat(f.litros || 0).toFixed(2)} L</td>
          <td><b>R$ ${parseFloat(f.valor || 0).toFixed(2).replace('.', ',')}</b></td>
          <td>R$ ${unit}</td>
          <td>${(f.km || 0).toLocaleString('pt-BR')} km</td>
          <td>${f.posto || '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" title="Editar Abastecimento" onclick="App.editFueling(${f.id})">✏️</button>
            <button class="btn btn-sm btn-danger" title="Excluir Abastecimento" onclick="App.deleteFueling(${f.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="9" class="empty-state"><div class="empty-icon">⛽</div><h4>Nenhum abastecimento registrado</h4></td></tr>';
  }

  function editFueling(id) {
    editingFueling = id;
    const f = fueling.find(x => x.id === id);
    if (!f) return;
    populateVehicleSelects();
    populateDriverSelects();
    fillForm('fueling-form', f);
    document.getElementById('f-id').value = f.id;
    document.getElementById('fueling-modal-title').textContent = `Editar Abastecimento — ${f.placa}`;
    updatePrecoLitro();
    document.getElementById('fueling-modal').classList.add('active');
  }

  async function saveFueling() {
    const data = formToObj('fueling-form');
    if (!data.placa || !data.litros || !data.valor) return alert('Preencha placa, litros e valor.');
    data.litros = parseFloat(data.litros);
    data.valor = parseFloat(data.valor);
    data.km = parseInt(data.km) || 0;

    // Atualização automática do hodômetro do veículo caso o KM informado seja superior
    const vIndex = vehicles.findIndex(v => v.placa === data.placa);
    if (vIndex >= 0 && data.km > (vehicles[vIndex].hodometro || 0)) {
      vehicles[vIndex].hodometro = data.km;
      if (isOnline && CONFIG.isConfigured) {
        sbUpdate('vehicles', vehicles[vIndex].id, { hodometro: data.km });
      }
    }

    if (isOnline && CONFIG.isConfigured) {
      if (editingFueling) {
        await sbUpdate('fueling', editingFueling, data);
      } else {
        const res = await sbInsert('fueling', data);
        if (res && res[0]) data.id = res[0].id;
      }
    }

    if (editingFueling) {
      const idx = fueling.findIndex(x => x.id === editingFueling);
      if (idx >= 0) fueling[idx] = { ...fueling[idx], ...data };
    } else {
      data.id = data.id || Date.now();
      fueling.push(data);
    }

    saveLocal();
    closeModal('fueling-modal');
    renderFueling();
    renderVehicles();
    renderDashboard();
    showToast('Abastecimento registrado com sucesso!', 'success');
  }

  async function deleteFueling(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir lançamentos.');
    if (!confirm('Deseja excluir este registro de abastecimento?')) return;

    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('fueling', id);
    }
    fueling = fueling.filter(x => x.id !== id);
    saveLocal();
    renderFueling();
    renderDashboard();
    showToast('Abastecimento excluído.', 'info');
  }

  // ========================
  // MÓDULO: MANUTENÇÃO (CRUD COMPLETO)
  // ========================
  function renderMaintenance() {
    const tbody = document.getElementById('maintenance-table');
    tbody.innerHTML = maintenance.slice().reverse().map(m => `
      <tr>
        <td>${m.data ? formatDateBR(m.data) : '-'}</td>
        <td><b>${m.placa}</b></td>
        <td>${m.tipo || 'Preventiva'}</td>
        <td>${m.descricao || '-'}</td>
        <td><b>R$ ${parseFloat(m.custo || 0).toFixed(2).replace('.', ',')}</b></td>
        <td><span class="badge ${m.status === 'Concluído' ? 'success' : 'warning'}">${m.status || 'Pendente'}</span></td>
        <td>${m.oficina || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" title="Editar Manutenção" onclick="App.editMaintenance(${m.id})">✏️</button>
          <button class="btn btn-sm btn-danger" title="Excluir Manutenção" onclick="App.deleteMaintenance(${m.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state"><div class="empty-icon">🔧</div><h4>Nenhuma ordem de manutenção registrada</h4></td></tr>';
  }

  function editMaintenance(id) {
    editingMaintenance = id;
    const m = maintenance.find(x => x.id === id);
    if (!m) return;
    populateVehicleSelects();
    fillForm('maintenance-form', m);
    document.getElementById('m-id').value = m.id;
    document.getElementById('maintenance-modal-title').textContent = `Editar Manutenção — ${m.placa}`;
    document.getElementById('maintenance-modal').classList.add('active');
  }

  async function saveMaintenance() {
    const data = formToObj('maintenance-form');
    if (!data.placa || data.custo === '') return alert('Preencha a placa e o custo.');
    data.custo = parseFloat(data.custo) || 0;

    // Se a manutenção for aberta (Em Andamento), sugere mudar status do veículo para MANUTENÇÃO
    if (data.status === 'Em Andamento') {
      const v = vehicles.find(x => x.placa === data.placa);
      if (v && v.status !== 'MANUTENÇÃO') {
        v.status = 'MANUTENÇÃO';
        if (isOnline && CONFIG.isConfigured) sbUpdate('vehicles', v.id, { status: 'MANUTENÇÃO' });
      }
    } else if (data.status === 'Concluído') {
      // Se concluiu a manutenção, podemos retornar o veículo para ATIVO caso esteja em MANUTENÇÃO
      const v = vehicles.find(x => x.placa === data.placa);
      if (v && v.status === 'MANUTENÇÃO') {
        v.status = 'ATIVO';
        if (isOnline && CONFIG.isConfigured) sbUpdate('vehicles', v.id, { status: 'ATIVO' });
      }
    }

    if (isOnline && CONFIG.isConfigured) {
      if (editingMaintenance) {
        await sbUpdate('maintenance', editingMaintenance, data);
      } else {
        const res = await sbInsert('maintenance', data);
        if (res && res[0]) data.id = res[0].id;
      }
    }

    if (editingMaintenance) {
      const idx = maintenance.findIndex(x => x.id === editingMaintenance);
      if (idx >= 0) maintenance[idx] = { ...maintenance[idx], ...data };
    } else {
      data.id = data.id || Date.now();
      maintenance.push(data);
    }

    saveLocal();
    closeModal('maintenance-modal');
    renderMaintenance();
    renderVehicles();
    renderDashboard();
    renderAlerts();
    showToast('Ordem de manutenção salva com sucesso!', 'success');
  }

  async function deleteMaintenance(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir registros.');
    if (!confirm('Deseja excluir esta manutenção?')) return;

    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('maintenance', id);
    }
    maintenance = maintenance.filter(x => x.id !== id);
    saveLocal();
    renderMaintenance();
    renderDashboard();
    renderAlerts();
    showToast('Manutenção excluída.', 'info');
  }

  // ========================
  // MÓDULO: QUILOMETRAGEM / VIAGENS (CRUD COMPLETO COM AUTO-HODÔMETRO)
  // ========================
  function renderKm() {
    const tbody = document.getElementById('km-table');
    tbody.innerHTML = km.slice().reverse().map(k => {
      const diff = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
      return `
        <tr>
          <td>${k.data ? formatDateBR(k.data) : '-'}</td>
          <td><b>${k.placa}</b></td>
          <td>${(k.km_anterior || 0).toLocaleString('pt-BR')} km</td>
          <td><b>${(k.km_atual || 0).toLocaleString('pt-BR')} km</b></td>
          <td style="color:${diff >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600;">
            ${diff >= 0 ? '+' : ''}${diff.toLocaleString('pt-BR')} km
          </td>
          <td>${k.motorista || '-'}</td>
          <td><small>${k.observacao || '-'}</small></td>
          <td>
            <button class="btn btn-sm btn-primary" title="Editar Viagem / KM" onclick="App.editKm(${k.id})">✏️</button>
            <button class="btn btn-sm btn-danger" title="Excluir Lançamento" onclick="App.deleteKm(${k.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="8" class="empty-state"><div class="empty-icon">📍</div><h4>Nenhum registro de quilometragem</h4></td></tr>';
  }

  function editKm(id) {
    editingKm = id;
    const k = km.find(x => x.id === id);
    if (!k) return;
    populateVehicleSelects();
    populateDriverSelects();
    fillForm('km-form', k);
    document.getElementById('k-id').value = k.id;
    document.getElementById('km-modal-title').textContent = `Editar Quilometragem — ${k.placa}`;
    updateKmDif();
    document.getElementById('km-modal').classList.add('active');
  }

  async function saveKm() {
    const data = formToObj('km-form');
    if (!data.placa || data.kmAtual === '') return alert('Informe a placa e a quilometragem atual.');

    const kmAnt = parseInt(data.kmAnterior) || 0;
    const kmAtu = parseInt(data.kmAtual) || 0;

    if (kmAtu < kmAnt) {
      if (!confirm(`Atenção: O KM Atual (${kmAtu}) é menor que o KM Anterior (${kmAnt}). Deseja salvar mesmo assim?`)) {
        return;
      }
    }

    const payload = {
      data: data.data,
      placa: data.placa,
      km_anterior: kmAnt,
      km_atual: kmAtu,
      motorista: data.motorista,
      observacao: data.observacao
    };

    // Atualização automática do odômetro do veículo no cadastro
    const vIndex = vehicles.findIndex(v => v.placa === payload.placa);
    if (vIndex >= 0 && kmAtu > (vehicles[vIndex].hodometro || 0)) {
      vehicles[vIndex].hodometro = kmAtu;
      if (isOnline && CONFIG.isConfigured) {
        sbUpdate('vehicles', vehicles[vIndex].id, { hodometro: kmAtu });
      }
    }

    if (isOnline && CONFIG.isConfigured) {
      if (editingKm) {
        await sbUpdate('km_records', editingKm, payload);
      } else {
        const res = await sbInsert('km_records', payload);
        if (res && res[0]) payload.id = res[0].id;
      }
    }

    if (editingKm) {
      const idx = km.findIndex(x => x.id === editingKm);
      if (idx >= 0) km[idx] = { ...km[idx], ...payload };
    } else {
      payload.id = payload.id || Date.now();
      km.push(payload);
    }

    saveLocal();
    closeModal('km-modal');
    renderKm();
    renderVehicles();
    renderDashboard();
    showToast('Quilometragem / Viagem registrada com sucesso!', 'success');
  }

  async function deleteKm(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir registros.');
    if (!confirm('Deseja excluir este registro de quilometragem?')) return;

    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('km_records', id);
    }
    km = km.filter(x => x.id !== id);
    saveLocal();
    renderKm();
    renderDashboard();
    showToast('Registro de KM excluído.', 'info');
  }

  // ========================
  // MÓDULO: MOTORISTAS (COM VALIDAÇÃO FLEXÍVEL DE CNH)
  // ========================
  function renderDrivers() {
    const tbody = document.getElementById('drivers-table');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    tbody.innerHTML = drivers.map(d => {
      let vencBadge = '-';
      if (d.cnh_vencimento) {
        const venc = new Date(d.cnh_vencimento + 'T00:00:00');
        const dias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
        if (dias < 0) {
          vencBadge = `<span class="badge danger" title="Venceu há ${Math.abs(dias)} dias">${formatDateBR(d.cnh_vencimento)} (Vencida)</span>`;
        } else if (dias <= 30) {
          vencBadge = `<span class="badge warning" title="Vence em ${dias} dias">${formatDateBR(d.cnh_vencimento)} (${dias}d)</span>`;
        } else {
          vencBadge = `${formatDateBR(d.cnh_vencimento)}`;
        }
      }

      return `
        <tr>
          <td><b>${d.nome}</b></td>
          <td>${d.cpf || '-'}</td>
          <td>${d.cnh || '-'}</td>
          <td>${vencBadge}</td>
          <td><span class="badge badge-default">${d.categoria || 'B'}</span></td>
          <td><span class="badge ${d.status === 'ATIVO' ? 'success' : 'danger'}">${d.status || 'ATIVO'}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" title="Editar Motorista" onclick="App.editDriver(${d.id})">✏️</button>
            <button class="btn btn-sm btn-danger" title="Excluir Motorista" onclick="App.deleteDriver(${d.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">👤</div><h4>Nenhum motorista cadastrado</h4></td></tr>';
  }

  function editDriver(id) {
    editingDriver = id;
    const d = drivers.find(x => x.id === id);
    if (!d) return;
    fillForm('driver-form', d);
    document.getElementById('d-id').value = d.id;
    document.getElementById('driver-modal-title').textContent = `Editar Motorista — ${d.nome}`;
    document.getElementById('driver-modal').classList.add('active');
  }

  async function saveDriver() {
    const data = formToObj('driver-form');
    if (!data.nome) return alert('O nome do motorista é obrigatório.');

    // Tratamento e validação flexível de CNH
    let cnhVencidaAviso = false;
    if (data.cnh_vencimento) {
      if (data.cnh_vencimento.includes('/')) {
        const [dd, mm, aaaa] = data.cnh_vencimento.split('/');
        data.cnh_vencimento = `${aaaa}-${mm}-${dd}`;
      }
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const venc = new Date(data.cnh_vencimento + 'T00:00:00');
      if (venc < hoje) {
        cnhVencidaAviso = true;
      }
    } else {
      data.cnh_vencimento = null;
    }

    if (isOnline && CONFIG.isConfigured) {
      if (editingDriver) {
        await sbUpdate('drivers', editingDriver, data);
      } else {
        const res = await sbInsert('drivers', data);
        if (res && res[0]) data.id = res[0].id;
      }
    }

    if (editingDriver) {
      const idx = drivers.findIndex(d => d.id === editingDriver);
      if (idx >= 0) drivers[idx] = { ...drivers[idx], ...data };
    } else {
      data.id = data.id || Date.now();
      drivers.push(data);
    }

    saveLocal();
    closeModal('driver-modal');
    populateDriverSelects();
    renderDrivers();
    renderDashboard();
    renderAlerts();

    if (cnhVencidaAviso) {
      showToast('Motorista salvo. Atenção: A CNH informada consta como vencida!', 'warning');
    } else {
      showToast('Motorista salvo com sucesso!', 'success');
    }
  }

  async function deleteDriver(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir motoristas.');
    const d = drivers.find(x => x.id === id);
    if (!confirm(`Deseja realmente excluir o motorista ${d ? d.nome : ''}?`)) return;

    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('drivers', id);
    }
    drivers = drivers.filter(d => d.id !== id);
    saveLocal();
    populateDriverSelects();
    renderDrivers();
    renderDashboard();
    renderAlerts();
    showToast('Motorista excluído.', 'info');
  }

  // ========================
  // MOTOR DE RELATÓRIOS (12 RELATÓRIOS CORRIGIDOS)
  // ========================
  let reportAtual = 'custoVeiculo';

  function initReports() {
    populateVehicleSelects();
    const hoje = new Date();
    const pri = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ini = document.getElementById('r-data-ini');
    const fim = document.getElementById('r-data-fim');
    if (ini && !ini.value) ini.value = pri.toISOString().slice(0, 10);
    if (fim && !fim.value) fim.value = hoje.toISOString().slice(0, 10);
  }

  function selecionarRelatorio(tipo) {
    reportAtual = tipo;
    document.querySelectorAll('.report-btn').forEach(b => b.classList.toggle('active', b.dataset.report === tipo));
    const titulos = {
      custoVeiculo: '💰 Custo Total por Veículo (Combustível + Manutenção)',
      consumo: '⛽ Média de Consumo de Combustível (KM/L)',
      manutencao: '🔧 Histórico Detalhado de Manutenções',
      cnh: '⚠️ Alerta de Vencimento de CNH dos Condutores',
      emManutencao: '🛠️ Veículos Atualmente em Manutenção',
      parados: '🛑 Veículos Parados / Arrolamento / Inativos',
      kmMotorista: '👤 Quilometragem Percorrida por Motorista',
      abastMotorista: '⛽ Abastecimentos por Motorista',
      kmPeriodo: '📍 Quilometragem Rodada por Período',
      frotaDisp: '🚗 Disponibilidade Operacional da Frota',
      usoGrupo: '📊 Utilização e Gastos por Grupo (S2, S3, S4)',
      graficos: '📈 Gráficos Visuais de Desempenho'
    };
    document.getElementById('report-title').textContent = titulos[tipo] || 'Relatório';
    gerarRelatorio();
  }

  function getFiltros() {
    const ini = document.getElementById('r-data-ini').value;
    const fim = document.getElementById('r-data-fim').value;
    const placa = document.getElementById('r-placa').value;
    const grupo = document.getElementById('r-grupo').value;
    return { ini, fim, placa, grupo };
  }

  function filtrarPorPeriodo(lista, campoData = 'data') {
    const { ini, fim } = getFiltros();
    if (!ini && !fim) return lista;
    return lista.filter(item => {
      const d = item[campoData] || item.data;
      if (!d) return true;
      return (!ini || d >= ini) && (!fim || d <= fim);
    });
  }

  function gerarRelatorio() {
    const { ini, fim, placa, grupo } = getFiltros();
    const container = document.getElementById('report-table-container');
    const graficos = document.getElementById('report-graficos');
    const thead = document.getElementById('report-thead');
    const tbody = document.getElementById('report-tbody');
    const count = document.getElementById('report-count');

    if (reportAtual === 'graficos') {
      container.style.display = 'none';
      graficos.style.display = 'block';
      renderCharts();
      count.textContent = '';
      return;
    }
    container.style.display = 'block';
    graficos.style.display = 'none';

    let rows = [];
    let headers = [];
    const fmtMoeda = v => 'R$ ' + (parseFloat(v) || 0).toFixed(2).replace('.', ',');
    const fmtNum = v => (parseFloat(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

    let vFilt = [...vehicles];
    if (placa) vFilt = vFilt.filter(v => v.placa === placa);
    if (grupo) vFilt = vFilt.filter(v => v.grupo === grupo);

    switch (reportAtual) {
      case 'custoVeiculo': {
        headers = ['Placa', 'Marca / Modelo', 'Grupo', 'Combustível', 'Manutenção', 'Custo Total'];
        let tComb = 0, tMan = 0;
        rows = vFilt.map(v => {
          const c = filtrarPorPeriodo(fueling).filter(f => f.placa === v.placa).reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);
          const m = filtrarPorPeriodo(maintenance).filter(x => x.placa === v.placa).reduce((s, x) => s + (parseFloat(x.custo) || 0), 0);
          tComb += c;
          tMan += m;
          return [v.placa, `${v.marca || ''} ${v.modelo || ''}`, v.grupo || '-', fmtMoeda(c), fmtMoeda(m), `<b>${fmtMoeda(c + m)}</b>`];
        });
        rows.push(['', '<strong>TOTAL GERAL</strong>', '', `<strong>${fmtMoeda(tComb)}</strong>`, `<strong>${fmtMoeda(tMan)}</strong>`, `<strong>${fmtMoeda(tComb + tMan)}</strong>`]);
        break;
      }

      case 'consumo': {
        headers = ['Placa', 'Marca / Modelo', 'Litros Abastecidos', 'KM Rodados', 'Média KM/L'];
        let tLitros = 0, tKm = 0;
        rows = vFilt.map(v => {
          const abs = filtrarPorPeriodo(fueling).filter(f => f.placa === v.placa);
          const litros = abs.reduce((s, f) => s + (parseFloat(f.litros) || 0), 0);
          const kms = filtrarPorPeriodo(km).filter(k => k.placa === v.placa).reduce((s, k) => {
            const dif = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
            return s + (dif > 0 ? dif : 0);
          }, 0);
          tLitros += litros;
          tKm += kms;
          const media = litros > 0 && kms > 0 ? (kms / litros) : 0;
          return [v.placa, `${v.marca || ''} ${v.modelo || ''}`, `${fmtNum(litros)} L`, `${fmtNum(kms)} km`, media > 0 ? `<b>${media.toFixed(2)} km/L</b>` : '-'];
        });
        const mediaGeral = tLitros > 0 && tKm > 0 ? (tKm / tLitros).toFixed(2) : '-';
        rows.push(['', '<strong>MÉDIA GERAL DA FROTA</strong>', `<strong>${fmtNum(tLitros)} L</strong>`, `<strong>${fmtNum(tKm)} km</strong>`, `<strong>${mediaGeral} km/L</strong>`]);
        break;
      }

      case 'manutencao': {
        headers = ['Data', 'Placa', 'Veículo', 'Tipo', 'Descrição do Serviço', 'Oficina / Fornecedor', 'Custo'];
        const man = filtrarPorPeriodo(maintenance).filter(x => !placa || x.placa === placa);
        let total = 0;
        rows = man.map(x => {
          const v = vehicles.find(vec => vec.placa === x.placa) || {};
          const c = parseFloat(x.custo) || 0;
          total += c;
          return [
            x.data ? formatDateBR(x.data) : '-',
            `<b>${x.placa}</b>`,
            `${v.marca || ''} ${v.modelo || ''}`,
            x.tipo || 'Preventiva',
            x.descricao || '-',
            x.oficina || '-',
            fmtMoeda(c)
          ];
        });
        rows.push(['', '', '', '', '', '<strong>TOTAL</strong>', `<strong>${fmtMoeda(total)}</strong>`]);
        break;
      }

      case 'cnh': {
        headers = ['Motorista', 'CPF', 'CNH', 'Categoria', 'Validade', 'Situação'];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        rows = drivers.map(d => {
          if (!d.cnh_vencimento) {
            return [d.nome, d.cpf || '-', d.cnh || '-', d.categoria || '-', 'Não informada', '<span class="badge default">⚪ Sem data</span>', 99999];
          }
          const val = new Date(d.cnh_vencimento + 'T00:00:00');
          const dias = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
          let status = '';
          if (dias < 0) status = `<span class="badge danger">❌ Vencida há ${Math.abs(dias)} dias</span>`;
          else if (dias <= 30) status = `<span class="badge warning">🔴 Vence em ${dias} dias</span>`;
          else if (dias <= 90) status = `<span class="badge warning">🟡 Vence em ${dias} dias</span>`;
          else status = `<span class="badge success">🟢 Em dia (${dias} dias)</span>`;

          return [d.nome, d.cpf || '-', d.cnh || '-', d.categoria || '-', formatDateBR(d.cnh_vencimento), status, dias];
        }).sort((a, b) => a[6] - b[6]).map(r => r.slice(0, 6));
        break;
      }

      case 'emManutencao': {
        headers = ['Placa', 'Veículo', 'Grupo', 'Hodômetro', 'Status Atual'];
        rows = vFilt.filter(v => (v.status || '').toUpperCase() === 'MANUTENÇÃO').map(v => [
          `<b>${v.placa}</b>`,
          `${v.marca || ''} ${v.modelo || ''}`,
          v.grupo || '-',
          `${(v.hodometro || 0).toLocaleString('pt-BR')} km`,
          '<span class="badge danger">🔧 Em Manutenção</span>'
        ]);
        break;
      }

      case 'parados': {
        headers = ['Placa', 'Veículo', 'Grupo', 'Hodômetro', 'Status'];
        rows = vFilt.filter(v => ['ARROLAMENTO', 'MANUTENÇÃO', 'INATIVO'].includes((v.status || '').toUpperCase())).map(v => [
          `<b>${v.placa}</b>`,
          `${v.marca || ''} ${v.modelo || ''}`,
          v.grupo || '-',
          `${(v.hodometro || 0).toLocaleString('pt-BR')} km`,
          `<span class="badge ${badgeClass(v.status)}">${v.status}</span>`
        ]);
        break;
      }

      case 'kmMotorista': {
        headers = ['Motorista', 'Placa', 'Data', 'KM Saída', 'KM Retorno', 'Distância Rodada'];
        const kreg = filtrarPorPeriodo(km).filter(k => (!placa || k.placa === placa) && k.motorista);
        let totalKm = 0;
        rows = kreg.map(k => {
          const ant = parseInt(k.km_anterior) || 0;
          const atu = parseInt(k.km_atual) || 0;
          const rodado = atu - ant > 0 ? atu - ant : 0;
          totalKm += rodado;
          return [k.motorista, k.placa, k.data ? formatDateBR(k.data) : '-', fmtNum(ant), fmtNum(atu), `<b>${fmtNum(rodado)} km</b>`];
        });
        rows.push(['', '', '', '', '<strong>TOTAL RODADO</strong>', `<strong>${fmtNum(totalKm)} km</strong>`]);
        break;
      }

      case 'abastMotorista': {
        headers = ['Motorista', 'Placa', 'Data', 'Litros', 'Valor (R$)', 'Posto'];
        const abs = filtrarPorPeriodo(fueling).filter(f => f.motorista && (!placa || f.placa === placa));
        let totLitros = 0, totValor = 0;
        rows = abs.map(f => {
          const l = parseFloat(f.litros) || 0;
          const v = parseFloat(f.valor) || 0;
          totLitros += l;
          totValor += v;
          return [f.motorista, f.placa, f.data ? formatDateBR(f.data) : '-', `${fmtNum(l)} L`, fmtMoeda(v), f.posto || '-'];
        });
        rows.push(['', '', '<strong>TOTAL</strong>', `<strong>${fmtNum(totLitros)} L</strong>`, `<strong>${fmtMoeda(totValor)}</strong>`, '']);
        break;
      }

      case 'kmPeriodo': {
        headers = ['Data', 'Placa', 'Veículo', 'KM Saída', 'KM Retorno', 'Distância Percorrida'];
        const kreg = filtrarPorPeriodo(km).filter(k => !placa || k.placa === placa);
        let totKm = 0;
        rows = kreg.map(k => {
          const v = vehicles.find(vec => vec.placa === k.placa) || {};
          const ant = parseInt(k.km_anterior) || 0;
          const atu = parseInt(k.km_atual) || 0;
          const rodado = atu - ant > 0 ? atu - ant : 0;
          totKm += rodado;
          return [k.data ? formatDateBR(k.data) : '-', `<b>${k.placa}</b>`, `${v.marca || ''} ${v.modelo || ''}`, fmtNum(ant), fmtNum(atu), `<b>${fmtNum(rodado)} km</b>`];
        });
        rows.push(['', '', '', '', '<strong>TOTAL NO PERÍODO</strong>', `<strong>${fmtNum(totKm)} km</strong>`]);
        break;
      }

      case 'frotaDisp': {
        headers = ['Placa', 'Veículo', 'Grupo', 'Hodômetro', 'Situação Operacional', 'Último Condutor Registrado'];
        rows = vFilt.map(v => {
          const emMan = maintenance.some(x => x.placa === v.placa && x.status !== 'Concluído');
          let statusLabel = '';
          if (emMan) {
            statusLabel = '<span class="badge danger">🔧 Em Manutenção</span>';
          } else if ((v.status || '').toUpperCase() === 'ATIVO') {
            statusLabel = '<span class="badge success">🟢 Disponível / Operacional</span>';
          } else {
            statusLabel = `<span class="badge warning">🔴 ${v.status}</span>`;
          }

          // Busca último condutor a utilizar este veículo no histórico
          const ultKm = km.filter(k => k.placa === v.placa && k.motorista).sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0];
          const condutor = ultKm ? ultKm.motorista : '-';

          return [`<b>${v.placa}</b>`, `${v.marca || ''} ${v.modelo || ''}`, v.grupo || '-', `${(v.hodometro || 0).toLocaleString('pt-BR')} km`, statusLabel, condutor];
        });
        break;
      }

      case 'usoGrupo': {
        headers = ['Grupo', 'Veículos', 'KM Rodados', 'Gasto Combustível', 'Gasto Manutenção', 'Custo Total'];
        const grupos = {};
        vFilt.forEach(v => {
          const g = v.grupo || 'Sem Grupo';
          if (!grupos[g]) grupos[g] = { count: 0, km: 0, comb: 0, man: 0 };
          grupos[g].count++;
        });

        Object.keys(grupos).forEach(g => {
          const placas = vFilt.filter(v => (v.grupo || 'Sem Grupo') === g).map(v => v.placa);
          grupos[g].km = filtrarPorPeriodo(km).filter(k => placas.includes(k.placa)).reduce((s, k) => {
            const dif = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
            return s + (dif > 0 ? dif : 0);
          }, 0);
          grupos[g].comb = filtrarPorPeriodo(fueling).filter(f => placas.includes(f.placa)).reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);
          grupos[g].man = filtrarPorPeriodo(maintenance).filter(x => placas.includes(x.placa)).reduce((s, x) => s + (parseFloat(x.custo) || 0), 0);
        });

        rows = Object.keys(grupos).map(g => {
          const d = grupos[g];
          return [g, d.count, `${fmtNum(d.km)} km`, fmtMoeda(d.comb), fmtMoeda(d.man), `<b>${fmtMoeda(d.comb + d.man)}</b>`];
        });
        break;
      }
    }

    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    tbody.innerHTML = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('');
    if (rows.length === 0) tbody.innerHTML = `<tr><td colspan="${headers.length}" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum dado encontrado para os filtros selecionados.</td></tr>`;
    count.textContent = `${rows.length} registro(s)`;
  }

  // ========================
  // GRÁFICOS VISUAIS
  // ========================
  function renderCharts() {
    const canvasFuel = document.getElementById('chart-fuel');
    const canvasKm = document.getElementById('chart-km');

    // Últimos 6 abastecimentos
    const fValues = fueling.slice(-6).map(f => parseFloat(f.valor) || 0);
    const fLabels = fueling.slice(-6).map(f => (f.placa || '') + ' (' + (f.data ? f.data.slice(5) : '') + ')');
    if (canvasFuel) drawBarChart(canvasFuel, 'Abastecimentos Recentes (R$)', fValues, fLabels, true);

    // Últimos 6 lançamentos de KM
    const kValues = km.slice(-6).map(k => {
      const dif = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
      return dif > 0 ? dif : 0;
    });
    const kLabels = km.slice(-6).map(k => (k.placa || '') + ' (' + (k.data ? k.data.slice(5) : '') + ')');
    if (canvasKm) drawBarChart(canvasKm, 'Quilometragem Rodada Recente (km)', kValues, kLabels, false);
  }

  function drawBarChart(canvas, title, values, labels, isMoney) {
    const parent = canvas.parentElement;
    canvas.width = (parent && parent.clientWidth > 100) ? parent.clientWidth : 400;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (values.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum dado recente registrado.', canvas.width / 2, canvas.height / 2);
      return;
    }

    const max = Math.max(...values, 10);
    const padding = 30;
    const chartHeight = canvas.height - 70;
    const barWidth = Math.min((canvas.width - padding * 2) / values.length - 12, 60);

    // Título
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 14, 20);

    values.forEach((v, i) => {
      const x = padding + i * ((canvas.width - padding * 2) / values.length) + 6;
      const h = (v / max) * chartHeight;
      const y = canvas.height - h - 35;

      // Barra
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, [4, 4, 0, 0]);
      ctx.fill();

      // Valor no topo
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const txtVal = isMoney ? 'R$ ' + Math.round(v) : Math.round(v) + ' km';
      ctx.fillText(txtVal, x + barWidth / 2, y - 6);

      // Legenda inferior
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      const lbl = labels[i] || '';
      ctx.fillText(lbl, x + barWidth / 2, canvas.height - 15);
    });
  }

  // ========================
  // EXPORTAÇÃO CSV E IMPRESSÃO
  // ========================
  function exportarExcel() {
    const table = document.getElementById('report-table');
    if (!table) return;
    let csv = '\uFEFF';
    table.querySelectorAll('tr').forEach(tr => {
      const cols = [];
      tr.querySelectorAll('th,td').forEach(td => {
        cols.push('"' + td.textContent.replace(/"/g, '""').trim() + '"');
      });
      csv += cols.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${reportAtual}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Planilha CSV gerada com sucesso!', 'success');
  }

  function imprimirRelatorio() {
    const header = document.getElementById('print-header');
    const footer = document.getElementById('print-footer');
    const sub = document.getElementById('print-subtitle');
    const meta = document.getElementById('print-meta');
    const title = document.getElementById('report-title').textContent;

    if (sub) sub.textContent = title;
    if (meta) {
      const { ini, fim, placa } = getFiltros();
      meta.textContent = `Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Período: ${ini ? formatDateBR(ini) : 'Início'} até ${fim ? formatDateBR(fim) : 'Hoje'} ${placa ? '| Placa: ' + placa : ''} | Usuário: ${currentUser ? currentUser.nome : 'Admin'}`;
    }

    if (header) header.style.display = 'block';
    if (footer) footer.style.display = 'flex';

    window.print();

    // Restaura display após o disparo da impressão
    setTimeout(() => {
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }, 1000);
  }

  // ========================
  // IMPORTAÇÃO DE DADOS
  // ========================
  function doImport() {
    const preview = document.getElementById('import-preview');
    if (preview) preview.value = JSON.stringify(IMPORT_DATA, null, 2);
    if (confirm('Deseja importar os 29 veículos oficiais do Complexo Penal de Marília?')) {
      importVehicles();
    }
  }

  async function importVehicles() {
    let count = 0;
    for (const item of IMPORT_DATA) {
      const exists = vehicles.some(v => v.placa === item.placa);
      if (!exists) {
        const novo = { ...item, id: Date.now() + count };
        vehicles.push(novo);
        if (isOnline && CONFIG.isConfigured) {
          await sbInsert('vehicles', item);
        }
        count++;
      }
    }
    saveLocal();
    populateVehicleSelects();
    renderVehicles();
    renderDashboard();
    renderAlerts();
    showToast(`${count} novos veículos importados com sucesso!`, 'success');
  }

  // ========================
  // MÓDULO: GESTÃO DE USUÁRIOS
  // ========================
  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><b>${u.nome}</b></td>
        <td>${u.usuario}</td>
        <td><span class="badge ${u.role === 'admin' ? 'danger' : 'default'}">${u.role === 'admin' ? 'Administrador' : 'Operador'}</span></td>
        <td><span class="badge ${u.ativo ? 'success' : 'default'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" title="Editar Usuário" onclick="App.editUser(${u.id})">✏️</button>
          <button class="btn btn-sm btn-danger" title="Excluir Usuário" onclick="App.deleteUser(${u.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="empty-state"><div class="empty-icon">🔐</div><h4>Nenhum usuário cadastrado</h4></td></tr>';
  }

  function openUserModal() {
    editingUser = null;
    document.getElementById('user-modal-title').textContent = 'Novo Usuário';
    document.getElementById('user-form').reset();
    document.getElementById('u-id').value = '';
    document.getElementById('u-senha').required = true;
    document.getElementById('user-modal').classList.add('active');
  }

  function editUser(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    editingUser = id;
    document.getElementById('user-modal-title').textContent = `Editar Usuário — ${u.usuario}`;
    document.getElementById('u-id').value = u.id;
    document.getElementById('u-nome').value = u.nome;
    document.getElementById('u-usuario').value = u.usuario;
    document.getElementById('u-senha').value = '';
    document.getElementById('u-senha').required = false;
    document.getElementById('u-role').value = u.role || 'operador';
    document.getElementById('u-ativo').value = u.ativo ? '1' : '0';
    document.getElementById('user-modal').classList.add('active');
  }

  async function saveUser() {
    if (!requireAdmin()) return alert('Apenas administradores podem gerenciar usuários.');
    const data = formToObj('user-form');
    const nome = (data.nome || '').trim();
    const usuario = (data.usuario || '').trim().toLowerCase();
    const senha = (data.senha || '').trim();
    const role = data.role || 'operador';
    const ativo = parseInt(data.ativo || '1');

    if (!nome || !usuario) return alert('Nome e usuário são obrigatórios.');

    const existing = users.find(x => x.usuario.toLowerCase() === usuario && x.id !== editingUser);
    if (existing) return alert('Já existe um usuário com este login.');

    let hash = null;
    if (senha) hash = await hashPassword(senha);

    if (editingUser) {
      const idx = users.findIndex(x => x.id === editingUser);
      if (idx >= 0) {
        users[idx].nome = nome;
        users[idx].usuario = usuario;
        users[idx].role = role;
        users[idx].ativo = ativo;
        if (hash) users[idx].senha = hash;
      }
    } else {
      if (!senha) return alert('Senha é obrigatória para novo usuário.');
      users.push({ id: Date.now(), nome, usuario, senha: hash, role, ativo });
    }

    saveUsers();
    closeModal('user-modal');
    renderUsers();
    showToast('Usuário salvo com sucesso!', 'success');
  }

  function deleteUser(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir usuários.');
    if (currentUser && currentUser.id === id) return alert('Você não pode excluir sua própria conta conectada.');
    if (!confirm('Deseja realmente excluir este usuário?')) return;

    users = users.filter(u => u.id !== id);
    saveUsers();
    renderUsers();
    showToast('Usuário excluído.', 'info');
  }

  // ========================
  // UTILITÁRIOS
  // ========================
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');

    const hoje = new Date().toISOString().slice(0, 10);

    if (id === 'fueling-modal') {
      editingFueling = null;
      document.getElementById('fueling-modal-title').textContent = 'Registrar Abastecimento';
      document.getElementById('fueling-form').reset();
      document.getElementById('f-id').value = '';
      document.getElementById('f-data').value = hoje;
      populateVehicleSelects();
      populateDriverSelects();
      updatePrecoLitro();
    } else if (id === 'maintenance-modal') {
      editingMaintenance = null;
      document.getElementById('maintenance-modal-title').textContent = 'Registrar Manutenção';
      document.getElementById('maintenance-form').reset();
      document.getElementById('m-id').value = '';
      document.getElementById('m-data').value = hoje;
      populateVehicleSelects();
    } else if (id === 'km-modal') {
      editingKm = null;
      document.getElementById('km-modal-title').textContent = 'Registrar Quilometragem / Viagem';
      document.getElementById('km-form').reset();
      document.getElementById('k-id').value = '';
      document.getElementById('k-data').value = hoje;
      populateVehicleSelects();
      populateDriverSelects();
      updateKmDif();
    } else if (id === 'driver-modal') {
      editingDriver = null;
      document.getElementById('driver-modal-title').textContent = 'Novo Motorista';
      document.getElementById('driver-form').reset();
      document.getElementById('d-id').value = '';
    }
  }

  function fillForm(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    Object.keys(data).forEach(key => {
      const el = form.querySelector(`[name="${key}"]`) || form.querySelector('#' + formId.replace('-form', '-' + key));
      if (el) {
        if (el.type === 'date' && data[key]) {
          el.value = data[key].slice(0, 10);
        } else {
          el.value = data[key] !== null && data[key] !== undefined ? data[key] : '';
        }
      }
    });
  }

  function formToObj(formId) {
    const form = document.getElementById(formId);
    const data = {};
    if (!form) return data;
    Array.from(form.elements).forEach(el => {
      if (el.name) data[el.name] = el.value;
    });
    return data;
  }

  function formatDateBR(isoStr) {
    if (!isoStr) return '-';
    const parts = isoStr.slice(0, 10).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  }

  // ========================
  // EXPOSIÇÃO PÚBLICA
  // ========================
  return {
    init,
    // Veículos
    openVehicleModal, editVehicle, saveVehicle, deleteVehicle,
    // Modais gerais
    openModal, closeModal, switchPage,
    // Abastecimento
    editFueling, saveFueling, deleteFueling,
    // Manutenção
    editMaintenance, saveMaintenance, deleteMaintenance,
    // Quilometragem
    editKm, saveKm, deleteKm,
    // Motoristas
    editDriver, saveDriver, deleteDriver,
    // Relatórios
    selecionarRelatorio, gerarRelatorio, exportarExcel, imprimirRelatorio,
    // Usuários
    openUserModal, editUser, saveUser, deleteUser
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
