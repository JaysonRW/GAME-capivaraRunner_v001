import { Config } from './config.js';

export class UI {
    constructor(storage) {
        this.storage = storage;
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            hud: document.getElementById('hud-screen'),
            gameOver: document.getElementById('game-over-screen'),
            choice: document.getElementById('choice-screen'),
            decision: document.getElementById('decision-screen')
        };
        
        this.elements = {
            score: document.getElementById('score-display'),
            finalScore: document.getElementById('final-score'),
            highScore: document.getElementById('high-score'),
            restartBtn: document.getElementById('restart-btn'),
            slotIcon: document.getElementById('slot-icon'),
            slotName: document.getElementById('slot-name'),
            slotBox: document.getElementById('slot-box'),
            activeIcon: document.getElementById('active-icon'),
            activeBar: document.getElementById('active-bar'),
            activeContainer: document.getElementById('active-container'),
            cardsContainer: document.getElementById('cards-container'),
            decisionTitle: document.getElementById('decision-title'),
            btnUseNow: document.getElementById('btn-use-now'),
            btnStore: document.getElementById('btn-store'),
            muteBtn: document.getElementById('mute-btn'),
            tutorialBox: document.getElementById('tutorial-box'),
            tutorialText: document.getElementById('tutorial-text'),
            fadeOverlay: document.getElementById('fade-overlay'),
            
            // Menu Tabs
            navBtns: document.querySelectorAll('.nav-btn'),
            tabPanes: document.querySelectorAll('.tab-pane'),
            sceneList: document.getElementById('scene-list'),
            skinList: document.getElementById('skin-list'),
            achList: document.getElementById('ach-list'),
            resetBtn: document.getElementById('reset-progress-btn'),
            
            // Toast
            toast: document.getElementById('toast'),
            toastMsg: document.querySelector('.toast-msg')
        };

        this.tutorialTimer = 0;
        this.tutorialStep = 0;
        
        this.setupMenu();
    }

    setupMenu() {
        // Tab Switching
        this.elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.navBtns.forEach(b => b.classList.remove('active'));
                this.elements.tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
                
                if (btn.dataset.tab === 'scenes') this.renderScenes();
                if (btn.dataset.tab === 'skins') this.renderSkins();
                if (btn.dataset.tab === 'achievements') this.renderAchievements();
            });
        });
        
        this.elements.resetBtn.addEventListener('click', () => {
            if(confirm("Tem certeza? Todo o progresso será perdido.")) {
                this.storage.resetProgress();
                alert("Progresso resetado.");
                this.renderAchievements(); // Refresh
            }
        });
    }

    renderScenes() {
        const list = this.elements.sceneList;
        list.innerHTML = '';
        const data = this.storage.data;
        
        Config.SCENES.forEach(scene => {
            const unlocked = data.unlockedScenes.includes(scene.id);
            const selected = data.selectedScene === scene.id;
            
            const el = document.createElement('div');
            el.className = `list-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
            el.innerHTML = `
                <div class="item-icon" style="background:${scene.colors.sky}"></div>
                <div class="item-info">
                    <div class="item-name">${scene.name} ${selected ? '(Selecionado)' : ''}</div>
                    <div class="item-desc">${unlocked ? scene.desc : `Melhor Score >= ${scene.unlockScore}`}</div>
                    <div class="item-status">Best: ${data.bestScores[scene.id] || 0}</div>
                </div>
            `;
            
            if (unlocked) {
                el.onclick = () => {
                    this.storage.selectScene(scene.id);
                    this.renderScenes(); // Re-render to update selection
                };
            }
            list.appendChild(el);
        });
    }

    renderSkins() {
        const list = this.elements.skinList;
        list.innerHTML = '';
        const data = this.storage.data;
        
        Config.SKINS.forEach(skin => {
            const unlocked = data.unlockedSkins.includes(skin.id);
            const selected = data.selectedSkin === skin.id;
            
            const el = document.createElement('div');
            el.className = `list-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
            el.innerHTML = `
                <div class="item-icon" style="background:${skin.color}"></div>
                <div class="item-info">
                    <div class="item-name">${skin.name} ${selected ? '(Selecionado)' : ''}</div>
                    <div class="item-desc">${unlocked ? skin.desc : skin.desc}</div>
                </div>
            `;
            
            if (unlocked) {
                el.onclick = () => {
                    this.storage.selectSkin(skin.id);
                    this.renderSkins();
                };
            }
            list.appendChild(el);
        });
    }

    renderAchievements() {
        const list = this.elements.achList;
        list.innerHTML = '';
        const data = this.storage.data;
        
        Config.ACHIEVEMENTS.forEach(ach => {
            const unlocked = data.achievements.includes(ach.id);
            
            const el = document.createElement('div');
            el.className = `list-item ${!unlocked ? 'locked' : ''}`;
            el.innerHTML = `
                <div class="item-icon">${unlocked ? '🏆' : '🔒'}</div>
                <div class="item-info">
                    <div class="item-name">${ach.name}</div>
                    <div class="item-desc">${ach.desc}</div>
                </div>
            `;
            list.appendChild(el);
        });
    }

    showToast(msg) {
        this.elements.toastMsg.innerText = msg;
        this.elements.toast.classList.remove('hidden');
        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, 3000);
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => {
            if (s.id !== 'hud-screen') s.classList.add('hidden');
            s.classList.remove('active');
        });

        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.screens[screenName].classList.add('active');
        }
        
        if (['running', 'choosing', 'deciding'].includes(screenName)) {
            this.screens.hud.classList.remove('hidden');
        }
    }

    triggerFade() {
        this.elements.fadeOverlay.classList.add('active');
        setTimeout(() => {
            this.elements.fadeOverlay.classList.remove('active');
        }, Config.FADE_DURATION);
    }

    updateScore(score) {
        this.elements.score.innerText = Math.floor(score);
    }

    updateGameOver(score, highScore) {
        this.elements.finalScore.innerText = Math.floor(score);
        this.elements.highScore.innerText = Math.floor(highScore);
    }

    updateHUD(powerUpManager) {
        if (powerUpManager.storedPowerUp) {
            this.elements.slotName.innerText = powerUpManager.storedPowerUp.name;
            this.elements.slotIcon.style.backgroundColor = powerUpManager.storedPowerUp.color;
            this.elements.slotIcon.innerText = powerUpManager.storedPowerUp.id[0];
            this.elements.slotBox.classList.add('highlight');
        } else {
            this.elements.slotName.innerText = "VAZIO";
            this.elements.slotIcon.style.backgroundColor = 'transparent';
            this.elements.slotIcon.innerText = "";
            this.elements.slotBox.classList.remove('highlight');
        }

        if (powerUpManager.activePowerUp) {
            this.elements.activeContainer.classList.remove('hidden');
            this.elements.activeIcon.style.backgroundColor = powerUpManager.activePowerUp.type.color;
            const pct = (powerUpManager.activePowerUp.timeLeft / Config.POWER_DURATION) * 100;
            this.elements.activeBar.style.width = `${pct}%`;
        } else {
            this.elements.activeContainer.classList.add('hidden');
        }
    }

    updateTutorial(dt, input) {
        if (this.tutorialStep >= 2) {
            this.elements.tutorialBox.classList.add('hidden');
            return;
        }
        this.tutorialTimer += dt;
        this.elements.tutorialBox.classList.remove('hidden');
        if (this.tutorialStep === 0) {
            this.elements.tutorialText.innerText = "ESPAÇO PARA PULAR";
            if (input.isActionActive('JUMP')) this.tutorialStep = 1;
        } else if (this.tutorialStep === 1) {
            this.elements.tutorialText.innerText = "S PARA DESLIZAR";
            if (input.isActionActive('SLIDE')) this.tutorialStep = 2;
        }
        if (this.tutorialTimer > Config.TUTORIAL_DURATION) this.tutorialStep = 2;
    }

    showChoices(options, onSelect) {
        this.showScreen('choice');
        this.elements.cardsContainer.innerHTML = '';
        options.forEach((opt, index) => {
            const card = document.createElement('div');
            card.className = 'powerup-card';
            card.style.borderColor = opt.color;
            card.innerHTML = `
                <div class="key-hint">${index + 1}</div>
                <div class="icon" style="background-color: ${opt.color}"></div>
                <h3 style="font-size: 16px; margin-bottom: 5px;">${opt.name}</h3>
                <p style="font-size: 12px; line-height: 1.2;">${opt.desc}</p>
            `;
            card.onclick = () => onSelect(index);
            this.elements.cardsContainer.appendChild(card);
        });
    }

    showDecision(pendingPowerUp, hasStored, onDecision) {
        this.showScreen('decision');
        this.elements.decisionTitle.innerText = `ESCOLHEU: ${pendingPowerUp.name}`;
        this.elements.btnUseNow.onclick = () => onDecision('USE');
        if (hasStored) {
            this.elements.btnStore.innerText = "SUBSTITUIR";
        } else {
            this.elements.btnStore.innerText = "GUARDAR";
        }
        this.elements.btnStore.onclick = () => onDecision('STORE');
    }

    onRestart(callback) {
        this.elements.restartBtn.addEventListener('click', callback);
    }

    onMuteToggle(callback) {
        this.elements.muteBtn.addEventListener('click', () => {
            const isMuted = callback();
            this.elements.muteBtn.innerText = isMuted ? '🔇' : '🔊';
        });
    }
    
    updateMuteIcon(isMuted) {
        this.elements.muteBtn.innerText = isMuted ? '🔇' : '🔊';
    }
}
