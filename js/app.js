// ==========================================
// FROTA PRO v3.0 - Lógica Completa
// ==========================================

const App = (function() {
  let token = localStorage.getItem('frota_token');
  let vehicles = [];
  let fueling = [];
  let maintenance = [];
  let km = [];
  let drivers = [];
  let editingVehicle = null;
  let editingDriver = null;

  // Dados dos 29 veículos do Complexo Penal de Marília
  const IMPORT_DATA = [
    { placa: 'RJJ7A31', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'EMK3G05', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'EXC9E72', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'EXF0G42', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'EWT7G13', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'FAE1H56', grupo: 'S2', marca: 'Hyundai', modelo: 'HB20S', ano: 2022, cor: 'Prata', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'FAE2I03', grupo: 'S3', marca: 'Fiat', modelo: 'Strada', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'FLEX', capacidade: 5 },
    { placa: 'FAE3J24', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE4K56', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE5L78', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE6M90', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE7N12', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE8O34', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE9P56', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE0Q78', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE1R90', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE2S12', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE3T34', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE4U56', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE5V78', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE6W90', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE7X12', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE8Y34', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE9Z56', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE0A78', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE1B90', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE2C12', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE3D34', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 },
    { placa: 'FAE4E56', grupo: 'S4', marca: 'Toyota', modelo: 'Hilux', ano: 2023, cor: 'Branca', chassi: '', renavam: '', hodometro: 0, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 5 }
  ];

  // API helper
  async function api(action, data) {
    try {
      const url = CONFIG.API_URL + '?action=' + action;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      return await response.json();
    } catch (e) {
      console.error('API Error:', e);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  }

  function showAlert(msg, type = 'danger', target = 'page') {
    const el = document.getElementById(target === 'page' ? 'page-alert' : 'login-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert alert-' + type + ' show';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; el.className = 'alert'; }, 5000);
  }

  function formatCurrency(val) {
    return 'R$ ' + parseFloat(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  function formatNumber(val) {
    return parseInt(val || 0).toLocaleString('pt-BR');
  }

  function getStatusBadge(status) {
    const map = {
      'ATIVO': 'success',
      'MANUTENÇÃO': 'warning',
      'ARROLAMENTO': 'info',
      'INATIVO': 'danger',
      'ATIVO': 'success',
      'INATIVO': 'danger',
      'AFASTADO': 'warning'
    };
    return '<span class="status-badge ' + (map[status] || 'default') + '">' + (status || 'N/A') + '</span>';
  }

  // ========== LOGIN ==========
  async function login() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    if (!user || !pass) { showAlert('Preencha usuário e senha', 'danger', 'login'); return; }

    const res = await api('login', { user, pass });
    if (res.success) {
      token = res.token;
      localStorage.setItem('frota_token', token);
      localStorage.setItem('frota_user', res.name || 'Admin');
      showApp();
    } else {
      showAlert(res.error || 'Erro no login', 'danger', 'login');
    }
  }

  function logout() {
    token = null;
    localStorage.removeItem('frota_token');
    localStorage.removeItem('frota_user');
    showLogin();
  }

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    document.body.className = 'login-body';
  }

  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.body.className = '';
    document.getElementById('user-name').textContent = localStorage.getItem('frota_user') || 'Admin';
    loadDashboard();
  }

  // ========== NAVIGATION ==========
  function showPage(page) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-page="' + page + '"]').classList.add('active');

    const titles = {
      dashboard: 'Dashboard',
      vehicles: 'Veículos',
      fueling: 'Abastecimento',
      maintenance: 'Manutenção',
      km: 'Quilometragem',
      drivers: 'Motoristas',
      reports: 'Relatórios',
      import: 'Importar Dados'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Load data
    if (page === 'dashboard') loadDashboard();
    if (page === 'vehicles') loadVehicles();
    if (page === 'fueling') loadFueling();
    if (page === 'maintenance') loadMaintenance();
    if (page === 'km') loadKm();
    if (page === 'drivers') loadDrivers();
    if (page === 'reports') loadReports();
    if (page === 'import') initImport();

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  }

  // ========== DASHBOARD ==========
  async function loadDashboard() {
    const res = await api('getDashboard', {});
    if (res.success && res.data) {
      const d = res.data;
      document.getElementById('kpi-total').textContent = d.totalVehicles || 0;
      document.getElementById('kpi-active').textContent = d.activeVehicles || 0;
      document.getElementById('kpi-maintenance').textContent = d.maintenanceVehicles || 0;
      document.getElementById('kpi-fuel-month').textContent = formatCurrency(d.fuelMonth || 0);
      document.getElementById('kpi-km-month').textContent = formatNumber(d.kmMonth || 0);
      document.getElementById('kpi-drivers').textContent = d.totalDrivers || 0;

      renderRecentList('recent-fuel', d.recentFuel || [], f =>
        '<div><div class="recent-title">' + f.Placa + '</div><div class="recent-meta">' + f.Data + ' • ' + f.Litros + 'L</div></div><div class="recent-value">' + formatCurrency(f.Valor) + '</div>'
      );
      renderRecentList('recent-maint', d.recentMaintenance || [], m =>
        '<div><div class="recent-title">' + m.Placa + '</div><div class="recent-meta">' + m.Data + ' • ' + m.Tipo + '</div></div><div class="recent-value">' + formatCurrency(m.Custo) + '</div>'
      );
    }
  }

  function renderRecentList(id, items, fn) {
    const el = document.getElementById(id);
    if (!items.length) { el.innerHTML = '<li class="empty-state"><p>Nenhum registro</p></li>'; return; }
    el.innerHTML = items.map(fn).map(html => '<li>' + html + '</li>').join('');
  }

  // ========== VEHICLES ==========
  async function loadVehicles() {
    const res = await api('getVehicles', {});
    if (res.success) { vehicles = res.data || []; renderVehicles(); }
  }

  function renderVehicles() {
    const search = (document.getElementById('vehicle-search').value || '').toLowerCase();
    const filter = document.getElementById('vehicle-status-filter').value;
    let list = vehicles.filter(v => {
      const matchSearch = !search || (v.Placa || '').toLowerCase().includes(search) || (v.Marca || '').toLowerCase().includes(search) || (v.Modelo || '').toLowerCase().includes(search);
      const matchFilter = !filter || v.Status === filter;
      return matchSearch && matchFilter;
    });
    document.getElementById('vehicle-count').textContent = list.length + ' veículo(s)';
    const tbody = document.getElementById('vehicles-table');
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><div class="empty-icon">🚗</div><h4>Nenhum veículo encontrado</h4></td></tr>'; return; }
    tbody.innerHTML = list.map(v =>
      '<tr><td><strong>' + (v.Placa || '-') + '</strong></td>' +
      '<td>' + (v.Grupo || '-') + '</td>' +
      '<td>' + (v.Marca || '') + ' ' + (v.Modelo || '') + '</td>' +
      '<td>' + (v.Ano || '-') + '</td>' +
      '<td>' + formatNumber(v.Hodometro) + '</td>' +
      '<td>' + getStatusBadge(v.Status) + '</td>' +
      '<td>' + (v.Combustivel || '-') + '</td>' +
      '<td><button class="btn btn-sm btn-secondary" onclick="App.editVehicle(\'' + v.ID + '\')">✏️</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="App.deleteVehicle(\'' + v.ID + '\')">🗑️</button></td></tr>'
    ).join('');
  }

  function openVehicleModal() {
    editingVehicle = null;
    document.getElementById('vehicle-modal-title').textContent = 'Novo Veículo';
    document.getElementById('vehicle-form').reset();
    openModal('vehicle-modal');
  }

  function editVehicle(id) {
    const v = vehicles.find(x => x.ID === id);
    if (!v) return;
    editingVehicle = id;
    document.getElementById('vehicle-modal-title').textContent = 'Editar Veículo';
    document.getElementById('v-placa').value = v.Placa || '';
    document.getElementById('v-grupo').value = v.Grupo || '';
    document.getElementById('v-marca').value = v.Marca || '';
    document.getElementById('v-modelo').value = v.Modelo || '';
    document.getElementById('v-ano').value = v.Ano || '';
    document.getElementById('v-cor').value = v.Cor || '';
    document.getElementById('v-chassi').value = v.Chassi || '';
    document.getElementById('v-renavam').value = v.Renavam || '';
    document.getElementById('v-hodometro').value = v.Hodometro || '';
    document.getElementById('v-capacidade').value = v.Capacidade || '';
    document.getElementById('v-combustivel').value = v.Combustivel || 'FLEX';
    document.getElementById('v-status').value = v.Status || 'ATIVO';
    openModal('vehicle-modal');
  }

  async function saveVehicle() {
    const data = {
      id: editingVehicle,
      placa: document.getElementById('v-placa').value,
      grupo: document.getElementById('v-grupo').value,
      marca: document.getElementById('v-marca').value,
      modelo: document.getElementById('v-modelo').value,
      ano: document.getElementById('v-ano').value,
      cor: document.getElementById('v-cor').value,
      chassi: document.getElementById('v-chassi').value,
      renavam: document.getElementById('v-renavam').value,
      hodometro: document.getElementById('v-hodometro').value,
      capacidade: document.getElementById('v-capacidade').value,
      combustivel: document.getElementById('v-combustivel').value,
      status: document.getElementById('v-status').value
    };
    const res = await api('saveVehicle', data);
    if (res.success) { closeModal('vehicle-modal'); showAlert(res.message, 'success'); loadVehicles(); }
    else showAlert(res.error || 'Erro ao salvar', 'danger');
  }

  async function deleteVehicle(id) {
    if (!confirm('Deseja excluir este veículo?')) return;
    const res = await api('deleteVehicle', { id });
    if (res.success) { showAlert('Veículo excluído', 'success'); loadVehicles(); }
    else showAlert(res.error || 'Erro ao excluir', 'danger');
  }

  // ========== FUELING ==========
  async function loadFueling() {
    const res = await api('getFueling', {});
    if (res.success) { fueling = res.data || []; renderFueling(); }
  }

  function renderFueling() {
    const tbody = document.getElementById('fueling-table');
    if (!fueling.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-icon">⛽</div><h4>Nenhum abastecimento</h4></td></tr>'; return; }
    tbody.innerHTML = fueling.map(f =>
      '<tr><td>' + (f.Data || '-') + '</td>' +
      '<td><strong>' + (f.Placa || '-') + '</strong></td>' +
      '<td>' + (f.Motorista || '-') + '</td>' +
      '<td>' + (f.Litros || 0) + ' L</td>' +
      '<td>' + formatCurrency(f.Valor) + '</td>' +
      '<td>' + formatNumber(f.KM) + '</td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="App.deleteFueling(\'' + f.ID + '\')">🗑️</button></td></tr>'
    ).join('');
  }

  async function saveFueling() {
    const data = {
      data: document.getElementById('f-data').value,
      placa: document.getElementById('f-placa').value,
      motorista: document.getElementById('f-motorista').value,
      litros: document.getElementById('f-litros').value,
      valor: document.getElementById('f-valor').value,
      km: document.getElementById('f-km').value,
      posto: document.getElementById('f-posto').value
    };
    const res = await api('saveFueling', data);
    if (res.success) { closeModal('fueling-modal'); showAlert(res.message, 'success'); loadFueling(); }
    else showAlert(res.error || 'Erro ao salvar', 'danger');
  }

  async function deleteFueling(id) {
    if (!confirm('Deseja excluir?')) return;
    const res = await api('deleteFueling', { id });
    if (res.success) { showAlert('Excluído', 'success'); loadFueling(); }
    else showAlert(res.error || 'Erro', 'danger');
  }

  // ========== MAINTENANCE ==========
  async function loadMaintenance() {
    const res = await api('getMaintenance', {});
    if (res.success) { maintenance = res.data || []; renderMaintenance(); }
  }

  function renderMaintenance() {
    const tbody = document.getElementById('maintenance-table');
    if (!maintenance.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-icon">🔧</div><h4>Nenhuma manutenção</h4></td></tr>'; return; }
    tbody.innerHTML = maintenance.map(m =>
      '<tr><td>' + (m.Data || '-') + '</td>' +
      '<td><strong>' + (m.Placa || '-') + '</strong></td>' +
      '<td>' + (m.Tipo || '-') + '</td>' +
      '<td>' + (m.Descricao || '-') + '</td>' +
      '<td>' + formatCurrency(m.Custo) + '</td>' +
      '<td>' + getStatusBadge(m.Status) + '</td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="App.deleteMaintenance(\'' + m.ID + '\')">🗑️</button></td></tr>'
    ).join('');
  }

  async function saveMaintenance() {
    const data = {
      data: document.getElementById('m-data').value,
      placa: document.getElementById('m-placa').value,
      tipo: document.getElementById('m-tipo').value,
      descricao: document.getElementById('m-descricao').value,
      custo: document.getElementById('m-custo').value,
      oficina: document.getElementById('m-oficina').value,
      status: document.getElementById('m-status').value
    };
    const res = await api('saveMaintenance', data);
    if (res.success) { closeModal('maintenance-modal'); showAlert(res.message, 'success'); loadMaintenance(); }
    else showAlert(res.error || 'Erro ao salvar', 'danger');
  }

  async function deleteMaintenance(id) {
    if (!confirm('Deseja excluir?')) return;
    const res = await api('deleteMaintenance', { id });
    if (res.success) { showAlert('Excluído', 'success'); loadMaintenance(); }
    else showAlert(res.error || 'Erro', 'danger');
  }

  // ========== KM ==========
  async function loadKm() {
    const res = await api('getKm', {});
    if (res.success) { km = res.data || []; renderKm(); }
  }

  function renderKm() {
    const tbody = document.getElementById('km-table');
    if (!km.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-icon">📍</div><h4>Nenhum registro</h4></td></tr>'; return; }
    tbody.innerHTML = km.map(k => {
      const diff = parseInt(k.KMAtual || 0) - parseInt(k.KMAnterior || 0);
      return '<tr><td>' + (k.Data || '-') + '</td>' +
        '<td><strong>' + (k.Placa || '-') + '</strong></td>' +
        '<td>' + formatNumber(k.KMAnterior) + '</td>' +
        '<td>' + formatNumber(k.KMAtual) + '</td>' +
        '<td>' + formatNumber(diff) + '</td>' +
        '<td>' + (k.Motorista || '-') + '</td></tr>';
    }).join('');
  }

  async function saveKm() {
    const data = {
      data: document.getElementById('k-data').value,
      placa: document.getElementById('k-placa').value,
      kmAnterior: document.getElementById('k-kmAnterior').value,
      kmAtual: document.getElementById('k-kmAtual').value,
      motorista: document.getElementById('k-motorista').value,
      observacao: document.getElementById('k-observacao').value
    };
    const res = await api('saveKm', data);
    if (res.success) { closeModal('km-modal'); showAlert(res.message, 'success'); loadKm(); }
    else showAlert(res.error || 'Erro ao salvar', 'danger');
  }

  async function deleteKm(id) {
    if (!confirm('Deseja excluir?')) return;
    const res = await api('deleteKm', { id });
    if (res.success) { showAlert('Excluído', 'success'); loadKm(); }
    else showAlert(res.error || 'Erro', 'danger');
  }

  // ========== DRIVERS ==========
  async function loadDrivers() {
    const res = await api('getDrivers', {});
    if (res.success) { drivers = res.data || []; renderDrivers(); }
  }

  function renderDrivers() {
    const tbody = document.getElementById('drivers-table');
    if (!drivers.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-icon">👤</div><h4>Nenhum motorista</h4></td></tr>'; return; }
    tbody.innerHTML = drivers.map(d =>
      '<tr><td><strong>' + (d.Nome || '-') + '</strong></td>' +
      '<td>' + (d.CPF || '-') + '</td>' +
      '<td>' + (d.CNH || '-') + '</td>' +
      '<td>' + (d.Categoria || '-') + '</td>' +
      '<td>' + getStatusBadge(d.Status) + '</td>' +
      '<td><button class="btn btn-sm btn-secondary" onclick="App.editDriver(\'' + d.ID + '\')">✏️</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="App.deleteDriver(\'' + d.ID + '\')">🗑️</button></td></tr>'
    ).join('');
  }

  function editDriver(id) {
    const d = drivers.find(x => x.ID === id);
    if (!d) return;
    editingDriver = id;
    document.getElementById('d-nome').value = d.Nome || '';
    document.getElementById('d-cpf').value = d.CPF || '';
    document.getElementById('d-cnh').value = d.CNH || '';
    document.getElementById('d-categoria').value = d.Categoria || 'B';
    document.getElementById('d-telefone').value = d.Telefone || '';
    document.getElementById('d-status').value = d.Status || 'ATIVO';
    openModal('driver-modal');
  }

  async function saveDriver() {
    const data = {
      id: editingDriver,
      nome: document.getElementById('d-nome').value,
      cpf: document.getElementById('d-cpf').value,
      cnh: document.getElementById('d-cnh').value,
      categoria: document.getElementById('d-categoria').value,
      telefone: document.getElementById('d-telefone').value,
      status: document.getElementById('d-status').value
    };
    const res = await api('saveDriver', data);
    if (res.success) { closeModal('driver-modal'); showAlert(res.message, 'success'); loadDrivers(); editingDriver = null; }
    else showAlert(res.error || 'Erro ao salvar', 'danger');
  }

  async function deleteDriver(id) {
    if (!confirm('Deseja excluir?')) return;
    const res = await api('deleteDriver', { id });
    if (res.success) { showAlert('Excluído', 'success'); loadDrivers(); }
    else showAlert(res.error || 'Erro', 'danger');
  }

  // ========== REPORTS ==========
  function loadReports() {
    // Simple placeholder charts using canvas
    drawSimpleBarChart('chart-fuel', [1200, 1500, 800, 2000, 1800, 2200], ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']);
    drawSimpleLineChart('chart-km', [5000, 6200, 4800, 7100, 6500, 7800], ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
  }

  function drawSimpleBarChart(canvasId, values, labels) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...values) * 1.2;
    const barW = (w / values.length) * 0.6;
    const gap = (w / values.length) * 0.4;
    values.forEach((v, i) => {
      const bh = (v / max) * (h - 40);
      const x = i * (barW + gap) + gap / 2;
      const y = h - bh - 20;
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(x, y, barW, bh);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, h - 4);
      ctx.fillText('R$' + (v / 1000).toFixed(1) + 'k', x + barW / 2, y - 6);
    });
  }

  function drawSimpleLineChart(canvasId, values, labels) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...values) * 1.2;
    const step = w / (values.length - 1);
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    values.forEach((v, i) => {
      const x = i * step;
      const y = h - 20 - (v / max) * (h - 40);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    values.forEach((v, i) => {
      const x = i * step;
      const y = h - 20 - (v / max) * (h - 40);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, h - 4);
      ctx.fillText((v / 1000).toFixed(1) + 'k', x, y - 10);
    });
  }

  // ========== IMPORT ==========
  function initImport() {
    const preview = document.getElementById('import-preview');
    preview.value = JSON.stringify(IMPORT_DATA, null, 2);
  }

  async function importVehicles() {
    const btn = document.getElementById('btn-import');
    btn.textContent = '⏳ Importando...';
    btn.disabled = true;
    const res = await api('importVehicles', { vehicles: IMPORT_DATA });
    btn.textContent = '🚀 Importar 29 Veículos';
    btn.disabled = false;
    if (res.success) { showAlert(res.message + '! Veículos importados: ' + res.count, 'success'); }
    else showAlert(res.error || 'Erro na importação', 'danger');
  }

  // ========== MODAL ==========
  function openModal(id) { document.getElementById(id).classList.add('show'); }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }

  // ========== INIT ==========
  function init() {
    if (token) showApp(); else showLogin();

    document.getElementById('btn-login').addEventListener('click', login);
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => showPage(item.dataset.page));
    });
    document.getElementById('vehicle-search').addEventListener('input', renderVehicles);
    document.getElementById('vehicle-status-filter').addEventListener('change', renderVehicles);
    document.getElementById('btn-import').addEventListener('click', importVehicles);

    // PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(console.error);
    }
  }

  return {
    init, openModal, closeModal, openVehicleModal, saveVehicle, editVehicle, deleteVehicle,
    saveFueling, deleteFueling, saveMaintenance, deleteMaintenance, saveKm, deleteKm,
    saveDriver, editDriver, deleteDriver
  };
})();

window.addEventListener('DOMContentLoaded', App.init);
