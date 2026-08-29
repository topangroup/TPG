/* ============================================================
   module-cuti.js — konfigurasi tab "Daftar Cuti"
   Kolom mengikuti contoh sheet "DAFTAR CUTI" yang dikirim:
   Nama, Tgl Gabung, Departemen, Tanggal Cuti/Resign, Tanggal
   Balik, Lama Cuti, Cuti Ke, Cuti Lokal/Tidak, Tanggal Ambil
   Uang Tiket, Claim Ke, Tiket ke Indo, Tiket ke CMB, Done Cuti,
   Notes.
   ============================================================ */

const CUTI_FIELDS = [
  {key:'name', label:'Nama', type:'text', searchable:true},
  {key:'joinDate', label:'Tgl Gabung', type:'date', mono:true},
  {key:'department', label:'Departemen', type:'text', filterable:true},
  {key:'tanggalCuti', label:'Tanggal Cuti / Resign', type:'date', mono:true},
  {key:'tanggalBalik', label:'Tanggal Balik', type:'date', mono:true},
  {key:'lamaCuti', label:'Lama Cuti (Hari)', type:'number'},
  {key:'cutiKe', label:'Cuti Ke', type:'number'},
  {key:'cutiLokasi', label:'Cuti Lokal / Tujuan', type:'text', filterable:true},
  {key:'tanggalAmbilTiket', label:'Tgl Ambil Uang Tiket', type:'date', mono:true},
  {key:'claimKe', label:'Claim Ke', type:'text'},
  {key:'tiketIndo', label:'Tiket ke Indo', type:'checkbox'},
  {key:'tiketCmb', label:'Tiket ke CMB', type:'checkbox'},
  {key:'doneCuti', label:'Done Cuti', type:'checkbox'},
  {key:'notes', label:'Notes', type:'textarea'},
];

function initCutiModule(){
  return new CrudModule({
    collectionName: 'cuti',
    containerId: 'panel-cuti',
    fields: CUTI_FIELDS,
    searchPlaceholder: 'Cari nama staf…',
    rowClassFn(row){
      return row.doneCuti ? '' : (row.tanggalBalik ? '' : 'row-warn');
    }
  });
}
