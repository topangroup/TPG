/* ============================================================
   common.js — fungsi bantu yang dipakai di semua tab.
   Ubah/tambah fungsi umum di sini saja, jangan duplikasi di
   file lain, supaya mudah dirawat.
   ============================================================ */

function esc(v){
  if(v===undefined||v===null) return '';
  return String(v).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

const MONTHS_ID = {januari:0,februari:1,maret:2,april:3,mei:4,juni:5,juli:6,agustus:7,september:8,oktober:9,november:10,desember:11};
const MONTHS_ID_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function parseIndoDate(str){
  if(!str) return null;
  const s = str.trim().toLowerCase().replace(/\s+/g,' ');
  const parts = s.split(' ');
  if(parts.length < 3) return null;
  const day = parseInt(parts[0],10);
  const month = MONTHS_ID[parts[1]];
  const year = parseInt(parts[2],10);
  if(isNaN(day) || month===undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function formatDateShort(d){
  if(!d) return '—';
  return `${d.getDate()} ${MONTHS_ID_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(d){
  if(!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  return Math.round((target-today)/86400000);
}

function uid(){ return 'r' + Math.random().toString(36).slice(2,10); }

function downloadFile(content, filename, type){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportCsvGeneric(fields, rows, filename){
  const header = fields.map(f=>f.label).join(',');
  const lines = rows.map(row => fields.map(f=>{
    let v = (row[f.key]??'').toString().replace(/"/g,'""');
    if(v.includes(',') || v.includes('"')) v = `"${v}"`;
    return v;
  }).join(','));
  const csv = [header, ...lines].join('\n');
  downloadFile(csv, filename, 'text/csv');
}
