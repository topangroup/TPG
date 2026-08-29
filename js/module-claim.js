/* ============================================================
   module-claim.js — konfigurasi tab "Claim Tiket / Cuti Lokal".
   Kolom mengikuti persis sheet "CLAIM TKT/CUTI LOKAL" yang
   dikirim: Name, Join Date, Department, Tanggal Cuti/Resign,
   Tanggal Balik, Lama Cuti (D), Cuti Ke, Cuti Lokal/Tidak,
   Tanggal Pengambilan Uang Tiket, Claim Ke, Tiket Pulang,
   Tiket ke PNH, Claim Uang Tiket, Notes.
   ============================================================ */

const CLAIM_FIELDS = [
  {key:'name', label:'Name', type:'text', searchable:true},
  {key:'joinDate', label:'Join Date', type:'date', mono:true},
  {key:'department', label:'Department', type:'text', filterable:true},
  {key:'tanggalCuti', label:'Tanggal Cuti / Resign', type:'date', mono:true},
  {key:'tanggalBalik', label:'Tanggal Balik', type:'date', mono:true},
  {key:'lamaCuti', label:'Lama Cuti (D)', type:'number'},
  {key:'cutiKe', label:'Cuti Ke', type:'number'},
  {key:'cutiLokasi', label:'Cuti Lokal / Tidak', type:'select', options:['LOKAL','CLAIM'], filterable:true},
  {key:'tanggalAmbilTiket', label:'Tgl Pengambilan Uang Tiket', type:'date', mono:true},
  {key:'claimKe', label:'Claim Ke', type:'number'},
  {key:'tiketPulang', label:'Tiket Pulang', type:'checkbox'},
  {key:'tiketKePnh', label:'Tiket ke PNH', type:'checkbox'},
  {key:'claimUangTiket', label:'Claim Uang Tiket', type:'checkbox'},
  {key:'notes', label:'Notes', type:'textarea'},
];

function initClaimModule(){
  return new CrudModule({
    collectionName: 'claims',
    containerId: 'panel-claim',
    fields: CLAIM_FIELDS,
    searchPlaceholder: 'Cari nama staf…',
    rowClassFn(row){
      return row.claimUangTiket ? '' : 'row-warn';
    }
  });
}
