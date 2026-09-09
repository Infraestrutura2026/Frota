'use strict';

// ============================================================
// Controle de Frota – Polícia Penal do Estado de São Paulo
// Lógica do front-end: carregamento, CRUD, filtros e estatísticas.
// Persistência: API (server.js) com fallback para localStorage.
// ============================================================

const estado = {
  veiculos: [],
  busca: '',
  filtroStatus: 'Todos',
  editandoId: null
};

const LOGIN_STORAGE_KEY = 'gestao_frota_sessao';
const $ = (seletor) => document.querySelector(seletor);

// ---------- Acesso à interface ----------

function lerSessao() {
  try {
    return sessionStorage.getItem(LOGIN_STORAGE_KEY) || '';
  } catch (erro) {
    return '';
  }
}

function mostrarPainel(usuario) {
  $('#tela-login').hidden = true;
  $('#app-shell').hidden = false;
  $('#nome-usuario').textContent = usuario || 'Usuário';
  $('#usuario-avatar').textContent = (usuario || 'U').charAt(0).toUpperCase();
}

function mostrarLogin() {
  try { sessionStorage.removeItem(LOGIN_STORAGE_KEY); } catch (erro) { /* armazenamento indisponível */ }
  $('#app-shell').hidden = true;
  $('#tela-login').hidden = false;
  $('#form-login').reset();
  $('#login-mensagem').hidden = true;
  $('#login-usuario').focus();
}

function configurarAcesso() {
  const form = $('#form-login');
  const mensagem = $('#login-mensagem');
  const campoSenha = $('#login-senha');
  const alternarSenha = $('#alternar-senha');

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const usuario = $('#login-usuario').value.trim();
    const senha = campoSenha.value;

    if (!usuario || !senha) {
      mensagem.textContent = 'Informe seu usuário e senha para continuar.';
      mensagem.hidden = false;
      return;
    }

    try { sessionStorage.setItem(LOGIN_STORAGE_KEY, usuario); } catch (erro) { /* segue apenas nesta sessão */ }
    mensagem.hidden = true;
    mostrarPainel(usuario);
  });

  alternarSenha.addEventListener('click', () => {
    const visivel = campoSenha.type === 'text';
    campoSenha.type = visivel ? 'password' : 'text';
    alternarSenha.textContent = visivel ? 'Mostrar' : 'Ocultar';
    alternarSenha.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
  });

  $('#btn-sair').addEventListener('click', mostrarLogin);

  const sessao = lerSessao();
  if (sessao) mostrarPainel(sessao);
}


// ---------- Utilidades ----------

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatarKm(km) {
  const n = Number(km);
  return Number.isFinite(n) ? n.toLocaleString('pt-BR') + ' km' : '—';
}

function classeStatus(status) {
  switch (status) {
    case CONFIG.STATUS.DISPONIVEL: return 'badge-verde';
    case CONFIG.STATUS.EM_USO: return 'badge-azul';
    case CONFIG.STATUS.MANUTENCAO: return 'badge-ambar';
    case CONFIG.STATUS.INDISPONIVEL: return 'badge-vermelho';
    default: return 'badge-azul';
  }
}

function toast(mensagem, tipo = 'info') {
  const el = $('#toast');
  el.textContent = mensagem;
  el.className = 'toast visivel toast-' + tipo;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('visivel'), 3200);
}

function guardarLocal() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(estado.veiculos));
}

// ---------- Carga de dados ----------

async function carregarVeiculos() {
  // Tenta, em ordem: API do servidor → arquivo data/db.json → localStorage
  const fontes = [
    () => fetch(`${CONFIG.API_BASE}/frota`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('api')))),
    () => fetch(CONFIG.DATA_FILE)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('arquivo'))))
      .then((d) => d.veiculos),
    () => Promise.resolve(JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]'))
  ];

  for (const fonte of fontes) {
    try {
      const dados = await fonte();
      if (Array.isArray(dados) && dados.length) {
        estado.veiculos = dados;
        break;
      }
    } catch (erro) {
      // tenta a próxima fonte
    }
  }
  guardarLocal();
}

// ---------- Persistência via API ----------

async function salvarNaApi(veiculo) {
  const url = estado.editandoId
    ? `${CONFIG.API_BASE}/frota/${estado.editandoId}`
    : `${CONFIG.API_BASE}/frota`;
  const resposta = await fetch(url, {
    method: estado.editandoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(veiculo)
  });
  if (!resposta.ok) throw new Error('api');
  return resposta.json();
}

async function excluirNaApi(id) {
  const resposta = await fetch(`${CONFIG.API_BASE}/frota/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('api');
}

function aplicarLocalmente(veiculo) {
  if (estado.editandoId) {
    const indice = estado.veiculos.findIndex((v) => String(v.id) === String(estado.editandoId));
    if (indice > -1) {
      estado.veiculos[indice] = { ...estado.veiculos[indice], ...veiculo, id: estado.veiculos[indice].id };
    }
  } else {
    const novoId = estado.veiculos.reduce((m, v) => Math.max(m, Number(v.id) || 0), 0) + 1;
    estado.veiculos.push({ ...veiculo, id: novoId });
  }
  guardarLocal();
  renderizar();
}

// ---------- Renderização ----------

function filtrarVeiculos() {
  const termo = estado.busca.trim().toLowerCase();
  return estado.veiculos.filter((v) => {
    const casaBusca = !termo ||
      [v.placa, v.modelo, v.tipo, v.setor, v.motorista, v.observacoes]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(termo));
    const casaStatus = estado.filtroStatus === 'Todos' || v.status === estado.filtroStatus;
    return casaBusca && casaStatus;
  });
}

function contarPorStatus(status) {
  return estado.veiculos.filter((v) => v.status === status).length;
}

function linhaVeiculo(v) {
  return `
    <tr>
      <td class="placa">${esc(v.placa)}</td>
      <td><strong>${esc(v.modelo)}</strong></td>
      <td>${esc(v.tipo || '—')}</td>
      <td>${v.ano || '—'}</td>
      <td>${esc(v.setor || '—')}</td>
      <td>${esc(v.motorista || '—')}</td>
      <td class="km">${formatarKm(v.km)}</td>
      <td><span class="badge ${classeStatus(v.status)}">${esc(v.status || '—')}</span></td>
      <td class="col-acoes">
        <button class="btn-icone btn-editar" data-id="${v.id}" title="Editar" aria-label="Editar veículo">✏️</button>
        <button class="btn-icone btn-excluir" data-id="${v.id}" title="Excluir" aria-label="Excluir veículo">🗑️</button>
      </td>
    </tr>`;
}

function renderizar() {
  const filtrados = filtrarVeiculos();

  $('#stat-total').textContent = estado.veiculos.length;
  $('#stat-disponiveis').textContent = contarPorStatus(CONFIG.STATUS.DISPONIVEL);
  $('#stat-emuso').textContent = contarPorStatus(CONFIG.STATUS.EM_USO);
  $('#stat-manutencao').textContent = contarPorStatus(CONFIG.STATUS.MANUTENCAO);

  $('#corpo-tabela').innerHTML = filtrados.map(linhaVeiculo).join('');
  $('#vazio').hidden = filtrados.length > 0;
}

// ---------- Modal ----------

function popularSelects() {
  const selTipos = $('#campo-tipo');
  selTipos.innerHTML = ['<option value="">Selecione…</option>']
    .concat(CONFIG.TIPOS.map((t) => `<option value="${t}">${t}</option>`))
    .join('');

  const opcoesStatus = Object.values(CONFIG.STATUS)
    .map((s) => `<option value="${s}">${s}</option>`)
    .join('');

  $('#campo-status').innerHTML = opcoesStatus;
  $('#filtro-status').innerHTML =
    '<option value="Todos">Todos os status</option>' + opcoesStatus;
}

function abrirModal(veiculo = null) {
  estado.editandoId = veiculo ? veiculo.id : null;
  $('#modal-titulo').textContent = veiculo ? 'Editar Veículo' : 'Novo Veículo';
  $('#form-veiculo').reset();

  $('#campo-id').value = veiculo ? veiculo.id : '';
  $('#campo-placa').value = veiculo ? veiculo.placa : '';
  $('#campo-modelo').value = veiculo ? veiculo.modelo : '';
  $('#campo-tipo').value = veiculo ? veiculo.tipo : '';
  $('#campo-ano').value = veiculo ? veiculo.ano : '';
  $('#campo-setor').value = veiculo ? veiculo.setor : '';
  $('#campo-motorista').value = veiculo ? veiculo.motorista : '';
  $('#campo-status').value = veiculo ? veiculo.status : CONFIG.STATUS.DISPONIVEL;
  $('#campo-km').value = veiculo ? veiculo.km : '';
  $('#campo-obs').value = veiculo ? veiculo.observacoes : '';

  $('#modal').hidden = false;
  $('#campo-placa').focus();
}

function fecharModal() {
  $('#modal').hidden = true;
  estado.editandoId = null;
}

// ---------- Ações (CRUD) ----------

function lerFormulario() {
  return {
    placa: $('#campo-placa').value.trim().toUpperCase(),
    modelo: $('#campo-modelo').value.trim(),
    tipo: $('#campo-tipo').value,
    ano: Number($('#campo-ano').value) || '',
    setor: $('#campo-setor').value.trim(),
    motorista: $('#campo-motorista').value.trim(),
    status: $('#campo-status').value,
    km: Number($('#campo-km').value) || 0,
    observacoes: $('#campo-obs').value.trim()
  };
}

async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  const veiculo = lerFormulario();
  if (!veiculo.placa || !veiculo.modelo) {
    toast('Preencha ao menos a placa e o modelo.', 'erro');
    return;
  }

  try {
    const dados = await salvarNaApi(veiculo);
    aplicarLocalmente(dados.veiculo || dados);
    toast(estado.editandoId ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.', 'sucesso');
  } catch (erro) {
    // API indisponível (ex.: hospedagem somente leitura) → salva apenas localmente
    aplicarLocalmente(veiculo);
    toast('API indisponível — alteração salva somente neste dispositivo.', 'aviso');
  }
  fecharModal();
}

async function excluirVeiculo(id) {
  if (!confirm('Excluir este veículo da frota?')) return;

  try {
    await excluirNaApi(id);
    toast('Veículo excluído da frota.', 'sucesso');
  } catch (erro) {
    toast('API indisponível — exclusão aplicada somente neste dispositivo.', 'aviso');
  }

  estado.veiculos = estado.veiculos.filter((v) => String(v.id) !== String(id));
  guardarLocal();
  renderizar();
}

function aoClicarNaTabela(evento) {
  const botao = evento.target.closest('button');
  if (!botao) return;
  const id = Number(botao.dataset.id);

  if (botao.classList.contains('btn-editar')) {
    const veiculo = estado.veiculos.find((v) => Number(v.id) === id);
    if (veiculo) abrirModal(veiculo);
  } else if (botao.classList.contains('btn-excluir')) {
    excluirVeiculo(id);
  }
}

// ---------- Inicialização ----------

function iniciar() {
  configurarAcesso();
  $('#titulo-painel').textContent = 'Painel Geral';
  popularSelects();

  $('#btn-novo').addEventListener('click', () => abrirModal());
  $('#btn-fechar-modal').addEventListener('click', fecharModal);
  $('#btn-cancelar').addEventListener('click', fecharModal);
  $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) fecharModal(); });
  $('#form-veiculo').addEventListener('submit', aoEnviarFormulario);

  $('#busca').addEventListener('input', (e) => { estado.busca = e.target.value; renderizar(); });
  $('#filtro-status').addEventListener('change', (e) => { estado.filtroStatus = e.target.value; renderizar(); });
  $('#corpo-tabela').addEventListener('click', aoClicarNaTabela);

  carregarVeiculos()
    .then(renderizar)
    .catch(() => { estado.veiculos = []; renderizar(); });
}

document.addEventListener('DOMContentLoaded', iniciar);
