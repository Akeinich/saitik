(() => {
    'use strict';

    const $ = (selector) => document.querySelector(selector);

    const overlay = $('#gachaOverlay');
    const balanceElement = $('#balance');
    const minedElement = $('#minedAmount');
    const farmOrb = $('#farmOrb');
    const skipButton = $('#skipBtn');
    const closeSummaryButton = $('#closeSummaryBtn');

    const cinematicMessage = $('#cinematicMessage');
    const cinematicTitle = $('#cinematicTitle');
    const cinematicSubtitle = $('#cinematicSubtitle');
    const revealScreen = $('#rarityReveal');
    const revealStars = $('#revealStars');
    const revealLabel = $('#revealLabel');
    const revealName = $('#revealName');
    const revealHint = $('#revealHint');
    const sceneBottomHint = $('#sceneBottomHint');

    const summaryScreen = $('#summaryScreen');
    const summaryGrid = $('#summaryGrid');
    const summaryTotal = $('#summaryTotal');

    const pityText = $('#pityText');
    const pityBar = $('#pityBar');
    const guaranteeStatus = $('#guaranteeStatus');

    const wishButtons = [...document.querySelectorAll('.wish-button')];

    const state = {
        busy: false,
        animating: false,
        phase: 'idle',
        results: [],
        index: 0
    };

    const rarityInfo = {
        3: { label: 'ОБЫЧНЫЙ', className: 'rarity-3', icon: '📦' },
        4: { label: 'ЭПИЧЕСКИЙ', className: 'rarity-4', icon: '🔮' },
        5: { label: 'ЛЕГЕНДАРНЫЙ', className: 'rarity-5', icon: '👑' }
    };

    async function api(url, body) {
        const options = { method: body ? 'POST' : 'GET', headers: { 'Accept': 'application/json' } };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['RequestVerificationToken'] = $('input[name="__RequestVerificationToken"]')?.value || '';
            options.body = JSON.stringify(body);
        }
        const res = await fetch(url, options);
        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Сервер вернул ошибку (HTTP ${res.status})`); }
        if (!res.ok) throw new Error(data.error || `Ошибка: ${res.status}`);
        return data;
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    function setBalance(val) {
        balanceElement.textContent = formatNumber(val);
        balanceElement.classList.remove('balance-pop');
        void balanceElement.offsetWidth;
        balanceElement.classList.add('balance-pop');
    }

    function updatePityUI(pity, guaranteed) {
        if (!pityText || !pityBar || !guaranteeStatus) return;

        pityText.textContent = `До гаранта: ${pity}/90`;

        const percent = Math.min(100, (pity / 90) * 100);
        pityBar.style.width = `${percent}%`;

        if (guaranteed) {
            guaranteeStatus.textContent = 'ГАРАНТ!';
            guaranteeStatus.classList.add('is-guaranteed');
            pityBar.classList.add('is-guaranteed');
        } else {
            guaranteeStatus.textContent = '50/50';
            guaranteeStatus.classList.remove('is-guaranteed');
            pityBar.classList.remove('is-guaranteed');
        }
    }

    function playSceneAnimation(item, callback) {
        if (window.GachaScene) {
            window.GachaScene.stop();
            window.GachaScene.playRarity(item.stars, item.name, callback);
        } else {
            setTimeout(callback, 1000);
        }
    }

    async function startGacha(count, btn) {
        if (state.animating || state.busy) return;
        state.busy = true;
        state.animating = true;

        wishButtons.forEach(b => b.disabled = true);
        btn?.blur();

        try {
            const data = await api('/Index?handler=Gacha', { count });
            setBalance(data.balance);

            state.results = data.results;
            state.index = 0;
            state.phase = 'cinematic';

            overlay.classList.add('active');
            revealScreen.classList.remove('active');
            summaryScreen.classList.remove('active');
            cinematicMessage.classList.remove('hidden');
            skipButton.style.display = 'block';

            const first = state.results[0];
            const isLegendary = first.stars === 5;

            cinematicTitle.textContent = isLegendary ? 'ЛЕГЕНДАРНЫЙ ПРИЗЫВ' : 'ИНИЦИАЛИЗАЦИЯ';
            cinematicSubtitle.textContent = isLegendary ? 'Судьба сделала свой выбор.' : 'Подключение к звёздам...';

            playSceneAnimation(first, () => {
                if (!state.animating) return;
                cinematicMessage.classList.add('hidden');
                showResult();
            });

            if (isLegendary) {
                skipButton.style.opacity = '0.5';
                skipButton.style.pointerEvents = 'none';
            } else {
                skipButton.style.opacity = '1';
                skipButton.style.pointerEvents = 'auto';
            }

        } catch (error) {
            console.error(error);
            alert(error.message);
            finishGacha();
        } finally {
            state.busy = false;
        }
    }

    function showResult() {
        state.phase = 'result';
        const item = state.results[state.index];
        const info = rarityInfo[item.stars] || rarityInfo[3];

        revealName.textContent = item.name;
        revealStars.textContent = '★'.repeat(item.stars);
        revealLabel.textContent = info.label;
        revealHint.textContent = state.index === state.results.length - 1
            ? 'Нажми, чтобы увидеть итоги'
            : 'Нажми для следующего';

        revealScreen.className = `rarity-reveal ${info.className} active`;
        sceneBottomHint.classList.remove('hidden');

        const chibiDryad = document.querySelector('.chibi-dryad');
        const fairyMascot = document.querySelector('.fairy-mascot');
        if (item.stars === 5 && chibiDryad && fairyMascot) {
            chibiDryad.classList.add('excited');
            fairyMascot.classList.add('flying-to-center');
            setTimeout(() => {
                chibiDryad.classList.remove('excited');
                fairyMascot.classList.remove('flying-to-center');
            }, 3000);
        }
    }

    function advance() {
        if (state.phase !== 'result') return;
        state.index++;
        if (state.index >= state.results.length) {
            showSummary();
        } else {
            const item = state.results[state.index];
            if (item.stars === 5) {
                revealScreen.classList.remove('active');
                state.phase = 'cinematic';
                state.animating = true;
                skipButton.style.opacity = '0.5';
                skipButton.style.pointerEvents = 'none';

                playSceneAnimation(item, () => {
                    if (!state.animating) return;
                    showResult();
                });
            } else {
                showResult();
            }
        }
    }

    function showSummary() {
        state.phase = 'summary';
        revealScreen.classList.remove('active');
        sceneBottomHint.classList.add('hidden');
        if (window.GachaScene) window.GachaScene.stop();

        summaryGrid.innerHTML = '';
        let counts = { 3: 0, 4: 0, 5: 0 };

        state.results.forEach((item, i) => {
            counts[item.stars]++;
            const info = rarityInfo[item.stars];
            const card = document.createElement('div');
            card.className = `summary-card ${info.className}`;
            card.style.animationDelay = `${i * 0.05}s`;
            card.innerHTML = `
                <div class="card-icon">${info.icon}</div>
                <div class="card-stars">${'★'.repeat(item.stars)}</div>
                <div class="card-name">${item.name}</div>
            `;
            summaryGrid.appendChild(card);
        });

        summaryTotal.textContent = `ИТОГО: ${counts[5]} ЛЕГЕНДАРНЫХ · ${counts[4]} ЭПИЧЕСКИХ`;
        summaryScreen.classList.add('active');
    }

    function finishGacha() {
        state.animating = false;
        state.phase = 'idle';
        overlay.classList.remove('active');
        revealScreen.classList.remove('active');
        summaryScreen.classList.remove('active');
        wishButtons.forEach(b => b.disabled = false);
        skipButton.style.opacity = '1';
        skipButton.style.pointerEvents = 'auto';
        if (window.GachaScene) window.GachaScene.stop();

        api('/Index?handler=Balance').then(d => {
            setBalance(d.balance);
            minedElement.textContent = formatNumber(d.mined);
            updatePityUI(d.pity, d.guaranteed);
        });
    }

    wishButtons.forEach(btn => {
        btn.addEventListener('click', () => startGacha(Number(btn.dataset.count), btn));
    });

    skipButton.addEventListener('click', () => {
        if (!state.animating) return;
        if (state.phase === 'cinematic') {
            const current = state.results[state.index];
            if (current && current.stars === 5) return;

            state.animating = false;
            cinematicMessage.classList.add('hidden');
            if (window.GachaScene) window.GachaScene.stop();
            showResult();
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target.closest('.skip-button') || e.target.closest('.button-gold')) return;
        if (state.phase === 'result') advance();
        else if (state.phase === 'summary') finishGacha();
    });

    closeSummaryButton.addEventListener('click', finishGacha);

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('active')) return;
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
            e.preventDefault();
            if (state.phase === 'result') advance();
            else if (state.phase === 'summary') finishGacha();
            else if (state.phase === 'cinematic') skipButton.click();
        }
    });

    $('#resetBtn').addEventListener('click', async () => {
        if (!confirm('Сбросить весь прогресс?')) return;
        try {
            const data = await api('/Index?handler=Reset', {});
            setBalance(data.balance);
            minedElement.textContent = formatNumber(data.mined);
            updatePityUI(0, false);
        } catch (e) { alert(e.message); }
    });

    farmOrb.addEventListener('click', async () => {
        if (farmOrb.disabled) return;
        farmOrb.disabled = true;
        try {
            const data = await api('/Index?handler=Mine', {});
            setBalance(data.balance);
            minedElement.textContent = formatNumber(data.mined);

            const rect = farmOrb.getBoundingClientRect();
            const spark = document.createElement('span');
            spark.className = 'farm-reward-float';
            spark.textContent = '+50 ◆';
            spark.style.left = `${rect.left}px`;
            spark.style.top = `${rect.top - 20}px`;
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 900);

        } catch (e) { console.warn(e); }
        finally { setTimeout(() => farmOrb.disabled = false, 200); }
    });

    api('/Index?handler=Balance').then(d => {
        setBalance(d.balance);
        minedElement.textContent = formatNumber(d.mined);
        updatePityUI(d.pity, d.guaranteed);
    });

    // --- ЛОГИКА ДРИАДЫ-ПОМОЩНИКА ---
    const fairyMascot = document.querySelector('.fairy-mascot');
    const chibiDryad = document.querySelector('.chibi-dryad');
    const giftUi = document.getElementById('fairyGiftUi');
    const giftTimer = document.getElementById('giftTimer');
    const loreTips = [
        "Древние говорили: не крути гачу на ночь.",
        "Я чувствую, что легендарка уже близко. Но я могу ошибаться.",
        "Ты знаешь, что Звёздная Пыль пахнет мятой?",
        "Осторожнее с магией. Она любит шутить.",
        "Однажды я видела, как Дракон Владыка чихнул и сжёг всю библиотеку.",
        "Ты уже пробовал фармить пыль? Это расслабляет.",
        "Мои листья шепчут, что сегодня твой день."
    ];

    if (giftUi) {
        let giftAvailable = false;
        const GIFT_COOLDOWN = 300;
        let timeLeft = GIFT_COOLDOWN;

        setInterval(() => {
            if (giftAvailable) return;

            timeLeft--;
            if (timeLeft <= 0) {
                giftAvailable = true;
                giftUi.classList.add('ready');
                giftTimer.textContent = "ЗАБРАТЬ!";
            } else {
                const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const s = (timeLeft % 60).toString().padStart(2, '0');
                giftTimer.textContent = `${m}:${s}`;
            }
        }, 1000);

        giftUi.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!giftAvailable) return;

            try {
                const data = await api('/Index?handler=ClaimGift', {});
                setBalance(data.balance);
                giftAvailable = false;
                timeLeft = GIFT_COOLDOWN;
                giftUi.classList.remove('ready');
                giftTimer.textContent = "05:00";

                chibiDryad.classList.add('excited');
                setTimeout(() => chibiDryad.classList.remove('excited'), 1000);
            } catch (err) {
                console.error("Подарок недоступен", err);
            }
        });
    }

    if (fairyMascot) {
        fairyMascot.addEventListener('click', (e) => {
            if (e.target.closest('#fairyGiftUi')) return;

            const randomTip = loreTips[Math.floor(Math.random() * loreTips.length)];

            const bubble = document.createElement('div');
            bubble.className = 'fairy-comment-bubble';
            bubble.textContent = randomTip;
            document.body.appendChild(bubble);

            const rect = fairyMascot.getBoundingClientRect();
            bubble.style.left = `${rect.left + 100}px`;
            bubble.style.top = `${rect.top - 20}px`;

            setTimeout(() => bubble.remove(), 4000);

            chibiDryad.classList.add('excited');
            setTimeout(() => chibiDryad.classList.remove('excited'), 500);
        });
    }

    const pupils = document.querySelectorAll('.pupil');
    if (chibiDryad && pupils.length > 0) {
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const rect = fairyMascot.getBoundingClientRect();
            const mascotX = rect.left + rect.width / 2;
            const mascotY = rect.top + rect.height / 2;

            const angle = Math.atan2(mouseY - mascotY, mouseX - mascotX);
            const distance = Math.min(4, Math.hypot(mouseX - mascotX, mouseY - mascotY) / 50);
            const moveX = Math.cos(angle) * distance;
            const moveY = Math.sin(angle) * distance;

            pupils.forEach(p => {
                p.style.transform = `translate(calc(-50% + ${moveX}px), ${moveY}px)`;
            });
        });

        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            chibiDryad.style.transform = `rotate(${x * 10}deg)`;
        });
    }
})();