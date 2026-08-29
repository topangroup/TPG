/* ============================================================
   firebase-config.js

   GANTI nilai di bawah ini dengan config dari project Firebase
   Anda sendiri. Caranya (lihat README.md untuk detail lengkap):

   1. Buka https://console.firebase.google.com
   2. Buat project baru (gratis)
   3. Klik ikon "</>" (Web app) untuk daftar app web baru
   4. Copy object "firebaseConfig" yang muncul, tempel di bawah

   CATATAN KEAMANAN:
   apiKey di bawah ini AMAN untuk terlihat publik / ikut ke-push
   ke GitHub. Ini bukan password. Firebase memang didesain begitu.
   Keamanan data yang sesungguhnya diatur lewat:
     - Firebase Authentication (harus login untuk masuk web ini)
     - Firestore Security Rules (lihat firestore.rules)
   Selama dua hal itu dikonfigurasi dengan benar, orang luar yang
   melihat apiKey ini TETAP TIDAK BISA membaca/mengubah data.
   ============================================================ */

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI_SENDER_ID",
  appId: "GANTI_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Simpan data offline sementara di perangkat supaya tetap bisa
// dibuka walau internet putus sebentar, lalu otomatis sinkron lagi.
db.enablePersistence({synchronizeTabs:true}).catch(()=>{ /* browser lama, abaikan */ });
