/* ============================================================
   auth.js — sistem login & daftar sendiri.

   Cara kerja:
   - Orang DAFTAR pakai: Username, Password, Gmail.
     Di balik layar, Firebase tetap butuh email untuk akun,
     jadi Gmail itu yang dipakai sebagai email akun Firebase.
     Username disimpan di koleksi Firestore "usernames" supaya
     nanti bisa dicari emailnya saat login pakai username.
   - Orang MASUK bisa pilih:
       a) Username + Password (cara biasa)
       b) Username saja -> dikirim "Link Masuk" ke Gmail yang
          didaftarkan untuk username itu -> klik link di Gmail
          untuk langsung masuk tanpa password (mirip OTP, tapi
          bentuknya link, bukan kode angka — ini opsi gratis
          tanpa perlu upgrade Firebase).
   ============================================================ */

const USERNAME_COLLECTION = 'usernames';
const usernameDocId = (u) => (u||'').trim().toLowerCase().replace(/\s+/g,'');

const loginScreen = document.getElementById('loginScreen');
const appRoot = document.getElementById('app');
const loginErr = document.getElementById('loginErr');
const registerErr = document.getElementById('registerErr');
const linkSentNote = document.getElementById('linkSentNote');
const userChipEmail = document.getElementById('userChipEmail');

// ---------- Tab: Masuk / Daftar ----------
document.querySelectorAll('.auth-tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.auth-tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.authtab === 'login' ? 'authPanelLogin' : 'authPanelRegister';
    document.getElementById(panel).classList.add('active');
  });
});

// ---------- Tab: Pakai Password / Pakai Link Email ----------
document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.login-mode-form').forEach(f=>f.classList.remove('active'));
    btn.classList.add('active');
    const form = btn.dataset.mode === 'password' ? 'loginPasswordForm' : 'loginLinkForm';
    document.getElementById(form).classList.add('active');
  });
});

// ---------- Daftar ----------
document.getElementById('registerForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  registerErr.textContent = '';
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const email = document.getElementById('regEmail').value.trim();
  const docId = usernameDocId(username);
  if(!docId){ registerErr.textContent = 'Username wajib diisi.'; return; }

  db.collection(USERNAME_COLLECTION).doc(docId).get().then(snap=>{
    if(snap.exists){ throw new Error('USERNAME_TAKEN'); }
    return auth.createUserWithEmailAndPassword(email, password);
  }).then(cred=>{
    return db.collection(USERNAME_COLLECTION).doc(docId).set({
      username: username, email: email, uid: cred.user.uid
    });
  }).catch(err=>{
    if(err.message === 'USERNAME_TAKEN'){
      registerErr.textContent = 'Username sudah dipakai, coba yang lain.';
    } else if(err.code === 'auth/email-already-in-use'){
      registerErr.textContent = 'Gmail ini sudah terdaftar dengan username lain.';
    } else if(err.code === 'auth/weak-password'){
      registerErr.textContent = 'Password minimal 6 karakter.';
    } else {
      registerErr.textContent = 'Daftar gagal: ' + (err.message||'');
    }
    console.error(err);
  });
});

// ---------- Masuk pakai Username + Password ----------
document.getElementById('loginPasswordForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  loginErr.textContent = '';
  const username = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const docId = usernameDocId(username);

  db.collection(USERNAME_COLLECTION).doc(docId).get().then(snap=>{
    if(!snap.exists){ throw new Error('USER_NOT_FOUND'); }
    const email = snap.data().email;
    return auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(()=> auth.signInWithEmailAndPassword(email, pass));
  }).catch(err=>{
    if(err.message === 'USER_NOT_FOUND'){
      loginErr.textContent = 'Username tidak ditemukan.';
    } else {
      loginErr.textContent = 'Login gagal: username atau password salah.';
    }
    console.error(err);
  });
});

// ---------- Masuk pakai Link Email (magic link ke Gmail) ----------
const actionCodeSettings = {
  url: window.location.href.split('?')[0].split('#')[0],
  handleCodeInApp: true,
};

document.getElementById('loginLinkForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  loginErr.textContent = '';
  linkSentNote.textContent = '';
  const username = document.getElementById('loginLinkUsername').value.trim();
  const docId = usernameDocId(username);

  db.collection(USERNAME_COLLECTION).doc(docId).get().then(snap=>{
    if(!snap.exists){ throw new Error('USER_NOT_FOUND'); }
    const email = snap.data().email;
    return auth.sendSignInLinkToEmail(email, actionCodeSettings).then(()=>{
      window.localStorage.setItem('emailForSignIn', email);
      linkSentNote.textContent = `Link masuk sudah dikirim ke ${email}. Buka Gmail, klik link-nya untuk masuk.`;
    });
  }).catch(err=>{
    if(err.message === 'USER_NOT_FOUND'){
      loginErr.textContent = 'Username tidak ditemukan.';
    } else {
      loginErr.textContent = 'Gagal mengirim link: ' + (err.message||'');
    }
    console.error(err);
  });
});

// ---------- Selesaikan proses masuk kalau halaman ini dibuka dari link di Gmail ----------
if(auth.isSignInWithEmailLink(window.location.href)){
  let email = window.localStorage.getItem('emailForSignIn');
  if(!email){
    email = window.prompt('Masukkan Gmail yang Anda daftarkan, untuk konfirmasi:');
  }
  auth.signInWithEmailLink(email, window.location.href).then(()=>{
    window.localStorage.removeItem('emailForSignIn');
    window.history.replaceState({}, document.title, window.location.pathname);
  }).catch(err=>{
    alert('Link masuk tidak valid atau sudah kedaluwarsa, silakan minta link baru.');
    console.error(err);
  });
}

// ---------- Keluar ----------
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  auth.signOut();
});

// ---------- Gerbang utama ----------
auth.onAuthStateChanged(user=>{
  if(user){
    loginScreen.style.display = 'none';
    appRoot.classList.add('open');
    userChipEmail.textContent = user.email;
    if(typeof initModules === 'function' && !window.__modulesInited){
      window.__modulesInited = true;
      initModules();
    }
  } else {
    loginScreen.style.display = 'flex';
    appRoot.classList.remove('open');
  }
});
