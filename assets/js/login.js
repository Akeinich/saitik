/* ── PARTICLES ── */
    (function(){
      const cv=document.getElementById('particles'), cx=cv.getContext('2d');
      let W,H,ps=[];
      function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
      addEventListener('resize',resize); resize();
      function rand(a,b){return a+Math.random()*(b-a);}
      for(let i=0;i<70;i++) ps.push({x:rand(0,W),y:rand(0,H),vx:rand(-.3,.3),vy:rand(-1,-.1),sz:rand(1,3),al:rand(.1,.6),col:Math.random()>.7?`rgba(${~~rand(180,255)},${~~rand(0,30)},${~~rand(0,30)},`:`rgba(${~~rand(160,210)},${~~rand(60,100)},${~~rand(0,20)},`});
      function draw(){
        cx.clearRect(0,0,W,H);
        ps.forEach(p=>{
          p.x+=p.vx;p.y+=p.vy;p.al-=.001;
          if(p.y<-10||p.al<=0){p.x=rand(0,W);p.y=H+5;p.al=rand(.2,.7);}
          cx.beginPath();cx.arc(p.x,p.y,p.sz,0,Math.PI*2);cx.fillStyle=p.col+p.al+')';cx.fill();
          cx.beginPath();cx.arc(p.x,p.y,p.sz*2.5,0,Math.PI*2);
          const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz*2.5);
          g.addColorStop(0,p.col+(p.al*.4)+')');g.addColorStop(1,'transparent');
          cx.fillStyle=g;cx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    })();

    /* ── TABS ── */
    function switchTab(tab) {
      const l = tab==='login';
      document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',l?i===0:i===1));
      document.getElementById('loginPanel').classList.toggle('active', l);
      document.getElementById('registerPanel').classList.toggle('active', !l);
      hideAlert();
    }

    /* ── ALERTS ── */
    function showAlert(msg, type) {
      const el = document.getElementById('alertBox');
      el.textContent = msg; el.className = 'alert ' + type;
    }
    function hideAlert() { document.getElementById('alertBox').className = 'alert'; }

    /* ── КНОПКА ── */
    function setBtnLoading(btn, text) {
      btn.disabled = true;
      btn.querySelector('.btn-text').innerHTML = `<span class="spinner"></span>${text}`;
    }
    function setBtnSuccess(btn, text) {
      btn.style.background = 'linear-gradient(135deg,#1a4a1a,#2d8b2d,#1a4a1a)';
      btn.style.boxShadow  = '0 0 30px #00ff0044';
      btn.querySelector('.btn-text').textContent = text;
    }
    function resetBtn(btn, text) {
      btn.disabled = false; btn.style.background = ''; btn.style.boxShadow = '';
      btn.querySelector('.btn-text').innerHTML = text;
      btn.querySelector('.btn-text').setAttribute('data-text', text);
    }

    /* ── ЖДЁМ ИНИЦИАЛИЗАЦИИ FIREBASE (module загружается асинхронно) ── */
    function ready(cb, n = 0) {
      if (window._firebase) { cb(); }
      else if (n < 60) { setTimeout(() => ready(cb, n+1), 100); }
      else { showAlert('⚠ Нет соединения с сервером. Обновите страницу.', 'error'); }
    }

    /* ── LOGIN ── */
    async function handleLogin(e) {
      e.preventDefault(); hideAlert();
      ready(async () => {
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe').checked;
        const btn      = document.getElementById('loginBtn');
        setBtnLoading(btn, 'Проверка...');
        try {
          const { user } = await window._firebase.signIn(email, password);

          // displayName может быть null если аккаунт создавали не через этот сайт
          const username = user.displayName || email.split('@')[0];

          /* ═══ ИСПРАВЛЕНИЕ БАГ 1 ═══
             Добавлен 'username' — все остальные страницы читают именно его */
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userId',    user.uid);
          sessionStorage.setItem('userEmail', user.email);
          sessionStorage.setItem('username',  username);   // ← ДОБАВЛЕНО

          if (remember) localStorage.setItem('school_remembered', email);

          // Обновляем lastLogin (не критично, ошибку глушим)
          window._firebase.dbUpdate('users/' + user.uid, { lastLogin: Date.now() }).catch(()=>{});

          setBtnSuccess(btn, 'Добро пожаловать!');
          /* ═══ ИСПРАВЛЕНИЕ БАГ 3 ═══ */
          setTimeout(() => { window.location.href = 'RASP.HTML'; }, 800); // ← ЗАГЛАВНЫЕ

        } catch (err) {
          let msg = '⚠ Ошибка входа.';
          switch (err.code) {
            case 'auth/invalid-credential':   // Firebase 10+ объединяет not-found + wrong-password
            case 'auth/user-not-found':        msg = '⚠ Неверный email или пароль.'; break;
            case 'auth/wrong-password':        msg = '⚠ Неверный пароль.'; break;
            case 'auth/invalid-email':         msg = '⚠ Неверный формат email.'; break;
            case 'auth/user-disabled':         msg = '⚠ Аккаунт заблокирован.'; break;
            case 'auth/too-many-requests':     msg = '⚠ Слишком много попыток. Попробуйте позже.'; break;
            case 'auth/network-request-failed':msg = '⚠ Ошибка сети. Проверьте подключение.'; break;
          }
          showAlert(msg, 'error');
          resetBtn(btn, 'Войти в Систему');
        }
      });
    }

    /* ── REGISTER ── */
    async function handleRegister(e) {
      e.preventDefault(); hideAlert();
      ready(async () => {
        const username = document.getElementById('regUsername').value.trim();
        const email    = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm  = document.getElementById('regConfirm').value;
        const btn      = document.getElementById('regBtn');

        if (username.length < 2) { showAlert('⚠ Имя — минимум 2 символа.', 'error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAlert('⚠ Введите корректный e-mail.', 'error'); return; }
        if (password.length < 6) { showAlert('⚠ Пароль — минимум 6 символов.', 'error'); return; }
        if (password !== confirm) { showAlert('⚠ Пароли не совпадают.', 'error'); return; }

        setBtnLoading(btn, 'Создание аккаунта...');
        try {
          const { user } = await window._firebase.createUser(email, password);
          await window._firebase.updateProfile(user, { displayName: username });

          /* ═══ ИСПРАВЛЕНИЕ БАГ 2 ═══
             Добавлен role: 'student' — без него admin-панель и чат не видят роль
             Путь users/{uid} — правильный для Firebase Auth */
          await window._firebase.dbSet('users/' + user.uid, {
            username:  username,
            email:     email,
            role:      'student',   // ← ДОБАВЛЕНО
            createdAt: Date.now(),
            lastLogin: Date.now()
          });

          /* ═══ ИСПРАВЛЕНИЕ БАГ 1 ═══ */
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userId',    user.uid);
          sessionStorage.setItem('userEmail', user.email);
          sessionStorage.setItem('username',  username);  // ← ДОБАВЛЕНО

          setBtnSuccess(btn, 'Аккаунт создан!');
          /* ═══ ИСПРАВЛЕНИЕ БАГ 3 ═══ */
          setTimeout(() => { window.location.href = 'RASP.HTML'; }, 800); // ← ЗАГЛАВНЫЕ

        } catch (err) {
          let msg = '⚠ Ошибка регистрации.';
          switch (err.code) {
            case 'auth/email-already-in-use': msg = '⚠ Этот email уже зарегистрирован.'; break;
            case 'auth/invalid-email':        msg = '⚠ Неверный формат email.'; break;
            case 'auth/weak-password':        msg = '⚠ Пароль слишком слабый (минимум 6 символов).'; break;
            case 'auth/network-request-failed': msg = '⚠ Ошибка сети. Проверьте подключение.'; break;
          }
          showAlert(msg, 'error');
          resetBtn(btn, 'Записаться');
        }
      });
    }

    /* ── AUTO-FILL ── */
    (function(){
      const saved = localStorage.getItem('school_remembered');
      if (saved) { document.getElementById('loginEmail').value = saved; document.getElementById('rememberMe').checked = true; }
    })();
