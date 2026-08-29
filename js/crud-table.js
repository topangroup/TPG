/* ============================================================
   crud-table.js — mesin generik untuk satu tab data (tabel +
   form tambah/edit/hapus + sinkron real-time ke Firestore).

   Semua 4 tab (Data Karyawan, Daftar Cuti, Claim Tiket/Cuti
   Lokal, Resign/Pecat) memakai class yang SAMA ini, cukup beda
   konfigurasi field. Kalau mau ubah perilaku tabel (misalnya
   cara search, cara sort), cukup ubah SATU tempat ini — otomatis
   berlaku ke semua tab. Ini yang bikin website gampang dirawat.
   ============================================================ */

class CrudModule{
  /**
   * @param {Object} cfg
   * cfg.collectionName  : nama koleksi Firestore
   * cfg.containerId     : id elemen div tempat tab ini dirender
   * cfg.fields          : [{key,label,type,options?,searchable?,filterable?}]
   *                        type: 'text' | 'date' | 'number' | 'select' | 'checkbox' | 'textarea'
   * cfg.title           : judul kosong-state
   * cfg.rowClassFn(row) : opsional, kembalikan 'row-flag' / 'row-warn' / ''
   * cfg.extraColumns    : opsional, [{label, render(row)}] kolom tambahan read-only (mis. badge H-hari)
   * cfg.searchPlaceholder
   */
  constructor(cfg){
    this.cfg = cfg;
    this.items = [];
    this.sortKey = null;
    this.sortDir = 1;
    this.editingId = null;
    this.el = document.getElementById(cfg.containerId);
    this.buildShell();
    this.attachEvents();
    this.subscribe();
  }

  // ---------- Firestore ----------
  subscribe(){
    const statusEl = this.el.querySelector('.sync-note');
    db.collection(this.cfg.collectionName).onSnapshot(snap=>{
      this.items = snap.docs.map(d=>({id:d.id, ...d.data()}));
      statusEl.classList.remove('offline');
      statusEl.innerHTML = '<span class="sync-dot"></span> Tersambung — data sinkron otomatis untuk semua pengguna';
      this.renderAll();
    }, err=>{
      console.error(err);
      statusEl.classList.add('offline');
      statusEl.innerHTML = '<span class="sync-dot"></span> Gagal tersambung ke server (cek koneksi internet / hak akses)';
    });
  }
  addDoc(data){ return db.collection(this.cfg.collectionName).add(data); }
  updateDoc(id, data){ return db.collection(this.cfg.collectionName).doc(id).update(data); }
  deleteDoc(id){ return db.collection(this.cfg.collectionName).doc(id).delete(); }

  // ---------- Shell (toolbar + table container + modal) ----------
  buildShell(){
    const cfg = this.cfg;
    const filterFields = cfg.fields.filter(f=>f.filterable);
    this.el.innerHTML = `
      <div class="sync-note"><span class="sync-dot"></span> Menghubungkan…</div>
      <div class="toolbar">
        <div class="toolbar-filters">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5b6478" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="js-search" type="text" placeholder="${cfg.searchPlaceholder||'Cari…'}">
          </div>
          ${filterFields.map(f=>`<select class="js-filter" data-key="${f.key}"><option value="">Semua ${f.label}</option></select>`).join('')}
        </div>
        <div class="toolbar-actions">
          <button class="btn ghost js-export-csv">Ekspor CSV</button>
          <button class="btn ghost js-import">Impor dari Excel</button>
          <button class="btn primary js-add">+ Tambah</button>
        </div>
      </div>
      <div class="table-wrap js-table-wrap"></div>

      <div class="overlay js-overlay">
        <div class="modal">
          <div class="modal-head">
            <h3 class="js-modal-title">Tambah</h3>
            <button class="close-x js-close">&times;</button>
          </div>
          <div class="modal-body js-modal-body"></div>
          <div class="modal-foot">
            <button class="btn ghost js-close">Batal</button>
            <button class="btn primary js-save">Simpan</button>
          </div>
        </div>
      </div>

      <div class="overlay js-import-overlay">
        <div class="modal" style="max-width:720px;">
          <div class="modal-head">
            <h3>Impor dari Excel</h3>
            <button class="close-x js-close-import">&times;</button>
          </div>
          <div class="import-body">
            <div class="hint">
              Di Excel/Google Sheets, blok kolom sesuai urutan berikut lalu <b>Copy</b> (Ctrl+C), kemudian <b>paste</b> di kotak bawah ini:<br>
              <code>${cfg.fields.map(f=>f.label).join(', ')}</code><br>
              Format tanggal: <code>18 November 2026</code>. Baris judul (header) akan otomatis dilewati.
            </div>
            <textarea class="js-import-area" placeholder="Tempel data di sini…"></textarea>
            <div class="hint js-import-preview"></div>
          </div>
          <div class="modal-foot">
            <button class="btn ghost js-close-import">Batal</button>
            <button class="btn ghost js-import-append">Tambahkan ke data yang ada</button>
            <button class="btn primary js-import-replace">Ganti semua data</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(){
    const root = this.el;
    root.querySelector('.js-add').addEventListener('click', ()=>this.openAdd());
    root.querySelector('.js-save').addEventListener('click', ()=>this.saveModal());
    root.querySelectorAll('.js-close').forEach(b=>b.addEventListener('click', ()=>this.closeModal()));
    root.querySelector('.js-overlay').addEventListener('click', (e)=>{ if(e.target===e.currentTarget) this.closeModal(); });
    root.querySelector('.js-search').addEventListener('input', ()=>this.renderTable());
    root.querySelector('.js-export-csv').addEventListener('click', ()=>{
      exportCsvGeneric(this.cfg.fields, this.getFilteredRows(), this.cfg.collectionName+'.csv');
    });
    root.querySelector('.js-import').addEventListener('click', ()=>{
      root.querySelector('.js-import-overlay').classList.add('open');
    });
    root.querySelector('.js-import-overlay').addEventListener('click', (e)=>{ if(e.target===e.currentTarget) this.closeImportModal(); });
    root.querySelectorAll('.js-close-import').forEach(b=>b.addEventListener('click', ()=>this.closeImportModal()));
    root.querySelector('.js-import-area').addEventListener('input', (e)=>{
      const rows = this.parseImportText(e.target.value);
      root.querySelector('.js-import-preview').textContent = rows.length ? `${rows.length} baris terdeteksi siap diimpor.` : '';
    });
    root.querySelector('.js-import-append').addEventListener('click', ()=>this.doImport('append'));
    root.querySelector('.js-import-replace').addEventListener('click', ()=>this.doImport('replace'));
    root.addEventListener('change', (e)=>{
      if(e.target.classList.contains('js-filter')) this.renderTable();
    });
  }

  // ---------- Filters populate ----------
  populateFilters(){
    this.cfg.fields.filter(f=>f.filterable).forEach(f=>{
      const sel = this.el.querySelector(`.js-filter[data-key="${f.key}"]`);
      const current = sel.value;
      const values = f.options ? f.options : [...new Set(this.items.map(i=>i[f.key]).filter(Boolean))].sort();
      sel.innerHTML = `<option value="">Semua ${f.label}</option>` + values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current;
    });
  }

  // ---------- Filtering / sorting ----------
  getFilteredRows(){
    const root = this.el;
    const q = root.querySelector('.js-search').value.trim().toLowerCase();
    let rows = [...this.items];

    const searchableKeys = this.cfg.fields.filter(f=>f.searchable).map(f=>f.key);
    if(q && searchableKeys.length){
      rows = rows.filter(r => searchableKeys.some(k => (r[k]||'').toString().toLowerCase().includes(q)));
    }
    root.querySelectorAll('.js-filter').forEach(sel=>{
      const key = sel.dataset.key;
      if(sel.value) rows = rows.filter(r => (r[key]||'') === sel.value);
    });

    if(this.sortKey){
      rows.sort((a,b)=>{
        let av=(a[this.sortKey]??'').toString().toLowerCase();
        let bv=(b[this.sortKey]??'').toString().toLowerCase();
        if(av<bv) return -1*this.sortDir;
        if(av>bv) return 1*this.sortDir;
        return 0;
      });
    }
    return rows;
  }

  renderAll(){
    this.populateFilters();
    this.renderTable();
  }

  // ---------- Table render ----------
  renderTable(){
    const wrap = this.el.querySelector('.js-table-wrap');
    const rows = this.getFilteredRows();

    if(this.items.length===0){
      wrap.innerHTML = `<div class="empty-state"><h2>Belum ada data</h2><p>Klik <b>+ Tambah</b> untuk mengisi data pertama.</p></div>`;
      return;
    }
    if(rows.length===0){
      wrap.innerHTML = `<div class="empty-state"><h2>Tidak ditemukan</h2><p>Tidak ada data yang cocok dengan pencarian/filter.</p></div>`;
      return;
    }

    const headerCell = (key,label)=>{
      const arrow = this.sortKey===key ? (this.sortDir===1?'▲':'▼') : '';
      return `<th data-sort="${key}">${label}<span class="arrow">${arrow}</span></th>`;
    };

    let html = `<table><thead><tr>`;
    this.cfg.fields.forEach(f=>{
      if(f.hideInTable) return;
      html += headerCell(f.key, f.label);
    });
    (this.cfg.extraColumns||[]).forEach(c=> html += `<th>${c.label}</th>`);
    html += `<th></th></tr></thead><tbody>`;

    rows.forEach(row=>{
      const rowClass = this.cfg.rowClassFn ? (this.cfg.rowClassFn(row)||'') : '';
      html += `<tr class="${rowClass}" data-id="${row.id}">`;
      this.cfg.fields.forEach(f=>{
        if(f.hideInTable) return;
        html += this.renderCell(f, row);
      });
      (this.cfg.extraColumns||[]).forEach(c=>{
        html += `<td>${c.render(row)}</td>`;
      });
      html += `<td class="actions-cell">
          <button class="icon-btn edit" title="Edit">✎</button>
          <button class="icon-btn del" title="Hapus">🗑</button>
        </td></tr>`;
    });
    html += `</tbody></table>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('th[data-sort]').forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.dataset.sort;
        if(this.sortKey===key) this.sortDir*=-1; else { this.sortKey=key; this.sortDir=1; }
        this.renderTable();
      });
    });
    wrap.querySelectorAll('tbody tr').forEach(tr=>{
      const id = tr.dataset.id;
      tr.querySelector('.edit').addEventListener('click', ()=>this.openEdit(id));
      tr.querySelector('.del').addEventListener('click', ()=>this.deleteRow(id));
      tr.querySelectorAll('.chk-cell').forEach(cell=>{
        cell.addEventListener('click', ()=>{
          const key = cell.dataset.key;
          const row = this.items.find(x=>x.id===id);
          this.updateDoc(id, {[key]: !row[key]});
        });
      });
    });
  }

  renderCell(f, row){
    const v = row[f.key];
    if(f.type==='checkbox'){
      const on = !!v;
      return `<td class="chk-cell ${on?'on':'off'}" data-key="${f.key}" title="Klik untuk ubah">${on?'✔':'—'}</td>`;
    }
    if(f.type==='select' && f.pillClass){
      return `<td>${v ? `<span class="${f.pillClass(v)}">${esc(v)}</span>` : ''}</td>`;
    }
    if(f.key==='notes'){
      return `<td class="notes-cell">${esc(v)}</td>`;
    }
    if(f.key===this.cfg.fields[0].key){
      return `<td class="name-cell">${esc(v)}</td>`;
    }
    return `<td class="${f.mono?'mono':''}">${esc(v)}</td>`;
  }

  // ---------- Modal (add/edit) ----------
  openAdd(){
    this.editingId = null;
    this.el.querySelector('.js-modal-title').textContent = 'Tambah Data';
    this.buildModalBody({});
    this.el.querySelector('.js-overlay').classList.add('open');
  }
  openEdit(id){
    this.editingId = id;
    const row = this.items.find(x=>x.id===id);
    this.el.querySelector('.js-modal-title').textContent = 'Edit — ' + (row[this.cfg.fields[0].key]||'');
    this.buildModalBody(row);
    this.el.querySelector('.js-overlay').classList.add('open');
  }
  buildModalBody(row){
    const body = this.el.querySelector('.js-modal-body');
    body.innerHTML = this.cfg.fields.map(f=>{
      const val = row[f.key] ?? '';
      if(f.type==='textarea'){
        return `<div class="field full"><label>${f.label}</label><textarea data-field="${f.key}">${esc(val)}</textarea></div>`;
      }
      if(f.type==='select'){
        const opts = ['', ...(f.options||[])].map(o=>`<option value="${esc(o)}" ${val===o?'selected':''}>${o||'— Pilih —'}</option>`).join('');
        return `<div class="field"><label>${f.label}</label><select data-field="${f.key}">${opts}</select></div>`;
      }
      if(f.type==='checkbox'){
        return `<div class="field checkbox-field"><input type="checkbox" data-field="${f.key}" data-type="checkbox" ${val?'checked':''}><label style="margin:0;">${f.label}</label></div>`;
      }
      if(f.type==='number'){
        return `<div class="field"><label>${f.label}</label><input data-field="${f.key}" type="number" value="${esc(val)}"></div>`;
      }
      const placeholder = f.type==='date' ? 'cth: 18 November 2026' : '';
      return `<div class="field"><label>${f.label}</label><input data-field="${f.key}" type="text" placeholder="${placeholder}" value="${esc(val)}"></div>`;
    }).join('');
  }
  closeModal(){
    this.el.querySelector('.js-overlay').classList.remove('open');
  }
  saveModal(){
    const inputs = this.el.querySelectorAll('.js-modal-body [data-field]');
    const data = {};
    inputs.forEach(inp=>{
      if(inp.dataset.type==='checkbox'){ data[inp.dataset.field] = inp.checked; }
      else { data[inp.dataset.field] = inp.value.trim(); }
    });
    const primaryKey = this.cfg.fields[0].key;
    if(!data[primaryKey]){ alert(`${this.cfg.fields[0].label} wajib diisi.`); return; }

    const action = this.editingId ? this.updateDoc(this.editingId, data) : this.addDoc(data);
    action.then(()=>{
      this.closeModal();
    }).catch(err=>{
      alert('Gagal menyimpan: ' + err.message);
    });
  }
  deleteRow(id){
    const row = this.items.find(x=>x.id===id);
    const label = row[this.cfg.fields[0].key] || '';
    if(!confirm(`Hapus data "${label}"?`)) return;
    this.deleteDoc(id).catch(err=> alert('Gagal menghapus: '+err.message));
  }

  // ---------- Impor dari Excel (paste tab-separated) ----------
  closeImportModal(){
    this.el.querySelector('.js-import-overlay').classList.remove('open');
  }
  parseImportText(text){
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
    const rows = [];
    const firstLabel = (this.cfg.fields[0].label||'').toUpperCase();
    lines.forEach(line=>{
      const cells = line.split('\t');
      const firstCell = (cells[0]||'').trim().toUpperCase();
      // lewati baris judul/header
      if(firstCell===firstLabel || firstCell==='NAMA' || firstCell==='NAME') return;
      const rec = {};
      this.cfg.fields.forEach((f,i)=>{
        const raw = (cells[i]||'').trim();
        if(f.type==='checkbox'){
          rec[f.key] = ['TRUE','1','YES','YA','V','✓','✔'].includes(raw.toUpperCase());
        } else {
          rec[f.key] = raw;
        }
      });
      if(rec[this.cfg.fields[0].key]) rows.push(rec);
    });
    return rows;
  }
  doImport(mode){
    const text = this.el.querySelector('.js-import-area').value;
    const rows = this.parseImportText(text);
    if(rows.length===0){ alert('Tidak ada baris valid untuk diimpor. Pastikan sudah di-paste dan urutan kolom sesuai petunjuk.'); return; }
    const msg = mode==='replace'
      ? `Ganti SEMUA data yang ada sekarang dengan ${rows.length} baris baru? Data lama di tab ini akan dihapus permanen.`
      : `Tambahkan ${rows.length} baris baru ke data yang sudah ada?`;
    if(!confirm(msg)) return;

    const colRef = db.collection(this.cfg.collectionName);
    const commitInChunks = async (items, action)=>{
      let batch = db.batch(), count = 0;
      for(const item of items){
        action(batch, item);
        count++;
        if(count===450){ await batch.commit(); batch = db.batch(); count = 0; }
      }
      if(count>0) await batch.commit();
    };

    (async ()=>{
      if(mode==='replace'){
        const snap = await colRef.get();
        await commitInChunks(snap.docs, (batch, doc)=> batch.delete(doc.ref));
      }
      await commitInChunks(rows, (batch, rec)=> batch.set(colRef.doc(), rec));
    })().then(()=>{
      this.closeImportModal();
      this.el.querySelector('.js-import-area').value='';
      this.el.querySelector('.js-import-preview').textContent='';
    }).catch(err=>{
      alert('Gagal mengimpor: ' + err.message);
    });
  }
}
