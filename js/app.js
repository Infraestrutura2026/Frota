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
      if (!res.ok) throw new Error(res.statusText);
      if (method === 'DELETE') return true;
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Supabase error:', e);
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
  // INIT & AUTH
  // ========================
  function init() {
    if (!token) {
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

    // Tenta login no Supabase primeiro
    if (CONFIG.isConfigured) {
      const rows = await sbGet('users', 'username=eq.' + encodeURIComponent(u));
      if (rows && rows.length > 0 && rows[0].password === p) {
        token = 'online_' + rows[0].id;
        localStorage.setItem('frota_token', token);
        localStorage.setItem('frota_user_name', rows[0].name || u);
        showApp();
        loadData();
        updateModeBadge(true);
        return;
      }
    }

    // Fallback local
    if (u === CONFIG.LOCAL_USER && p === CONFIG.LOCAL_PASS) {
      token = 'local_' + Date.now();
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user_name', 'Admin (Local)');
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
    localStorage.removeItem('frota_token');
    localStorage.removeItem('frota_user_name');
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
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
    document.getElementById('page-title').textContent = {
      dashboard: 'Dashboard', vehicles: 'Veículos', fueling: 'Abastecimento',
      maintenance: 'Manutenção', km: 'Quilometragem', drivers: 'Motoristas',
      reports: 'Relatórios', import: 'Importar Dados'
    }[page] || page;
    if (page === 'dashboard') renderDashboard();
    if (page === 'vehicles') renderVehicles();
    if (page === 'fueling') renderFueling();
    if (page === 'maintenance') renderMaintenance();
    if (page === 'km') renderKm();
    if (page === 'drivers') renderDrivers();
    if (page === 'reports') renderReports();
  }

  // ========================
  // DATA LOAD / SYNC
  // ========================
  async function testSupabaseWrite() {
    if (!CONFIG.isConfigured) return false;
    const testObj = { placa: '__TEST__', grupo: 'TEST', marca: 'TEST', modelo: 'TEST', ano: 2025, status: 'ATIVO' };
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/vehicles`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testObj)
      });
      if (res.status === 401 || res.status === 403) {
        console.warn('Supabase bloqueou escrita (RLS/permissoes). Usando modo local.');
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].id) {
          await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/vehicles?id=eq.${data[0].id}`, {
            method: 'DELETE',
            headers: { 'apikey': CONFIG.SUPABASE_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY }
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Supabase write test error:', e);
      return false;
    }
  }

  async function loadData() {
    if (CONFIG.isConfigured) {
      const canWrite = await testSupabaseWrite();
      if (canWrite) {
        const v = await sbGet('vehicles');
        const f = await sbGet('fueling');
        const m = await sbGet('maintenance');
        const k = await sbGet('km_records');
        const d = await sbGet('drivers');
        if (v !== null) vehicles = v;
        if (f !== null) fueling = f;
        if (m !== null) maintenance = m;
        if (k !== null) km = k;
        if (d !== null) drivers = d;
        isOnline = true;
        saveLocal(); // cache local
        updateModeBadge(true);
      } else {
        isOnline = false;
        loadLocal();
        updateModeBadge(false);
        setTimeout(() => {
          alert('⚠️ Supabase configurado mas sem permissão de escrita.\n\nO sistema está rodando em MODO LOCAL (dados salvos no navegador).\n\nPara usar online, execute no SQL Editor do Supabase:\n\nALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;\nALTER TABLE fueling DISABLE ROW LEVEL SECURITY;\nALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;\nALTER TABLE km_records DISABLE ROW LEVEL SECURITY;\nALTER TABLE drivers DISABLE ROW LEVEL SECURITY;\n\n(ou crie politicas RLS para o role anon)');
        }, 800);
      }
    } else {
      loadLocal();
      isOnline = false;
      updateModeBadge(false);
    }
    renderDashboard();
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
    return { 'ATIVO': 'success', 'MANUTENÇÃO': 'warning', 'ARROLAMENTO': 'info', 'INATIVO': 'danger' }[status] || 'secondary';
  }

  function openVehicleModal() { editingVehicle = null; document.getElementById('vehicle-modal-title').textContent = 'Novo Veículo'; document.getElementById('vehicle-form').reset(); document.getElementById('vehicle-modal').classList.add('active'); }
  function editVehicle(id) { editingVehicle = id; const v = vehicles.find(x => x.id === id); if (!v) return; fillForm('vehicle-form', v); document.getElementById('vehicle-modal-title').textContent = 'Editar Veículo'; document.getElementById('vehicle-modal').classList.add('active'); }
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
        <td>${d.categoria || '-'}</td>
        <td><span class="badge ${d.status === 'ATIVO' ? 'success' : 'danger'}">${d.status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="App.editDriver(${d.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="App.deleteDriver(${d.id})">🗑️</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="empty-state"><div class="empty-icon">👤</div><h4>Nenhum motorista</h4></td></tr>';
  }
  function openModal(id) { document.getElementById(id).classList.add('active'); editingDriver = null; document.getElementById('driver-form').reset(); }
  function editDriver(id) { editingDriver = id; const d = drivers.find(x => x.id === id); if (!d) return; fillForm('driver-form', d); document.getElementById('driver-modal').classList.add('active'); }
  async function saveDriver() {
    const data = formToObj('driver-form');
    if (!data.nome) return alert('Nome é obrigatório');
    if (isOnline && CONFIG.isConfigured) {
      if (editingDriver) {
        const res = await sbUpdate('drivers', editingDriver, data);
        if (!res) { alert('Erro ao atualizar no Supabase'); return; }
      } else {
        const res = await sbInsert('drivers', data);
        if (!res || !res[0]) { alert('Erro ao inserir no Supabase'); return; }
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
  // REPORTS (simple chart placeholders)
  // ========================
  function renderReports() {
    // simple bar chart via canvas
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
  // PUBLIC API
  // ========================
  return {
    init, openVehicleModal, editVehicle, saveVehicle, deleteVehicle,
    openModal, saveFueling, deleteFueling, saveMaintenance, deleteMaintenance,
    saveKm, saveDriver, editDriver, deleteDriver, closeModal, switchPage
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
