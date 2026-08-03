/**
 * ==========================================
 * FROTA PRO v3.0 - Google Apps Script Backend
 * API REST completa com autenticação, CRUD, importação
 * ==========================================
 */

const SPREADSHEET_ID = null; // null = usa a planilha ativa
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin2025';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Proteção para execução manual no editor (e === undefined)
  if (!e) {
    return jsonResponse({ 
      success: true, 
      message: '✅ Frota Pro v3.0 backend está funcionando! Execute via URL do Web App para usar a API.' 
    });
  }

  const action = (e.parameter && e.parameter.action) || (e.postData ? JSON.parse(e.postData.contents).action : null);
  const postData = e.postData ? JSON.parse(e.postData.contents) : {};
  const data = Object.keys(postData).length > 0 ? postData : (e.parameter || {});

  try {
    switch (action) {
      case 'login': return login(data);
      case 'getVehicles': return getVehicles();
      case 'saveVehicle': return saveVehicle(data);
      case 'deleteVehicle': return deleteVehicle(data);
      case 'getFueling': return getFueling();
      case 'saveFueling': return saveFueling(data);
      case 'deleteFueling': return deleteFueling(data);
      case 'getMaintenance': return getMaintenance();
      case 'saveMaintenance': return saveMaintenance(data);
      case 'deleteMaintenance': return deleteMaintenance(data);
      case 'getKm': return getKm();
      case 'saveKm': return saveKm(data);
      case 'deleteKm': return deleteKm(data);
      case 'getDrivers': return getDrivers();
      case 'saveDriver': return saveDriver(data);
      case 'deleteDriver': return deleteDriver(data);
      case 'importVehicles': return importVehicles(data);
      case 'getDashboard': return getDashboard();
      case 'setup': return setupSpreadsheet();
      default: return jsonResponse({ error: 'Ação não encontrada: ' + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHttpStatus(statusCode || 200);
}

// ==========================================
// AUTH
// ==========================================
function login(data) {
  if (data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
    return jsonResponse({ success: true, token: 'frota-token-2025', user: 'admin', name: 'Administrador' });
  }
  return jsonResponse({ success: false, error: 'Usuário ou senha inválidos' }, 401);
}

// ==========================================
// SPREADSHEET HELPERS
// ==========================================
function getSpreadsheet() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function getSheetData(name, headers) {
  const sheet = getSheet(name, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._row = i + 1;
    rows.push(row);
  }
  return rows;
}

function appendRow(sheetName, headers, values) {
  const sheet = getSheet(sheetName, headers);
  sheet.appendRow(values);
}

function updateRow(sheetName, headers, rowIndex, values) {
  const sheet = getSheet(sheetName, headers);
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
}

function deleteRow(sheetName, headers, rowIndex) {
  const sheet = getSheet(sheetName, headers);
  sheet.deleteRow(rowIndex);
}

// ==========================================
// SETUP
// ==========================================
function setupSpreadsheet() {
  const ss = getSpreadsheet();
  const sheets = ['Veiculos', 'Abastecimentos', 'Manutencoes', 'Quilometragens', 'Motoristas'];
  const headers = {
    'Veiculos': ['ID', 'Placa', 'Grupo', 'Marca', 'Modelo', 'Ano', 'Cor', 'Chassi', 'Renavam', 'Hodometro', 'Status', 'Combustivel', 'Capacidade', 'DataCadastro'],
    'Abastecimentos': ['ID', 'Data', 'Placa', 'Motorista', 'Litros', 'Valor', 'KM', 'Posto', 'DataCadastro'],
    'Manutencoes': ['ID', 'Data', 'Placa', 'Tipo', 'Descricao', 'Custo', 'Oficina', 'Status', 'DataCadastro'],
    'Quilometragens': ['ID', 'Data', 'Placa', 'KMAnterior', 'KMAtual', 'Motorista', 'Observacao', 'DataCadastro'],
    'Motoristas': ['ID', 'Nome', 'CPF', 'CNH', 'Categoria', 'Telefone', 'Status', 'DataCadastro']
  };
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      const sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
      sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
    }
  });
  return jsonResponse({ success: true, message: 'Planilha configurada com sucesso' });
}

// ==========================================
// VEICULOS
// ==========================================
const V_HEADERS = ['ID', 'Placa', 'Grupo', 'Marca', 'Modelo', 'Ano', 'Cor', 'Chassi', 'Renavam', 'Hodometro', 'Status', 'Combustivel', 'Capacidade', 'DataCadastro'];

function getVehicles() {
  return jsonResponse({ success: true, data: getSheetData('Veiculos', V_HEADERS) });
}

function saveVehicle(data) {
  if (data.id) {
    const rows = getSheetData('Veiculos', V_HEADERS);
    const row = rows.find(r => String(r.ID) === String(data.id));
    if (row) {
      const values = [data.id, data.placa, data.grupo, data.marca, data.modelo, data.ano, data.cor, data.chassi, data.renavam, data.hodometro, data.status, data.combustivel, data.capacidade, data.dataCadastro || row.DataCadastro];
      updateRow('Veiculos', V_HEADERS, row._row, values);
      return jsonResponse({ success: true, message: 'Veículo atualizado' });
    }
  }
  const id = new Date().getTime().toString();
  const values = [id, data.placa, data.grupo, data.marca, data.modelo, data.ano, data.cor, data.chassi, data.renavam, data.hodometro, data.status, data.combustivel, data.capacidade, new Date().toLocaleString('pt-BR')];
  appendRow('Veiculos', V_HEADERS, values);
  return jsonResponse({ success: true, message: 'Veículo cadastrado', id: id });
}

function deleteVehicle(data) {
  const rows = getSheetData('Veiculos', V_HEADERS);
  const row = rows.find(r => String(r.ID) === String(data.id));
  if (row) {
    deleteRow('Veiculos', V_HEADERS, row._row);
    return jsonResponse({ success: true, message: 'Veículo excluído' });
  }
  return jsonResponse({ success: false, error: 'Veículo não encontrado' }, 404);
}

// ==========================================
// ABASTECIMENTOS
// ==========================================
const F_HEADERS = ['ID', 'Data', 'Placa', 'Motorista', 'Litros', 'Valor', 'KM', 'Posto', 'DataCadastro'];

function getFueling() {
  return jsonResponse({ success: true, data: getSheetData('Abastecimentos', F_HEADERS) });
}

function saveFueling(data) {
  const id = new Date().getTime().toString();
  const values = [id, data.data, data.placa, data.motorista, data.litros, data.valor, data.km, data.posto, new Date().toLocaleString('pt-BR')];
  appendRow('Abastecimentos', F_HEADERS, values);
  return jsonResponse({ success: true, message: 'Abastecimento registrado', id: id });
}

function deleteFueling(data) {
  const rows = getSheetData('Abastecimentos', F_HEADERS);
  const row = rows.find(r => String(r.ID) === String(data.id));
  if (row) { deleteRow('Abastecimentos', F_HEADERS, row._row); return jsonResponse({ success: true }); }
  return jsonResponse({ success: false, error: 'Não encontrado' }, 404);
}

// ==========================================
// MANUTENCOES
// ==========================================
const M_HEADERS = ['ID', 'Data', 'Placa', 'Tipo', 'Descricao', 'Custo', 'Oficina', 'Status', 'DataCadastro'];

function getMaintenance() {
  return jsonResponse({ success: true, data: getSheetData('Manutencoes', M_HEADERS) });
}

function saveMaintenance(data) {
  const id = new Date().getTime().toString();
  const values = [id, data.data, data.placa, data.tipo, data.descricao, data.custo, data.oficina, data.status, new Date().toLocaleString('pt-BR')];
  appendRow('Manutencoes', M_HEADERS, values);
  return jsonResponse({ success: true, message: 'Manutenção registrada', id: id });
}

function deleteMaintenance(data) {
  const rows = getSheetData('Manutencoes', M_HEADERS);
  const row = rows.find(r => String(r.ID) === String(data.id));
  if (row) { deleteRow('Manutencoes', M_HEADERS, row._row); return jsonResponse({ success: true }); }
  return jsonResponse({ success: false, error: 'Não encontrado' }, 404);
}

// ==========================================
// QUILOMETRAGENS
// ==========================================
const K_HEADERS = ['ID', 'Data', 'Placa', 'KMAnterior', 'KMAtual', 'Motorista', 'Observacao', 'DataCadastro'];

function getKm() {
  return jsonResponse({ success: true, data: getSheetData('Quilometragens', K_HEADERS) });
}

function saveKm(data) {
  const id = new Date().getTime().toString();
  const values = [id, data.data, data.placa, data.kmAnterior, data.kmAtual, data.motorista, data.observacao, new Date().toLocaleString('pt-BR')];
  appendRow('Quilometragens', K_HEADERS, values);
  return jsonResponse({ success: true, message: 'Quilometragem registrada', id: id });
}

function deleteKm(data) {
  const rows = getSheetData('Quilometragens', K_HEADERS);
  const row = rows.find(r => String(r.ID) === String(data.id));
  if (row) { deleteRow('Quilometragens', K_HEADERS, row._row); return jsonResponse({ success: true }); }
  return jsonResponse({ success: false, error: 'Não encontrado' }, 404);
}

// ==========================================
// MOTORISTAS
// ==========================================
const D_HEADERS = ['ID', 'Nome', 'CPF', 'CNH', 'Categoria', 'Telefone', 'Status', 'DataCadastro'];

function getDrivers() {
  return jsonResponse({ success: true, data: getSheetData('Motoristas', D_HEADERS) });
}

function saveDriver(data) {
  if (data.id) {
    const rows = getSheetData('Motoristas', D_HEADERS);
    const row = rows.find(r => String(r.ID) === String(data.id));
    if (row) {
      const values = [data.id, data.nome, data.cpf, data.cnh, data.categoria, data.telefone, data.status, data.dataCadastro || row.DataCadastro];
      updateRow('Motoristas', D_HEADERS, row._row, values);
      return jsonResponse({ success: true, message: 'Motorista atualizado' });
    }
  }
  const id = new Date().getTime().toString();
  const values = [id, data.nome, data.cpf, data.cnh, data.categoria, data.telefone, data.status, new Date().toLocaleString('pt-BR')];
  appendRow('Motoristas', D_HEADERS, values);
  return jsonResponse({ success: true, message: 'Motorista cadastrado', id: id });
}

function deleteDriver(data) {
  const rows = getSheetData('Motoristas', D_HEADERS);
  const row = rows.find(r => String(r.ID) === String(data.id));
  if (row) { deleteRow('Motoristas', D_HEADERS, row._row); return jsonResponse({ success: true }); }
  return jsonResponse({ success: false, error: 'Não encontrado' }, 404);
}

// ==========================================
// IMPORTAÇÃO EM MASSA
// ==========================================
function importVehicles(data) {
  if (!data.vehicles || !Array.isArray(data.vehicles)) {
    return jsonResponse({ success: false, error: 'Dados inválidos' }, 400);
  }
  let count = 0;
  data.vehicles.forEach(v => {
    const id = new Date().getTime().toString() + '_' + count;
    const values = [id, v.placa, v.grupo, v.marca, v.modelo, v.ano, v.cor, v.chassi, v.renavam, v.hodometro, v.status, v.combustivel, v.capacidade, new Date().toLocaleString('pt-BR')];
    appendRow('Veiculos', V_HEADERS, values);
    count++;
  });
  return jsonResponse({ success: true, message: count + ' veículos importados com sucesso', count: count });
}

// ==========================================
// DASHBOARD
// ==========================================
function getDashboard() {
  const vehicles = getSheetData('Veiculos', V_HEADERS);
  const fueling = getSheetData('Abastecimentos', F_HEADERS);
  const maintenance = getSheetData('Manutencoes', M_HEADERS);
  const drivers = getSheetData('Motoristas', D_HEADERS);

  const total = vehicles.length;
  const active = vehicles.filter(v => v.Status === 'ATIVO').length;
  const maint = vehicles.filter(v => v.Status === 'MANUTENÇÃO').length;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const fuelMonth = fueling.filter(f => {
    const d = new Date(f.Data);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalFuel = fuelMonth.reduce((sum, f) => sum + (parseFloat(f.Valor) || 0), 0);

  const kmMonth = fueling.filter(f => {
    const d = new Date(f.Data);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalKm = kmMonth.reduce((sum, f) => sum + (parseFloat(f.KM) || 0), 0);

  const recentFuel = fueling.slice(-5).reverse();
  const recentMaint = maintenance.slice(-5).reverse();

  return jsonResponse({
    success: true,
    data: {
      totalVehicles: total,
      activeVehicles: active,
      maintenanceVehicles: maint,
      fuelMonth: totalFuel,
      kmMonth: totalKm,
      totalDrivers: drivers.length,
      recentFuel: recentFuel,
      recentMaintenance: recentMaint
    }
  });
}
