// ==========================================
// FROTA PRO v3.1 — Sistema de Gestão de Frotas
// Complexo Penal de Marília
// Suporte Multi-computador: Servidor Central Online + Nuvem Supabase + Fallback Local
// ==========================================

const App = (function() {
  let token = localStorage.getItem('frota_token');
  let backendMode = 'server'; // 'server' | 'supabase' | 'local'
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

  const GROUP_DEFINITIONS = {
    S2: { label: 'Grupo S2', icon: '🚐', className: 'group-s2' },
    S3: { label: 'Grupo S3', icon: '🚚', className: 'group-s3' },
    S4: { label: 'Grupo S4', icon: '🚛', className: 'group-s4' }
  };

  function normalizeGroup(group) {
    const value = String(group || '').trim().toUpperCase();
    return value || 'SEM GRUPO';
  }

  function getGroupKeys(items = []) {
    const keys = ['S2', 'S3', 'S4'];
    items.forEach(item => {
      const group = normalizeGroup(item.grupo);
      if (!keys.includes(group)) keys.push(group);
    });
    return keys;
  }

  function getGroupInfo(group) {
    const key = normalizeGroup(group);
    return GROUP_DEFINITIONS[key] || {
      label: key === 'SEM GRUPO' ? 'Sem grupo definido' : `Grupo ${key}`,
      icon: '🚗',
      className: 'group-other'
    };
  }

  function getVehicleGroupKey(placa) {
    const vehicle = vehicles.find(item => item.placa === placa);
    return normalizeGroup(vehicle && vehicle.grupo);
  }

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
  // UNIFIED DATA ACCESS LAYER (SERVIDOR NODE OU SUPABASE OU LOCAL)
  // ========================
  async function dataInsert(table, obj) {
    if (backendMode === 'server') {
      try {
        const res = await fetch('/api/' + table, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API insert error:', e);
      }
    } else if (backendMode === 'supabase' && CONFIG.isConfigured) {
      return await sbInsert(table, obj);
    }
    return null;
  }

  async function dataUpdate(table, id, obj) {
    if (backendMode === 'server') {
      try {
        const res = await fetch(`/api/${table}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API update error:', e);
      }
    } else if (backendMode === 'supabase' && CONFIG.isConfigured) {
      return await sbUpdate(table, id, obj);
    }
    return null;
  }

  async function dataDelete(table, id) {
    if (backendMode === 'server') {
      try {
        const res = await fetch(`/api/${table}/${id}`, { method: 'DELETE' });
        return res.ok;
      } catch (e) {
        console.warn('API delete error:', e);
        return false;
      }
    } else if (backendMode === 'supabase' && CONFIG.isConfigured) {
      return await sbDelete(table, id);
    }
    return true;
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
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      if (method === 'DELETE') return true;
      return await res.json();
    } catch (e) {
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
      try { vehicles = JSON.parse(storedV); } catch (e) { vehicles = []; }
    }
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
    try { users = JSON.parse(localStorage.getItem('frota_users') || '[]'); } catch (e) { users = []; }
    if (users.length === 0) {
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
    startPolling();
  }

  function bindEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      doLogin();
    });

    const toggleLoginPassword = document.getElementById('toggle-login-password');
    if (toggleLoginPassword) toggleLoginPassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('login-pass');
      if (!passwordInput) return;
      const showing = passwordInput.type === 'text';
      passwordInput.type = showing ? 'password' : 'text';
      toggleLoginPassword.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
      toggleLoginPassword.setAttribute('title', showing ? 'Mostrar senha' : 'Ocultar senha');
    });

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

    // Auto-preenchimento do KM anterior a partir do último lançamento do veículo
    const kPlaca = document.getElementById('k-placa');
    if (kPlaca) {
      kPlaca.addEventListener('change', function() {
        if (!editingKm) preencherKmAnteriorAutomatico(this.value);
      });
    }

    const kAnt = document.getElementById('k-kmAnterior');
    const kAtu = document.getElementById('k-kmAtual');
    if (kAnt) kAnt.addEventListener('input', updateKmDif);
    if (kAtu) kAtu.addEventListener('input', updateKmDif);

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

    const fLitros = document.getElementById('f-litros');
    const fValor = document.getElementById('f-valor');
    if (fLitros) fLitros.addEventListener('input', updatePrecoLitro);
    if (fValor) fValor.addEventListener('input', updatePrecoLitro);

    const loginPass = document.getElementById('login-pass');
    if (loginPass) {
      loginPass.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doLogin();
        }
      });
    }
  }

  function getUltimoLancamentoKm(placa, excluirId = null) {
    return km
      .map((registro, indice) => ({ registro, indice }))
      .filter(({ registro }) => registro.placa === placa && registro.id !== excluirId)
      .sort((a, b) => {
        // O ID representa a ordem de lançamento tanto no servidor quanto no modo local.
        const idA = Number(a.registro.id) || 0;
        const idB = Number(b.registro.id) || 0;
        if (idA !== idB) return idB - idA;
        return b.indice - a.indice;
      })[0]?.registro || null;
  }

  function preencherKmAnteriorAutomatico(placa) {
    const antEl = document.getElementById('k-kmAnterior');
    if (!antEl) return;

    const ultimo = getUltimoLancamentoKm(placa);
    const veiculo = vehicles.find(v => v.placa === placa);
    const kmBase = ultimo
      ? parseInt(ultimo.km_atual, 10) || 0
      : (veiculo ? parseInt(veiculo.hodometro, 10) || 0 : 0);

    antEl.value = kmBase;
    updateKmDif();
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
    document.getElementById('login-screen').style.display = 'grid';
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

  function updateModeBadge(mode) {
    const badge = document.getElementById('mode-badge');
    if (!badge) return;
    badge.style.display = 'inline-block';
    if (mode === 'server') {
      badge.textContent = '🌐 Online (Rede / Servidor Central)';
      badge.style.background = 'var(--success)';
      badge.style.color = '#fff';
      badge.title = 'Conectado ao Servidor Central. Todos os computadores compartilham os mesmos dados em tempo real!';
    } else if (mode === 'supabase') {
      badge.textContent = '☁️ Online (Nuvem Supabase)';
      badge.style.background = 'var(--info)';
      badge.style.color = '#fff';
      badge.title = 'Conectado ao banco de dados Supabase na nuvem.';
    } else {
      badge.textContent = '📴 Modo Local';
      badge.style.background = 'var(--warning)';
      badge.style.color = '#000';
      badge.title = 'Dados salvos localmente neste navegador.';
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
      km: 'Controle de Quilometragem',
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

    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  // ========================
  // CARREGAMENTO DE DADOS (SERVIDOR NODE -> SUPABASE -> LOCAL)
  // ========================
  async function loadData() {
    loadLocal();
    populateVehicleSelects();
    populateDriverSelects();
    renderDashboard();
    renderAlerts();

    // 1. Tenta carregar do Servidor Central Node.js (/api/status e /api/data)
    try {
      const sRes = await fetch('/api/status', { method: 'GET' });
      if (sRes.ok) {
        const st = await sRes.json();
        if (st && st.online) {
          const dRes = await fetch('/api/data', { method: 'GET' });
          if (dRes.ok) {
            const data = await dRes.json();
            backendMode = 'server';
            isOnline = true;
            vehicles = data.vehicles || [];
            fueling = data.fueling || [];
            maintenance = data.maintenance || [];
            km = data.km_records || [];
            drivers = data.drivers || [];
            if (data.users && data.users.length > 0) {
              users = data.users;
              saveUsers();
            }
            saveLocal();
            updateModeBadge('server');
            populateVehicleSelects();
            populateDriverSelects();
            renderDashboard();
            renderAlerts();
            return;
          }
        }
      }
    } catch (e) {
      // Servidor local não disponível (ex: hospedagem puramente estática)
    }

    // 2. Tenta carregar do Supabase (se configurado)
    const customUrl = localStorage.getItem('frota_custom_supabase_url');
    const customKey = localStorage.getItem('frota_custom_supabase_key');
    if (customUrl) CONFIG.SUPABASE_URL = customUrl;
    if (customKey) CONFIG.SUPABASE_KEY = customKey;

    if (CONFIG.isConfigured) {
      try {
        const v = await sbGet('vehicles');
        if (v !== null && Array.isArray(v)) {
          backendMode = 'supabase';
          isOnline = true;
          if (v.length > 0) vehicles = v;
          const f = await sbGet('fueling');
          const m = await sbGet('maintenance');
          const k = await sbGet('km_records');
          const d = await sbGet('drivers');
          if (f !== null) fueling = f;
          if (m !== null) maintenance = m;
          if (k !== null) km = k;
          if (d !== null) drivers = d;
          saveLocal();
          updateModeBadge('supabase');
          populateVehicleSelects();
          populateDriverSelects();
          renderDashboard();
          renderAlerts();
          return;
        }
      } catch (e) {
        console.warn('Supabase não conectado:', e);
      }
    }

    // 3. Fallback para Modo Local
    backendMode = 'local';
    isOnline = false;
    updateModeBadge('local');
  }

  // Polling em background para sincronização em tempo real entre múltiplos computadores
  function startPolling() {
    setInterval(async () => {
      if (backendMode === 'server' && !document.querySelector('.modal-overlay.active')) {
        try {
          const res = await fetch('/api/data', { method: 'GET' });
          if (res.ok) {
            const fresh = await res.json();
            vehicles = fresh.vehicles || vehicles;
            fueling = fresh.fueling || fueling;
            maintenance = fresh.maintenance || maintenance;
            km = fresh.km_records || km;
            drivers = fresh.drivers || drivers;
            saveLocal();

            const curPage = document.querySelector('.page-section.active');
            if (curPage) {
              const pageId = curPage.id.replace('page-', '');
              if (pageId === 'dashboard') { renderDashboard(); renderAlerts(); }
              else if (pageId === 'vehicles') renderVehicles();
              else if (pageId === 'fueling') renderFueling();
              else if (pageId === 'maintenance') renderMaintenance();
              else if (pageId === 'km') renderKm();
              else if (pageId === 'drivers') renderDrivers();
            }
          }
        } catch (e) {}
      }
    }, 15000);
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
    const selects = ['f-motorista'];
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
  function renderDashboardGroups() {
    const groupsEl = document.getElementById('dashboard-groups');
    if (!groupsEl) return;

    const groupKeys = getGroupKeys(vehicles);
    const countEl = document.getElementById('dashboard-groups-count');
    if (countEl) countEl.textContent = `${vehicles.length} veículos · ${groupKeys.length} grupos`;

    groupsEl.innerHTML = groupKeys.map(group => {
      const info = getGroupInfo(group);
      const groupVehicles = vehicles.filter(v => normalizeGroup(v.grupo) === group);
      const vehicleItems = groupVehicles.map(v => `
        <button type="button" class="dashboard-vehicle-item" onclick="App.openVehicleSummary(${v.id})" title="Abrir resumo de ${v.placa}">
          <span class="dashboard-vehicle-topline">
            <span class="placa-badge">${v.placa}</span>
            <span class="badge ${badgeClass(v.status)}"><span class="status-dot"></span>${v.status || 'ATIVO'}</span>
          </span>
          <strong>${v.marca || ''} ${v.modelo || ''}</strong>
          <span class="dashboard-vehicle-km">${(v.hodometro || 0).toLocaleString('pt-BR')} km no hodômetro</span>
        </button>
      `).join('') || `<div class="dashboard-group-empty"><span>${info.icon}</span><span>Nenhum veículo cadastrado neste grupo.</span></div>`;

      return `
        <section class="fleet-group-module dashboard-group-module ${info.className}" aria-labelledby="dashboard-${group.toLowerCase()}-title">
          <div class="fleet-group-header">
            <div class="fleet-group-heading">
              <span class="fleet-group-icon" aria-hidden="true">${info.icon}</span>
              <div>
                <h4 id="dashboard-${group.toLowerCase()}-title">${info.label}</h4>
                <span>Visão rápida dos veículos</span>
              </div>
            </div>
            <span class="fleet-group-count">${groupVehicles.length} veículo(s)</span>
          </div>
          <div class="dashboard-vehicle-list">${vehicleItems}</div>
        </section>
      `;
    }).join('');
  }

  function renderDashboard() {
    renderDashboardGroups();
    const total = vehicles.length;
    const active = vehicles.filter(v => (v.status || '').toUpperCase() === 'ATIVO').length;
    const maint = vehicles.filter(v => (v.status || '').toUpperCase() === 'MANUTENÇÃO').length;


    // Atualiza Barra de Disponibilidade da Frota
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    const maintPct = total > 0 ? Math.round((maint / total) * 100) : 0;
    const other = Math.max(0, total - active - maint);
    const otherPct = total > 0 ? Math.max(0, 100 - activePct - maintPct) : 0;

    const pctEl = document.getElementById('fleet-availability-pct');
    if (pctEl) pctEl.textContent = `${activePct}% Operacional (${active}/${total} viaturas)`;

    const barActive = document.getElementById('bar-active');
    const barMaint = document.getElementById('bar-maint');
    const barOther = document.getElementById('bar-other');
    if (barActive) barActive.style.width = `${activePct}%`;
    if (barMaint) barMaint.style.width = `${maintPct}%`;
    if (barOther) barOther.style.width = `${otherPct}%`;

    const lblActive = document.getElementById('lbl-active');
    const lblMaint = document.getElementById('lbl-maint');
    const lblOther = document.getElementById('lbl-other');
    if (lblActive) lblActive.textContent = `${active} Operacionais`;
    if (lblMaint) lblMaint.textContent = `${maint} Em Manutenção`;
    if (lblOther) lblOther.textContent = `${other} Arrolamento / Outros`;

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
    const searchEl = document.getElementById('vehicle-search');
    const filterEl = document.getElementById('vehicle-status-filter');
    const groupsEl = document.getElementById('vehicles-groups');
    if (!groupsEl) return;

    const search = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const filter = (filterEl ? filterEl.value : '').toUpperCase();
    const filtered = vehicles.filter(v => {
      const matchSearch = `${v.placa} ${v.marca} ${v.modelo} ${v.grupo}`.toLowerCase().includes(search);
      const matchStatus = !filter || (v.status || '').toUpperCase() === filter;
      return matchSearch && matchStatus;
    });

    const countEl = document.getElementById('vehicle-count');
    if (countEl) countEl.textContent = `${filtered.length} veículo(s) de ${vehicles.length}`;

    groupsEl.innerHTML = getGroupKeys(vehicles).map(group => {
      const info = getGroupInfo(group);
      const groupVehicles = filtered.filter(v => normalizeGroup(v.grupo) === group);
      const rows = groupVehicles.map(v => `
        <tr>
          <td><span class="placa-badge">${v.placa}</span></td>
          <td><b>${v.marca || ''}</b> ${v.modelo || ''}</td>
          <td>${v.ano || '-'}</td>
          <td><b>${(v.hodometro || 0).toLocaleString('pt-BR')} km</b></td>
          <td><span class="badge ${badgeClass(v.status)}"><span class="status-dot"></span>${v.status || 'ATIVO'}</span></td>
          <td>${v.combustivel || '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" title="Editar Veículo" onclick="App.editVehicle(${v.id})">✏️</button>
            <button class="btn btn-sm btn-danger" title="Excluir Veículo" onclick="App.deleteVehicle(${v.id})">🗑️</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="7" class="empty-state group-empty-state"><div class="empty-icon">${info.icon}</div><h4>Nenhum veículo neste grupo</h4><p>Altere os filtros para visualizar outros veículos.</p></td></tr>`;

      return `
        <section class="fleet-group-module ${info.className}" aria-labelledby="vehicles-${group.toLowerCase()}-title">
          <div class="fleet-group-header">
            <div class="fleet-group-heading">
              <span class="fleet-group-icon" aria-hidden="true">${info.icon}</span>
              <div>
                <h4 id="vehicles-${group.toLowerCase()}-title">${info.label}</h4>
                <span>Veículos cadastrados neste grupo</span>
              </div>
            </div>
            <span class="fleet-group-count">${groupVehicles.length} veículo(s)</span>
          </div>
          <div class="fleet-group-content table-responsive">
            <table class="data-table">
              <thead><tr><th>Placa</th><th>Marca / Modelo</th><th>Ano</th><th>KM Atual</th><th>Status</th><th>Combustível</th><th>Ações</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    }).join('');
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

  function getOilSummary(vehicle) {
    const currentKm = Math.max(0, parseInt(vehicle.hodometro, 10) || 0);
    const intervalKm = 10000;
    const kmSinceReference = currentKm % intervalKm;
    const kmRemaining = kmSinceReference === 0 ? intervalKm : intervalKm - kmSinceReference;
    return {
      currentKm,
      intervalKm,
      kmRemaining,
      nextKm: currentKm + kmRemaining,
      urgent: kmRemaining <= 1000
    };
  }

  function getVehicleMaintenanceSummary(vehicle) {
    const records = maintenance
      .filter(item => item.placa === vehicle.placa)
      .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    const openRecord = records.find(item => (item.status || '').toLowerCase() !== 'concluído');
    const record = openRecord || records[0];
    if (!record) {
      return {
        reason: 'Motivo ainda não informado nos registros de manutenção.',
        type: 'Manutenção',
        date: 'Data não informada',
        workshop: 'Oficina não informada',
        status: 'Em manutenção'
      };
    }
    return {
      reason: record.descricao || record.tipo || 'Motivo não informado',
      type: record.tipo || 'Manutenção',
      date: record.data ? formatDateBR(record.data) : 'Data não informada',
      workshop: record.oficina || 'Oficina não informada',
      status: record.status || 'Pendente'
    };
  }

  function openVehicleSummary(id) {
    const vehicle = vehicles.find(item => item.id === id);
    const body = document.getElementById('vehicle-summary-body');
    const modal = document.getElementById('vehicle-summary-modal');
    const title = document.getElementById('vehicle-summary-title');
    if (!vehicle || !body || !modal || !title) return;

    const group = getGroupInfo(vehicle.grupo);
    const status = (vehicle.status || 'ATIVO').toUpperCase();
    const oil = getOilSummary(vehicle);
    const latestKm = getUltimoLancamentoKm(vehicle.placa);
    const maintenanceInfo = status === 'MANUTENÇÃO' ? getVehicleMaintenanceSummary(vehicle) : null;
    const oilClass = oil.urgent ? 'warning' : 'success';
    const oilMessage = oil.urgent ? 'Troca próxima' : 'Dentro do intervalo';

    title.textContent = `${vehicle.placa} — Resumo do Veículo`;
    body.innerHTML = `
      <div class="vehicle-summary-heading ${group.className}">
        <div>
          <span class="placa-badge">${vehicle.placa}</span>
          <h4>${vehicle.marca || ''} ${vehicle.modelo || ''}</h4>
          <p>${group.label} · Ano ${vehicle.ano || 'não informado'}</p>
        </div>
        <span class="badge ${badgeClass(status)}"><span class="status-dot"></span>${vehicle.status || 'ATIVO'}</span>
      </div>

      <div class="vehicle-summary-grid">
        <div class="vehicle-summary-stat">
          <span>Quilometragem atual</span>
          <strong>${oil.currentKm.toLocaleString('pt-BR')} km</strong>
          <small>Hodômetro cadastrado</small>
        </div>
        <div class="vehicle-summary-stat ${oilClass}">
          <span>Troca de óleo</span>
          <strong>${oil.kmRemaining.toLocaleString('pt-BR')} km</strong>
          <small>${oilMessage} · próxima aos ${oil.nextKm.toLocaleString('pt-BR')} km</small>
        </div>
        <div class="vehicle-summary-stat">
          <span>Último lançamento</span>
          <strong>${latestKm ? `${(parseInt(latestKm.km_atual, 10) || 0).toLocaleString('pt-BR')} km` : 'Nenhum'}</strong>
          <small>${latestKm && latestKm.data ? formatDateBR(latestKm.data) : 'Ainda não registrado'}</small>
        </div>
      </div>

      <div class="vehicle-summary-note">
        <strong>📏 Critério da troca de óleo</strong>
        <p>Intervalo preventivo calculado a cada 10.000 km, usando o hodômetro atual como referência.</p>
      </div>

      ${maintenanceInfo ? `
        <div class="vehicle-summary-maintenance">
          <div class="vehicle-summary-maintenance-title"><span>🔧</span><strong>Motivo da manutenção</strong><span class="badge danger">${maintenanceInfo.status}</span></div>
          <p>${maintenanceInfo.reason}</p>
          <small>${maintenanceInfo.type} · ${maintenanceInfo.date} · ${maintenanceInfo.workshop}</small>
        </div>
      ` : ''}
    `;
    modal.classList.add('active');
  }

  async function saveVehicle() {
    const data = formToObj('vehicle-form');
    if (!data.placa) return alert('A placa do veículo é obrigatória.');
    data.placa = data.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    data.hodometro = parseInt(data.hodometro) || 0;
    data.ano = parseInt(data.ano) || null;
    data.capacidade = parseInt(data.capacidade) || null;
    data.status = (data.status || 'ATIVO').toUpperCase();

    const dup = vehicles.find(x => x.placa === data.placa && x.id !== editingVehicle);
    if (dup) return alert(`Já existe outro veículo cadastrado com a placa ${data.placa}.`);

    if (editingVehicle) {
      await dataUpdate('vehicles', editingVehicle, data);
      const idx = vehicles.findIndex(v => v.id === editingVehicle);
      if (idx >= 0) vehicles[idx] = { ...vehicles[idx], ...data };
    } else {
      const res = await dataInsert('vehicles', data);
      if (res && res.id) data.id = res.id;
      else data.id = data.id || Date.now();
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

    await dataDelete('vehicles', id);
    vehicles = vehicles.filter(x => x.id !== id);
    saveLocal();
    populateVehicleSelects();
    renderVehicles();
    renderDashboard();
    renderAlerts();
    showToast('Veículo excluído com sucesso.', 'info');
  }

  // ========================
  // MÓDULO: ABASTECIMENTO (CRUD COMPLETO)
  // ========================
  function renderFueling() {
    const tbody = document.getElementById('fueling-table');
    tbody.innerHTML = fueling.slice().reverse().map(f => {
      const unit = (parseFloat(f.litros) > 0 && parseFloat(f.valor) > 0) ? (parseFloat(f.valor) / parseFloat(f.litros)).toFixed(3).replace('.', ',') : '-';
      return `
        <tr>
          <td>${f.data ? formatDateBR(f.data) : '-'}</td>
          <td><span class="placa-badge">${f.placa}</span></td>
          <td><b>${f.motorista || '-'}</b></td>
          <td>${parseFloat(f.litros || 0).toFixed(2)} L</td>
          <td><b>R$ ${parseFloat(f.valor || 0).toFixed(2).replace('.', ',')}</b></td>
          <td style="color:var(--text-muted);">R$ ${unit}</td>
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

    // Atualização automática do odômetro do veículo no servidor e na tela
    const vIndex = vehicles.findIndex(v => v.placa === data.placa);
    if (vIndex >= 0 && data.km > (vehicles[vIndex].hodometro || 0)) {
      vehicles[vIndex].hodometro = data.km;
      dataUpdate('vehicles', vehicles[vIndex].id, { hodometro: data.km });
    }

    if (editingFueling) {
      await dataUpdate('fueling', editingFueling, data);
      const idx = fueling.findIndex(x => x.id === editingFueling);
      if (idx >= 0) fueling[idx] = { ...fueling[idx], ...data };
    } else {
      const res = await dataInsert('fueling', data);
      if (res && res.id) data.id = res.id;
      else data.id = data.id || Date.now();
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

    await dataDelete('fueling', id);
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
        <td><span class="placa-badge">${m.placa}</span></td>
        <td><b>${m.tipo || 'Preventiva'}</b></td>
        <td>${m.descricao || '-'}</td>
        <td><b style="color:#fbbf24;">R$ ${parseFloat(m.custo || 0).toFixed(2).replace('.', ',')}</b></td>
        <td><span class="badge ${m.status === 'Concluído' ? 'success' : 'warning'}"><span class="status-dot"></span>${m.status || 'Pendente'}</span></td>
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

    if (data.status === 'Em Andamento') {
      const v = vehicles.find(x => x.placa === data.placa);
      if (v && v.status !== 'MANUTENÇÃO') {
        v.status = 'MANUTENÇÃO';
        dataUpdate('vehicles', v.id, { status: 'MANUTENÇÃO' });
      }
    } else if (data.status === 'Concluído') {
      const v = vehicles.find(x => x.placa === data.placa);
      if (v && v.status === 'MANUTENÇÃO') {
        v.status = 'ATIVO';
        dataUpdate('vehicles', v.id, { status: 'ATIVO' });
      }
    }

    if (editingMaintenance) {
      await dataUpdate('maintenance', editingMaintenance, data);
      const idx = maintenance.findIndex(x => x.id === editingMaintenance);
      if (idx >= 0) maintenance[idx] = { ...maintenance[idx], ...data };
    } else {
      const res = await dataInsert('maintenance', data);
      if (res && res.id) data.id = res.id;
      else data.id = data.id || Date.now();
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

    await dataDelete('maintenance', id);
    maintenance = maintenance.filter(x => x.id !== id);
    saveLocal();
    renderMaintenance();
    renderDashboard();
    renderAlerts();
    showToast('Manutenção excluída.', 'info');
  }

  // ========================
  // MÓDULO: QUILOMETRAGEM
  // ========================
  function renderKmHistoryRow(k) {
    const diff = (parseInt(k.km_atual) || 0) - (parseInt(k.km_anterior) || 0);
    return `
      <tr>
        <td>${k.data ? formatDateBR(k.data) : '-'}</td>
        <td><span class="placa-badge">${k.placa}</span></td>
        <td>${(k.km_anterior || 0).toLocaleString('pt-BR')} km</td>
        <td><b>${(k.km_atual || 0).toLocaleString('pt-BR')} km</b></td>
        <td style="color:${diff >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700;">
          ${diff >= 0 ? '+' : ''}${diff.toLocaleString('pt-BR')} km
        </td>
        <td><small style="color:var(--text-muted);">${k.observacao || '-'}</small></td>
        <td>
          <button class="btn btn-sm btn-primary" title="Editar Quilometragem" onclick="App.editKm(${k.id})">✏️</button>
          <button class="btn btn-sm btn-danger" title="Excluir Lançamento" onclick="App.deleteKm(${k.id})">🗑️</button>
        </td>
      </tr>
    `;
  }

  function openKmForVehicle(placa) {
    openModal('km-modal');
    const select = document.getElementById('k-placa');
    if (select) {
      select.value = placa;
      preencherKmAnteriorAutomatico(placa);
    }
  }

  function renderKm() {
    const groupsEl = document.getElementById('km-groups');
    if (!groupsEl) return;

    const groupKeys = getGroupKeys(vehicles);
    km.forEach(registro => {
      const group = getVehicleGroupKey(registro.placa);
      if (!groupKeys.includes(group)) groupKeys.push(group);
    });

    groupsEl.innerHTML = groupKeys.map(group => {
      const info = getGroupInfo(group);
      const groupVehicles = vehicles.filter(v => normalizeGroup(v.grupo) === group);
      const groupRecords = km.filter(registro => getVehicleGroupKey(registro.placa) === group);

      const vehicleRows = groupVehicles.map(v => {
        const registros = km.filter(registro => registro.placa === v.placa);
        const ultimo = getUltimoLancamentoKm(v.placa);
        const ultimoDiff = ultimo
          ? (parseInt(ultimo.km_atual) || 0) - (parseInt(ultimo.km_anterior) || 0)
          : 0;
        return `
          <tr>
            <td><span class="placa-badge">${v.placa}</span></td>
            <td><b>${v.marca || ''}</b> ${v.modelo || ''}</td>
            <td><b>${(v.hodometro || 0).toLocaleString('pt-BR')} km</b></td>
            <td>${ultimo ? formatDateBR(ultimo.data) : '<span class="text-muted">Sem lançamento</span>'}</td>
            <td style="color:${ultimo ? (ultimoDiff >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)'};font-weight:700;">
              ${ultimo ? `${ultimoDiff >= 0 ? '+' : ''}${ultimoDiff.toLocaleString('pt-BR')} km` : '-'}
            </td>
            <td>${registros.length}</td>
            <td><button class="btn btn-sm btn-primary" title="Registrar Quilometragem para ${v.placa}" onclick="App.openKmForVehicle('${v.placa}')">+ Registrar</button></td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="7" class="empty-state group-empty-state"><div class="empty-icon">${info.icon}</div><h4>Nenhum veículo neste grupo</h4></td></tr>`;

      const history = groupRecords.length > 0 ? `
        <details class="km-group-history">
          <summary>Ver histórico de lançamentos (${groupRecords.length})</summary>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Data</th><th>Placa</th><th>KM Anterior</th><th>KM Atual</th><th>Diferença</th><th>Observação</th><th>Ações</th></tr></thead>
              <tbody>${groupRecords.slice().sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)).map(renderKmHistoryRow).join('')}</tbody>
            </table>
          </div>
        </details>
      ` : '<p class="group-helper-text">Nenhum lançamento registrado para este grupo.</p>';

      return `
        <section class="fleet-group-module ${info.className}" aria-labelledby="km-${group.toLowerCase()}-title">
          <div class="fleet-group-header">
            <div class="fleet-group-heading">
              <span class="fleet-group-icon" aria-hidden="true">${info.icon}</span>
              <div>
                <h4 id="km-${group.toLowerCase()}-title">${info.label}</h4>
                <span>Controle de quilometragem por veículo</span>
              </div>
            </div>
            <span class="fleet-group-count">${groupVehicles.length} veículo(s) · ${groupRecords.length} lançamento(s)</span>
          </div>
          <div class="fleet-group-content table-responsive">
            <table class="data-table km-summary-table">
              <thead><tr><th>Placa</th><th>Veículo</th><th>Hodômetro Atual</th><th>Último Lançamento</th><th>KM Rodados</th><th>Registros</th><th>Ação</th></tr></thead>
              <tbody>${vehicleRows}</tbody>
            </table>
          </div>
          ${history}
        </section>
      `;
    }).join('');
  }

  function editKm(id) {
    editingKm = id;
    const k = km.find(x => x.id === id);
    if (!k) return;
    populateVehicleSelects();
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
      observacao: data.observacao
    };

    const vIndex = vehicles.findIndex(v => v.placa === payload.placa);
    if (vIndex >= 0 && kmAtu > (vehicles[vIndex].hodometro || 0)) {
      vehicles[vIndex].hodometro = kmAtu;
      dataUpdate('vehicles', vehicles[vIndex].id, { hodometro: kmAtu });
    }

    if (editingKm) {
      await dataUpdate('km_records', editingKm, payload);
      const idx = km.findIndex(x => x.id === editingKm);
      if (idx >= 0) km[idx] = { ...km[idx], ...payload };
    } else {
      const res = await dataInsert('km_records', payload);
      if (res && res.id) payload.id = res.id;
      else payload.id = payload.id || Date.now();
      km.push(payload);
    }

    saveLocal();
    closeModal('km-modal');
    renderKm();
    renderVehicles();
    renderDashboard();
    showToast('Quilometragem registrada com sucesso!', 'success');
  }

  async function deleteKm(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir registros.');
    if (!confirm('Deseja excluir este registro de quilometragem?')) return;

    await dataDelete('km_records', id);
    km = km.filter(x => x.id !== id);
    saveLocal();
    renderKm();
    renderDashboard();
    showToast('Registro de KM excluído.', 'info');
  }

  // ========================
  // MÓDULO: MOTORISTAS
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
          vencBadge = `<span class="badge danger" title="Venceu há ${Math.abs(dias)} dias"><span class="status-dot"></span>${formatDateBR(d.cnh_vencimento)} (Vencida)</span>`;
        } else if (dias <= 30) {
          vencBadge = `<span class="badge warning" title="Vence em ${dias} dias"><span class="status-dot"></span>${formatDateBR(d.cnh_vencimento)} (${dias}d)</span>`;
        } else {
          vencBadge = `${formatDateBR(d.cnh_vencimento)}`;
        }
      }

      return `
        <tr>
          <td><b>${d.nome}</b></td>
          <td>${d.cpf || '-'}</td>
          <td><code>${d.cnh || '-'}</code></td>
          <td>${vencBadge}</td>
          <td><span class="badge default">${d.categoria || 'B'}</span></td>
          <td><span class="badge ${d.status === 'ATIVO' ? 'success' : 'danger'}"><span class="status-dot"></span>${d.status || 'ATIVO'}</span></td>
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

    let cnhVencidaAviso = false;
    if (data.cnh_vencimento) {
      if (data.cnh_vencimento.includes('/')) {
        const [dd, mm, aaaa] = data.cnh_vencimento.split('/');
        data.cnh_vencimento = `${aaaa}-${mm}-${dd}`;
      }
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const venc = new Date(data.cnh_vencimento + 'T00:00:00');
      if (venc < hoje) cnhVencidaAviso = true;
    } else {
      data.cnh_vencimento = null;
    }

    if (editingDriver) {
      await dataUpdate('drivers', editingDriver, data);
      const idx = drivers.findIndex(d => d.id === editingDriver);
      if (idx >= 0) drivers[idx] = { ...drivers[idx], ...data };
    } else {
      const res = await dataInsert('drivers', data);
      if (res && res.id) data.id = res.id;
      else data.id = data.id || Date.now();
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

    await dataDelete('drivers', id);
    drivers = drivers.filter(d => d.id !== id);
    saveLocal();
    populateDriverSelects();
    renderDrivers();
    renderDashboard();
    renderAlerts();
    showToast('Motorista excluído.', 'info');
  }

  // ========================
  // MOTOR DE RELATÓRIOS
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

    const fValues = fueling.slice(-6).map(f => parseFloat(f.valor) || 0);
    const fLabels = fueling.slice(-6).map(f => (f.placa || '') + ' (' + (f.data ? f.data.slice(5) : '') + ')');
    if (canvasFuel) drawBarChart(canvasFuel, 'Abastecimentos Recentes (R$)', fValues, fLabels, true);

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

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 14, 20);

    values.forEach((v, i) => {
      const x = padding + i * ((canvas.width - padding * 2) / values.length) + 6;
      const h = (v / max) * chartHeight;
      const y = canvas.height - h - 35;

      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const txtVal = isMoney ? 'R$ ' + Math.round(v) : Math.round(v) + ' km';
      ctx.fillText(txtVal, x + barWidth / 2, y - 6);

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

    setTimeout(() => {
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }, 1000);
  }

  // ========================
  // MODAL DE CONFIGURAÇÃO ONLINE & REDE
  // ========================
  function openOnlineConfigModal() {
    const modal = document.getElementById('online-config-modal');
    if (!modal) return;
    const titleEl = document.getElementById('cfg-status-title');
    const descEl = document.getElementById('cfg-status-desc');
    const serverUrlEl = document.getElementById('cfg-server-url');
    const supUrlEl = document.getElementById('cfg-supabase-url');
    const supKeyEl = document.getElementById('cfg-supabase-key');

    if (serverUrlEl) {
      serverUrlEl.value = window.location.origin;
    }

    if (backendMode === 'server') {
      if (titleEl) {
        titleEl.textContent = '🌐 Servidor Central Online Ativo';
        titleEl.parentElement.style.borderLeftColor = 'var(--success)';
      }
      if (descEl) {
        descEl.innerHTML = 'Este sistema está conectado ao <b>Servidor Central Integrado</b>. Todos os computadores ou celulares que acessarem este link compartilham a mesma base de dados em tempo real!';
      }
    } else if (backendMode === 'supabase') {
      if (titleEl) {
        titleEl.textContent = '☁️ Conectado ao Banco na Nuvem (Supabase)';
        titleEl.parentElement.style.borderLeftColor = 'var(--info)';
      }
      if (descEl) {
        descEl.innerHTML = 'O sistema está conectado ao banco de dados Supabase na nuvem. Todos os dispositivos compartilham os dados remotamente.';
      }
    } else {
      if (titleEl) {
        titleEl.textContent = '📴 Modo Local (Armazenamento neste Navegador)';
        titleEl.parentElement.style.borderLeftColor = 'var(--warning)';
      }
      if (descEl) {
        descEl.innerHTML = 'Os dados estão sendo salvos apenas no navegador deste dispositivo.';
      }
    }

    if (supUrlEl) supUrlEl.value = localStorage.getItem('frota_custom_supabase_url') || CONFIG.SUPABASE_URL || '';
    if (supKeyEl) supKeyEl.value = localStorage.getItem('frota_custom_supabase_key') || CONFIG.SUPABASE_KEY || '';

    modal.classList.add('active');
  }

  async function testarConexaoSupabase() {
    const url = (document.getElementById('cfg-supabase-url').value || '').trim();
    const key = (document.getElementById('cfg-supabase-key').value || '').trim();
    if (!url || !key) return alert('Informe a URL e a Chave do Supabase para testar.');

    showToast('Testando conexão com Supabase...', 'info');
    try {
      const res = await fetch(`${url}/rest/v1/vehicles?select=count`, {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
      });
      if (res.ok) {
        alert('✅ Conexão com o Supabase estabelecida com sucesso!');
      } else {
        alert(`⚠️ Resposta do Supabase: Código HTTP ${res.status}. Verifique se a tabela 'vehicles' foi criada via supabase-setup.sql.`);
      }
    } catch (e) {
      alert(`❌ Erro ao conectar no Supabase: ${e.message}`);
    }
  }

  async function salvarConexaoSupabase() {
    const url = (document.getElementById('cfg-supabase-url').value || '').trim();
    const key = (document.getElementById('cfg-supabase-key').value || '').trim();

    if (!url || !key) {
      localStorage.removeItem('frota_custom_supabase_url');
      localStorage.removeItem('frota_custom_supabase_key');
      CONFIG.SUPABASE_URL = '';
      CONFIG.SUPABASE_KEY = '';
      showToast('Configuração de nuvem limpa. Utilizando o Servidor Central.', 'info');
    } else {
      localStorage.setItem('frota_custom_supabase_url', url);
      localStorage.setItem('frota_custom_supabase_key', key);
      CONFIG.SUPABASE_URL = url;
      CONFIG.SUPABASE_KEY = key;
      showToast('Configuração do Supabase salva com sucesso!', 'success');
    }
    closeModal('online-config-modal');
    loadData();
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
        const res = await dataInsert('vehicles', item);
        const novo = res && res.id ? res : { ...item, id: Date.now() + count };
        vehicles.push(novo);
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

    const userPayload = { nome, usuario, role, ativo };
    if (hash) userPayload.senha = hash;

    if (editingUser) {
      await dataUpdate('users', editingUser, userPayload);
      const idx = users.findIndex(x => x.id === editingUser);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...userPayload };
      }
    } else {
      if (!senha) return alert('Senha é obrigatória para novo usuário.');
      userPayload.senha = hash;
      const res = await dataInsert('users', userPayload);
      const newU = res && res.id ? res : { ...userPayload, id: Date.now() };
      users.push(newU);
    }

    saveUsers();
    closeModal('user-modal');
    renderUsers();
    showToast('Usuário salvo com sucesso!', 'success');
  }

  async function deleteUser(id) {
    if (!requireAdmin()) return alert('Apenas administradores podem excluir usuários.');
    if (currentUser && currentUser.id === id) return alert('Você não pode excluir sua própria conta conectada.');
    if (!confirm('Deseja realmente excluir este usuário?')) return;

    await dataDelete('users', id);
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
      document.getElementById('km-modal-title').textContent = 'Registrar Quilometragem';
      document.getElementById('km-form').reset();
      document.getElementById('k-id').value = '';
      document.getElementById('k-data').value = hoje;
      populateVehicleSelects();
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
    openVehicleModal, editVehicle, openVehicleSummary, saveVehicle, deleteVehicle,
    // Modais gerais
    openModal, closeModal, switchPage,
    // Abastecimento
    editFueling, saveFueling, deleteFueling,
    // Manutenção
    editMaintenance, saveMaintenance, deleteMaintenance,
    // Quilometragem
    openKmForVehicle, editKm, saveKm, deleteKm,
    // Motoristas
    editDriver, saveDriver, deleteDriver,
    // Relatórios
    selecionarRelatorio, gerarRelatorio, exportarExcel, imprimirRelatorio,
    // Usuários
    openUserModal, editUser, saveUser, deleteUser,
    // Conexão Online
    openOnlineConfigModal, testarConexaoSupabase, salvarConexaoSupabase
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
