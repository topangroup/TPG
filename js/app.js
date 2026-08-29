/* ============================================================
   app.js — inisialisasi semua tab & logika ganti-tab.
   Kalau nanti mau tambah tab baru: buat file js/module-xxx.js
   baru (contek pola module-cuti.js), tambah tombol+panel di
   index.html, lalu daftarkan di initModules() bawah ini.
   ============================================================ */

function initModules(){
  initKaryawanModule();
  initCutiModule();
  initClaimModule();
  initResignModule();
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });
});
