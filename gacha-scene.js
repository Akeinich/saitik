// js/gacha-scene.js
(() => {
    'use strict';

    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, dpr = 1, raf = 0, running = false;
    let currentPhase = 'idle';
    let phaseTimer = 0;
    let globalTime = 0;
    let cameraShake = 0;

    // Данные текущего призыва
    let currentRarity = 3;
    let currentName = "";
    let onRevealCallback = null;

    // Частицы и эффекты
    let particles = [];
    let runes = [];
    let stars = [];

    const themes = {
        3: { color: '#00f0ff', bg: '#050a14', name: 'basic' },
        4: { color: '#d800ff', bg: '#14051a', name: 'epic' },
        5: { color: '#ffd700', bg: '#1a1400', name: 'legendary' }
    };
    let theme = themes[3];

    const rand = (a, b) => Math.random() * (b - a) + a;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = innerWidth;
        h = innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function start() {
        if (running) return;
        running = true;
        resize();
        loop();
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
        currentPhase = 'idle';
        particles = [];
        runes = [];
        stars = [];
        cameraShake = 0;
        globalTime = 0;
    }

    // --- ГЕНЕРАЦИЯ ЧАСТИЦ ---

    function spawnRune(x, y) {
        runes.push({
            x: x, y: y,
            vx: rand(-2, 2), vy: rand(-2, 2),
            life: 1, decay: rand(0.01, 0.03),
            size: rand(10, 30),
            char: ['✦', '◆', '△', '○', '✧'][Math.floor(rand(0, 5))],
            rot: rand(0, Math.PI * 2),
            vrot: rand(-0.05, 0.05)
        });
    }

    function spawnParticles(count, speedMax, sizeMax) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(2, speedMax);
            particles.push({
                x: w / 2, y: h / 2,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: rand(0.005, 0.02),
                size: rand(1, sizeMax),
                color: theme.color
            });
        }
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: rand(0, w),
                y: rand(0, h),
                z: rand(0.1, 1),
                size: rand(0.5, 2)
            });
        }
    }

    // --- ОБНОВЛЕНИЕ ЛОГИКИ ---

    function update() {
        phaseTimer++;
        globalTime += 1;

        if (cameraShake > 0) cameraShake *= 0.9;

        // 1. ФАЗА РИТУАЛА
        if (currentPhase === 'ritual') {
            if (phaseTimer % 5 === 0) {
                spawnRune(w / 2, h / 2 + 100);
            }
            if (phaseTimer > 120) { // 2 секунды
                currentPhase = 'tunnel';
                phaseTimer = 0;
                initStars();
                cameraShake = 20;
                spawnParticles(200, 15, 4);
            }
        }

        // 2. ФАЗА ТУННЕЛЯ (Полет)
        else if (currentPhase === 'tunnel') {
            // Постоянный поток частиц, летящих на камеру
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: w / 2 + rand(-w, w),
                    y: h / 2 + rand(-h, h),
                    vx: rand(-5, 5), vy: rand(-5, 5),
                    life: 1, decay: 0.02,
                    size: rand(1, 3),
                    color: theme.color
                });
            }

            // Движение звезд (эффект гиперпрыжка)
            for (let s of stars) {
                s.y += s.z * 20;
                if (s.y > h) {
                    s.y = 0;
                    s.x = rand(0, w);
                }
            }

            // Переход к показу
            let tunnelDuration = 90; // 1.5 сек
            if (currentRarity === 4) tunnelDuration = 150;
            if (currentRarity === 5) tunnelDuration = 240;

            if (phaseTimer > tunnelDuration) {
                currentPhase = 'reveal';
                phaseTimer = 0;
                cameraShake = currentRarity === 5 ? 40 : 10;
                spawnParticles(300, 25, 5);
                if (onRevealCallback) onRevealCallback();
            }
        }

        // 3. ФАЗА ПОКАЗА
        else if (currentPhase === 'reveal') {
            // Медленное затухание камеры
            cameraShake *= 0.95;

            // Для 5★ продолжаем сыпать искры
            if (currentRarity === 5 && phaseTimer % 2 === 0) {
                spawnParticles(2, 10, 3);
            }
        }

        // Обновление частиц
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Обновление рун
        for (let i = runes.length - 1; i >= 0; i--) {
            let r = runes[i];
            r.x += r.vx; r.y += r.vy;
            r.rot += r.vrot;
            r.life -= r.decay;
            if (r.life <= 0) runes.splice(i, 1);
        }
    }

    // --- ОТРИСОВКА ---

    function draw() {
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, w, h);

        // Тряска камеры
        const dx = cameraShake > 0.5 ? rand(-cameraShake, cameraShake) : 0;
        const dy = cameraShake > 0.5 ? rand(-cameraShake, cameraShake) : 0;

        ctx.save();
        ctx.translate(dx, dy);

        const cx = w / 2;
        const cy = h / 2;

        // Отрисовка фаз
        if (currentPhase === 'ritual') {
            // Магический круг
            ctx.strokeStyle = theme.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = theme.color;

            ctx.beginPath();
            ctx.arc(cx, cy + 100, 150, 0, Math.PI * 2);
            ctx.stroke();

            // Внутренний круг
            ctx.beginPath();
            ctx.arc(cx, cy + 100, 100, 0, Math.PI * 2);
            ctx.stroke();

            // Вращающиеся руны
            for (let i = 0; i < 8; i++) {
                const angle = (globalTime * 0.02) + (i * Math.PI / 4);
                const rx = cx + Math.cos(angle) * 125;
                const ry = cy + 100 + Math.sin(angle) * 125;
                ctx.fillStyle = theme.color;
                ctx.font = '20px serif';
                ctx.fillText('✦', rx, ry);
            }
        }

        else if (currentPhase === 'tunnel') {
            // Звезды (эффект скорости)
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            for (let s of stars) {
                ctx.globalAlpha = s.z;
                ctx.fillRect(s.x, s.y, s.size, s.size * 10); // Вытянутые звезды
            }
            ctx.globalAlpha = 1;

            // Вспышка скорости
            if (currentRarity === 5 && phaseTimer > 150) {
                ctx.fillStyle = `rgba(255, 215, 0, ${rand(0, 0.2)})`;
                ctx.fillRect(0, 0, w, h);
            }
        }

        // Отрисовка частиц (искр)
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.color;
        for (let p of particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Отрисовка рун
        for (let r of runes) {
            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.rotate(r.rot);
            ctx.globalAlpha = Math.max(0, r.life);
            ctx.fillStyle = theme.color;
            ctx.font = `${r.size}px serif`;
            ctx.fillText(r.char, 0, 0);
            ctx.restore();
        }

        // Белая вспышка при переходе
        if (currentPhase === 'reveal' && phaseTimer < 20) {
            const alpha = 1 - (phaseTimer / 20);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
    }

    function loop() {
        if (!running) return;
        update();
        draw();
        raf = requestAnimationFrame(loop);
    }

    // --- API ДЛЯ ВЫЗОВА ИЗ APP.JS ---

    function playRarity(stars, name, callback) {
        start();
        currentRarity = stars;
        currentName = name;
        onRevealCallback = callback;
        theme = themes[stars] || themes[3];
        currentPhase = 'ritual';
        phaseTimer = 0;
        globalTime = 0;
        cameraShake = 0;
    }

    window.GachaScene = { start, stop, playRarity };
})();