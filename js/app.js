// ==========================================
// FROTA PRO v3.0 - Lógica Completa
// Modo Online (Supabase) + Fallback Local
// ==========================================

const App = (function() {
  let token = localStorage.getItem('frota_token');
  let isOnline = false;
  let vehicles = [];
  let fueling = [];
  let maintenance = [];
  let km = [];
  let drivers = [];
  let editingVehicle = null;
  let editingDriver = null;
  let users = [];
  let currentUser = null;
  let editingUser = null;

  // ========================
  // DADOS DOS 29 VEÍCULOS - COMPLEXO PENAL DE MARÍLIA
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
  // SUPABASE API REST HELPERS
  // ========================
  async function sbRequest(table, method, body, id) {
    const url = CONFIG.isConfigured
      ? `${CONFIG.SUPABASE_URL}/rest/v1/${table}${id ? '?id=eq.' + id : ''}`
      : null;
    if (!url) return null;
    const headers = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': id ? 'return=representation' : 'return=representation'
    };
    try {
      const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.error('Supabase error', res.status, errText, body);
        throw new Error(res.status + ' ' + errText);
      }
      if (method === 'DELETE') return true;
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Supabase error:', e);
      window._lastSupabaseError = e.message || 'Erro desconhecido no Supabase';
      return null;
    }
  }

  async function sbGet(table, query) {
    const url = CONFIG.isConfigured
      ? `${CONFIG.SUPABASE_URL}/rest/v1/${table}?select=*${query ? '&' + query : ''}`
      : null;
    if (!url) return null;
    const headers = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY
    };
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (e) {
      console.error('Supabase GET error:', e);
      return null;
    }
  }

  async function sbInsert(table, obj) {
    return await sbRequest(table, 'POST', obj);
  }
  async function sbUpdate(table, id, obj) {
    return await sbRequest(table, 'PATCH', obj, id);
  }
  async function sbDelete(table, id) {
    return await sbRequest(table, 'DELETE', null, id);
  }

  // ========================
  // LOCALSTORAGE HELPERS
  // ========================
  function loadLocal() {
    vehicles = JSON.parse(localStorage.getItem('frota_vehicles') || '[]');
    fueling = JSON.parse(localStorage.getItem('frota_fueling') || '[]');
    maintenance = JSON.parse(localStorage.getItem('frota_maintenance') || '[]');
    km = JSON.parse(localStorage.getItem('frota_km') || '[]');
    drivers = JSON.parse(localStorage.getItem('frota_drivers') || '[]');
  }
  function saveLocal() {
    localStorage.setItem('frota_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('frota_fueling', JSON.stringify(fueling));
    localStorage.setItem('frota_maintenance', JSON.stringify(maintenance));
    localStorage.setItem('frota_km', JSON.stringify(km));
    localStorage.setItem('frota_drivers', JSON.stringify(drivers));
  }

  // ========================
  // USERS & HASH
  // ========================
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function loadUsers() {
    users = JSON.parse(localStorage.getItem('frota_users') || '[]');
    // Cria admin padrão se vazio
    if (users.length === 0) {
      const defaultAdmin = {
        id: Date.now(),
        nome: 'Administrador',
        usuario: 'admin',
        senha: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // sha256('admin')
        role: 'admin',
        ativo: 1
      };
      users.push(defaultAdmin);
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
  // INIT & AUTH
  // ========================
  function init() {
    loadUsers();
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
    document.getElementById('btn-login').addEventListener('click', doLogin);
    document.getElementById('btn-logout').addEventListener('click', doLogout);
    document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar);
    document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', () => switchPage(el.dataset.page)));
    document.getElementById('vehicle-search').addEventListener('input', () => renderVehicles());
    document.getElementById('vehicle-status-filter').addEventListener('change', () => renderVehicles());
    document.getElementById('btn-import').addEventListener('click', doImport);
  }

  async function doLogin() {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const alert = document.getElementById('login-alert');

    if (!u || !p) { alert.textContent = 'Preencha usuário e senha.'; alert.style.display = 'block'; return; }

    const hash = await hashPassword(p);
    const found = users.find(x => x.usuario === u && x.senha === hash && x.ativo === 1);

    if (found) {
      token = 'local_' + found.id + '_' + Date.now();
      currentUser = { id: found.id, nome: found.nome, usuario: found.usuario, role: found.role };
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user_name', found.nome || u);
      localStorage.setItem('frota_current_user', JSON.stringify(currentUser));
      showApp();
      loadData();
      updateModeBadge(CONFIG.isConfigured);
      return;
    }

    // Fallback legacy local
    if (u === CONFIG.LOCAL_USER && p === CONFIG.LOCAL_PASS) {
      token = 'local_' + Date.now();
      currentUser = { nome: 'Admin (Local)', usuario: u, role: 'admin' };
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user_name', 'Admin (Local)');
      localStorage.setItem('frota_current_user', JSON.stringify(currentUser));
      showApp();
      loadData();
      updateModeBadge(false);
    } else {
      alert.textContent = 'Usuário ou senha inválidos.';
      alert.style.display = 'block';
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
    document.getElementById('login-alert').style.display = 'none';
  }
  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    const name = localStorage.getItem('frota_user_name') || 'Admin';
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
    if (online) {
      badge.textContent = '☁️ Modo Online';
      badge.style.background = 'var(--success)';
      badge.style.color = '#fff';
      badge.style.display = 'inline-block';
    } else if (!CONFIG.isConfigured) {
      badge.textContent = '📴 Modo Local';
      badge.style.background = 'var(--warning)';
      badge.style.color = '#000';
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = '⚠️ Online sem permissão';
      badge.style.background = 'var(--danger)';
      badge.style.color = '#fff';
      badge.style.display = 'inline-block';
    }
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  }
  function switchPage(page) {
    // Restrições por role
    if (page === 'import' || page === 'users') {
      if (!requireAdmin()) {
        alert('Acesso restrito a administradores.');
        return;
      }
    }
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
    document.getElementById('page-title').textContent = {
      dashboard: 'Dashboard', vehicles: 'Veículos', fueling: 'Abastecimento',
      maintenance: 'Manutenção', km: 'Quilometragem', drivers: 'Motoristas',
      reports: 'Relatórios', import: 'Importar Dados', users: 'Usuários'
    }[page] || page;
    if (page === 'dashboard') renderDashboard();
    if (page === 'vehicles') renderVehicles();
    if (page === 'fueling') renderFueling();
    if (page === 'maintenance') renderMaintenance();
    if (page === 'km') renderKm();
    if (page === 'drivers') renderDrivers();
    if (page === 'reports') { initReports(); gerarRelatorio(); }
    if (page === 'users') renderUsers();
  }

  // ========================
  // DATA LOAD / SYNC
  // ========================
  async function testSupabaseWrite() {
    // Teste de escrita removido — agora usamos leitura para detectar modo online
    return true;
  }

  async function loadData() {
    if (!CONFIG.isConfigured) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;text-align:center;padding:20px;"><h1>⚠️ Configuração pendente</h1><p>O sistema requer conexão com o Supabase.</p><p>Verifique o arquivo <code>js/config.js</code> e configure URL e chave.</p></div>';
      return;
    }
    const v = await sbGet('vehicles');
    if (v !== null) {
      const f = await sbGet('fueling');
      const m = await sbGet('maintenance');
      const k = await sbGet('km_records');
      const d = await sbGet('drivers');
      vehicles = v || [];
      fueling = f || [];
      maintenance = m || [];
      km = k || [];
      drivers = d || [];
      isOnline = true;
      updateModeBadge(true);
      populateVehicleSelects();
      populateDriverSelects();
      renderDashboard();
    } else {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;text-align:center;padding:20px;"><h1>🚫 Sem conexão</h1><p>Não foi possível conectar ao Supabase.</p><p>Verifique sua conexão com a internet e as configurações em <code>js/config.js</code>.</p><button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;font-size:16px;cursor:pointer;">🔄 Tentar novamente</button></div>';
    }
  }

  // ========================
  // POPULATE DROPDOWNS
  // ========================
  function populateVehicleSelects() {
    const selects = ['f-placa', 'm-placa', 'k-placa'];
    selects.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = '<option value="">Selecione a placa</option>';
      vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.placa;
        opt.textContent = v.placa + ' - ' + v.marca + ' ' + v.modelo;
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
      sel.innerHTML = '<option value="">Selecione o motorista</option>';
      drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.nome;
        opt.textContent = d.nome;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
  }

  // ========================
  // DASHBOARD
  // ========================
  function renderDashboard() {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'ATIVO').length;
    const maint = vehicles.filter(v => v.status === 'MANUTENÇÃO').length;
    const now = new Date();
    const thisMonth = fueling.filter(f => {
      const d = new Date(f.data || f.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const fuelMonth = thisMonth.reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);
    const kmMonth = thisMonth.reduce((s, f) => s + (parseFloat(f.km) || 0), 0);

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-active').textContent = active;
    document.getElementById('kpi-maintenance').textContent = maint;
    document.getElementById('kpi-fuel-month').textContent = 'R$ ' + fuelMonth.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('kpi-km-month').textContent = kmMonth.toLocaleString('pt-BR');
    document.getElementById('kpi-drivers').textContent = drivers.length;

    document.getElementById('recent-fuel').innerHTML = fueling.slice(-5).reverse().map(f => `<li><b>${f.placa}</b> — ${f.litros} L / R$ ${f.valor} <span style="float:right;color:var(--text-muted);">${f.data || ''}</span></li>`).join('') || '<li class="empty-state"><p>Nenhum abastecimento</p></li>';
    document.getElementById('recent-maint').innerHTML = maintenance.slice(-5).reverse().map(m => `<li><b>${m.placa}</b> — ${m.tipo} <span style="float:right;color:var(--text-muted);">${m.data || ''}</span></li>`).join('') || '<li class="empty-state"><p>Nenhuma manutenção</p></li>';
  }

  // ========================
  // VEHICLES
  // ========================
  function renderVehicles() {
    const search = document.getElementById('vehicle-search').value.toLowerCase();
    const filter = document.getElementById('vehicle-status-filter').value;
    const filtered = vehicles.filter(v => {
      const matchSearch = (v.placa + ' ' + v.marca + ' ' + v.modelo).toLowerCase().includes(search);
      const matchStatus = !filter || v.status === filter;
      return matchSearch && matchStatus;
    });
    document.getElementById('vehicle-count').textContent = filtered.length + ' veículo(s)';
    const tbody = document.getElementById('vehicles-table');
    tbody.innerHTML = filtered.map(v => `
      <tr>
        <td><b>${v.placa}</b></td>
        <td>${v.grupo || '-'}</td>
        <td>${v.marca} ${v.modelo}</td>
        <td>${v.ano || '-'}</td>
        <td>${(v.hodometro || 0).toLocaleString('pt-BR')}</td>
        <td><span class="badge ${badgeClass(v.status)}">${v.status}</span></td>
        <td>${v.combustivel || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="App.editVehicle(${v.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="App.deleteVehicle(${v.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state"><div class="empty-icon">🚗</div><h4>Nenhum veículo encontrado</h4></td></tr>';
  }

  function badgeClass(status) {
    return { 'ATIVO': 'success', 'MANUTENÇÃO': 'danger', 'ARROLAMENTO': 'warning', 'INATIVO': 'secondary' }[status] || 'secondary';
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
    document.getElementById('vehicle-modal-title').textContent = 'Editar Veículo';
    document.getElementById('vehicle-modal').classList.add('active');
  }
  async function saveVehicle() {
    const data = formToObj('vehicle-form');
    if (!data.placa) return alert('Placa é obrigatória');
    data.hodometro = parseInt(data.hodometro) || 0;
    data.ano = parseInt(data.ano) || null;
    data.capacidade = parseInt(data.capacidade) || null;
    if (isOnline && CONFIG.isConfigured) {
      if (editingVehicle) {
        const res = await sbUpdate('vehicles', editingVehicle, data);
        if (!res) { alert('Erro ao atualizar no Supabase'); return; }
      } else {
        const res = await sbInsert('vehicles', data);
        if (!res || !res[0]) { alert('Erro ao inserir no Supabase'); return; }
        data.id = res[0].id;
      }
      await loadData();
    } else {
      if (editingVehicle) {
        const idx = vehicles.findIndex(v => v.id === editingVehicle);
        if (idx >= 0) vehicles[idx] = { ...vehicles[idx], ...data };
      } else {
        data.id = data.id || Date.now();
        vehicles.push(data);
      }
      saveLocal();
    }
    closeModal('vehicle-modal');
    renderVehicles();
    renderDashboard();
  }
  async function deleteVehicle(id) {
    if (!requireAdmin()) { alert('Apenas administradores podem excluir registros.'); return; }
    if (!confirm('Tem certeza?')) return;
    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('vehicles', id);
      await loadData();
    } else {
      vehicles = vehicles.filter(v => v.id !== id);
      saveLocal();
    }
    renderVehicles();
    renderDashboard();
  }

  // ========================
  // FUELING
  // ========================
  function renderFueling() {
    const tbody = document.getElementById('fueling-table');
    tbody.innerHTML = fueling.slice().reverse().map(f => `
      <tr>
        <td>${f.data || '-'}</td>
        <td><b>${f.placa}</b></td>
        <td>${f.motorista || '-'}</td>
        <td>${f.litros} L</td>
        <td>R$ ${f.valor}</td>
        <td>${(f.km || 0).toLocaleString('pt-BR')}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="App.deleteFueling(${f.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">⛽</div><h4>Nenhum abastecimento</h4></td></tr>';
  }
  async function saveFueling() {
    const data = formToObj('fueling-form');
    if (!data.placa || !data.litros || !data.valor) return alert('Preencha os campos obrigatórios');
    data.litros = parseFloat(data.litros);
    data.valor = parseFloat(data.valor);
    data.km = parseInt(data.km) || 0;
    if (isOnline && CONFIG.isConfigured) {
      const res = await sbInsert('fueling', data);
      if (!res || !res[0]) { alert('Erro ao inserir no Supabase'); return; }
      await loadData();
    } else {
      data.id = Date.now();
      fueling.push(data);
      saveLocal();
    }
    closeModal('fueling-modal');
    renderFueling();
    renderDashboard();
  }
  async function deleteFueling(id) {
    if (!requireAdmin()) { alert('Apenas administradores podem excluir registros.'); return; }
    if (!confirm('Tem certeza?')) return;
    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('fueling', id);
      await loadData();
    } else {
      fueling = fueling.filter(x => x.id !== id);
      saveLocal();
    }
    renderFueling();
    renderDashboard();
  }

  // ========================
  // MAINTENANCE
  // ========================
  function renderMaintenance() {
    const tbody = document.getElementById('maintenance-table');
    tbody.innerHTML = maintenance.slice().reverse().map(m => `
      <tr>
        <td>${m.data || '-'}</td>
        <td><b>${m.placa}</b></td>
        <td>${m.tipo}</td>
        <td>${m.descricao || '-'}</td>
        <td>R$ ${m.custo}</td>
        <td><span class="badge ${m.status === 'Concluído' ? 'success' : 'warning'}">${m.status}</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="App.deleteMaintenance(${m.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">🔧</div><h4>Nenhuma manutenção</h4></td></tr>';
  }
  async function saveMaintenance() {
    const data = formToObj('maintenance-form');
    if (!data.placa || !data.custo) return alert('Preencha os campos obrigatórios');
    data.custo = parseFloat(data.custo);
    if (isOnline && CONFIG.isConfigured) {
      const res = await sbInsert('maintenance', data);
      if (!res || !res[0]) { alert('Erro ao inserir no Supabase'); return; }
      await loadData();
    } else {
      data.id = Date.now();
      maintenance.push(data);
      saveLocal();
    }
    closeModal('maintenance-modal');
    renderMaintenance();
    renderDashboard();
  }
  async function deleteMaintenance(id) {
    if (!requireAdmin()) { alert('Apenas administradores podem excluir registros.'); return; }
    if (!confirm('Tem certeza?')) return;
    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('maintenance', id);
      await loadData();
    } else {
      maintenance = maintenance.filter(x => x.id !== id);
      saveLocal();
    }
    renderMaintenance();
    renderDashboard();
  }

  // ========================
  // KM
  // ========================
  function renderKm() {
    const tbody = document.getElementById('km-table');
    tbody.innerHTML = km.slice().reverse().map(k => `
      <tr>
        <td>${k.data || '-'}</td>
        <td><b>${k.placa}</b></td>
        <td>${(k.km_anterior || 0).toLocaleString('pt-BR')}</td>
        <td>${(k.km_atual || 0).toLocaleString('pt-BR')}</td>
        <td>${((k.km_atual || 0) - (k.km_anterior || 0)).toLocaleString('pt-BR')}</td>
        <td>${k.motorista || '-'}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="empty-state"><div class="empty-icon">📍</div><h4>Nenhum registro</h4></td></tr>';
  }
  async function saveKm() {
    const data = formToObj('km-form');
    if (!data.placa || !data.kmAtual) return alert('Preencha os campos obrigatórios');
    const payload = {
      data: data.data,
      placa: data.placa,
      km_anterior: parseInt(data.kmAnterior) || 0,
      km_atual: parseInt(data.kmAtual) || 0,
      motorista: data.motorista,
      observacao: data.observacao
    };
    if (isOnline && CONFIG.isConfigured) {
      const res = await sbInsert('km_records', payload);
      if (!res || !res[0]) { alert('Erro ao inserir no Supabase'); return; }
      await loadData();
    } else {
      payload.id = Date.now();
      km.push(payload);
      saveLocal();
    }
    closeModal('km-modal');
    renderKm();
    renderDashboard();
  }

  // ========================
  // DRIVERS
  // ========================
  function renderDrivers() {
    const tbody = document.getElementById('drivers-table');
    tbody.innerHTML = drivers.map(d => `
      <tr>
        <td><b>${d.nome}</b></td>
        <td>${d.cpf || '-'}</td>
        <td>${d.cnh || '-'}</td>
        <td>${d.cnh_vencimento ? new Date(d.cnh_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
        <td>${d.categoria || '-'}</td>
        <td><span class="badge ${d.status === 'ATIVO' ? 'success' : 'danger'}">${d.status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="App.editDriver(${d.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="App.deleteDriver(${d.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state"><div class="empty-icon">👤</div><h4>Nenhum motorista</h4></td></tr>';
  }
  function openModal(id) {
    document.getElementById(id).classList.add('active');
    if (id === 'fueling-modal') {
      populateVehicleSelects();
      populateDriverSelects();
      document.getElementById('fueling-form').reset();
    } else if (id === 'maintenance-modal') {
      populateVehicleSelects();
      document.getElementById('maintenance-form').reset();
    } else if (id === 'km-modal') {
      populateVehicleSelects();
      populateDriverSelects();
      document.getElementById('km-form').reset();
    } else if (id === 'driver-modal') {
      editingDriver = null;
      document.getElementById('driver-form').reset();
    }
  }
  function editDriver(id) { editingDriver = id; const d = drivers.find(x => x.id === id); if (!d) return; fillForm('driver-form', d); document.getElementById('driver-modal').classList.add('active'); }
  async function saveDriver() {
    const data = formToObj('driver-form');
    if (!data.nome) return alert('Nome é obrigatório');
    // Converte data do formato brasileiro (DD/MM/AAAA) ou já ISO para YYYY-MM-DD
    if (data.cnh_vencimento) {
      const d = data.cnh_vencimento;
      if (d.includes('/')) {
        const [dd, mm, aaaa] = d.split('/');
        data.cnh_vencimento = `${aaaa}-${mm}-${dd}`;
      }
      // Valida se a data de vencimento é futura
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const venc = new Date(data.cnh_vencimento + 'T00:00:00');
      if (venc < hoje) {
        return alert('A data de vencimento da CNH não pode ser anterior à data atual.');
      }
    } else {
      data.cnh_vencimento = null;
    }
    if (isOnline && CONFIG.isConfigured) {
      if (editingDriver) {
        const res = await sbUpdate('drivers', editingDriver, data);
        if (!res) { alert('Erro ao atualizar no Supabase: ' + (window._lastSupabaseError || '')); return; }
      } else {
        const res = await sbInsert('drivers', data);
        if (!res || !res[0]) { alert('Erro ao inserir no Supabase: ' + (window._lastSupabaseError || '')); return; }
        data.id = res[0].id;
      }
      await loadData();
    } else {
      if (editingDriver) {
        const idx = drivers.findIndex(d => d.id === editingDriver);
        if (idx >= 0) drivers[idx] = { ...drivers[idx], ...data };
      } else {
        data.id = Date.now();
        drivers.push(data);
      }
      saveLocal();
    }
    closeModal('driver-modal');
    renderDrivers();
    renderDashboard();
  }
  async function deleteDriver(id) {
    if (!requireAdmin()) { alert('Apenas administradores podem excluir registros.'); return; }
    if (!confirm('Tem certeza?')) return;
    if (isOnline && CONFIG.isConfigured) {
      await sbDelete('drivers', id);
      await loadData();
    } else {
      drivers = drivers.filter(d => d.id !== id);
      saveLocal();
    }
    renderDrivers();
    renderDashboard();
  }

  // ========================
  // REPORTS ENGINE
  // ========================
  let reportAtual = 'custoVeiculo';

  function initReports() {
    const sel = document.getElementById('r-placa');
    if (sel) {
      sel.innerHTML = '<option value="">Todas</option>' + vehicles.map(v => '<option value="' + v.placa + '">' + v.placa + '</option>').join('');
    }
    const hoje = new Date();
    const pri = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ini = document.getElementById('r-data-ini');
    const fim = document.getElementById('r-data-fim');
    if (ini) ini.value = pri.toISOString().slice(0, 10);
    if (fim) fim.value = hoje.toISOString().slice(0, 10);
  }

  function selecionarRelatorio(tipo) {
    reportAtual = tipo;
    document.querySelectorAll('.report-btn').forEach(b => b.classList.toggle('active', b.dataset.report === tipo));
    const titulos = {
      custoVeiculo: '💰 Custo por Veículo', consumo: '⛽ Consumo Médio de Combustível',
      manutencao: '🔧 Manutenção por Veículo', cnh: '⚠️ Alerta de CNH Vencendo',
      emManutencao: '🛠️ Veículos em Manutenção', parados: '🛑 Veículos Parados',
      kmMotorista: '👤 KM por Motorista', abastMotorista: '⛽ Abastecimentos por Motorista',
      kmPeriodo: '📍 Quilometragem por Período', frotaDisp: '🚗 Frota Disponível',
      usoGrupo: '📊 Utilização por Grupo', graficos: '📈 Gráficos'
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

  function filtrarPorPeriodo(lista, campoData) {
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

    let rows = [], headers = [];
    const fmtMoeda = v => 'R$ ' + (v || 0).toFixed(2).replace('.', ',');
    const fmtNum = v => (v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

    let vFilt = vehicles;
    if (placa) vFilt = vFilt.filter(v => v.placa === placa);
    if (grupo) vFilt = vFilt.filter(v => v.grupo === grupo);

    switch (reportAtual) {
      case 'custoVeiculo': {
        headers = ['Placa', 'Modelo', 'Combustível', 'Manutenção', 'Total'];
        rows = vFilt.map(v => {
          const c = filtrarPorPeriodo(fueling, 'data').filter(f => f.placa === v.placa).reduce((s, f) => s + (f.valor || 0), 0);
          const m = filtrarPorPeriodo(maintenance, 'data').filter(x => x.placa === v.placa).reduce((s, x) => s + (x.custo || 0), 0);
          return [v.placa, v.modelo, fmtMoeda(c), fmtMoeda(m), fmtMoeda(c + m)];
        });
        const tComb = rows.reduce((s, r) => s + parseFloat(r[2].replace(/[^\d,]/g, '').replace(',', '.')), 0);
        const tMan = rows.reduce((s, r) => s + parseFloat(r[3].replace(/[^\d,]/g, '').replace(',', '.')), 0);
        rows.push(['', '<strong>TOTAL</strong>', '<strong>' + fmtMoeda(tComb) + '</strong>', '<strong>' + fmtMoeda(tMan) + '</strong>', '<strong>' + fmtMoeda(tComb + tMan) + '</strong>']);
        break;
      }
      case 'consumo': {
        headers = ['Placa', 'Modelo', 'Litros', 'KM Rodados', 'Média KM/L'];
        rows = vFilt.map(v => {
          const abs = filtrarPorPeriodo(fueling, 'data').filter(f => f.placa === v.placa);
          const litros = abs.reduce((s, f) => s + (parseFloat(f.litros) || 0), 0);
          const kms = abs.reduce((s, f) => s + (parseFloat(f.km) || 0), 0);
          const media = litros > 0 ? kms / litros : 0;
          return [v.placa, v.modelo, fmtNum(litros), fmtNum(kms), fmtNum(media)];
        });
        break;
      }
      case 'manutencao': {
        headers = ['Placa', 'Modelo', 'Data', 'Serviço', 'Fornecedor', 'Custo'];
        const man = filtrarPorPeriodo(maintenance, 'data').filter(x => !placa || x.placa === placa);
        rows = man.map(x => [x.placa, (vehicles.find(v => v.placa === x.placa) || {}).modelo || '-', x.data, x.servico, x.fornecedor, fmtMoeda(x.custo)]);
        const t = man.reduce((s, x) => s + (x.custo || 0), 0);
        rows.push(['', '', '', '', '<strong>TOTAL</strong>', '<strong>' + fmtMoeda(t) + '</strong>']);
        break;
      }
      case 'cnh': {
        headers = ['Motorista', 'CNH', 'Validade', 'Dias Restantes', 'Status'];
        const hoje = new Date();
        rows = drivers.map(d => {
          const val = d.cnh_validade ? new Date(d.cnh_validade) : null;
          let dias = val ? Math.ceil((val - hoje) / (1000 * 60 * 60 * 24)) : 0;
          let status = dias < 0 ? '❌ Vencida' : dias <= 30 ? '🔴 Vence em ' + dias + ' dias' : dias <= 90 ? '🟡 Vence em ' + dias + ' dias' : '🟢 OK';
          return [d.nome, d.cnh, d.cnh_validade, dias, status];
        }).sort((a, b) => a[3] - b[3]);
        break;
      }
      case 'emManutencao': {
        headers = ['Placa', 'Modelo', 'Grupo', 'Status', 'KM Atual'];
        rows = vFilt.filter(v => v.status === 'MANUTENÇÃO').map(v => [v.placa, v.modelo, v.grupo || '-', v.status, (v.hodometro || 0).toLocaleString('pt-BR')]);
        break;
      }
      case 'parados': {
        headers = ['Placa', 'Modelo', 'Grupo', 'Status', 'KM Atual'];
        rows = vFilt.filter(v => v.status === 'ARROLAMENTO' || v.status === 'MANUTENÇÃO').map(v => [v.placa, v.modelo, v.grupo || '-', v.status, (v.hodometro || 0).toLocaleString('pt-BR')]);
        break;
      }
      case 'kmMotorista': {
        headers = ['Motorista', 'Placa', 'Data', 'KM Inicial', 'KM Final', 'Total'];
        const kreg = filtrarPorPeriodo(km, 'data').filter(k => (!placa || k.placa === placa) && k.motorista);
        rows = kreg.map(k => {
          const ini = parseFloat(k.km_atual) || 0;
          const fin = parseFloat(k.km_final) || ini;
          return [k.motorista, k.placa, k.data, fmtNum(ini), fmtNum(fin), fmtNum(fin - ini)];
        });
        break;
      }
      case 'abastMotorista': {
        headers = ['Motorista', 'Placa', 'Data', 'Litros', 'Valor Total'];
        const abs = filtrarPorPeriodo(fueling, 'data').filter(f => f.motorista && (!placa || f.placa === placa));
        rows = abs.map(f => [f.motorista, f.placa, f.data, fmtNum(f.litros), fmtMoeda(f.valor)]);
        const t = abs.reduce((s, f) => s + (f.valor || 0), 0);
        rows.push(['', '', '', '<strong>TOTAL</strong>', '<strong>' + fmtMoeda(t) + '</strong>']);
        break;
      }
      case 'kmPeriodo': {
        headers = ['Placa', 'Modelo', 'Data', 'KM Anterior', 'KM Atual', 'Rodado'];
        const kreg = filtrarPorPeriodo(km, 'data').filter(k => !placa || k.placa === placa);
        rows = kreg.map(k => {
          const ant = parseFloat(k.km_anterior) || 0;
          const atu = parseFloat(k.km_atual) || 0;
          return [k.placa, (vehicles.find(v => v.placa === k.placa) || {}).modelo || '-', k.data, fmtNum(ant), fmtNum(atu), fmtNum(atu - ant)];
        });
        break;
      }
      case 'frotaDisp': {
        headers = ['Placa', 'Modelo', 'Grupo', 'Status', 'Motorista Atual'];
        rows = vFilt.map(v => {
          const emMan = maintenance.some(x => x.placa === v.placa && x.status !== 'Concluído');
          const status = emMan ? '🔧 Em Manutenção' : v.status === 'Ativo' ? '🟢 Disponível' : '🔴 ' + v.status;
          return [v.placa, v.modelo, v.grupo, status, v.motorista || '-'];
        });
        break;
      }
      case 'usoGrupo': {
        headers = ['Grupo', 'Total Veículos', 'KM Rodados', 'Combustível (R$)', 'Manutenção (R$)', 'Custo/KM'];
        const grupos = {};
        vFilt.forEach(v => { if (!grupos[v.grupo]) grupos[v.grupo] = { v: [], km: 0, comb: 0, man: 0 }; grupos[v.grupo].v.push(v); });
        Object.keys(grupos).forEach(g => {
          grupos[g].v.forEach(v => {
            grupos[g].km += filtrarPorPeriodo(km, 'data').filter(k => k.placa === v.placa).reduce((s, k) => s + ((parseFloat(k.km_atual) || 0) - (parseFloat(k.km_anterior) || 0)), 0);
            grupos[g].comb += filtrarPorPeriodo(fueling, 'data').filter(f => f.placa === v.placa).reduce((s, f) => s + (f.valor || 0), 0);
            grupos[g].man += filtrarPorPeriodo(maintenance, 'data').filter(x => x.placa === v.placa).reduce((s, x) => s + (x.custo || 0), 0);
          });
        });
        rows = Object.keys(grupos).map(g => {
          const d = grupos[g];
          return [g, d.v.length, fmtNum(d.km), fmtMoeda(d.comb), fmtMoeda(d.man), d.km > 0 ? fmtMoeda((d.comb + d.man) / d.km) : '-'];
        });
        break;
      }
    }

    thead.innerHTML = '<tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>';
    tbody.innerHTML = rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('');
    if (rows.length === 0) tbody.innerHTML = '<tr><td colspan="' + headers.length + '" style="text-align:center;color:var(--text-muted);">Nenhum registro encontrado</td></tr>';
    count.textContent = rows.length + ' registro(s)';
  }

  function renderCharts() {
    const canvasFuel = document.getElementById('chart-fuel');
    const canvasKm = document.getElementById('chart-km');
    if (canvasFuel) drawBarChart(canvasFuel, 'Abastecimentos (R$)', fueling.slice(-6).map(f => f.valor || 0));
    if (canvasKm) drawBarChart(canvasKm, 'KM Registrados', km.slice(-6).map(k => k.km_atual || 0));
  }

  function drawBarChart(canvas, label, values) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const max = Math.max(...values, 1);
    const w = canvas.width / values.length;
    values.forEach((v, i) => {
      const h = (v / max) * (canvas.height - 30);
      ctx.fillStyle = 'rgba(59,130,246,0.7)';
      ctx.fillRect(i * w + 4, canvas.height - h - 20, w - 8, h);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(String(v), i * w + 8, canvas.height - h - 24);
    });
    ctx.fillStyle = '#aaa';
    ctx.fillText(label, 10, 14);
  }

  function exportarExcel() {
    const table = document.getElementById('report-table');
    if (!table) return;
    let csv = '\uFEFF';
    table.querySelectorAll('tr').forEach(tr => {
      const cols = [];
      tr.querySelectorAll('th,td').forEach(td => { cols.push('"' + td.textContent.replace(/"/g, '""') + '"'); });
      csv += cols.join(';') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_' + reportAtual + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
  }

  // ========================
  // IMPORT
  // ========================
  function doImport() {
    const preview = document.getElementById('import-preview');
    preview.value = JSON.stringify(IMPORT_DATA, null, 2);
    if (confirm('Deseja importar os 29 veículos?')) {
      importVehicles();
    }
  }
  async function importVehicles() {
    if (isOnline && CONFIG.isConfigured) {
      for (const v of IMPORT_DATA) {
        await sbInsert('vehicles', v);
      }
      await loadData();
    } else {
      vehicles = IMPORT_DATA.map((v, i) => ({ ...v, id: Date.now() + i }));
      saveLocal();
    }
    renderVehicles();
    renderDashboard();
    alert('29 veículos importados com sucesso!');
  }

  // ========================
  // UTILS
  // ========================
  function closeModal(id) { document.getElementById(id).classList.remove('active'); }
  function fillForm(formId, data) {
    const form = document.getElementById(formId);
    Object.keys(data).forEach(key => {
      const el = form.querySelector('[name="' + key + '"]') || form.querySelector('#' + formId.replace('-form', '-' + key));
      if (el) el.value = data[key] || '';
    });
  }
  function formToObj(formId) {
    const form = document.getElementById(formId);
    const data = {};
    Array.from(form.elements).forEach(el => { if (el.name) data[el.name] = el.value; });
    return data;
  }

  // ========================
  // USERS CRUD
  // ========================
  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.usuario}</td>
        <td><span class="badge badge-${u.role === 'admin' ? 'danger' : 'secondary'}">${u.role === 'admin' ? 'Administrador' : 'Operador'}</span></td>
        <td><span class="badge badge-${u.ativo ? 'success' : 'secondary'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="App.editUser(${u.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="App.deleteUser(${u.id})">🗑️</button>
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
    document.getElementById('user-modal-title').textContent = 'Editar Usuário';
    document.getElementById('u-id').value = u.id;
    document.getElementById('u-nome').value = u.nome;
    document.getElementById('u-usuario').value = u.usuario;
    document.getElementById('u-senha').value = '';
    document.getElementById('u-senha').required = false;
    document.getElementById('u-role').value = u.role;
    document.getElementById('u-ativo').value = u.ativo ? '1' : '0';
    document.getElementById('user-modal').classList.add('active');
  }

  async function saveUser() {
    if (!requireAdmin()) { alert('Apenas administradores podem gerenciar usuários.'); return; }
    const data = formToObj('user-form');
    const nome = (data.nome || '').trim();
    const usuario = (data.usuario || '').trim();
    const senha = (data.senha || '').trim();
    const role = data.role || 'operador';
    const ativo = parseInt(data.ativo || '1');
    if (!nome || !usuario) return alert('Nome e usuário são obrigatórios.');

    const existing = users.find(x => x.usuario === usuario && x.id !== editingUser);
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
  }

  function deleteUser(id) {
    if (!requireAdmin()) { alert('Apenas administradores podem excluir usuários.'); return; }
    if (currentUser && currentUser.id === id) { alert('Você não pode excluir seu próprio usuário.'); return; }
    if (!confirm('Tem certeza?')) return;
    users = users.filter(u => u.id !== id);
    saveUsers();
    renderUsers();
  }

  // ========================
  // PUBLIC API
  // ========================
  return {
    init, openVehicleModal, editVehicle, saveVehicle, deleteVehicle,
    openModal, saveFueling, deleteFueling, saveMaintenance, deleteMaintenance,
    saveKm, saveDriver, editDriver, deleteDriver, closeModal, switchPage,
    selecionarRelatorio, gerarRelatorio, exportarExcel,
    openUserModal, editUser, saveUser, deleteUser
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
