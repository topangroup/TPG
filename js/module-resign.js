/* ============================================================
   module-resign.js — konfigurasi tab "Resign / Pecat".
   Kolom sama dengan Data Karyawan (Name s/d Notes) ditambah
   1 checkbox status di paling akhir, sesuai sheet yang dikirim.
   ============================================================ */

const RESIGN_FIELDS = [
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
  {key:'sudahDiproses', label:'Sudah Diproses', type:'checkbox'},
];

function initResignModule(){
  return new CrudModule({
    collectionName: 'resign',
    containerId: 'panel-resign',
    fields: RESIGN_FIELDS,
    searchPlaceholder: 'Cari nama staf…',
    rowClassFn(row){
      return row.sudahDiproses ? '' : 'row-flag';
    }
  });
}
