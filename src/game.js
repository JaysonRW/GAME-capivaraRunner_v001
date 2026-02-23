import { Config } from './config.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Player } from './physics.js';
import { Spawner } from './spawner.js';
import { Collision } from './collision.js';
import { UI } from './ui.js';
import { PowerUpManager } from './powerups.js';
import { AssetManager } from './assets.js';
import { ParticleSystem } from './particles.js';
import { GameStorage } from './storage.js';
import { AchievementSystem } from './achievements.js';

const STATE = {
    MENU: 0,
    RUNNING: 1,
    GAME_OVER: 2,
    CHOOSING_POWERUP: 3,
    DECIDING_POWERUP: 4
};

export class Game {
    constructor() {
        console.log("Game Constructor called");
        this.storage = new GameStorage();
        this.ui = new UI(this.storage); // Passa storage para UI
        this.renderer = new Renderer('game-canvas');
        this.input = new InputHandler();
        this.player = new Player();
        this.spawner = new Spawner();
        this.powerUpManager = new PowerUpManager();
        this.assets = new AssetManager();
        this.particles = new ParticleSystem();
        this.achievements = new AchievementSystem(this.storage, this.ui);

        this.state = STATE.MENU;
        this.lastTime = 0;
        this.timeScale = 1.0;
        this.score = 0;
        this.highScore = 0;
        this.globalScroll = 0;
        this.difficultyMultiplier = 1.0;
        
        // Run Stats (resetadas a cada jogo)
        this.runStats = {
            jumps: 0,
            ecoPoints: 0,
            powerupChoices: 0,
            storedUsed: 0,
            shieldTime: 0,
            turboDistance: 0
        };

        this.loop = this.loop.bind(this);
        this.handleChoice = this.handleChoice.bind(this);
        this.handleDecision = this.handleDecision.bind(this);
        
        // Callback para voltar ao menu
        this.ui.onRestart(() => {
            this.state = STATE.MENU;
            this.ui.showScreen('menu');
            // Recarrega as listas para refletir novos unlocks
            this.ui.renderScenes();
            this.ui.renderSkins();
            this.ui.renderAchievements();
        });
        
        this.ui.onMuteToggle(() => this.assets.toggleMute());
    }

    async init() {
        await this.assets.loadAll(Config.ASSETS);
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('active');
        this.ui.showScreen('menu');
        requestAnimationFrame(this.loop);
    }

    resetGame() {
        // Carrega configurações selecionadas
        const sceneId = this.storage.data.selectedScene;
        const skinId = this.storage.data.selectedSkin;
        
        this.currentScene = Config.SCENES.find(s => s.id === sceneId);
        this.currentSkin = Config.SKINS.find(s => s.id === skinId);
        
        // Configura Renderer
        this.renderer.currentScene = this.currentScene;
        this.renderer.currentSkin = this.currentSkin;
        
        // Reseta Entidades
        this.player = new Player();
        this.spawner.reset();
        this.powerUpManager.reset();
        this.particles.reset();
        
        this.score = 0;
        this.highScore = this.storage.data.bestScores[sceneId] || 0;
        this.timeScale = 1.0;
        this.globalScroll = 0;
        this.difficultyMultiplier = 1.0;
        
        // Reseta Run Stats
        this.runStats = { jumps: 0, ecoPoints: 0, powerupChoices: 0, storedUsed: 0, shieldTime: 0, turboDistance: 0 };
        
        this.state = STATE.RUNNING;
        this.ui.showScreen('running');
        this.ui.triggerFade();
        this.ui.tutorialStep = 0;
        this.ui.tutorialTimer = 0;
        
        this.input.reset();
        this.updateHUD();
        this.assets.playAudio('MUSIC', true);
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        const safeDt = Math.min(dt, 0.1);

        this.update(safeDt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        if (this.input.wasPressed('KeyM')) {
            const isMuted = this.assets.toggleMute();
            this.ui.updateMuteIcon(isMuted);
        }

        if (this.state === STATE.MENU) {
            if (this.input.isActionActive('START')) {
                // Só inicia se estiver na aba PLAY
                const activeTab = document.querySelector('.nav-btn.active');
                if (activeTab && activeTab.dataset.tab === 'play') {
                    this.assets.playAudio('SELECT');
                    this.resetGame();
                }
            }
            return;
        }

        if (this.state === STATE.GAME_OVER) return;

        let currentTimeScale = 1.0;
        if (this.state === STATE.CHOOSING_POWERUP || this.state === STATE.DECIDING_POWERUP) {
            currentTimeScale = Config.TIMESCALE_CHOOSING;
        } else if (this.powerUpManager.isActive('SPEED')) {
            currentTimeScale = Config.TIMESCALE_TURBO;
        }

        const gameDt = dt * currentTimeScale;

        if (this.state === STATE.RUNNING) {
            this.difficultyMultiplier = Math.min(
                Config.MAX_SPEED_MULTIPLIER, 
                this.difficultyMultiplier + (Config.DIFFICULTY_RAMP * gameDt)
            );
        }

        const currentSpeed = Config.OBSTACLE_SPEED * this.difficultyMultiplier * (this.powerUpManager.isActive('SPEED') ? Config.SCORE_MULTIPLIER_TURBO : 1.0);
        this.globalScroll += currentSpeed * gameDt;

        // Stats Tracking: Distância Turbo
        if (this.powerUpManager.isActive('SPEED')) {
            this.runStats.turboDistance += (currentSpeed * gameDt) / 100;
        }
        // Stats Tracking: Tempo Shield
        if (this.powerUpManager.isActive('SHIELD')) {
            this.runStats.shieldTime += gameDt;
        }

        if (this.state === STATE.RUNNING && this.input.isActionActive('USE_SLOT')) {
            if (this.powerUpManager.useStored()) {
                this.assets.playAudio('SELECT');
                this.updateHUD();
                this.particles.spawn(this.player.x + 10, this.player.y, '#FFD700', 10);
                this.runStats.storedUsed++;
            }
        }

        if (this.state === STATE.CHOOSING_POWERUP) {
            if (this.input.isActionActive('CHOICE_1')) this.handleChoice(0);
            if (this.input.isActionActive('CHOICE_2')) this.handleChoice(1);
            if (this.input.isActionActive('CHOICE_3')) this.handleChoice(2);
        }

        const jumpMod = this.powerUpManager.isActive('JUMP') ? Config.JUMP_BOOST_FACTOR : 1.0;
        const wasGrounded = this.player.isGrounded;
        
        this.player.update(gameDt, this.input, jumpMod);
        
        if (this.input.isActionActive('JUMP') && this.player.vy === Config.JUMP_FORCE * jumpMod) {
            this.assets.playAudio('JUMP');
            this.particles.spawn(this.player.x + 10, this.player.y + this.player.height, '#FFF', 5);
            this.runStats.jumps++;
        }
        
        if (!wasGrounded && this.player.isGrounded) {
            this.particles.spawn(this.player.x + 10, this.player.y + this.player.height, '#8B4513', 3);
        }

        this.spawner.update(gameDt, this.difficultyMultiplier); 
        this.powerUpManager.update(gameDt);
        this.particles.update(gameDt);
        this.renderer.updateShake(dt);

        if (this.state === STATE.RUNNING) {
            this.ui.updateTutorial(dt, this.input);
        }

        let scoreMult = this.powerUpManager.isActive('SPEED') ? Config.SCORE_MULTIPLIER_TURBO : 1.0;
        if (this.state === STATE.CHOOSING_POWERUP) scoreMult = 0.1; 
        
        this.score += (Config.OBSTACLE_SPEED * this.difficultyMultiplier * gameDt * scoreMult) / 100;
        this.ui.updateScore(this.score);
        this.updateHUD();

        this.checkCollisions();
    }

    checkCollisions() {
        const playerBounds = this.player.getBounds();
        
        if (!this.powerUpManager.isActive('SHIELD')) {
            for (let obs of this.spawner.obstacles) {
                if (Collision.checkAABB(playerBounds, obs)) {
                    this.assets.playAudio('HIT');
                    this.renderer.triggerShake();
                    this.particles.spawn(this.player.x, this.player.y, '#FF0000', 20);
                    this.gameOver();
                    return;
                }
            }
        }

        for (let i = this.spawner.ecoFragments.length - 1; i >= 0; i--) {
            let eco = this.spawner.ecoFragments[i];
            if (Collision.checkAABB(playerBounds, eco)) {
                this.assets.playAudio('PICKUP');
                this.particles.spawn(eco.x, eco.y, '#00FF7F', 10);
                this.spawner.ecoFragments.splice(i, 1);
                this.runStats.ecoPoints++;
                this.startPowerUpChoice();
            }
        }
    }

    startPowerUpChoice() {
        this.state = STATE.CHOOSING_POWERUP;
        this.powerUpManager.generateOptions();
        this.ui.showChoices(this.powerUpManager.currentOptions, (index) => this.handleChoice(index));
    }

    handleChoice(index) {
        if (this.state !== STATE.CHOOSING_POWERUP) return;
        const selected = this.powerUpManager.currentOptions[index];
        if (!selected) return;

        this.assets.playAudio('SELECT');
        this.powerUpManager.pendingChoice = selected;
        this.runStats.powerupChoices++;
        
        this.state = STATE.DECIDING_POWERUP;
        const hasStored = !!this.powerUpManager.storedPowerUp;
        this.ui.showDecision(selected, hasStored, (action) => this.handleDecision(action));
    }

    handleDecision(action) {
        const choice = this.powerUpManager.pendingChoice;
        if (action === 'USE') this.powerUpManager.activate(choice);
        else if (action === 'STORE') this.powerUpManager.store(choice);

        this.assets.playAudio('SELECT');
        this.state = STATE.RUNNING;
        this.ui.showScreen('running');
        this.updateHUD();
    }

    updateHUD() {
        this.ui.updateHUD(this.powerUpManager);
    }

    gameOver() {
        this.state = STATE.GAME_OVER;
        this.assets.stopMusic();
        
        // Atualiza Persistência
        const sceneId = this.storage.data.selectedScene;
        this.storage.updateStats(this.runStats);
        this.storage.updateBestScore(sceneId, this.score);
        
        // Checa Conquistas e Unlocks
        this.achievements.checkAll(this.runStats);
        
        this.ui.updateGameOver(this.score, this.storage.data.bestScores[sceneId]);
        this.ui.showScreen('gameOver');
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawBackground(this.assets, this.globalScroll);
        
        const isInvulnerable = this.powerUpManager.isActive('SHIELD');
        this.renderer.drawEntities(this.spawner, this.assets);
        this.renderer.drawPlayer(this.player, this.assets, isInvulnerable);
        this.renderer.drawParticles(this.particles);
        
        this.renderer.renderToScreen();
    }
}
