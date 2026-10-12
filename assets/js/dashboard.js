/* ═══ AUTH GUARD ═══ */
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}
const _username = sessionStorage.getItem('username') || 'Гость';
document.getElementById('usernameDisplay').textContent = _username;
document.getElementById('profileName').textContent     = _username;

function logout() {
  if (confirm('Вы уверены, что хотите выйти?')) {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    window.location.href = 'index.html';
  }
}

/* ═══ THEME ═══ */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('school_theme', t);
  document.getElementById('themeBtn').textContent = t === 'light' ? '☀' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function(){ const s = localStorage.getItem('school_theme'); if (s) applyTheme(s); else applyTheme('dark'); })();

/* ═══ LIVE CLOCK ═══ */
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('navClock').textContent =
    pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}
updateClock();
setInterval(updateClock, 1000);

/* ═══ CURRENT DAY ═══ */
(function(){
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const now  = new Date();
  document.getElementById('heroDay').textContent = '📖 ' + days[now.getDay()];
})();

/* ═══ SCHOOL YEAR PROGRESS ═══ */
(function(){
  const start = new Date('2025-09-01');
  const end   = new Date('2026-05-31');
  const now   = new Date();
  const pct   = Math.min(100, Math.max(0,
    Math.round(((now - start) / (end - start)) * 100)
  ));
  document.getElementById('yearPct').textContent     = pct + '%';
  document.getElementById('yearBarPct').textContent  = pct + '%';
  // animate after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.getElementById('navProgressFill').style.width  = pct + '%';
      document.getElementById('yearBarFill').style.width      = pct + '%';
    }, 200);
  });
})();

/* ═══ FILTER ═══ */
const GRADE_RANGES = { all:[5,6,7,8,9,10,11], '5-7':[5,6,7], '8-9':[8,9], '10-11':[10,11] };
function filterClasses(range, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const allowed = GRADE_RANGES[range] || GRADE_RANGES.all;
  let count = 0;
  document.querySelectorAll('.class-card').forEach(card => {
    const g = parseInt(card.dataset.grade);
    const hide = !allowed.includes(g);
    card.classList.toggle('hidden', hide);
    if (!hide) count++;
  });
  updateCount();
}

/* ═══ SEARCH ═══ */
let searchOpen = false;
function toggleSearch() {
  searchOpen = !searchOpen;
  const ns = document.getElementById('navSearch');
  ns.classList.toggle('open', searchOpen);
  if (searchOpen) { setTimeout(() => document.getElementById('searchInput').focus(), 200); }
  else { document.getElementById('searchInput').value = ''; searchCards(''); }
}
function searchCards(q) {
  const val = q.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll('.class-card').forEach(card => {
    if (card.classList.contains('hidden')) return;
    const grade = card.dataset.grade;
    const hide  = val && !grade.startsWith(val);
    card.classList.toggle('search-hide', hide);
    if (!hide) count++;
  });
  updateCount();
}
function updateCount() {
  const vis = document.querySelectorAll('.class-card:not(.hidden):not(.search-hide)').length;
  document.getElementById('cardCount').textContent = vis + ' ' + (vis === 1 ? 'класс' : vis < 5 ? 'класса' : 'классов');
}

/* ═══ KEYBOARD SHORTCUTS ═══ */
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    if (e.key === 'Escape') { document.activeElement.blur(); closeProfile(); searchCards(''); }
    return;
  }
  if (e.key === 'p' || e.key === 'P') openProfile();
  if (e.key === 't' || e.key === 'T') toggleTheme();
  if (e.key === '/')  { e.preventDefault(); toggleSearch(); }
  if (e.key === 'Escape') { closeProfile(); if (searchOpen) toggleSearch(); }
});

/* ═══ RIPPLE EFFECT ═══ */
document.querySelectorAll('.ripple-container').forEach(el => {
  el.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple-circle';
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    this.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
});

/* ═══ PROFILE OPEN / CLOSE ═══ */
function openProfile() {
  document.getElementById('profileOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  // animate counters when opened
  animateCounter('statScore', 0, 14280, 900);
  animateCounter('statMissions', 0, 47, 700);
}
function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
function closeProfileOutside(e) {
  if (e.target === document.getElementById('profileOverlay')) closeProfile();
}

/* ═══ ANIMATED COUNTER ═══ */
function animateCounter(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * ease).toLocaleString('ru');
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ═══ PROFILE DATA ═══ */
const QUOTES_DATA = [
  { text:'«Отлично!»',                                    author:'— Данте, игровая серия' },
  { text:'«Мне нужно больше силы»',                       author:'— Вергилий, игровая серия' },
  { text:'«Всё это было забавно»',                        author:'— Данте, игровая серия' },
  { text:'«Я не проигрываю»',                             author:'— Неро, игровая серия' },
  { text:'«Сильные люди не сдаются»',                    author:'— V, игровая серия' },
  { text:'«Давай, покажи мне, на что ты способен»',       author:'— Данте, игровая серия' },
  { text:'«Мы с тобой одна команда»',                    author:'— Вергилий, игровая серия' }
];
const STYLE_DESC = {
  Analyst  : 'Внимательность и скорость — быстро замечай изменения',
  Planner: 'Планирование — используй возможности на максимум',
  Strategist : 'Стратегия — действуй точно и обдуманно',
  'Coordinator': 'Железная защита — парируй и отвечай сокрушительной контратакой'
};
const DEFAULTS = { subject:'Математика', style:'Analyst', quote:'0' };

function generateRandomClass() {
  const g=['5','6','7','8','9','10','11'], l=['Z','O','V'];
  return g[Math.floor(Math.random()*g.length)] + ' «' + l[Math.floor(Math.random()*l.length)] + '»';
}

function loadProfileData() {
  let uc = localStorage.getItem('profile_class');
  if (!uc) { uc = generateRandomClass(); localStorage.setItem('profile_class', uc); }
  document.getElementById('profileClass').textContent = uc + ' класс';

  const sub = localStorage.getItem('profile_subject') || DEFAULTS.subject;
  document.getElementById('selectSubject').value = sub;

  const sty = localStorage.getItem('profile_style') || DEFAULTS.style;
  document.getElementById('selectStyle').value = sty;
  updateStyleTooltip();

  const qi = localStorage.getItem('profile_quote') || DEFAULTS.quote;
  document.getElementById('selectQuote').value = qi;
  applyQuote(parseInt(qi));

  /* rank based on style */
  const ranks = { Analyst:'A', Planner:'S', Strategist:'SS', 'Coordinator':'SSS' };
  document.getElementById('statRank').textContent = ranks[sty] || 'S';
}

function saveProfileField(field, value) {
  localStorage.setItem('profile_' + field, value);
  if (field === 'style') {
    const ranks = { Analyst:'A', Planner:'S', Strategist:'SS', 'Coordinator':'SSS' };
    document.getElementById('statRank').textContent = ranks[value] || 'S';
  }
  showSaveToast();
}
function saveQuote(idx) {
  localStorage.setItem('profile_quote', idx);
  applyQuote(parseInt(idx));
  showSaveToast();
}
function applyQuote(idx) {
  const q = QUOTES_DATA[idx] || QUOTES_DATA[0];
  document.getElementById('quoteText').textContent = q.text;
  document.getElementById('quoteCite').textContent = q.author;
}
function updateStyleTooltip() {
  const s = document.getElementById('selectStyle').value;
  document.getElementById('styleTooltip').textContent = STYLE_DESC[s] || '';
}
function showSaveToast(msg) {
  const t = document.getElementById('saveToast');
  if (msg) t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.innerHTML = '✔ Сохранено'; }, 400);
  }, 1800);
}
function resetProfile() {
  if (!confirm('Сбросить все настройки профиля? Будет назначен новый класс.')) return;
  ['profile_class','profile_subject','profile_style','profile_quote'].forEach(k => localStorage.removeItem(k));
  loadProfileData();
  showSaveToast('🔄 Настройки сброшены');
}

/* ═══ INIT ═══ */
loadProfileData();
updateCount();
