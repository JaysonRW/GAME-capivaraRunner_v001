import { Config } from './config.js';

export class AchievementSystem {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
    }

    // Chamado ao fim de uma run ou evento específico
    checkAll(runStats = {}) {
        const stats = this.storage.data.stats;
        const gameData = this.storage.data;
        const newUnlocks = [];

        // 1. Checar Conquistas
        Config.ACHIEVEMENTS.forEach(ach => {
            if (!gameData.achievements.includes(ach.id)) {
                if (ach.condition(stats, runStats, gameData)) {
                    if (this.storage.unlockAchievement(ach.id)) {
                        newUnlocks.push({ type: 'ACHIEVEMENT', name: ach.name });
                    }
                }
            }
        });

        // 2. Checar Skins
        Config.SKINS.forEach(skin => {
            if (!gameData.unlockedSkins.includes(skin.id)) {
                let unlocked = false;
                if (skin.reqType === 'totalEcoPoints' && stats.totalEcoPoints >= skin.reqValue) unlocked = true;
                if (skin.reqType === 'totalStoredPowerupsUsed' && stats.totalStoredPowerupsUsed >= skin.reqValue) unlocked = true;
                
                if (unlocked) {
                    if (this.storage.unlockSkin(skin.id)) {
                        newUnlocks.push({ type: 'SKIN', name: skin.name });
                    }
                }
            }
        });

        // 3. Checar Cenários (Baseado no melhor score global para simplificar)
        // Pega o maior score entre todos os cenários
        const maxScore = Math.max(...Object.values(gameData.bestScores));
        
        Config.SCENES.forEach(scene => {
            if (!gameData.unlockedScenes.includes(scene.id)) {
                if (maxScore >= scene.unlockScore) {
                    if (this.storage.unlockScene(scene.id)) {
                        newUnlocks.push({ type: 'SCENE', name: scene.name });
                    }
                }
            }
        });

        // Notificar UI
        newUnlocks.forEach(item => {
            this.ui.showToast(`Desbloqueado: ${item.name}`);
        });
    }
}
