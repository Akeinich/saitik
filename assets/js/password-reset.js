/* ── PARTICLES ── */
(function(){
  const cv=document.getElementById('particles'),cx=cv.getContext('2d');
  let W,H,ps=[];
  function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
  addEventListener('resize',resize);resize();
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

/* ── ALERTS ── */
function showAlert(msg, type) {
  const el = document.getElementById('alertBox');
  el.textContent = msg; el.className = 'alert ' + type;
}

/* ── ЖДЁМ FIREBASE ── */
function ready(cb, n=0) {
  if (window._fbResetPassword) { cb(); }
  else if (n < 60) { setTimeout(() => ready(cb, n+1), 100); }
  else { showAlert('⚠ Нет соединения с сервером. Обновите страницу.', 'error'); }
}

/* ── ОБРАБОТЧИК ФОРМЫ ── */
async function handleReset(e) {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value.trim();
  const btn   = document.getElementById('resetBtn');

  btn.disabled = true;
  btn.querySelector('.btn-text').innerHTML = '<span class="spinner"></span>Отправка...';

  ready(async () => {
    try {
      await window._fbResetPassword(email);

      // Показываем экран успеха
      document.getElementById('resetForm').style.display   = 'none';
      document.getElementById('successScreen').classList.add('visible');
      document.getElementById('successEmail').textContent  = email;

    } catch (err) {
      let msg = '⚠ Ошибка отправки.';
      switch (err.code) {
        case 'auth/user-not-found':
          // Намеренно не раскрываем — безопаснее показать тот же успех
          // чтобы нельзя было определить существование аккаунта по email
          document.getElementById('resetForm').style.display   = 'none';
          document.getElementById('successScreen').classList.add('visible');
          document.getElementById('successEmail').textContent  = email;
          return;
        case 'auth/invalid-email':
          msg = '⚠ Неверный формат email.'; break;
        case 'auth/too-many-requests':
          msg = '⚠ Слишком много запросов. Попробуйте позже.'; break;
        case 'auth/network-request-failed':
          msg = '⚠ Ошибка сети. Проверьте подключение.'; break;
      }
      showAlert(msg, 'error');
      btn.disabled = false;
      btn.querySelector('.btn-text').innerHTML = 'Отправить Письмо';
    }
  });
}
