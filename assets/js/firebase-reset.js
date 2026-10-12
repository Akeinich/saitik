import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
  import { getAuth, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

  const firebaseConfig = {
    apiKey: "AIzaSyA_rAWj8YakdcZ-WBvQAGNVD1jTGvUFUaQ",
    authDomain: "sait-8a1d6.firebaseapp.com",
    databaseURL: "https://sait-8a1d6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sait-8a1d6",
    storageBucket: "sait-8a1d6.firebasestorage.app",
    messagingSenderId: "471741162305",
    appId: "1:471741162305:web:e0597664c362b91fc8b7c0"
  };

  const app  = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Единственная нужная функция — отправить письмо сброса пароля
  window._fbResetPassword = (email) => sendPasswordResetEmail(auth, email);
