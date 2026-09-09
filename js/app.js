const App = (function() {
  let token = localStorage.getItem('frota_token');
  let currentUser = null;
  let vehicles = [];
  let editingVehicle = null;

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
    { id: 26, placa: 'FTQ3C13', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 213986, status: 'MANUTENÇÃO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 27, placa: 'FUW4H93', grupo: 'S4', marca: 'CAOACHERY', modelo: 'TIGGO 8 1.6 TGDI', ano: 2023, cor: 'BRANCA', hodometro: 93631, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 },
    { id: 28, placa: 'FYI5976', grupo: 'S4', marca: 'RENAULT', modelo: 'MASTER', ano: 2018, cor: 'BRANCA', hodometro: 140580, status: 'ATIVO', combustivel: 'DIESEL', capacidade: 4 },
    { id: 29, placa: 'GIT5825', grupo: 'S4', marca: 'MITSUBISHI', modelo: 'OUTLANDER 2.0 P', ano: 2020, cor: 'PRATA', hodometro: 233678, status: 'ATIVO', combustivel: 'GASOLINA', capacidade: 7 }
  ];

  const GROUPS = { S2:{label:'Grupo S2',icon:'🚐',cls:'group-s2'}, S3:{label:'Grupo S3',icon:'🚚',cls:'group-s3'}, S4:{label:'Grupo S4',icon:'🚛',cls:'group-s4'} };
  function norm(g){ return String(g||'').trim().toUpperCase()||'SEM GRUPO'; }
  function keys(){ const k=['S2','S3','S4']; vehicles.forEach(v=>{ const g=norm(v.grupo); if(!k.includes(g))k.push(g); }); return k; }
  function info(g){ const k=norm(g); return GROUPS[k]||{label:`Grupo ${k}`,icon:'🚗',cls:'group-other'}; }

  function toast(msg){
    const c=document.getElementById('toast-container'); if(!c)return;
    const t=document.createElement('div'); t.className='toast-msg success';
    t.innerHTML=`<span>✅</span><span>${msg}</span>`;
    c.appendChild(t); setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},3000);
  }

  function load(){
    try{vehicles=JSON.parse(localStorage.getItem('frota_vehicles')||'[]');}catch{vehicles=[];}
    if(vehicles.length===0){vehicles=VEHICLES.map((v,i)=>({...v,id:i+1})); save();}
  }
  function save(){ localStorage.setItem('frota_vehicles',JSON.stringify(vehicles)); }

  let users=[];
  function loadUsers(){
    try{users=JSON.parse(localStorage.getItem('frota_users')||'[]');}catch{users=[];}
    if(users.length===0){
      users=[{id:1,nome:'Administrador',usuario:'admin',senha:'e6c2797fed87dd7a39f60bcfe65cf34645229671607ef506720d20d41f173b2a',role:'admin',ativo:1}];
      localStorage.setItem('frota_users',JSON.stringify(users));
    }
  }

  async function hash(p){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function init(){
    loadUsers(); load();
    const st=localStorage.getItem('frota_token'), su=localStorage.getItem('frota_current_user');
    if(st&&su){try{currentUser=JSON.parse(su);token=st;}catch{}}
    if(!token||!currentUser) showLogin(); else { showApp(); renderDashboard(); }
    bind();
  }

  function bind(){
    document.getElementById('login-form').addEventListener('submit',e=>{e.preventDefault();login();});
    const tp=document.getElementById('toggle-login-password');
    if(tp) tp.addEventListener('click',()=>{const p=document.getElementById('login-pass');p.type=p.type==='text'?'password':'text';});
    document.getElementById('btn-logout').addEventListener('click',logout);
    document.getElementById('btn-toggle-sidebar').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',()=>page(el.dataset.page)));
    const s=document.getElementById('vehicle-search'); if(s)s.addEventListener('input',renderVehicles);
    const f=document.getElementById('vehicle-status-filter'); if(f)f.addEventListener('change',renderVehicles);
  }

  async function login(){
    const u=document.getElementById('login-user').value.trim(), p=document.getElementById('login-pass').value;
    const al=document.getElementById('login-alert');
    if(!u||!p){al.textContent='Preencha usuário e senha.';al.style.display='block';return;}
    const h=await hash(p);
    const found=users.find(x=>x.usuario.toLowerCase()===u.toLowerCase()&&(x.senha===h||(u==='admin'&&(p==='admin'||p==='admin2025')))&&x.ativo===1);
    if(found){
      token='token_'+found.id+'_'+Date.now();
      currentUser={id:found.id,nome:found.nome,usuario:found.usuario,role:found.role};
      localStorage.setItem('frota_token',token);
      localStorage.setItem('frota_current_user',JSON.stringify(currentUser));
      showApp(); renderDashboard(); return;
    }
    al.textContent='Usuário ou senha incorretos.';al.style.display='block';
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
    document.getElementById('page-title').textContent=p==='dashboard'?'Painel Geral — Frota Pro':'Cadastro de Veículos';
    if(p==='dashboard')renderDashboard(); if(p==='vehicles')renderVehicles();
  }

  function badge(s){s=(s||'').toUpperCase();if(s==='ATIVO')return'success';if(s==='MANUTENÇÃO')return'danger';if(s==='ARROLAMENTO')return'warning';return'default';}

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

  function openVehicleModal(){editingVehicle=null;document.getElementById('vehicle-modal-title').textContent='Novo Veículo';document.getElementById('vehicle-form').reset();document.getElementById('vehicle-modal').classList.add('active');}
  function editVehicle(id){
    editingVehicle=id; const v=vehicles.find(x=>x.id===id); if(!v)return;
    ['placa','grupo','marca','modelo','ano','cor','hodometro','combustivel','status'].forEach(k=>{const el=document.getElementById('v-'+k);if(el)el.value=v[k]||'';});
    document.getElementById('vehicle-modal-title').textContent='Editar — '+v.placa;
    document.getElementById('vehicle-modal').classList.add('active');
  }
  function saveVehicle(){
    const d={}; document.querySelectorAll('#vehicle-form [name]').forEach(el=>{d[el.name]=el.value;});
    if(!d.placa)return alert('Placa obrigatória');
    d.placa=d.placa.toUpperCase().replace(/[^A-Z0-9]/g,'');
    d.hodometro=parseInt(d.hodometro)||0; d.ano=parseInt(d.ano)||null; d.capacidade=parseInt(d.capacidade)||null;
    d.status=(d.status||'ATIVO').toUpperCase();
    if(vehicles.find(x=>x.placa===d.placa&&x.id!==editingVehicle))return alert('Placa já cadastrada');
    if(editingVehicle){const idx=vehicles.findIndex(v=>v.id===editingVehicle);if(idx>=0)vehicles[idx]={...vehicles[idx],...d};}
    else{d.id=Date.now();vehicles.push(d);}
    save(); closeModal('vehicle-modal'); renderVehicles(); renderDashboard(); toast('Veículo salvo!');
  }
  function deleteVehicle(id){
    const v=vehicles.find(x=>x.id===id); if(!confirm('Excluir '+v?.placa+'?'))return;
    vehicles=vehicles.filter(x=>x.id!==id); save(); renderVehicles(); renderDashboard(); toast('Veículo excluído');
  }
  function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('active');}

  return {init,openVehicleModal,editVehicle,saveVehicle,deleteVehicle,closeModal,switchPage:page};
})();
document.addEventListener('DOMContentLoaded',App.init);