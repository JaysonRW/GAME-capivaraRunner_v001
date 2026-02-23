import { Config } from './config.js';

export class GameStorage {
    constructor() {
        this.data = this.load();
    }

    getInitialData() {
        return {
            stats: {
                totalRuns: 0,
                totalEcoPoints: 0,
                totalJumps: 0,
                totalPowerupChoices: 0,
                totalStoredPowerupsUsed: 0
            },
            bestScores: {
                botanico: 0,
                tangua: 0,
                barigui: 0
            },
            unlockedScenes: ['botanico'],
            unlockedSkins: ['aventureira'],
            achievements: [], // IDs desbloqueados
            selectedScene: 'botanico',
            selectedSkin: 'aventureira'
        };
    }

    load() {
        try {
            const stored = localStorage.getItem(Config.STORAGE_KEY);
            if (stored) {
                // Merge com initialData para garantir que campos novos existam
                const parsed = JSON.parse(stored);
                return { ...this.getInitialData(), ...parsed, stats: { ...this.getInitialData().stats, ...parsed.stats } };
            }
        } catch (e) {
            console.error("Erro ao carregar save:", e);
        }
        return this.getInitialData();
    }

    save() {
        try {
            localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("Erro ao salvar:", e);
        }
    }

    updateStats(runStats) {
        this.data.stats.totalRuns++;
        this.data.stats.totalEcoPoints += (runStats.ecoPoints || 0);
        this.data.stats.totalJumps += (runStats.jumps || 0);
        this.data.stats.totalPowerupChoices += (runStats.powerupChoices || 0);
        this.data.stats.totalStoredPowerupsUsed += (runStats.storedUsed || 0);
        this.save();
    }

    updateBestScore(sceneId, score) {
        if (!this.data.bestScores[sceneId] || score > this.data.bestScores[sceneId]) {
            this.data.bestScores[sceneId] = Math.floor(score);
            this.save();
            return true; // Novo recorde
        }
        return false;
    }

    unlockScene(sceneId) {
        if (!this.data.unlockedScenes.includes(sceneId)) {
            this.data.unlockedScenes.push(sceneId);
            this.save();
            return true;
        }
        return false;
    }

    unlockSkin(skinId) {
        if (!this.data.unlockedSkins.includes(skinId)) {
            this.data.unlockedSkins.push(skinId);
            this.save();
            return true;
        }
        return false;
    }

    unlockAchievement(achId) {
        if (!this.data.achievements.includes(achId)) {
            this.data.achievements.push(achId);
            this.save();
            return true;
        }
        return false;
    }

    selectScene(sceneId) {
        if (this.data.unlockedScenes.includes(sceneId)) {
            this.data.selectedScene = sceneId;
            this.save();
        }
    }

    selectSkin(skinId) {
        if (this.data.unlockedSkins.includes(skinId)) {
            this.data.selectedSkin = skinId;
            this.save();
        }
    }
    
    resetProgress() {
        this.data = this.getInitialData();
        this.save();
    }
}
