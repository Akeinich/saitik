import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
    import { 
      getAuth, 
      createUserWithEmailAndPassword, 
      signInWithEmailAndPassword,
      updateProfile,
      onAuthStateChanged
    } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
    import { 
      getDatabase, 
      ref, 
      set,
      update
    } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

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
    const db   = getDatabase(app);

    // Экспортируем функции в window — к ним обращается обычный скрипт ниже
    window._firebase = {
      signIn:         (e, p) => signInWithEmailAndPassword(auth, e, p),
      createUser:     (e, p) => createUserWithEmailAndPassword(auth, e, p),
      updateProfile:  (u, d) => updateProfile(u, d),
      dbSet:          (path, data) => set(ref(db, path), data),
      dbUpdate:       (path, data) => update(ref(db, path), data),
    };

    // Если пользователь уже авторизован — можно добавить авто-редирект
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // window.location.href = 'RASP.HTML'; // раскомментируй по желанию
      }
    });
