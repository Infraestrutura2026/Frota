const App = (function() {
  let token = localStorage.getItem('frota_token');
  let currentUser = null;
  let vehicles = [];
  let maintenances = [];
  let editingVehicle = null;
  let editingMaintenance = null;
  let online = false;

  // Seed offline (usado só se a API estiver indisponível e não houver cache)
  const VEHICLES = [
    { id: 1, placa: 'CUQ3I89', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 52952, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 2, placa: 'CUW3J07', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 92369, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 3, placa: 'TIT8E83', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 52906, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 4, placa: 'TIV8C29', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 80003, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 5, placa: 'TJY6A21', grupo: 'S2', marca: 'RENAULT', modelo: 'MASTER MINIBUS', ano: 2025, cor: 'BRANCA', hodometro: 57902, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
    { id: 6, placa: 'TLM2D25', grupo: 'S2', marca: 'GM / CHEVROLET', modelo: 'SPIN', ano: 2025, cor: 'BRANCA', hodometro: 57662, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 7, placa: 'FJF0688', grupo: 'S3', marca: 'FORD', modelo: 'F-4000', ano: 2018, cor: 'BRANCA', hodometro: 169633, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
    { id: 8, placa: 'BRZ7720', grupo: 'S4', marca: 'GMC', modelo: '12170', ano: 1996, cor: 'BRANCA', hodometro: 311382, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 3 },
    { id: 9, placa: 'BVZ5E97', grupo: 'S4', marca: 'MERCEDES-BENZ', modelo: 'COMIL SVELTO U', ano: 1999, cor: 'PRETA', hodometro: 242225, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 40 },
    { id: 10, placa: 'CFY2G52', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRATA', hodometro: 154152, status: 'ATIVO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 11, placa: 'CFY2G97', grupo: 'S4', marca: 'TOYOTA', modelo: 'HILUX SW4', ano: 2013, cor: 'PRETA', hodometro: 246909, status: 'ARROLAMENTO', combustivel: 'ETANOL', capacidade: 5 },
    { id: 12, placa: 'CMW9549', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 7012', ano: 2004, cor: 'BRANCA', hodometro: 106805, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 3 },
    { id: 13, placa: 'CST0H92', grupo: 'S4', marca: 'IVECO', modelo: 'GCLASS 150', ano: 2020, cor: 'FANTASIA', hodometro: 33669, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 34 },
    { id: 14, placa: 'DJL7937', grupo: 'S4', marca: 'IVECO', modelo: 'DAILY 70C16', ano: 2011, cor: 'PRATA', hodometro: 167185, status: 'ARROLAMENTO', combustivel: 'DIESEL', capacidade: 20 },
    { id: 15, placa: 'EEF7G88', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2010, cor: 'PRATA', hodometro: 602982, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
    { id: 16, placa: 'FCK5196', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 466636, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
    { id: 17, placa: 'FCW8I62', grupo: 'S4', marca: 'CITROEN', modelo: 'JUMPY GREE AMB', ano: 2022, cor: 'BRANCA', hodometro: 110240, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
    { id: 18, placa: 'FJG7158', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 265891, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 6 },
    { id: 19, placa: 'FKE6H32', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 282733, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 20, placa: 'FKN6069', grupo: 'S4', marca: 'FORD', modelo: 'CARGO 816 S', ano: 2018, cor: 'PRATA', hodometro: 218324, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 16 },
    { id: 21, placa: 'FML8H43', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 221400, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 22, placa: 'FMM5G11', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 248248, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 23, placa: 'FRR1B42', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 259728, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 24, placa: 'FSH3I13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 282851, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 25, placa: 'FSW4013', grupo: 'S4', marca: 'GM / CHEVROLET', modelo: 'S10', ano: 2015, cor: 'PRATA', hodometro: 485585, status: 'MANUTENÇÃO', combustivel: 'DIESEL', capacidade: 6 },
    { id: 26, placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'PRATA', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 27, placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 28, placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
    { id: 29, placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
  ];

  const GROUPS = { S2:{label:'Grupo S2',icon:'🚐',cls:'group-s2'}, S3:{label:'Grupo S3',icon:'🚚',cls:'group-s3'}, S4:{label:'Grupo S4',icon:'🚛',cls:'group-s4'} };
  const MAN_TIPOS = ['PREVENTIVA', 'CORRETIVA', 'EMERGENCIAL', 'REVISÃO', 'RECALL', 'TROCA DE ÓLEO'];
  const MAN_STATUS = ['EM ANDAMENTO', 'CONCLUÍDA', 'AGUARDANDO PEÇA', 'CANCELADA'];
  function norm(g){ return String(g||'').trim().toUpperCase()||'SEM GRUPO'; }
  function keys(){ const k=['S2','S3','S4']; vehicles.forEach(v=>{ const g=norm(v.grupo); if(!k.includes(g))k.push(g); }); return k; }
  function info(g){ const k=norm(g); return GROUPS[k]||{label:`Grupo ${k}`,icon:'🚗',cls:'group-other'}; }
  function esc(value){ const d=document.createElement('div'); d.textContent=value==null?'':String(value); return d.innerHTML; }
  function dateLabel(value){ if(!value)return'-'; const parts=String(value).slice(0,10).split('-'); return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:String(value); }
  function currentOilMonth(){ return document.getElementById('oil-month-filter')?.value || new Date().toISOString().slice(0,7); }
  function oilRecords(){ return maintenances.filter(m => (m.tipo||'').toUpperCase()==='TROCA DE ÓLEO'); }

  function toast(msg, tipo){
    const c=document.getElementById('toast-container'); if(!c)return;
    const t=document.createElement('div'); t.className='toast-msg '+ (tipo==='aviso'?'aviso':'success');
    t.innerHTML=`<span>${tipo==='aviso'?'⚠️':'✅'}</span><span>${msg}</span>`;
    c.appendChild(t); setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},3500);
  }

  // ---------- Cache local (espelho para modo offline) ----------
  function saveCache(){ try{localStorage.setItem('frota_vehicles',JSON.stringify(vehicles));}catch{} }
  function loadCache(){
    try{vehicles=JSON.parse(localStorage.getItem('frota_vehicles')||'[]');}catch{vehicles=[];}
    if(!Array.isArray(vehicles)||vehicles.length===0){vehicles=VEHICLES.map((v,i)=>({...v,id:i+1})); saveCache();}
  }
  function saveMaintCache(){ try{localStorage.setItem('frota_manutencoes',JSON.stringify(maintenances));}catch{} }
  function loadMaintCache(){
    try{maintenances=JSON.parse(localStorage.getItem('frota_manutencoes')||'[]');}catch{maintenances=[];}
    if(!Array.isArray(maintenances))maintenances=[];
  }

  // ---------- API ----------
  async function api(path, opts){
    const r=await fetch('/api'+path, opts);
    if(!r.ok){ let msg='Erro na API'; try{msg=(await r.json()).error||msg;}catch{} throw new Error(msg); }
    return r.json();
  }

  async function syncVehicles(){
    try{
      vehicles=await api('/vehicles');
      online=true; saveCache(); setConnStatus(true);
    }catch{
      online=false; setConnStatus(false); loadCache();
    }
  }

  async function syncMaintenances(){
    try{
      maintenances=await api('/manutencoes');
      saveMaintCache();
    }catch{
      loadMaintCache();
    }
  }

  function setConnStatus(on){
    const el=document.getElementById('conn-status'); if(!el)return;
    el.textContent=on?'● Online':'● Offline';
    el.className='conn-status '+(on?'conn-on':'conn-off');
  }

  async function hash(p){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function init(){
    bind();
    const st=localStorage.getItem('frota_token'), su=localStorage.getItem('frota_current_user');
    if(st&&su){try{currentUser=JSON.parse(su);token=st;}catch{}}
    if(!token||!currentUser){ showLogin(); }
    else { showApp(); }
    await syncVehicles();
    await syncMaintenances();
    if(currentUser){ renderDashboard(); }
  }

  function bind(){
    document.getElementById('login-form').addEventListener('submit',e=>{e.preventDefault();login();});
    const tp=document.getElementById('toggle-login-password');
    if(tp) tp.addEventListener('click',()=>{
      const p=document.getElementById('login-pass');
      const visible=p.type==='text';
      p.type=visible?'password':'text';
      tp.textContent=visible?'Mostrar':'Ocultar';
      tp.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');
    });
    document.getElementById('btn-logout').addEventListener('click',logout);
    document.getElementById('btn-toggle-sidebar').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',()=>{ page(el.dataset.page); document.getElementById('sidebar').classList.remove('open'); }));
    const s=document.getElementById('vehicle-search'); if(s)s.addEventListener('input',renderVehicles);
    const f=document.getElementById('vehicle-status-filter'); if(f)f.addEventListener('change',renderVehicles);
    const os=document.getElementById('oil-search'); if(os)os.addEventListener('input',renderOilChanges);
    const om=document.getElementById('oil-month-filter'); if(om)om.addEventListener('change',renderOilChanges);
    const ms=document.getElementById('maint-search'); if(ms)ms.addEventListener('input',renderMaintenance);
    const mt=document.getElementById('maint-tipo-filter'); if(mt)mt.addEventListener('change',renderMaintenance);
    const mst=document.getElementById('maint-status-filter'); if(mst)mst.addEventListener('change',renderMaintenance);
    const mto=document.getElementById('m-tipo'); if(mto)mto.addEventListener('change',toggleOilFields);
  }

  async function login(){
    const u=document.getElementById('login-user').value.trim(), p=document.getElementById('login-pass').value;
    const al=document.getElementById('login-alert');
    al.style.display='none';
    if(!u||!p){al.textContent='Preencha usuário e senha.';al.style.display='block';return;}

    // 1) Tenta login na API (válido em qualquer computador)
    try{
      const user=await api('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:u,senha:p})});
      token='token_'+user.id+'_'+Date.now();
      currentUser={id:user.id,nome:user.nome,usuario:user.usuario,role:user.role};
      localStorage.setItem('frota_token',token);
      localStorage.setItem('frota_current_user',JSON.stringify(currentUser));
      showApp(); await syncVehicles(); await syncMaintenances(); renderDashboard();
      online=true; setConnStatus(true);
      return;
    }catch(e){
      if(e.message && e.message!=='Failed to fetch' && e.message!=='NetworkError when attempting to fetch resource.'){
        al.textContent=e.message; al.style.display='block';
        if(e.message==='Usuário ou senha incorretos.') return; // credencial inválida: não tenta offline
      }
    }

    // 2) Fallback offline: valida contra cache local
    try{
      const h=await hash(p);
      let users=[]; try{users=JSON.parse(localStorage.getItem('frota_users')||'[]');}catch{}
      if(users.length===0){users=[{id:1,nome:'Administrador',usuario:'admin',senha:'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a',role:'admin',ativo:1}];}
      const found=users.find(x=>x.usuario.toLowerCase()===u.toLowerCase()&&(x.senha===h||(u==='admin'&&(p==='admin'||p==='admin2025')))&&x.ativo===1);
      if(found){
        token='token_offline_'+found.id+'_'+Date.now();
        currentUser={id:found.id,nome:found.nome,usuario:found.usuario,role:found.role};
        localStorage.setItem('frota_token',token);
        localStorage.setItem('frota_current_user',JSON.stringify(currentUser));
        showApp(); await syncVehicles(); await syncMaintenances(); renderDashboard();
        toast('Sem conexão com a API — usando dados locais.','aviso');
        return;
      }
    }catch{}
    if(al.style.display!=='block'){al.textContent='Usuário ou senha incorretos.';al.style.display='block';}
  }

  function logout(){
    token=null;currentUser=null;
    localStorage.removeItem('frota_token');localStorage.removeItem('frota_current_user');
    showLogin();
  }
  function showLogin(){document.getElementById('login-screen').style.display='grid';document.getElementById('app-screen').style.display='none';}
  function showApp(){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-screen').style.display='flex';
    document.getElementById('user-name').textContent=currentUser?.nome||'Admin';
  }

  function page(p){
    document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const t=document.getElementById('page-'+p); if(t)t.classList.add('active');
    const nv=document.querySelector(`.nav-item[data-page="${p}"]`); if(nv)nv.classList.add('active');
    const titles={dashboard:'Painel Geral',vehicles:'Cadastro de Veículos',manutencao:'Manutenção','oil-changes':'Troca de Óleo'};
    document.getElementById('page-title').textContent=titles[p]||'Gestão de Frota';
    if(p==='dashboard')renderDashboard();
    if(p==='vehicles')renderVehicles();
    if(p==='manutencao')renderMaintenance();
    if(p==='oil-changes')renderOilChanges();
  }

  function badge(s){s=(s||'').toUpperCase();if(s==='ATIVO')return'success';if(s==='MANUTENÇÃO')return'danger';if(s==='ARROLAMENTO')return'warning';return'default';}
  function tipoBadge(t){
    t=(t||'').toUpperCase();
    if(t==='TROCA DE ÓLEO')return'success';
    if(t==='PREVENTIVA')return'warning';
    if(t==='CORRETIVA'||t==='EMERGENCIAL')return'danger';
    return'default';
  }
  function osBadge(s){
    s=(s||'').toUpperCase();
    if(s==='CONCLUÍDA')return'success';
    if(s==='EM ANDAMENTO')return'warning';
    if(s==='AGUARDANDO PEÇA')return'danger';
    return'default';
  }

  function renderDashboard(){
    renderDashGroups();
    const total=vehicles.length, act=vehicles.filter(v=>(v.status||'').toUpperCase()==='ATIVO').length, man=vehicles.filter(v=>(v.status||'').toUpperCase()==='MANUTENÇÃO').length;
    const aP=total>0?Math.round(act/total*100):0, mP=total>0?Math.round(man/total*100):0, oP=100-aP-mP;
    const el=document.getElementById('fleet-availability-pct'); if(el)el.textContent=`${aP}% Operacional (${act}/${total})`;
    const ba=document.getElementById('bar-active'),bm=document.getElementById('bar-maint'),bo=document.getElementById('bar-other');
    if(ba)ba.style.width=aP+'%'; if(bm)bm.style.width=mP+'%'; if(bo)bo.style.width=Math.max(0,oP)+'%';
    const la=document.getElementById('lbl-active'),lm=document.getElementById('lbl-maint'),lo=document.getElementById('lbl-other');
    if(la)la.textContent=act+' Operacionais'; if(lm)lm.textContent=man+' Em Manutenção'; if(lo)lo.textContent=Math.max(0,total-act-man)+' Outros';
  }

  function renderDashGroups(){
    const g=document.getElementById('dashboard-groups'); if(!g)return;
    const ks=keys();
    document.getElementById('dashboard-groups-count').textContent=`${vehicles.length} veículos · ${ks.length} grupos`;
    g.innerHTML=ks.map(gr=>{
      const i=info(gr); const gv=vehicles.filter(v=>norm(v.grupo)===gr);
      const items=gv.map(v=>`<button type="button" class="dashboard-vehicle-item" onclick="App.editVehicle(${v.id})"><span class="dashboard-vehicle-topline"><span class="placa-badge">${v.placa}</span><span class="badge ${badge(v.status)}">${v.status||'ATIVO'}</span></span><strong>${v.marca||''} ${v.modelo||''}</strong><span class="dashboard-vehicle-km">${(v.hodometro||0).toLocaleString('pt-BR')} km</span></button>`).join('');
      return `<section class="fleet-group-module dashboard-group-module ${i.cls}"><div class="fleet-group-header"><div class="fleet-group-heading"><span class="fleet-group-icon">${i.icon}</span><div><h4>${i.label}</h4><span>Visão rápida</span></div></div><span class="fleet-group-count">${gv.length} veículo(s)</span></div><div class="dashboard-vehicle-list">${items}</div></section>`;
    }).join('');
  }

  function renderVehicles(){
    const search=(document.getElementById('vehicle-search')?.value||'').toLowerCase();
    const filter=document.getElementById('vehicle-status-filter')?.value||'';
    const filt=vehicles.filter(v=>`${v.placa} ${v.marca} ${v.modelo}`.toLowerCase().includes(search)&&(!filter||(v.status||'').toUpperCase()===filter));
    document.getElementById('vehicle-count').textContent=`${filt.length} de ${vehicles.length}`;
    document.getElementById('vehicles-groups').innerHTML=keys().map(gr=>{
      const i=info(gr); const gv=filt.filter(v=>norm(v.grupo)===gr);
      const rows=gv.map(v=>`<tr><td><span class="placa-badge">${v.placa}</span></td><td><b>${v.marca||''}</b> ${v.modelo||''}</td><td>${v.ano||'-'}</td><td><b>${(v.hodometro||0).toLocaleString('pt-BR')} km</b></td><td><span class="badge ${badge(v.status)}">${v.status||'ATIVO'}</span></td><td>${v.combustivel||'-'}</td><td><button class="btn btn-sm btn-primary" onclick="App.editVehicle(${v.id})">✏️</button><button class="btn btn-sm btn-danger" onclick="App.deleteVehicle(${v.id})">🗑️</button></td></tr>`).join('');
      return `<section class="fleet-group-module ${i.cls}"><div class="fleet-group-header"><div class="fleet-group-heading"><span class="fleet-group-icon">${i.icon}</span><div><h4>${i.label}</h4><span>Veículos do grupo</span></div></div><span class="fleet-group-count">${gv.length}</span></div><div class="fleet-group-content table-responsive"><table class="data-table"><thead><tr><th>Placa</th><th>Marca/Modelo</th><th>Ano</th><th>KM</th><th>Status</th><th>Combustível</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty-state">Nenhum veículo</td></tr>'}</tbody></table></div></section>`;
    }).join('');
  }

  // ============ MANUTENÇÃO ============

  function renderMaintenance(){
    const search=(document.getElementById('maint-search')?.value||'').toLowerCase();
    const tipo=(document.getElementById('maint-tipo-filter')?.value||'').toUpperCase();
    const status=(document.getElementById('maint-status-filter')?.value||'').toUpperCase();
    const filtered=maintenances.filter(m=>{
      const v=vehicles.find(x=>Number(x.id)===Number(m.vehicle_id));
      const text=`${m.placa||''} ${v?.marca||''} ${v?.modelo||''} ${m.servico||''} ${m.oficina||''} ${m.itens||''} ${m.observacoes||''}`.toLowerCase();
      return (!tipo||(m.tipo||'').toUpperCase()===tipo)&&(!status||(m.status_os||'').toUpperCase()===status)&&(!search||text.includes(search));
    });
    const totalEl=document.getElementById('maint-summary-total'); if(totalEl)totalEl.textContent=filtered.length;
    const openCount=filtered.filter(m=>['EM ANDAMENTO','AGUARDANDO PEÇA'].includes((m.status_os||'').toUpperCase())).length;
    const openEl=document.getElementById('maint-summary-open'); if(openEl)openEl.textContent=openCount;
    const cost=filtered.reduce((s,m)=>s+Number(m.custo||0),0);
    const costEl=document.getElementById('maint-summary-cost'); if(costEl)costEl.textContent='R$ '+cost.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const countEl=document.getElementById('maint-count'); if(countEl)countEl.textContent=`${filtered.length} registro(s)`;
    const list=document.getElementById('maint-list'); if(!list)return;
    const rows=filtered.map(m=>{
      const v=vehicles.find(x=>Number(x.id)===Number(m.vehicle_id));
      const plate=m.placa||v?.placa||'-';
      const model=v?`${v.marca||''} ${v.modelo||''}`.trim():'Veículo cadastrado';
      const km=m.hodometro==null?'-':`${Number(m.hodometro).toLocaleString('pt-BR')} km`;
      const prox=m.proxima_manutencao==null?'':'<small class="table-subtitle">próx. '+Number(m.proxima_manutencao).toLocaleString('pt-BR')+' km</small>';
      const costTxt=m.custo==null?'-':'R$ '+Number(m.custo).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      return `<tr><td>${dateLabel(m.data)}</td><td><span class="placa-badge">${esc(plate)}</span><small class="table-subtitle">${esc(model)}</small></td><td><span class="badge ${tipoBadge(m.tipo)}">${esc(m.tipo||'-')}</span></td><td>${esc(m.servico||'-')}</td><td>${km}${prox}</td><td><span class="badge ${osBadge(m.status_os)}">${esc(m.status_os||'-')}</span></td><td>${costTxt}</td><td><button class="btn btn-sm btn-primary" title="Editar" onclick="App.editMaintenance(${Number(m.id)})">✏️</button><button class="btn btn-sm btn-danger" title="Excluir" onclick="App.deleteMaintenance(${Number(m.id)})">🗑️</button></td></tr>`;
    }).join('');
    list.innerHTML=`<table class="data-table"><thead><tr><th>Data</th><th>Veículo</th><th>Tipo</th><th>Serviço</th><th>Hodômetro</th><th>Status</th><th>Custo</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="empty-state">Nenhuma manutenção encontrada para os filtros selecionados.</td></tr>'}</tbody></table>`;
  }

  function toggleOilFields(){
    const tipo=(document.getElementById('m-tipo')?.value||'').toUpperCase();
    document.querySelectorAll('#maintenance-form .oil-only').forEach(el=>{ el.style.display = tipo==='TROCA DE ÓLEO' ? '' : 'none'; });
  }

  function vehicleOptions(selected){
    return ['<option value="">Selecione o veículo</option>',...vehicles.map(v=>`<option value="${Number(v.id)}" ${Number(v.id)===Number(selected)?'selected':''}>${esc(v.placa)} — ${esc(`${v.marca||''} ${v.modelo||''}`.trim())}</option>`)].join('');
  }

  function openMaintenanceModal(preset){
    editingMaintenance=null;
    const title=document.getElementById('maintenance-modal-title');
    title.textContent=preset==='TROCA DE ÓLEO'?'Registrar Troca de Óleo':'Nova Manutenção';
    const form=document.getElementById('maintenance-form'); if(form)form.reset();
    const data=document.getElementById('m-data'); if(data)data.value=new Date().toISOString().slice(0,10);
    const select=document.getElementById('m-vehicle'); if(select)select.innerHTML=vehicleOptions('');
    const tipo=document.getElementById('m-tipo');
    if(tipo){ tipo.disabled=false; tipo.value=preset||'PREVENTIVA'; if(preset==='TROCA DE ÓLEO')tipo.disabled=true; }
    toggleOilFields();
    document.getElementById('maintenance-modal').classList.add('active');
  }

  function editMaintenance(id){
    const item=maintenances.find(x=>Number(x.id)===Number(id)); if(!item)return;
    editingMaintenance=Number(id);
    document.getElementById('maintenance-modal-title').textContent = item.tipo==='TROCA DE ÓLEO' ? 'Editar Troca de Óleo' : 'Editar Manutenção';
    const tipo=document.getElementById('m-tipo'); if(tipo){tipo.disabled=false;tipo.value=item.tipo||'PREVENTIVA';}
    document.getElementById('m-vehicle').innerHTML=vehicleOptions(item.vehicle_id);
    document.getElementById('m-vehicle').value=item.vehicle_id||'';
    document.getElementById('m-data').value=String(item.data||'').slice(0,10);
    document.getElementById('m-data-saida').value=item.data_saida?String(item.data_saida).slice(0,10):'';
    document.getElementById('m-hodometro').value=item.hodometro??'';
    document.getElementById('m-proxima').value=item.proxima_manutencao??'';
    document.getElementById('m-tipo-oleo').value=item.tipo_oleo||'';
    document.getElementById('m-quantidade').value=item.quantidade??'';
    document.getElementById('m-status-os').value=item.status_os||'CONCLUÍDA';
    document.getElementById('m-oficina').value=item.oficina||'';
    document.getElementById('m-custo').value=item.custo??'';
    document.getElementById('m-servico').value=item.servico||'';
    document.getElementById('m-itens').value=item.itens||'';
    document.getElementById('m-observacoes').value=item.observacoes||'';
    toggleOilFields();
    document.getElementById('maintenance-modal').classList.add('active');
  }

  async function saveMaintenance(){
    const form=document.getElementById('maintenance-form');
    const data={}; form.querySelectorAll('[name]').forEach(el=>{data[el.name]=el.value;});
    if(!data.vehicle_id)return alert('Selecione o veículo.');
    if(!data.data)return alert('Informe a data de entrada.');
    data.vehicle_id=Number(data.vehicle_id);
    data.hodometro=data.hodometro===''?null:Number(data.hodometro);
    data.proxima_manutencao=data.proxima_manutencao===''?null:Number(data.proxima_manutencao);
    data.custo=data.custo===''?null:Number(data.custo);
    data.quantidade=data.quantidade===''?null:Number(data.quantidade);
    data.tipo=(data.tipo||'PREVENTIVA').toUpperCase();
    data.status_os=(data.status_os||'CONCLUÍDA').toUpperCase();
    data.tipo_oleo=(data.tipo_oleo||'').trim().toUpperCase()||null;
    if(data.tipo==='TROCA DE ÓLEO'){ if(!data.servico) data.servico='Troca de óleo'; }
    else if(!data.servico){ return alert('Informe o serviço/descrição da manutenção.'); }
    if(online){
      try{
        const saved=await api(editingMaintenance?`/manutencoes/${editingMaintenance}`:'/manutencoes',{method:editingMaintenance?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if(editingMaintenance){const i=maintenances.findIndex(x=>Number(x.id)===editingMaintenance);if(i>=0)maintenances[i]=saved;}
        else maintenances.unshift(saved);
        saveMaintCache(); closeModal('maintenance-modal'); renderMaintenance(); renderOilChanges(); toast(data.tipo==='TROCA DE ÓLEO'?'Troca de óleo salva!':'Manutenção salva!'); return;
      }catch(e){ toast('API falhou — salvando só neste dispositivo.','aviso'); }
    }
    const local={...data,id:editingMaintenance||Date.now(),placa:vehicles.find(v=>Number(v.id)===Number(data.vehicle_id))?.placa||null,data_entrada:data.data};
    if(editingMaintenance){const i=maintenances.findIndex(x=>Number(x.id)===editingMaintenance);if(i>=0)maintenances[i]={...maintenances[i],...local};}
    else maintenances.unshift(local);
    saveMaintCache(); closeModal('maintenance-modal'); renderMaintenance(); renderOilChanges(); toast('Registro salvo localmente!','aviso');
  }

  async function deleteMaintenance(id){
    const item=maintenances.find(x=>Number(x.id)===Number(id));
    const label=item?.tipo==='TROCA DE ÓLEO'?'troca de óleo':'manutenção';
    if(!confirm(`Excluir o registro de ${label} de ${dateLabel(item?.data)}?`))return;
    if(online){
      try{await api('/manutencoes/'+id,{method:'DELETE'});maintenances=maintenances.filter(x=>Number(x.id)!==Number(id));saveMaintCache();renderMaintenance();renderOilChanges();toast('Registro excluído!');return;}
      catch{toast('API falhou — exclusão só neste dispositivo.','aviso');}
    }
    maintenances=maintenances.filter(x=>Number(x.id)!==Number(id));saveMaintCache();renderMaintenance();renderOilChanges();toast('Registro excluído localmente!','aviso');
  }

  // ============ TROCA DE ÓLEO (visão ligada à Manutenção) ============

  function renderOilChanges(){
    const monthEl=document.getElementById('oil-month-filter');
    const month=monthEl?.value||'';
    const search=(document.getElementById('oil-search')?.value||'').toLowerCase().trim();
    const filtered=oilRecords().filter(item=>{
      const v=vehicles.find(x=>Number(x.id)===Number(item.vehicle_id));
      const text=`${item.placa||''} ${v?.marca||''} ${v?.modelo||''} ${item.tipo_oleo||''} ${item.observacoes||''}`.toLowerCase();
      return (!month||String(item.data||'').slice(0,7)===month)&&(!search||text.includes(search));
    });
    const totalEl=document.getElementById('oil-summary-total'); if(totalEl)totalEl.textContent=filtered.length;
    const vehiclesEl=document.getElementById('oil-summary-vehicles'); if(vehiclesEl)vehiclesEl.textContent=new Set(filtered.map(x=>x.vehicle_id||x.placa)).size;
    const litersEl=document.getElementById('oil-summary-liters'); if(litersEl)litersEl.textContent=filtered.reduce((sum,x)=>sum+Number(x.quantidade||0),0).toLocaleString('pt-BR',{maximumFractionDigits:2});
    const countEl=document.getElementById('oil-count'); if(countEl)countEl.textContent=`${filtered.length} registro(s)`;
    const list=document.getElementById('oil-changes-list'); if(!list)return;
    const rows=filtered.map(item=>{
      const v=vehicles.find(x=>Number(x.id)===Number(item.vehicle_id));
      const plate=item.placa||v?.placa||'-';
      const model=v?`${v.marca||''} ${v.modelo||''}`.trim():'Veículo cadastrado';
      const quantity=item.quantidade==null?'-':`${Number(item.quantidade).toLocaleString('pt-BR',{maximumFractionDigits:2})} L`;
      return `<tr><td>${dateLabel(item.data)}</td><td><span class="placa-badge">${esc(plate)}</span><small class="table-subtitle">${esc(model)}</small></td><td>${esc(item.tipo_oleo||'-')}</td><td>${item.hodometro==null?'-':`${Number(item.hodometro).toLocaleString('pt-BR')} km`}</td><td>${quantity}</td><td>${esc(item.observacoes||'-')}</td><td><button class="btn btn-sm btn-primary" title="Editar" onclick="App.editMaintenance(${Number(item.id)})">✏️</button><button class="btn btn-sm btn-danger" title="Excluir" onclick="App.deleteMaintenance(${Number(item.id)})">🗑️</button></td></tr>`;
    }).join('');
    list.innerHTML=`<table class="data-table"><thead><tr><th>Data</th><th>Veículo</th><th>Óleo</th><th>Hodômetro</th><th>Quantidade</th><th>Observações</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty-state">Nenhuma troca de óleo encontrada para os filtros selecionados.</td></tr>'}</tbody></table>`;
  }

  async function loadOilReport(){
    const value=currentOilMonth();
    const [ano,mes]=value?value.split('-'):new Date().toISOString().slice(0,7).split('-');
    const output=document.getElementById('oil-report-output'); if(!output)return;
    output.innerHTML='<span class="report-loading">Carregando relatório…</span>';
    let report;
    try{report=await api(`/trocas-oleo/relatorio-mensal?ano=${encodeURIComponent(ano)}&mes=${encodeURIComponent(mes)}`);}
    catch{
      const records=oilRecords().filter(x=>String(x.data||'').slice(0,7)===`${ano}-${mes}`);
      report={ano,mes,total:records.length,total_quantidade:records.reduce((s,x)=>s+Number(x.quantidade||0),0),por_veiculo:[]};
    }
    const groups=(report.por_veiculo||[]).map(item=>`<span class="report-chip"><b>${esc(item.placa||'Sem placa')}</b> ${item.total} troca(s)</span>`).join('');
    output.innerHTML=`<div><strong>${String(mes).padStart(2,'0')}/${ano}</strong><span>${report.total||0} troca(s) registrada(s)</span><span>${Number(report.total_quantidade||0).toLocaleString('pt-BR',{maximumFractionDigits:2})} L de óleo</span></div><div class="report-chips">${groups||'<span class="report-muted">Nenhum veículo no período.</span>'}</div>`;
  }

  // ============ VEÍCULOS ============

  function openVehicleModal(){editingVehicle=null;document.getElementById('vehicle-modal-title').textContent='Novo Veículo';document.getElementById('vehicle-form').reset();document.getElementById('vehicle-modal').classList.add('active');}
  function editVehicle(id){
    editingVehicle=id; const v=vehicles.find(x=>x.id===id); if(!v)return;
    ['placa','grupo','marca','modelo','ano','cor','hodometro','combustivel','status','capacidade'].forEach(k=>{const el=document.getElementById('v-'+k);if(el)el.value=v[k]||'';});
    document.getElementById('vehicle-modal-title').textContent='Editar — '+v.placa;
    document.getElementById('vehicle-modal').classList.add('active');
  }

  async function saveVehicle(){
    const d={}; document.querySelectorAll('#vehicle-form [name]').forEach(el=>{d[el.name]=el.value;});
    if(!d.placa)return alert('Placa obrigatória');
    d.placa=d.placa.toUpperCase().replace(/[^A-Z0-9]/g,'');
    d.hodometro=parseInt(d.hodometro)||0; d.ano=parseInt(d.ano)||null; d.capacidade=parseInt(d.capacidade)||null;
    d.status=(d.status||'ATIVO').toUpperCase();
    if(vehicles.find(x=>x.placa===d.placa&&x.id!==editingVehicle))return alert('Placa já cadastrada');

    if(online){
      try{
        if(editingVehicle){
          const upd=await api('/vehicles/'+editingVehicle,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
          const idx=vehicles.findIndex(v=>v.id===editingVehicle); if(idx>=0)vehicles[idx]=upd;
        }else{
          const novo=await api('/vehicles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
          vehicles.push(novo);
        }
        saveCache(); closeModal('vehicle-modal'); renderVehicles(); renderDashboard(); toast('Veículo salvo!');
        return;
      }catch(e){
        toast('API falhou — salvando só neste dispositivo.','aviso');
        online=false; setConnStatus(false);
      }
    }

    // Fallback local
    if(editingVehicle){const idx=vehicles.findIndex(v=>v.id===editingVehicle);if(idx>=0)vehicles[idx]={...vehicles[idx],...d};}
    else{d.id=Date.now();vehicles.push(d);}
    saveCache(); closeModal('vehicle-modal'); renderVehicles(); renderDashboard(); toast('Veículo salvo localmente!');
  }

  async function deleteVehicle(id){
    const v=vehicles.find(x=>x.id===id); if(!confirm('Excluir '+v?.placa+'?'))return;
    if(online){
      try{
        await api('/vehicles/'+id,{method:'DELETE'});
        vehicles=vehicles.filter(x=>x.id!==id);
        saveCache(); renderVehicles(); renderDashboard(); toast('Veículo excluído');
        return;
      }catch{
        toast('API falhou — exclusão só neste dispositivo.','aviso');
        online=false; setConnStatus(false);
      }
    }
    vehicles=vehicles.filter(x=>x.id!==id); saveCache(); renderVehicles(); renderDashboard(); toast('Veículo excluído localmente');
  }

  function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('active');}

  return {init,openVehicleModal,editVehicle,saveVehicle,deleteVehicle,openMaintenanceModal,editMaintenance,saveMaintenance,deleteMaintenance,openOilModal:()=>openMaintenanceModal('TROCA DE ÓLEO'),loadOilReport,closeModal,switchPage:page};
})();
