/* ============================================================
   AP MOTORS — Configuración de Firebase
   Se carga después de los SDK de Firebase (compat).
   Expone window.FB = { firebase, auth, db, storage }
   ============================================================ */

'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyDVIY25MKFWVWyqmJYSfyovC2_V2UK4JKs",
  authDomain: "apmotors-6bece.firebaseapp.com",
  projectId: "apmotors-6bece",
  storageBucket: "apmotors-6bece.firebasestorage.app",
  messagingSenderId: "445404034411",
  appId: "1:445404034411:web:c21de0b5f85ea0c3f7c82e"
};

let app, auth, db, storage;

try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
} catch (e) {
  console.error('Firebase no pudo inicializarse:', e);
}

window.FB = { firebase, app, auth, db, storage };
