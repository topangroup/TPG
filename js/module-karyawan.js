/* ============================================================
   module-karyawan.js — konfigurasi tab "Data Karyawan".
   Kolom mengikuti persis sheet "LIST REK TP GROUP" yang dikirim:
   Name, Join Date, Department, No Paspor, Masa Berlaku Paspor,
   Masa Berlaku Visa, WP Tahun, Tanggal Lahir, Agama, Status,
   Bank, Rek, Nama Penerima, Notes.
   ============================================================ */

function getPassportThresholds(){
  const today = new Date(); today.setHours(0,0,0,0);
  const addMonths=(d,n)=>{ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; };
  return { red: daysUntil(addMonths(today,6)), amber: daysUntil(addMonths(today,9)) };
}
function getVisaThresholds(){ return { red: 30, amber: 90 }; }
function statusFor(days, redDays, amberDays){
  if(days===null) return 'grey';
  if(days < 0) return 'expired';
  if(days <= redDays) return 'red';
  if(days <= amberDays) return 'amber';
  return 'green';
}
const RANK = {expired:4, red:3, amber:2, green:1, grey:0};
function worseStatus(a,b){ return RANK[a]>=RANK[b] ? a : b; }

function makeExpiryBadge(days, status){
  if(days===null) return `<span class="badge grey">—</span>`;
  if(days<0) return `<span class="badge red">LEWAT ${Math.abs(days)}H</span>`;
  return `<span class="badge ${status==='red'?'red':status==='amber'?'amber':'green'}">H-${days}</span>`;
}

const KARYAWAN_FIELDS = [
  {key:'name', label:'Name', type:'text', searchable:true},
  {key:'joinDate', label:'Join Date', type:'date', mono:true},
  {key:'department', label:'Department', type:'text', filterable:true},
  {key:'passportNo', label:'No Paspor', type:'text', mono:true},
  {key:'passportExpiry', label:'Masa Berlaku Paspor', type:'date', mono:true},
  {key:'visaExpiry', label:'Masa Berlaku Visa', type:'date', mono:true},
  {key:'wpYear', label:'WP Tahun', type:'text'},
  {key:'birthDate', label:'Tanggal Lahir', type:'date', mono:true},
  {key:'religion', label:'Agama', type:'select', options:['ISLAM','KRISTEN','KATOLIK','BUDDHA','HINDU','KONGHUCU'], filterable:true},
  {key:'status', label:'Status', type:'select', options:['ACTIVE','NON-ACTIVE'], filterable:true},
  {key:'bank', label:'Bank', type:'text'},
  {key:'account', label:'Rek', type:'text', mono:true},
  {key:'accountName', label:'Nama Penerima', type:'text'},
  {key:'notes', label:'Notes', type:'textarea'},
];

function initKaryawanModule(){
  const mod = new CrudModule({
    collectionName: 'employees',
    containerId: 'panel-karyawan',
    fields: KARYAWAN_FIELDS,
    searchPlaceholder: 'Cari nama staf…',
    extraColumns: [
      { label:'Sisa Paspor', render(row){
          const d = parseIndoDate(row.passportExpiry);
          const days = daysUntil(d);
          const t = getPassportThresholds();
          return makeExpiryBadge(days, statusFor(days, t.red, t.amber));
        }},
      { label:'Sisa Visa', render(row){
          const d = parseIndoDate(row.visaExpiry);
          const days = daysUntil(d);
          const t = getVisaThresholds();
          return makeExpiryBadge(days, statusFor(days, t.red, t.amber));
        }},
    ],
    rowClassFn(row){
      const pT = getPassportThresholds(), vT = getVisaThresholds();
      const pStatus = statusFor(daysUntil(parseIndoDate(row.passportExpiry)), pT.red, pT.amber);
      const vStatus = statusFor(daysUntil(parseIndoDate(row.visaExpiry)), vT.red, vT.amber);
      const worst = worseStatus(pStatus, vStatus);
      if(worst==='expired' || worst==='red') return 'row-flag';
      if(worst==='amber') return 'row-warn';
      return '';
    }
  });

  // Statistik ringkas di atas tabel
  function renderStats(){
    const statsEl = document.getElementById('karyawanStats');
    const pT = getPassportThresholds(), vT = getVisaThresholds();
    let total = mod.items.length, active=0, pExpiring=0, pExpired=0, vExpiring=0, vExpired=0;
    mod.items.forEach(e=>{
      if((e.status||'').toLowerCase()==='active') active++;
      const pDays = daysUntil(parseIndoDate(e.passportExpiry));
      const vDays = daysUntil(parseIndoDate(e.visaExpiry));
      if(pDays!==null){ if(pDays<0) pExpired++; else if(pDays<=pT.red) pExpiring++; }
      if(vDays!==null){ if(vDays<0) vExpired++; else if(vDays<=vT.red) vExpiring++; }
    });
    const stats = [
      {n:total, l:'Total Staf', c:''},
      {n:active, l:'Status Aktif', c:'green'},
      {n:pExpiring, l:'Paspor ≤ 6 Bulan', c:'amber'},
      {n:pExpired, l:'Paspor Kedaluwarsa', c:'red'},
      {n:vExpiring, l:'Visa ≤ H-30', c:'amber'},
      {n:vExpired, l:'Visa Kedaluwarsa', c:'red'},
    ];
    statsEl.innerHTML = stats.map(s=>`<div class="stat ${s.c}"><div class="n">${s.n}</div><div class="l">${s.l}</div></div>`).join('');
  }
  const originalRenderAll = mod.renderAll.bind(mod);
  mod.renderAll = function(){ originalRenderAll(); renderStats(); };

  return mod;
}
