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
  apiKey: "AIzaSyDhocmPu3sc-H7-0ymZ1b0pkI1ftuKrR8o",
  authDomain: "topan-group.firebaseapp.com",
  projectId: "topan-group",
  storageBucket: "topan-group.firebasestorage.app",
  messagingSenderId: "422072178316",
  appId: "1:422072178316:web:3b3f10f014a66735e3cda9",
  measurementId: "G-QREDDW781H"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Simpan data offline sementara di perangkat supaya tetap bisa
// dibuka walau internet putus sebentar, lalu otomatis sinkron lagi.
db.enablePersistence({synchronizeTabs:true}).catch(()=>{ /* browser lama, abaikan */ });
