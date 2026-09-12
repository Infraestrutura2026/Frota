const App = (function() {
  let token = localStorage.getItem('frota_token');
  let currentUser = null;
  let vehicles = [];
  let maintenances = [];
  let editingVehicle = null;
  let editingMaintenance = null;
  let historyVehicle = null;
  let historyFilter = 'TODOS'; // TODOS | MANUT | OLEO
  let historyMonth = '';        // filtro de mês (YYYY-MM) escolhido no gráfico
  let historySyncing = false;
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

  // Placa no padrão Mercosul (AAA9A99). Placas antigas (AAA9999) são convertidas
  // pela regra oficial: o 2º dígito vira letra (0→A, 1→B … 9→J). Ex.: ABC1234 → ABC1C34.
  function formatPlacaMercosul(p){
    const s=String(p==null?'':p).toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(s))return s; // já é Mercosul
    if(/^[A-Z]{3}[0-9]{4}$/.test(s))return s.slice(0,4)+'ABCDEFGHIJ'[Number(s.charAt(4))]+s.slice(5);
    return s;
  }
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
  function readMaintCache(){
    try{const arr=JSON.parse(localStorage.getItem('frota_manutencoes')||'[]');return Array.isArray(arr)?arr:[];}catch{return[];}
  }
  function loadMaintCache(){ maintenances=readMaintCache(); }

  // ---------- Fila de sincronização offline (manutenções) ----------
  const MAINT_QUEUE_KEY='frota_maintenance_queue';
  function loadQueue(){
    try{const arr=JSON.parse(localStorage.getItem(MAINT_QUEUE_KEY)||'[]');return Array.isArray(arr)?arr:[];}catch{return[];}
  }
  function saveQueue(q){ try{localStorage.setItem(MAINT_QUEUE_KEY,JSON.stringify(q||[]));}catch{} }

  // ---------- Fila de sincronização offline (veículos) ----------
  const VEHICLE_QUEUE_KEY='frota_vehicle_queue';
  function loadVehicleQueue(){
    try{const arr=JSON.parse(localStorage.getItem(VEHICLE_QUEUE_KEY)||'[]');return Array.isArray(arr)?arr:[];}catch{return[];}
  }
  function saveVehicleQueue(q){ try{localStorage.setItem(VEHICLE_QUEUE_KEY,JSON.stringify(q||[]));}catch{} }

  // Registro criado/alterado enquanto offline: id de timestamp (>1e11) ou flag _pending
  function isPendingRecord(m){ return !!m&&(m._pending===true||(m.id!=null&&Number(m.id)>1e11)); }

  function readVehicleCache(){
    try{const arr=JSON.parse(localStorage.getItem('frota_vehicles')||'[]');return Array.isArray(arr)?arr:[];}catch{return[];}
  }

  function maintenancePayload(m){
    return {
      vehicle_id:Number(m.vehicle_id),
      data:m.data||null,
      data_saida:m.data_saida||null,
      hodometro:m.hodometro==null?null:Number(m.hodometro),
      proxima_manutencao:m.proxima_manutencao==null?null:Number(m.proxima_manutencao),
      tipo:(m.tipo||'PREVENTIVA').toUpperCase(),
      status_os:(m.status_os||'CONCLUÍDA').toUpperCase(),
      tipo_oleo:m.tipo_oleo||null,
      quantidade:m.quantidade==null?null:Number(m.quantidade),
      oficina:m.oficina||null,
      custo:m.custo==null?null:Number(m.custo),
      servico:m.servico||null,
      itens:m.itens||null,
      observacoes:m.observacoes||null,
      placa:m.placa||null
    };
  }
  function vehiclePayload(v){
    return {
      placa:v.placa,grupo:v.grupo,marca:v.marca,modelo:v.modelo,
      ano:v.ano==null?null:Number(v.ano),cor:v.cor,
      hodometro:Number(v.hodometro)||0,status:v.status,
      combustivel:v.combustivel,capacidade:v.capacidade==null?null:Number(v.capacidade)
    };
  }

  // ---------- Fila: flush das manutenções pendentes ----------
  let flushingMaint=false, flushingVehicle=false;
  async function flushMaintenanceQueue(){
    if(flushingMaint)return;
    flushingMaint=true;
    let synced=false;
    try{
      while(loadQueue().length){
        const q=loadQueue(), item=q[0];
        try{
          if(item.op==='delete'){
            try{await api('/manutencoes/'+item.id,{method:'DELETE'});}
            catch(e){ if(!isOfflineError(e)&&e.status!==404) throw e; } // 404: já não existe no servidor
            maintenances=maintenances.filter(x=>Number(x.id)!==Number(item.id));
          }else{
            const saved=await api(item.op==='update'?'/manutencoes/'+item.id:'/manutencoes',
              {method:item.op==='update'?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item.payload)});
            if(item.op==='create'){
              const i=maintenances.findIndex(x=>Number(x.id)===Number(item.localId));
              if(i>=0)maintenances[i]=saved; else maintenances.unshift(saved);
            }else{
              const i=maintenances.findIndex(x=>Number(x.id)===Number(item.id));
              if(i>=0)maintenances[i]={...maintenances[i],...saved,_pending:false};
            }
          }
          const after=loadQueue(); after.shift(); saveQueue(after);
          saveMaintCache(); synced=true;
        }catch(e){
          if(!isOfflineError(e)) toast('Não foi possível sincronizar um registro de manutenção: '+e.message,'aviso');
          break; // falha: item volta/permanece na fila para tentar de novo
        }
      }
    }finally{ flushingMaint=false; }
    if(synced){ saveMaintCache(); renderMaintenance(); renderOilChanges(); refreshHistoryIfOpen(); }
  }

  // ---------- Fila: flush dos veículos pendentes ----------
  async function flushVehicleQueue(){
    if(flushingVehicle)return;
    flushingVehicle=true;
    let synced=false;
    try{
      while(loadVehicleQueue().length){
        const q=loadVehicleQueue(), item=q[0];
        try{
          if(item.op==='delete'){
            try{await api('/vehicles/'+item.id,{method:'DELETE'});}
            catch(e){ if(!isOfflineError(e)&&e.status!==404) throw e; }
            vehicles=vehicles.filter(x=>Number(x.id)!==Number(item.id));
          }else{
            const saved=await api(item.op==='update'?'/vehicles/'+item.id:'/vehicles',
              {method:item.op==='update'?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item.payload)});
            if(item.op==='create'){
              const i=vehicles.findIndex(x=>Number(x.id)===Number(item.localId));
              if(i>=0)vehicles[i]=saved; else vehicles.push(saved);
            }else{
              const i=vehicles.findIndex(x=>Number(x.id)===Number(item.id));
              if(i>=0)vehicles[i]={...vehicles[i],...saved,_pending:false};
            }
          }
          const after=loadVehicleQueue(); after.shift(); saveVehicleQueue(after);
          saveCache(); synced=true;
        }catch(e){
          if(!isOfflineError(e)) toast('Não foi possível sincronizar um veículo: '+e.message,'aviso');
          break; // falha: item volta/permanece na fila para tentar de novo
        }
      }
    }finally{ flushingVehicle=false; }
    if(synced){ saveCache(); renderVehicles(); renderDashboard(); }
  }

  // ---------- API ----------
  async function api(path, opts){
    let r;
    try{
      r=await fetch('/api'+path, opts);
    }catch(err){
      err.offline=true; // falha de rede/fetch: API fora do ar
      throw err;
    }
    if(!r.ok){
      let msg='Erro na API'; try{msg=(await r.json()).error||msg;}catch{}
      const e=new Error(msg);
      e.status=r.status;
      if(r.status===502||r.status===503||r.status===504) e.offline=true; // gateway indisponível
      throw e;
    }
    online=true; setConnStatus(true);
    return r.json();
  }
  function isOfflineError(e){ return !!(e&&(e.offline===true||e.status===502||e.status===503||e.status===504)); }

  async function syncVehicles(){
    let fromServer=null;
    try{
      fromServer=await api('/vehicles');
      vehicles=fromServer;
      online=true; saveCache(); setConnStatus(true);
    }catch(e){
      online=false; setConnStatus(false); loadCache();
      return;
    }
    // Registros salvos offline (id de timestamp ou _pending) que ainda não estão no servidor:
    // enfileira e sincroniza automaticamente.
    const pending=readVehicleCache().filter(v=>isPendingRecord(v)
      &&!fromServer.some(s=>Number(s.id)===Number(v.id))
      &&!fromServer.some(s=>(s.placa||'').toUpperCase()===(v.placa||'').toUpperCase()));
    if(pending.length){
      const q=loadVehicleQueue();
      pending.forEach(v=>{ if(!q.some(x=>x.op==='create'&&Number(x.localId)===Number(v.id))) q.push({op:'create',localId:v.id,payload:vehiclePayload(v)}); });
      saveVehicleQueue(q);
    }
    if(loadVehicleQueue().length) await flushVehicleQueue();
  }

  async function syncMaintenances(){
    let fromServer=null;
    try{
      fromServer=await api('/manutencoes');
      maintenances=fromServer;
      saveMaintCache();
    }catch(e){
      if(isOfflineError(e)){ online=false; setConnStatus(false); }
      loadMaintCache();
      return;
    }
    // Detecta registros salvos offline (id de timestamp >1e11 ou flag _pending) que não
    // estão no servidor: enfileira e chama flushMaintenanceQueue().
    const pending=readMaintCache().filter(m=>isPendingRecord(m)&&!fromServer.some(s=>Number(s.id)===Number(m.id)));
    if(pending.length){
      const q=loadQueue();
      pending.forEach(m=>{ if(!q.some(x=>x.op==='create'&&Number(x.localId)===Number(m.id))) q.push({op:'create',localId:m.id,payload:maintenancePayload(m)}); });
      saveQueue(q);
    }
    if(loadQueue().length) await flushMaintenanceQueue();
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
    // Esc fecha o modal aberto (histórico, manutenção ou veículo)
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      const open=document.querySelector('.modal.active'); if(open)open.classList.remove('active');
    });
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

  // Placa clicável nas tabelas (Manutenção / Troca de Óleo): abre o histórico do veículo,
  // igual ao clique na placa dos cartões do Painel Geral.
  function placaLink(m, plate){
    const text=esc(formatPlacaMercosul(plate||''))||'-';
    const vid=Number(m?.vehicle_id)||Number(vehicles.find(x=>(x.placa||'').toUpperCase()===String(m?.placa||'').toUpperCase())?.id)||0;
    if(!vid) return `<span class="placa-badge">${text}</span>`;
    return `<span class="placa-badge placa-badge-clickable" role="button" tabindex="0" title="Ver histórico de manutenção e troca de óleo" onclick="App.openVehicleHistory(event, ${vid})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openVehicleHistory(event, ${vid});}">${text}</span>`;
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
      // O cartão inteiro abre o histórico; a edição do veículo fica no botão de lápis.
      const items=gv.map(v=>`<div class="dashboard-vehicle-item" role="button" tabindex="0" title="Ver histórico de manutenção de ${esc(formatPlacaMercosul(v.placa))}" aria-label="Ver histórico de manutenção de ${esc(formatPlacaMercosul(v.placa))}" onclick="App.openVehicleHistory(event, ${Number(v.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openVehicleHistory(event, ${Number(v.id)});}"><span class="dashboard-vehicle-topline"><span class="placa-badge placa-badge-clickable">${esc(formatPlacaMercosul(v.placa))} 🔧</span><span class="badge ${badge(v.status)}">${v.status||'ATIVO'}</span></span><strong>${v.marca||''} ${v.modelo||''}</strong><span class="dashboard-vehicle-foot"><span class="dashboard-vehicle-km">${(v.hodometro||0).toLocaleString('pt-BR')} km</span><button type="button" class="btn btn-sm btn-icon dashboard-vehicle-edit" title="Editar veículo" aria-label="Editar ${esc(formatPlacaMercosul(v.placa))}" onclick="event.stopPropagation();App.editVehicle(${Number(v.id)})">✏️</button></span></div>`).join('');
      return `<section class="fleet-group-module dashboard-group-module ${i.cls}"><div class="fleet-group-header"><div class="fleet-group-heading"><span class="fleet-group-icon">${i.icon}</span><div><h4>${i.label}</h4><span>Visão rápida</span></div></div><span class="fleet-group-count">${gv.length} veículo(s)</span></div><div class="dashboard-vehicle-list">${items}</div></section>`;
    }).join('');
  }

  // ============ HISTÓRICO DO VEÍCULO (ao clicar na placa do Painel Geral) ============

  async function openVehicleHistory(ev,id){
    if(ev){ ev.stopPropagation(); ev.preventDefault(); } // não abre o editar do cartão
    historyVehicle=Number(id);
    historyFilter='TODOS';
    historyMonth='';
    renderVehicleHistory();
    const m=document.getElementById('vehicle-history-modal'); if(m)m.classList.add('active');
    await syncVehicleHistory(); // busca na API as OS mais recentes (outro computador pode ter lançado)
  }

  // Recarrega da API somente as manutenções do veículo em foco,
  // preservando os registros criados offline que ainda não foram sincronizados.
  async function syncVehicleHistory(){
    const id=historyVehicle; if(!id)return;
    historySyncing=true; renderVehicleHistory();
    try{
      const rows=await api('/manutencoes?vehicle_id='+encodeURIComponent(id));
      if(Number(historyVehicle)!==Number(id))return; // o usuário abriu outro veículo
      const pendentes=maintenances.filter(m=>Number(m.vehicle_id)===Number(id)&&isPendingRecord(m));
      maintenances=maintenances.filter(m=>Number(m.vehicle_id)!==Number(id)).concat(rows,pendentes);
      saveMaintCache();
    }catch(e){ /* sem API: mantém o cache local já exibido */ }
    finally{
      if(Number(historyVehicle)===Number(id)){ historySyncing=false; renderVehicleHistory(); }
    }
  }

  function setHistoryFilter(f){ historyFilter=f||'TODOS'; renderVehicleHistory(); }

  function refreshHistoryIfOpen(){
    const m=document.getElementById('vehicle-history-modal');
    if(m&&m.classList.contains('active')) renderVehicleHistory();
  }

  // Todos os registros do veículo (usado nos chips) e os do filtro atual (usado na tabela)
  function historyAllItems(){
    const v=vehicles.find(x=>Number(x.id)===Number(historyVehicle));
    if(!v)return [];
    return maintenances.filter(m=>Number(m.vehicle_id)===Number(v.id));
  }
  function historyItems(){
    return historyAllItems()
      .filter(m=>{
        const isOil=(m.tipo||'').toUpperCase()==='TROCA DE ÓLEO';
        return historyFilter==='TODOS'||(historyFilter==='OLEO'?isOil:!isOil);
      })
      .filter(m=>!historyMonth||String(m.data||'').slice(0,7)===historyMonth)
      .slice()
      .sort((a,b)=>String(b.data||'').slice(0,10).localeCompare(String(a.data||'').slice(0,10))||Number(b.id||0)-Number(a.id||0));
  }

  // Clica numa barra do gráfico para filtrar a tabela por aquele mês (clicar de novo limpa)
  function setHistoryMonth(m){ historyMonth=(m&&m!==historyMonth)?m:''; renderVehicleHistory(); }

  function monthLabel(key){
    const p=String(key||'').split('-'); return p.length===2?`${p[1]}/${p[0]}`:String(key||'');
  }
  function daysBetween(from,to){
    const a=Date.parse(String(from||'').slice(0,10)), b=Date.parse(String(to||'').slice(0,10));
    if(isNaN(a)||isNaN(b)||b<a)return null;
    return Math.round((b-a)/86400000);
  }

  // Custo agregado por mês (máximo de 12 meses exibidos)
  function historyMonthlyCosts(){
    const map=new Map();
    historyAllItems().forEach(m=>{
      const k=String(m.data||'').slice(0,7); if(!k)return;
      const cur=map.get(k)||{custo:0,total:0};
      cur.custo+=Number(m.custo||0); cur.total+=1; map.set(k,cur);
    });
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-12);
  }

  // Média de km rodados entre manutenções e de dias parado por ordem de serviço
  function historyStats(){
    const asc=historyAllItems().slice().sort((a,b)=>String(a.data||'').slice(0,10).localeCompare(String(b.data||'').slice(0,10)));
    const gaps=[], stops=[];
    let lastKm=null;
    asc.forEach(m=>{
      const km=Number(m.hodometro)||null;
      if(km!=null){ if(lastKm!=null&&km>lastKm)gaps.push(km-lastKm); lastKm=km; }
      const d=daysBetween(m.data,m.data_saida); if(d!=null)stops.push(d);
    });
    const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
    return {mediaKm:avg(gaps),mediaDias:avg(stops),qtdGaps:gaps.length,qtdStops:stops.length};
  }

  function renderHistoryOverview(){
    if(!historyAllItems().length)return '';
    const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const months=historyMonthlyCosts();
    const max=Math.max(...months.map(([,v])=>v.custo),1);
    const totalPeriodo=months.reduce((s,[,v])=>s+v.custo,0);
    const bars=months.map(([k,v])=>{
      const h=Math.max(8,Math.round(v.custo/max*100));
      const [y,mo]=k.split('-');
      return `<button type="button" class="chart-col ${historyMonth===k?'is-active':''}" title="${mo}/${y} — ${v.total} registro(s), ${money(v.custo)}" aria-label="Filtrar ${mo}/${y}" onclick="App.setHistoryMonth('${k}')"><span class="chart-amount">${v.custo?money(v.custo):'—'}</span><span class="chart-track"><span class="chart-bar" style="height:${h}%"></span></span><span class="chart-month">${mo}/${String(y).slice(2)}</span></button>`;
    }).join('');
    // Linha do tempo (ordem cronológica) com o intervalo em km desde a manutenção anterior
    const asc=historyAllItems().slice().sort((a,b)=>String(a.data||'').slice(0,10).localeCompare(String(b.data||'').slice(0,10))||Number(a.id||0)-Number(b.id||0));
    let lastKm=null;
    const timeline=asc.map(m=>{
      const km=Number(m.hodometro)||null;
      const delta=(km!=null&&lastKm!=null&&km>lastKm)?`+ ${(km-lastKm).toLocaleString('pt-BR')} km desde a intervenção anterior`:'';
      if(km!=null)lastKm=km;
      const dias=daysBetween(m.data,m.data_saida);
      const meta=[km!=null?`${km.toLocaleString('pt-BR')} km`:'',m.oficina||'',money(m.custo)].filter(Boolean).join(' · ');
      return `<li class="tl-item"><span class="tl-dot badge-${tipoBadge(m.tipo)}"></span><div class="tl-body"><div class="tl-top"><strong>${dateLabel(m.data)}</strong><span class="badge ${tipoBadge(m.tipo)}">${esc(m.tipo||'-')}</span>${dias!=null?`<span class="tl-tag">${dias} ${dias===1?'dia':'dias'} parado</span>`:''}</div><span class="tl-servico">${esc(m.servico||'-')}</span><span class="tl-meta">${esc(meta)}</span>${delta?`<span class="tl-delta">${delta}</span>`:''}</div></li>`;
    }).join('');
    const st=historyStats();
    const notes=[
      st.mediaKm!=null?`média de ${Math.round(st.mediaKm).toLocaleString('pt-BR')} km entre manutenções`:'',
      st.mediaDias!=null?`${(Math.round(st.mediaDias*10)/10).toLocaleString('pt-BR')} dia(s) parado por OS`:''
    ].filter(Boolean).join(' · ');
    return `<div class="history-overview">
      <section class="history-panel">
        <div class="history-panel-head"><h4>Custo por mês</h4><span>${money(totalPeriodo)} no período · clique numa barra para filtrar</span></div>
        <div class="history-chart${months.length>6?' chart-dense':''}">${bars}</div>
      </section>
      <section class="history-panel">
        <div class="history-panel-head"><h4>Linha do tempo</h4><span>${esc(notes||'sem dados de hodômetro suficientes')}</span></div>
        <ol class="history-timeline">${timeline}</ol>
      </section>
    </div>`;
  }

  function exportHistoryCsv(){
    const v=vehicles.find(x=>Number(x.id)===Number(historyVehicle)); if(!v)return;
    const items=historyItems(); if(!items.length){ toast('Nenhum registro para exportar.','aviso'); return; }
    const placa=formatPlacaMercosul(v.placa);
    const num=n=>n==null?'':String(n).replace('.',',');
    const head=['Data','Tipo','Serviço','Itens / peças','Oficina','Hodômetro (km)','Próx. manutenção (km)','Status da OS','Custo (R$)','Saída','Óleo','Litros','Observações'];
    const lines=[head.join(';')].concat(items.map(m=>[
      dateLabel(m.data),m.tipo||'',m.servico||'',m.itens||'',m.oficina||'',
      num(m.hodometro),num(m.proxima_manutencao),m.status_os||'',
      num(m.custo==null?'':Number(m.custo).toFixed(2)),
      m.data_saida?dateLabel(m.data_saida):'',m.tipo_oleo||'',num(m.quantidade),m.observacoes||''
    ].map(cell=>`"${String(cell==null?'':cell).replace(/"/g,'""')}"`).join(';')));
    try{
      const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=`Historico-${placa||'veiculo'}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('Histórico exportado em CSV!');
    }catch(e){ toast('Não foi possível exportar: '+e.message,'aviso'); }
  }

  function renderVehicleHistory(){
    const titleEl=document.getElementById('vehicle-history-title');
    const content=document.getElementById('vehicle-history-content');
    if(!titleEl||!content)return;
    const v=vehicles.find(x=>Number(x.id)===Number(historyVehicle));
    const placa=formatPlacaMercosul(v?.placa||'');
    titleEl.textContent='Histórico — '+(placa||'Veículo');
    const todos=historyAllItems();
    const items=historyItems();
    const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const model=v?`${v.marca||''} ${v.modelo||''}`.trim():'';
    const meta=[v?.grupo&&`Grupo ${v.grupo}`,v?.ano,`${Number(v?.hodometro||0).toLocaleString('pt-BR')} km`,v?.combustivel].filter(Boolean).join(' · ');
    const sorted=todos.slice().sort((a,b)=>String(b.data||'').slice(0,10).localeCompare(String(a.data||'').slice(0,10)));
    const oil=todos.filter(m=>(m.tipo||'').toUpperCase()==='TROCA DE ÓLEO').length;
    const ultima=sorted[0];
    const proximaKm=sorted.map(m=>Number(m.proxima_manutencao)).filter(n=>n>0).sort((a,b)=>b-a)[0]||null;
    const chips=[
      `<span class="report-chip"><b>${todos.length}</b> ${todos.length===1?'manutenção':'manutenções'}</span>`,
      `<span class="report-chip"><b>${oil}</b> ${oil===1?'troca de óleo':'trocas de óleo'}</span>`,
      `<span class="report-chip"><b>${money(todos.reduce((s,m)=>s+Number(m.custo||0),0))}</b> custo acumulado</span>`,
      `<span class="report-chip"><b>${ultima?dateLabel(ultima.data):'—'}</b> última manutenção</span>`,
      proximaKm?`<span class="report-chip"><b>${proximaKm.toLocaleString('pt-BR')} km</b> próxima programada</span>`:''
    ].join('');
    const vid=Number(historyVehicle);
    const filters=[['TODOS','Todos'],['MANUT','Manutenções'],['OLEO','Trocas de óleo']]
      .map(([k,l])=>`<button type="button" class="btn btn-sm ${historyFilter===k?'btn-primary':''}" onclick="App.setHistoryFilter('${k}')">${l}</button>`).join('')
      +(historyMonth?`<button type="button" class="btn btn-sm btn-primary" title="Remover filtro de mês" onclick="App.setHistoryMonth('')">📅 ${esc(monthLabel(historyMonth))} ✕</button>`:'');
    const actions=`
      <button type="button" class="btn btn-sm btn-primary" onclick="App.openMaintenanceModal(null, ${vid})">＋ Nova manutenção</button>
      <button type="button" class="btn btn-sm" onclick="App.openMaintenanceModal('TROCA DE ÓLEO', ${vid})">◉ Troca de óleo</button>
      <button type="button" class="btn btn-sm" onclick="App.exportHistoryCsv()">⬇ Exportar CSV</button>
      <button type="button" class="btn btn-sm" title="Recarregar do servidor" onclick="App.syncVehicleHistory()">⟳ Atualizar</button>`;
    const rows=items.map(m=>{
      const km=m.hodometro==null?'-':`${Number(m.hodometro).toLocaleString('pt-BR')} km`;
      const prox=m.proxima_manutencao?`<small class="table-subtitle">próx. ${Number(m.proxima_manutencao).toLocaleString('pt-BR')} km</small>`:'';
      const saida=m.data_saida?`<small class="table-subtitle">saída ${dateLabel(m.data_saida)}</small>`:'';
      const extra=[m.tipo_oleo?`óleo ${m.tipo_oleo}${m.quantidade?` (${Number(m.quantidade).toLocaleString('pt-BR',{maximumFractionDigits:2})} L)`:''}`:'',m.itens?`peças: ${m.itens}`:'',m.observacoes?`obs: ${m.observacoes}`:''].filter(Boolean).join(' · ');
      const oficinaInline=m.oficina?`<span class="history-oficina-inline">Oficina: ${esc(m.oficina)}</span>`:'';
      return `<tr><td>${dateLabel(m.data)}${saida}</td><td><span class="badge ${tipoBadge(m.tipo)}">${esc(m.tipo||'-')}</span></td><td class="history-col-servico">${esc(m.servico||'-')}${extra?`<small class="table-subtitle">${esc(extra)}</small>`:''}${oficinaInline}</td><td class="history-col-oficina">${esc(m.oficina||'-')}</td><td>${km}${prox}</td><td class="history-col-status"><span class="badge ${osBadge(m.status_os)}">${esc(m.status_os||'-')}</span></td><td>${m.custo==null?'-':money(m.custo)}</td><td><button class="btn btn-sm btn-primary" title="Editar" onclick="App.editMaintenance(${Number(m.id)})">✏️</button><button class="btn btn-sm btn-danger" title="Excluir" onclick="App.deleteMaintenance(${Number(m.id)})">🗑️</button></td></tr>`;
    }).join('');
    const empty = todos.length===0
      ? `<div class="history-empty">Nenhuma manutenção ou troca de óleo registrada para este veículo.<div class="history-empty-actions"><button type="button" class="btn btn-sm btn-primary" onclick="App.openMaintenanceModal(null, ${vid})">＋ Registrar manutenção</button><button type="button" class="btn btn-sm" onclick="App.openMaintenanceModal('TROCA DE ÓLEO', ${vid})">◉ Registrar troca de óleo</button></div></div>`
      : '<div class="history-empty">Nenhum registro neste filtro.</div>';
    content.innerHTML=`
      <div class="history-head">
        <div class="history-vehicle">
          <span class="placa-badge">${esc(placa||'-')}</span>
          <div><strong>${esc(model||'Veículo')}</strong><span>${esc(meta)}</span></div>
          ${v?`<span class="badge ${badge(v.status)}">${esc(v.status||'ATIVO')}</span>`:''}
          ${historySyncing?'<span class="history-syncing">Atualizando…</span>':''}
        </div>
        <div class="history-chips">${chips}</div>
      </div>
      <div class="history-toolbar">
        <div class="history-filters">${filters}</div>
        <div class="history-actions">${actions}</div>
      </div>
      ${renderHistoryOverview()}
      ${items.length?`<div class="table-responsive"><table class="data-table history-table"><thead><tr><th>Data</th><th>Tipo</th><th class="history-col-servico">Serviço</th><th class="history-col-oficina">Oficina</th><th>Hodômetro</th><th class="history-col-status">Status OS</th><th>Custo</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`:empty}`;
  }

  function renderVehicles(){
    const search=(document.getElementById('vehicle-search')?.value||'').toLowerCase();
    const filter=document.getElementById('vehicle-status-filter')?.value||'';
    const filt=vehicles.filter(v=>`${v.placa} ${v.marca} ${v.modelo}`.toLowerCase().includes(search)&&(!filter||(v.status||'').toUpperCase()===filter));
    document.getElementById('vehicle-count').textContent=`${filt.length} de ${vehicles.length}`;
    document.getElementById('vehicles-groups').innerHTML=keys().map(gr=>{
      const i=info(gr); const gv=filt.filter(v=>norm(v.grupo)===gr);
      const rows=gv.map(v=>`<tr><td><span class="placa-badge placa-badge-clickable" role="button" tabindex="0" title="Ver histórico de manutenção e troca de óleo" onclick="App.openVehicleHistory(event, ${Number(v.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openVehicleHistory(event, ${Number(v.id)});}">${esc(formatPlacaMercosul(v.placa))}</span></td><td><b>${v.marca||''}</b> ${v.modelo||''}</td><td>${v.ano||'-'}</td><td><b>${(v.hodometro||0).toLocaleString('pt-BR')} km</b></td><td><span class="badge ${badge(v.status)}">${v.status||'ATIVO'}</span></td><td>${v.combustivel||'-'}</td><td><button class="btn btn-sm btn-primary" onclick="App.editVehicle(${v.id})">✏️</button><button class="btn btn-sm btn-danger" onclick="App.deleteVehicle(${v.id})">🗑️</button></td></tr>`).join('');
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
      return `<tr><td>${dateLabel(m.data)}</td><td>${placaLink(m,plate)}<small class="table-subtitle">${esc(model)}</small></td><td><span class="badge ${tipoBadge(m.tipo)}">${esc(m.tipo||'-')}</span></td><td>${esc(m.servico||'-')}</td><td>${km}${prox}</td><td><span class="badge ${osBadge(m.status_os)}">${esc(m.status_os||'-')}</span></td><td>${costTxt}</td><td><button class="btn btn-sm btn-primary" title="Editar" onclick="App.editMaintenance(${Number(m.id)})">✏️</button><button class="btn btn-sm btn-danger" title="Excluir" onclick="App.deleteMaintenance(${Number(m.id)})">🗑️</button></td></tr>`;
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

  // preset: tipo de manutenção (ou 'TROCA DE ÓLEO'); vehicleId: veículo já selecionado
  // (usado quando o modal é aberto a partir do histórico de um veículo)
  function openMaintenanceModal(preset,vehicleId){
    editingMaintenance=null;
    const title=document.getElementById('maintenance-modal-title');
    title.textContent=preset==='TROCA DE ÓLEO'?'Registrar Troca de Óleo':'Nova Manutenção';
    const form=document.getElementById('maintenance-form'); if(form)form.reset();
    const data=document.getElementById('m-data'); if(data)data.value=new Date().toISOString().slice(0,10);
    const select=document.getElementById('m-vehicle');
    if(select){ select.innerHTML=vehicleOptions(vehicleId||''); select.value=vehicleId||''; }
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
    // SEMPRE tenta a API primeiro (independe da flag online)
    try{
      const saved=await api(editingMaintenance?`/manutencoes/${editingMaintenance}`:'/manutencoes',{method:editingMaintenance?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(editingMaintenance){const i=maintenances.findIndex(x=>Number(x.id)===editingMaintenance);if(i>=0)maintenances[i]=saved;}
      else maintenances.unshift(saved);
      saveMaintCache(); closeModal('maintenance-modal'); renderMaintenance(); renderOilChanges(); refreshHistoryIfOpen();
      if(loadQueue().length) flushMaintenanceQueue(); // aproveita para drenar a fila
      toast(data.tipo==='TROCA DE ÓLEO'?'Troca de óleo salva!':'Manutenção salva!'); return;
    }catch(e){
      if(!isOfflineError(e)){ toast('Não foi possível salvar: '+e.message,'aviso'); return; }
      online=false; setConnStatus(false); // API fora do ar
    }
    // API indisponível: salva localmente E enfileira para sincronizar depois
    const existing=editingMaintenance?maintenances.find(x=>Number(x.id)===Number(editingMaintenance)):null;
    const wasPending=existing?isPendingRecord(existing):false;
    let local;
    if(existing){
      local={...existing,...data,_pending:true,_op:wasPending?'create':'update'};
      const i=maintenances.findIndex(x=>Number(x.id)===Number(editingMaintenance)); if(i>=0)maintenances[i]=local;
    }else{
      local={...data,id:Date.now(),placa:vehicles.find(v=>Number(v.id)===Number(data.vehicle_id))?.placa||null,data_entrada:data.data,_pending:true,_op:'create'};
      maintenances.unshift(local);
    }
    const q=loadQueue();
    const entry=local._op==='update'
      ?{op:'update',id:local.id,payload:maintenancePayload(local)}
      :{op:'create',localId:local.id,payload:maintenancePayload(local)};
    const qi=local._op==='update'
      ?q.findIndex(x=>x.op==='update'&&Number(x.id)===Number(local.id))
      :q.findIndex(x=>x.op==='create'&&Number(x.localId)===Number(local.id));
    if(qi>=0)q[qi]=entry; else q.push(entry);
    saveQueue(q);
    saveMaintCache(); closeModal('maintenance-modal'); renderMaintenance(); renderOilChanges(); refreshHistoryIfOpen();
    toast('Sem conexão com a API — registro salvo neste dispositivo e será sincronizado automaticamente.','aviso');
  }

  async function deleteMaintenance(id){
    const item=maintenances.find(x=>Number(x.id)===Number(id));
    const label=item?.tipo==='TROCA DE ÓLEO'?'troca de óleo':'manutenção';
    if(!confirm(`Excluir o registro de ${label} de ${dateLabel(item?.data)}?`))return;
    // SEMPRE tenta a API primeiro (independe da flag online)
    try{
      await api('/manutencoes/'+id,{method:'DELETE'});
      maintenances=maintenances.filter(x=>Number(x.id)!==Number(id));
      saveMaintCache(); renderMaintenance(); renderOilChanges(); refreshHistoryIfOpen();
      if(loadQueue().length) flushMaintenanceQueue(); // aproveita para drenar a fila
      toast('Registro excluído!'); return;
    }catch(e){
      if(!isOfflineError(e)){ toast('Não foi possível excluir: '+e.message,'aviso'); return; }
      online=false; setConnStatus(false); // API fora do ar
    }
    // API indisponível: exclui localmente E enfileira a exclusão (ou descarta create pendente)
    const q=loadQueue();
    if(isPendingRecord(item)){
      saveQueue(q.filter(x=>!(x.op==='create'&&Number(x.localId)===Number(id))));
      toast('Registro excluído neste dispositivo (ainda não sincronizado com a API).','aviso');
    }else{
      if(!q.some(x=>x.op==='delete'&&Number(x.id)===Number(id))) q.push({op:'delete',id:Number(id)});
      saveQueue(q);
      toast('Registro excluído localmente — a exclusão será sincronizada quando a API voltar.','aviso');
    }
    maintenances=maintenances.filter(x=>Number(x.id)!==Number(id));
    saveMaintCache(); renderMaintenance(); renderOilChanges(); refreshHistoryIfOpen();
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
      return `<tr><td>${dateLabel(item.data)}</td><td>${placaLink(item,plate)}<small class="table-subtitle">${esc(model)}</small></td><td>${esc(item.tipo_oleo||'-')}</td><td>${item.hodometro==null?'-':`${Number(item.hodometro).toLocaleString('pt-BR')} km`}</td><td>${quantity}</td><td>${esc(item.observacoes||'-')}</td><td><button class="btn btn-sm btn-primary" title="Editar" onclick="App.editMaintenance(${Number(item.id)})">✏️</button><button class="btn btn-sm btn-danger" title="Excluir" onclick="App.deleteMaintenance(${Number(item.id)})">🗑️</button></td></tr>`;
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

    // SEMPRE tenta a API primeiro (independe da flag online)
    try{
      if(editingVehicle){
        const upd=await api('/vehicles/'+editingVehicle,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
        const idx=vehicles.findIndex(v=>v.id===editingVehicle); if(idx>=0)vehicles[idx]=upd;
      }else{
        const novo=await api('/vehicles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
        vehicles.push(novo);
      }
      saveCache(); closeModal('vehicle-modal'); renderVehicles(); renderDashboard(); toast('Veículo salvo!');
      if(loadVehicleQueue().length) flushVehicleQueue(); // aproveita para drenar a fila
      return;
    }catch(e){
      if(!isOfflineError(e)){ toast('Não foi possível salvar o veículo: '+e.message,'aviso'); return; }
      online=false; setConnStatus(false); // API fora do ar
    }

    // Fallback local: salva no dispositivo E enfileira para sincronizar depois
    const q=loadVehicleQueue();
    if(editingVehicle){
      const idx=vehicles.findIndex(v=>v.id===editingVehicle);
      if(idx>=0)vehicles[idx]={...vehicles[idx],...d,_pending:true,_op:'update'};
      const entry={op:'update',id:editingVehicle,payload:vehiclePayload(d)};
      const qi=q.findIndex(x=>x.op==='update'&&Number(x.id)===Number(editingVehicle));
      if(qi>=0)q[qi]=entry; else q.push(entry);
      saveVehicleQueue(q);
    }else{
      const local={...d,id:Date.now(),_pending:true,_op:'create'};
      vehicles.push(local);
      const entry={op:'create',localId:local.id,payload:vehiclePayload(local)};
      const qi=q.findIndex(x=>x.op==='create'&&Number(x.localId)===Number(local.id));
      if(qi>=0)q[qi]=entry; else q.push(entry);
      saveVehicleQueue(q);
    }
    saveCache(); closeModal('vehicle-modal'); renderVehicles(); renderDashboard();
    toast('Veículo salvo localmente — será sincronizado quando a API voltar.','aviso');
  }

  async function deleteVehicle(id){
    const v=vehicles.find(x=>x.id===id); if(!confirm('Excluir '+v?.placa+'?'))return;
    // SEMPRE tenta a API primeiro (independe da flag online)
    try{
      await api('/vehicles/'+id,{method:'DELETE'});
      vehicles=vehicles.filter(x=>x.id!==id);
      saveCache(); renderVehicles(); renderDashboard();
      if(loadVehicleQueue().length) flushVehicleQueue(); // aproveita para drenar a fila
      toast('Veículo excluído');
      return;
    }catch(e){
      if(!isOfflineError(e)){ toast('Não foi possível excluir o veículo: '+e.message,'aviso'); return; }
      online=false; setConnStatus(false); // API fora do ar
    }
    // API indisponível: exclui localmente E enfileira a exclusão (ou descarta create pendente)
    const q=loadVehicleQueue();
    if(v&&isPendingRecord(v)){
      saveVehicleQueue(q.filter(x=>!(x.op==='create'&&Number(x.localId)===Number(id))));
      toast('Veículo excluído neste dispositivo (ainda não sincronizado com a API).','aviso');
    }else{
      if(!q.some(x=>x.op==='delete'&&Number(x.id)===Number(id))) q.push({op:'delete',id:Number(id)});
      saveVehicleQueue(q);
      toast('Veículo excluído localmente — a exclusão será sincronizada quando a API voltar.','aviso');
    }
    vehicles=vehicles.filter(x=>x.id!==id); saveCache(); renderVehicles(); renderDashboard();
  }

  function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('active');}

  return {init,openVehicleModal,editVehicle,saveVehicle,deleteVehicle,openMaintenanceModal,editMaintenance,saveMaintenance,deleteMaintenance,openOilModal:()=>openMaintenanceModal('TROCA DE ÓLEO'),loadOilReport,openVehicleHistory,renderVehicleHistory,syncVehicleHistory,setHistoryFilter,setHistoryMonth,exportHistoryCsv,formatPlacaMercosul,closeModal,switchPage:page};
})();
